---
title: "Build an AI shopping agent that actually buys things with LangGraph and BuyWhere MCP"
slug: "build-an-ai-shopping-agent-that-actually-buys-things-with-langgraph-and-buywhere-mcp-213g"
tags: "ai, mcp, python, agents"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/build-an-ai-shopping-agent-that-actually-buys-things-with-langgraph-and-buywhere-mcp-213g"
enableToc: true
subtitle: "A step-by-step guide to building a ReAct shopping agent using LangGraph that searches, compares, and executes purchases — with a human-in-the-loop confirmation step."
seoTitle: "Build an AI shopping agent that actually buys things with LangGraph and BuyWhere MCP"
seoDescription: "A step-by-step guide to building a ReAct shopping agent using LangGraph that searches, compares, and executes purchases — with a human-in-the-loop confirmation step."
---
Most shopping agents stop at "here are some options." The useful ones go further: they pick one, confirm with you, and hand you a checkout link.

This post builds that agent. It uses the ReAct pattern (Reason + Act), LangGraph for orchestration, and the BuyWhere MCP server for real product data. By the end you'll have a working agent that takes a query, searches across merchants, reasons about the best option, and asks for your OK before delivering the purchase link.

## Why ReAct for shopping

ReAct (Reason + Act) alternates between thinking about what to do and doing it. For shopping that looks like:

1. **Reason**: "I need a laptop under $1500 SGD, preferably with Windows"
2. **Act**: Search the catalog for laptops in Singapore
3. **Reason**: "These three options meet the criteria — which is cheapest?"
4. **Act**: Fetch prices from each merchant
5. **Reason**: "The Dell XPS 13 at Challenger is $1,399 and has the specs I want"
6. **Act**: Ask the user to confirm
7. **Act** (after confirmation): Return the affiliate link

LangGraph makes the state machine explicit — you can inspect every step, add guards, and handle failures gracefully.

## What you need

```bash
pip install langgraph langchain-core buywhere-mcp
```

Or with npx:
```bash
npx -y @buywhere/mcp-server
```

You'll also need the BuyWhere API key from buywhere.ai/developers.

## The agent architecture

The flow: User query → Search → Reason about options → Present recommendation → Ask user to confirm → Return checkout link (or explain why not buying).

## Implementation

### 1. Define the state

```python
from typing import TypedDict, Optional
from langgraph.graph import StateGraph, END

class ShoppingState(TypedDict):
    query: str
    products: list[dict]
    recommendation: Optional[dict]
    reasoning: str
    user_confirmed: Optional[bool]
    checkout_url: Optional[str]
    error: Optional[str]
```

### 2. The search step

```python
import subprocess
import json

def search_products(query: str, country: str = "SG") -> list[dict]:
    result = subprocess.run(
        ["npx", "-y", "@buywhere/mcp-server", "search",
         "--query", query, "--country", country.lower(), "--limit", "15"],
        capture_output=True, text=True, timeout=30
    )
    if result.returncode != 0:
        return []
    try:
        data = json.loads(result.stdout)
        return data.get("products", data.get("data", []))
    except json.JSONDecodeError:
        return []

def search_node(state: ShoppingState) -> ShoppingState:
    products = search_products(state["query"])
    if not products:
        state["error"] = f"No products found for '{state['query']}'"
    state["products"] = products
    return state
```

### 3. The reasoning step

```python
def reason_about_products(state: ShoppingState) -> ShoppingState:
    products = state.get("products", [])
    if not products:
        return state

    priced = [p for p in products if p.get("price") and p.get("price") > 0]
    if not priced:
        state["error"] = "No products with prices found"
        return state

    priced.sort(key=lambda p: float(p["price"]))
    best = priced[0]
    currency = best.get("currency", "SGD")
    price = best.get("price")
    merchant = best.get("merchantName", "Unknown merchant")

    state["recommendation"] = best
    state["reasoning"] = (
        f"Selected '{best.get('name', state['query'])}' at {currency} {price} "
        f"from {merchant}. {len(priced)} products found in total."
    )
    return state
```

### 4. The confirmation and checkout steps

