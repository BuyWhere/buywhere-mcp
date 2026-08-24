#!/usr/bin/env node
/**
 * Smoke test for the BuyWhere MCP server.
 *
 * Boots the published build over stdio via StdioClientTransport, lists tools,
 * verifies the scorecard-required surface (annotations + agent_manifest +
 * capabilities + data_inventory + connection_status + resources), and exits
 * non-zero if any required element is missing.
 *
 * Usage:  node scripts/smoke-tools.mjs
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const REQUIRED_DISCOVERY_TOOLS = [
  "buywhere_agent_manifest",
  "buywhere_capabilities",
  "buywhere_data_inventory",
  "buywhere_connection_status",
];
const MIN_RESOURCES = 3;
const REQUIRED_ANNOTATIONS = ["readOnlyHint"];

async function main() {
  const errors = [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["./dist/index.js"],
    env: { ...process.env, BUYWHERE_API_KEY: process.env.BUYWHERE_API_KEY ?? "smoke-test-placeholder" },
  });
  const client = new Client({ name: "buywhere-mcp-smoke", version: "1.0.0" }, { capabilities: {} });
  await client.connect(transport);

  // 1. List tools
  const { tools } = await client.listTools();
  const names = tools.map((t) => t.name);
  console.log(`✓ listed ${tools.length} tools: ${names.join(", ")}`);

  // 2. Discovery tools present
  for (const t of REQUIRED_DISCOVERY_TOOLS) {
    if (!names.includes(t)) errors.push(`missing discovery tool: ${t}`);
  }
  if (errors.length === 0) console.log(`✓ all ${REQUIRED_DISCOVERY_TOOLS.length} discovery tools present`);

  // 3. Annotations on read tools
  const readOnly = ["search_products", "get_product", "compare_products", "get_deals", "list_categories", "find_best_price"];
  let annotated = 0;
  for (const t of tools) {
    if (!readOnly.includes(t.name)) continue;
    const a = t.annotations;
    if (!a) { errors.push(`tool ${t.name} has no annotations`); continue; }
    for (const k of REQUIRED_ANNOTATIONS) {
      if (!(k in a)) errors.push(`tool ${t.name} missing annotation.${k}`);
    }
    annotated++;
  }
  console.log(`✓ ${annotated}/${readOnly.length} read tools carry annotations.readOnlyHint`);

  // 4. Resources
  const { resources } = await client.listResources();
  console.log(`✓ ${resources.length} resources registered: ${resources.map((r) => r.uri).join(", ")}`);
  if (resources.length < MIN_RESOURCES) errors.push(`expected ≥${MIN_RESOURCES} resources, got ${resources.length}`);

  // 5. Manifest call shape
  const manifest = await client.callTool({ name: "buywhere_agent_manifest", arguments: {} });
  const text = manifest?.content?.[0]?.text ?? "{}";
  const obj = JSON.parse(text);
  if (!Array.isArray(obj.recommended_first_calls) || obj.recommended_first_calls.length === 0) {
    errors.push("manifest.recommended_first_calls missing/empty");
  }
  if (!Array.isArray(obj.standard_tools) || obj.standard_tools.length === 0) {
    errors.push("manifest.standard_tools missing/empty");
  }
  console.log(`✓ manifest has ${obj.recommended_first_calls.length} recommended_first_calls + ${obj.standard_tools.length} standard_tools`);

  await client.close();
  if (errors.length) {
    console.error(`\nFAIL — ${errors.length} smoke-check(s) failed:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log("\nPASS — BuyWhere MCP server meets the agent-readiness smoke bar.");
}

main().catch((err) => {
  console.error(`smoke-test fatal: ${err}`);
  process.exit(2);
});
