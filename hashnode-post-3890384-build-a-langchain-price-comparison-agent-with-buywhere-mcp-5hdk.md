---
title: "Build a LangChain price-comparison agent with BuyWhere MCP"
slug: "build-a-langchain-price-comparison-agent-with-buywhere-mcp-5hdk"
tags: "mcp, langchain, langgraph, modelcontextprotocol"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-a-langchain-price-comparison-agent-with-buywhere-mcp-5hdk"
enableToc: true
subtitle: "A real, runnable ReAct agent in ~30 lines that calls 9 retailers across 9 countries through the Model Context Protocol"
seoTitle: "Build a LangChain price-comparison agent with BuyWhere MCP"
seoDescription: "A real, runnable ReAct agent in ~30 lines that calls 9 retailers across 9 countries through the Model Context Protocol"
---
_A real, runnable ReAct agent in ~30 lines that calls 9 retailers across 9 countries through the Model Context Protocol_


## body_markdown draft

# Build a LangChain price-comparison agent with BuyWhere MCP

Every time I want to buy a laptop, a pair of headphones, or a vacuum, I open five tabs — Amazon, Shopee, Best Buy, Lazada, Apple Store — and copy-paste prices into a spreadsheet. So I built a ReAct agent in LangChain that does it for me. It runs in 30 lines, fans out a query to 9 retailers across 9 countries, and returns the cheapest real-time price.

Here's how to wire it up.

## What we're building

A LangChain `create_react_agent` that uses BuyWhere as an MCP tool server. The agent can answer questions like:

- "What's the cheapest 14-inch laptop under SGD 1,500 in Singapore right now?"
- "Compare prices for the Sony WH-1000XM5 across the US, SG, and Japan."
- "Where can I buy an iPhone 17 with USB-C, in stock today, in Malaysia?"

The agent uses Anthropic's Claude as the reasoning model, calls BuyWhere MCP tools, and returns a structured answer with merchant, price, currency, and a direct link to the listing.

## Prerequisites