```python
def confirmation_node(state: ShoppingState) -> ShoppingState:
    return state

def has_confirmation(state: ShoppingState) -> str:
    if state.get("user_confirmed") is None:
        return "wait"
    return "proceed"

def checkout_node(state: ShoppingState) -> ShoppingState:
    if not state.get("user_confirmed"):
        return state
    product = state.get("recommendation")
    if not product:
        state["error"] = "No product to checkout"
        return state
    product_id = product.get("id", "")
    country = product.get("country", "SG")
    state["checkout_url"] = f"https://buywhere.ai/r/{product_id}?country={country}&source=agent"
    return state
```

### 5. Assemble the graph

```python
def build_shopping_graph():
    builder = StateGraph(ShoppingState)
    builder.add_node("search", search_node)
    builder.add_node("reason", reason_about_products)
    builder.add_node("confirm", confirmation_node)
    builder.add_node("checkout", checkout_node)
    builder.set_entry_point("search")
    builder.add_edge("search", "reason")
    builder.add_edge("reason", "confirm")
    builder.add_conditional_edges(
        "confirm", has_confirmation,
        {"wait": END, "proceed": "checkout"}
    )
    builder.add_edge("checkout", END)
    return builder.compile()

graph = build_shopping_graph()
```

### 6. A simple CLI

```python
def cli():
    print("🛒 BuyWhere Shopping Agent
")
    while True:
        query = input("What are you looking for? (or 'quit')
> ")
        if query.lower() in ("quit", "exit", "q"):
            break
        result = graph.invoke({"query": query, "user_confirmed": None})
        if result.get("error"):
            print(f"❌ {result['error']}
")
            continue
        rec = result["recommendation"]
        print(f"💡 Recommendation: {rec.get('name')}")
        print(f"   Price: {rec.get('currency', 'SGD')} {rec.get('price')}")
        print(f"   Merchant: {rec.get('merchantName', 'Unknown')}")
        print(f"   Why: {result['reasoning']}
")
        confirm = input("Buy it now? (yes/no)
> ").strip().lower()
        if confirm in ("yes", "y", "buy"):
            url = result.get("checkout_url")
            if url:
                print(f"
✅ Here's your link: {url}
")
        else:
            print("🤔 No problem.
")

if __name__ == "__main__":
    cli()
```

### Adding memory with LangGraph checkpointer

```python
from langgraph.checkpoint.sqlite import SqliteSaver

memory = SqliteSaver.from_conn_string(":memory:")

graph = build_shopping_graph().compile(
    checkpointer=memory,
    interrupt_before=["confirm"]  # Pause before checkout
)

config = {"configurable": {"thread_id": "user-123"}}

# Run: interrupts at confirm, resumes after user approval
result = graph.invoke({"query": "laptop Singapore"}, config)
```

With `interrupt_before=["confirm"]`, the graph pauses before any checkout link is generated — the human reviews and approves first.

## What makes this agent actually useful

The MCP server handles the hard data problems:

- **Merchant normalization**: Shopee, Lazada, Amazon, Challenger, Courts — all under one schema
- **Currency handling**: SGD, USD, MYR, AUD — converted correctly
- **Deduplication**: Same product, different sellers, collapsed into one result
- **Fallback**: When one merchant is out of stock, the agent still has options

Without BuyWhere you'd spend 80% of your code on data cleaning. With it, you're writing the agent logic.

## What's next

Real deployments add price history alerts, merchant preferences, multi-country arbitrage, and inventory checks. The BuyWhere MCP server handles the catalog complexity so you focus on the agent.

---

*This is part of a series on building AI shopping agents with BuyWhere MCP.*

**Series:**
1. [BuyWhere MCP — give your agent a real product catalog](https://dev.to/buywhere/buywhere-mcp-give-your-agent-a-real-product-catalog-not-just-an-amazon-buy-link-300a)
2. [What I accidentally built when I connected Claude to a product catalog](https://dev.to/buywhere/what-i-accidentally-built-when-i-connected-claude-to-a-product-catalog-4lpi)
3. [Ship a self-serve commerce MCP without the sales call](https://dev.to/buywhere/ship-a-self-serve-commerce-mcp-without-the-sales-call-the-four-anti-patterns-we-removed-3ejp)
4. [Build a price tracking agent that monitors deals for you](https://dev.to/buywhere/build-a-price-tracking-agent-that-monitors-deals-for-you-4508698)
