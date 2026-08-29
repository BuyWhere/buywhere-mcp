#!/usr/bin/env node
/**
 * BuyWhere MCP Server (stdio)
 *
 * This package is a thin stdio bridge to the hosted BuyWhere MCP server. It does not
 * re-implement tools: it forwards tools/list and tools/call to
 * https://api.buywhere.ai/mcp and returns the responses verbatim.
 *
 * Why: until 2026-08-29 this package hardcoded its own copy of the v1 tools, so it
 * drifted from the hosted contract (7 local tools vs 13 hosted, missing the whole v2
 * family). Any agent comparing the two saw two different products. Forwarding makes
 * the contracts identical by construction — new hosted tools appear here the moment
 * they ship, with the same names, schemas and descriptions.
 *
 * Configuration (environment variables):
 *   BUYWHERE_API_KEY  (required) — your BuyWhere API key. Free, instant:
 *                                  POST https://api.buywhere.ai/v1/auth/register
 *   BUYWHERE_MCP_URL  (optional) — override the upstream MCP endpoint
 *   BUYWHERE_API_URL  (optional) — legacy alias; /mcp is appended if no path is given
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";

const PKG_VERSION = "0.4.0";
const API_KEY = process.env.BUYWHERE_API_KEY;

function resolveUpstream(): string {
  const explicit = process.env.BUYWHERE_MCP_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const legacy = process.env.BUYWHERE_API_URL;
  if (legacy) {
    const base = legacy.replace(/\/$/, "");
    return /\/mcp$/.test(base) ? base : `${base}/mcp`;
  }
  return "https://api.buywhere.ai/mcp";
}

const UPSTREAM = resolveUpstream();
const USER_AGENT = `buywhere-mcp/${PKG_VERSION}`;
const TOOLS_TTL_MS = 5 * 60 * 1000;

if (!API_KEY) {
  process.stderr.write(
    "BUYWHERE_API_KEY is not set — tool calls will fail with an auth error.\n" +
      "Get a free key: curl -X POST https://api.buywhere.ai/v1/auth/register " +
      '-H "Content-Type: application/json" -d \'{"agent_name":"my-agent"}\'\n',
  );
}

/** One JSON-RPC round trip to the hosted server. Accepts plain JSON or SSE framing. */
async function upstreamCall(method: string, params: unknown, timeoutMs = 60_000): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res: Response;
  try {
    res = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        "User-Agent": USER_AGENT,
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}`, "x-api-key": API_KEY } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: Date.now(), method, params: params ?? {} }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    const reason = err instanceof Error && err.name === "AbortError" ? "timed out" : String(err);
    throw new McpError(ErrorCode.InternalError, `BuyWhere upstream request ${reason}`);
  }
  clearTimeout(timer);

  const raw = await res.text();
  if (!res.ok && !raw.trim()) {
    throw new McpError(ErrorCode.InternalError, `BuyWhere upstream returned HTTP ${res.status}`);
  }

  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    const framed = raw.split("\n").find((line) => line.startsWith("data: "));
    if (!framed) {
      throw new McpError(ErrorCode.InternalError, `BuyWhere upstream sent an unparseable response (HTTP ${res.status})`);
    }
    payload = JSON.parse(framed.slice(6));
  }

  if (payload?.error) {
    const { code, message } = payload.error;
    throw new McpError(typeof code === "number" ? code : ErrorCode.InternalError, message ?? "BuyWhere upstream error");
  }
  return payload?.result;
}

let toolsCache: { at: number; tools: unknown[] } | null = null;

const server = new Server(
  { name: "buywhere-mcp", version: PKG_VERSION },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  if (toolsCache && Date.now() - toolsCache.at < TOOLS_TTL_MS) {
    return { tools: toolsCache.tools };
  }
  const result = (await upstreamCall("tools/list", {})) as { tools?: unknown[] };
  const tools = Array.isArray(result?.tools) ? result.tools : [];
  toolsCache = { at: Date.now(), tools };
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const result = await upstreamCall("tools/call", {
    name: request.params.name,
    arguments: request.params.arguments ?? {},
  });
  return result as { content: unknown[]; isError?: boolean };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`buywhere-mcp ${PKG_VERSION} → ${UPSTREAM}\n`);
}

main().catch((err) => {
  process.stderr.write(`buywhere-mcp failed to start: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