- Python 3.10+
- A BuyWhere API key (free) — [request one here](https://buywhere.ai/api-keys?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24)
- An Anthropic API key for Claude
- Node.js 18+ (the MCP server runs via `npx`)

## Install

```bash
pip install langchain langchain-anthropic langchain-mcp-adapters langgraph mcp
```

The `langchain-mcp-adapters` package is the official LangChain bridge for MCP servers. It wraps any stdio-based MCP server as a list of LangChain `BaseTool` objects, which is exactly what `create_react_agent` wants.

## The full agent (30 lines)

```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_anthropic import ChatAnthropic
from langgraph.prebuilt import create_react_agent

BUYWHERE_API_KEY = "sk-buywhere-your-key"  # from buywhere.ai/api-keys
ANTHROPIC_API_KEY = "sk-ant-your-key"

async def main():
    # 1. Connect to the BuyWhere MCP server (stdio transport)
    client = MultiServerMCPClient({
        "buywhere": {
            "command": "npx",
            "args": ["-y", "@buywhere/mcp-server"],
            "env": {"BUYWHERE_API_KEY": BUYWHERE_API_KEY},
            "transport": "stdio",
        }
    })

    # 2. Load MCP tools as LangChain BaseTool objects
    tools = await client.get_tools()
    print(f"Loaded {len(tools)} BuyWhere tools: {[t.name for t in tools]}")
    # Loaded 4 BuyWhere tools: ['search_prices', 'compare_product', 'list_cheapest', 'get_product']

    # 3. Build a Claude-backed ReAct agent
    model = ChatAnthropic(model="claude-sonnet-4-6", api_key=ANTHROPIC_API_KEY)
    agent = create_react_agent(model, tools)

    # 4. Ask
    response = await agent.ainvoke({
        "messages": [("user",
            "What's the cheapest 14-inch laptop under SGD 1500 in Singapore right now? "
            "Show me the top 3 with merchant, price, and a link."
        )]
    })
    print(response["messages"][-1].content)

asyncio.run(main())
```

That's the whole agent. The MCP server handles all the retailer adapters — Claude just decides which tool to call and reads the result.

## What the tools look like to the agent

When the agent loads the MCP server, it sees four tools. Here's what it gets:

| Tool | What it does | When the agent uses it |
|------|--------------|------------------------|
| `search_prices` | Free-text search across all retailers in a country, sorted by price | "Find me cheap noise-cancelling headphones" |
| `compare_product` | Resolve a product to a canonical SKU and return its price across all merchants | "Compare the iPhone 17 Pro across stores" |
| `list_cheapest` | Top N cheapest products in a category, country-scoped | "What's the cheapest laptop right now in SG?" |
| `get_product` | Detailed product info, including stock, rating, and spec list | "Tell me more about that Dyson V15 listing" |

The agent reads the tool descriptions (which the MCP server ships as part of the protocol) and picks the right one based on the user's question. You don't have to write any custom routing logic.

## How the pieces fit

```plaintext
┌─────────────────────┐    stdio (JSON-RPC)    ┌───────────────────────┐
│  LangChain agent    │ ─────────────────────▶ │  BuyWhere MCP server  │
│  (Claude + ReAct)   │ ◀───────────────────── │  (@buywhere/mcp-server)│
└─────────────────────┘    tool calls/returns  └──────────┬────────────┘
                                                            │
                                            ┌───────────────┴────────────┐
                                            │  Per-retailer adapters:     │
                                            │  Amazon, Best Buy, Walmart, │
                                            │  Shopee, Lazada, Apple, …   │
                                            └───────────────┬────────────┘
                                                            │
                                                       retailer APIs
```

Three things are worth knowing:

**1. `langchain-mcp-adapters` is a thin shim, not a framework.** It just speaks JSON-RPC over stdio and adapts the MCP tool schema into LangChain's `BaseTool` API. The MCP server runs in a child process; the agent talks to it like any other tool. If you ever swap BuyWhere for another MCP server (Linear, Notion, GitHub), the agent code doesn't change — only the config.

**2. The MCP server caches per (query, country, retailer).** A 5-minute TTL means 4 users asking the same question in a 5-minute window share the work, and you stay polite to Shopee and Lazada's rate limits. Steady-state hit rate is ~12% in my testing.

**3. `create_react_agent` is from `langgraph.prebuilt`, not `langchain.agents`.** This is a 2026 thing — the modern LangChain agent surface is LangGraph. The old `initialize_agent` and `AgentExecutor` paths still work but are considered legacy. Use the LangGraph one.

## A multi-step example

The agent isn't limited to one tool call. Here's a multi-step question that exercises the full MCP surface:

```python
question = (
    "I'm looking at the Sony WH-1000XM5 in Singapore. "
    "1) Find the cheapest listing and tell me the merchant, price, and URL. "
    "2) Then check if it's in stock at 2 other major retailers. "
    "3) Finally, tell me the SGD price converted to USD at today's rate."
)
response = await agent.ainvoke({"messages": [("user", question)]})
```

What happens under the hood:

1. Agent calls `search_prices("Sony WH-1000XM5", "SG")` — gets 8 listings sorted by price
2. Agent calls `get_product(sku)` on the top result — gets stock + full spec
3. Agent calls `get_product(sku)` again on two other retailers' listings — gets stock
4. Agent uses its own knowledge to do the SGD→USD conversion (or you can add an FX tool)
5. Agent returns a structured summary

The full MCP transcript (tool calls + results) is preserved in `response["messages"]`, so you can log it for debugging or show the user what the agent did.

## Where to take it from here

- **Add memory.** Wrap the agent in a `MemorySaver` checkpointer so multi-turn conversations work.
- **Add a Slack or Telegram channel.** A ReAct agent that watches a `#deals` channel and pings when prices drop is maybe 50 more lines.
- **Stream the output.** Use `agent.astream_events` to get tool-call deltas and partial answers in real time.
- **Swap to OpenAI.** Replace `ChatAnthropic` with `ChatOpenAI(model="gpt-4o")` — the rest of the code is identical.

## FAQ

### What is the Model Context Protocol (MCP)?
MCP is an open standard from Anthropic that lets LLM clients (Claude, Cursor, agents) discover and call tools exposed by external servers. Think of it as LSP for AI tools. BuyWhere ships a [Model Context Protocol server](https://buywhere.ai/integrate?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24) that exposes pricing tools to any MCP-compatible client.

### Do I need an Anthropic API key, or can I use OpenAI?
You can use any LangChain chat model. The example uses Claude because the MCP protocol was designed alongside Claude, but `langchain-mcp-adapters` is model-agnostic. OpenAI, Gemini, Mistral, local Ollama — all work.

### How do I get a BuyWhere API key?
It's free, no waitlist. Go to [buywhere.ai/api-keys](https://buywhere.ai/api-keys?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24), enter your email, and you'll get the key on the page and by email.

### How many merchants does BuyWhere cover?
Nine retailers in the current public release: Amazon, Best Buy, Walmart, eBay, Apple, B&H (US); Shopee, Lazada, Apple Store (SG/MY); plus Amazon JP, Rakuten (JP); plus a handful of EU ones. Coverage is being expanded — check the [integration docs](https://buywhere.ai/integrate?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24) for the current list.

### Is this production-ready?
For prototypes and side projects, yes. For production, you'll want to add: (a) observability on the MCP transport (LangSmith or Helicone), (b) per-user rate limiting on the agent, and (c) a fallback path if the MCP server is unreachable. The MCP server itself is stateless and horizontally scalable.

### Can I use this with CrewAI or AutoGen instead?
Yes. Any framework that can speak MCP works. For CrewAI, use `MCPServerAdapter`. For AutoGen, use the `mcp` Python client directly. The [integration page](https://buywhere.ai/integrate?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24) has copy-paste configs for the four most popular agent frameworks.

---

*If you build something with this, I'd love to see it — drop a comment or open an issue at [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp). And if you find a retailer we should add, the [API keys page](https://buywhere.ai/api-keys?utm_source=devto&utm_medium=social&utm_campaign=june30_25k&utm_content=devto_mcp_langchain_2026w24) has a "Request a merchant" link at the bottom.*
