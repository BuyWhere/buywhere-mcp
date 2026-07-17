---
title: "Building an AI shopping agent that actually buys things"
slug: "building-an-ai-shopping-agent-that-actually-buys-things-11b"
tags: "ai, mcp, langgraph, python"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/building-an-ai-shopping-agent-that-actually-buys-things-11b"
enableToc: true
subtitle: "How to combine LLM reasoning with real-time product data to build an autonomous shopping agent using MCP and LangGraph"
seoTitle: "Building an AI shopping agent that actually buys things"
seoDescription: "How to combine LLM reasoning with real-time product data to build an autonomous shopping agent using MCP and LangGraph"
---
title: "Building an AI shopping agent that actually buys things"
published: false
description: "How to combine LLM reasoning with real-time product data to build an autonomous shopping agent using MCP and LangGraph"
tags: ai, mcp, langgraph, python, ecommerce
canonical_url: https://buywhere.ai/blog/ai-shopping-agent-mcp-react
cover_image: https://buywhere.ai/og-shopping-agent.png
---

Most AI shopping assistants stop at "here are some results." The hard part is the next step: evaluating options, reasoning about trade-offs, and actually completing a purchase. This post walks through how to build an AI shopping agent that goes from natural language request to checkout-ready recommendation — using the ReAct pattern, LangGraph, and the BuyWhere MCP server.

## The problem with chatbot-style shopping

Ask ChatGPT "find me the cheapest AirPods Pro 2," and you get a list of links — often outdated, sometimes hallucinated. The model has no access to real-time pricing, no ability to compare across merchants, and no mechanism to take action.

What you actually want is an agent that:
1. Understands your shopping intent (what, where, budget, constraints)
2. Searches real product catalogs in real time
3. Reasons about the results (price, shipping, seller rating)
4. Presents a ranked recommendation — or places the order

The ReAct (Reason + Act) pattern is the simplest architecture that delivers this.

## What the ReAct pattern looks like for shopping

ReAct agents alternate between two phases:

- **Reason:** The LLM analyzes the current state, decides what information it needs, and formulates a plan.
- **Act:** The agent calls a tool (API, search function, MCP tool) to get that information.
- **Observe:** The agent processes the tool's response and feeds it back into reasoning.

For a shopping agent, this loop looks like:

```plaintext
User: "I need a noise-cancelling headphone under $200, available in Singapore"

Thought: I should search for noise-cancelling headphones in Singapore with a budget constraint.
Action: products_search(query="noise cancelling headphones", country="sg", limit=10)
Observation: [results with prices, merchants, URLs]

Thought: Let me filter by price under $200 and check which ones are well-rated.
Action: products_search(query="Sony WH-1000XM5", country="sg")
Observation: [specific product results]

Thought: I have enough data to recommend. Best option is [X] at [price] from [merchant].
Final Answer: Here are my top 3 recommendations...
```

## Building it with LangGraph

LangGraph makes this loop explicit as a state machine. Here is a minimal implementation:

```python
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool

# Define the state
class ShoppingState(TypedDict):
    messages: Annotated[list, "The conversation history"]
    budget: float | None
    country: str
    product_category: str

# Define the MCP-backed tool
@tool
def search_products(query: str, country: str, limit: int = 5) -> str:
    """Search for products across marketplaces in a given country.
    Returns structured results with prices, merchants, and URLs."""
    # In production, this calls the BuyWhere MCP server
    import subprocess, json
    # Simplified: shell out to the MCP CLI
    result = subprocess.run(
        ["npx", "-y", "@buywhere/mcp-server", "search",
         "--query", query, "--country", country, "--limit", str(limit)],
        capture_output=True, text=True, timeout=30
    )
    return result.stdout

# Build the graph
llm = ChatOpenAI(model="gpt-4o", temperature=0)
tools = [search_products]
llm_with_tools = llm.bind_tools(tools)

def reason(state: ShoppingState):
    """LLM reasons about what to do next."""
    messages = state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}

def should_continue(state: ShoppingState):
    """Route to tools if the LLM wants to act, otherwise end."""
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END

# Assemble the graph
graph = StateGraph(ShoppingState)
graph.add_node("reason", reason)
graph.add_node("tools", ToolNode(tools))
graph.set_entry_point("reason")
graph.add_conditional_edges("reason", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "reason")

app = graph.compile()

# Run it
result = app.invoke({
    "messages": [
        SystemMessage(content=(
            "You are a shopping assistant. Use the search_products tool to find "
            "real products with real prices. Compare options and recommend the best "
            "value based on price, reviews, and availability. Always search at least "
            "2 different queries to ensure comprehensive coverage."
        )),
        HumanMessage(content="I need noise-cancelling headphones under SGD 400 in Singapore")
    ],
    "budget": 400.0,
    "country": "sg",
    "product_category": "headphones"
})

# Print the final recommendation
print(result["messages"][-1].content)
```

## Key design decisions

### 1. MCP as the data layer

The agent does not need to know about Shopee, Lazada, Amazon, or any specific marketplace. The BuyWhere MCP server abstracts all of that behind a single `products_search` tool. This means:
- Adding a new marketplace is a server-side change, not an agent change
- The agent's tool schema stays stable across 9 countries
- Rate limiting, deduplication, and currency conversion are handled upstream

### 2. State management matters

LangGraph's state machine approach gives you explicit control over the agent's decision loop. Unlike a simple `AgentExecutor`, you can:
- Enforce a maximum number of search iterations (prevent infinite loops)
- Inject budget constraints from the user's profile
- Log every reasoning step for debugging
- Branch into different strategies based on product category

### 3. Confidence-based termination

The agent should not search forever. A good stopping rule: if the LLM produces a final answer without tool calls, it has enough information. Add a hard cap (e.g., 5 tool calls) and a confidence check to prevent degenerate loops.

## Going beyond recommendations

The same ReAct architecture extends to:
- **Price-drop monitoring:** Schedule the agent to re-run on a cron, compare against previous prices, and alert when a threshold is crossed
- **Multi-product shopping lists:** Feed in a list of items, have the agent optimize for total basket cost across countries
- **Gift finder:** Natural language constraints ("something for my mom who likes cooking, under $50") mapped to product search queries

The key insight: once your agent has access to real-time structured product data through MCP, the reasoning layer (LLM + ReAct) becomes the differentiator — not the data acquisition.

## Try it yourself

```bash
# Install the MCP server
npx -y @buywhere/mcp-server

# Connect from Claude Desktop, Cursor, or your own Python client
# The server exposes products_search across 9 countries and 11M products
```

The BuyWhere MCP server is open source: [github.com/BuyWhere/buywhere-mcp](https://github.com/BuyWhere/buywhere-mcp)

---

*This is the third post in a 4-part series on building AI shopping agents with MCP. Follow BuyWhere on [dev.to](https://dev.to/buywhere) for the final post: the MCP ecosystem and what's next.*
