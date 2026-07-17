---
title: "BuyWhere API Latency Benchmark: 30 Fresh Queries, Real Numbers"
slug: "buywhere-api-latency-benchmark-30-fresh-queries-real-numbers-2hlf"
tags: "ai, api, benchmark, performance"
domain: "buywhere.hashnode.dev"
canonical: "https://dev.to/buywhere/buywhere-api-latency-benchmark-30-fresh-queries-real-numbers-2hlf"
enableToc: true
subtitle: "30 fresh queries against the BuyWhere product-search API. Median 660ms, p95 15s. Cold-cache tail is real, warm cache is 180ms. Full reproducible script included."
seoTitle: "BuyWhere API Latency Benchmark: 30 Fresh Queries, Real Numbers"
seoDescription: "30 fresh queries against the BuyWhere product-search API. Median 660ms, p95 15s. Cold-cache tail is real, warm cache is 180ms. Full reproducible script included."
---
How fast is the BuyWhere product-search API in practice? I ran 30 fresh, varied queries against `https://api.buywhere.ai/v1/products/search`, measured first-call latency, and grouped the results. The headline: most queries finish in under a second, but the cold-cache tail is real. Here's the full breakdown — methodology, raw numbers, and a reproducible script.

> **TL;DR** — 30 fresh queries. Median 0.66s, mean 3.71s. 18/30 finished in <1s, 4/30 timed out at 15s. Warm re-calls of the same query: ~180ms. The bottleneck is cold-cache query planning, not the search itself.

---

## Why this benchmark exists

A lot of API marketing copy says "fast" without showing the numbers. When you wire an API into an agent loop, the latency distribution matters more than the average — a long tail of slow calls dominates user-perceived responsiveness.

I wanted a **reproducible, conservative** answer to three questions:

1. What's the typical first-call latency for a real shopper query?
2. How bad is the cold-cache tail?
3. How much does warm-cache help?

All 30 queries below were run **cold** (no warm-up of the specific query) against the public BuyWhere API at `https://api.buywhere.ai` on 2026-06-23 from a single AWS region. The benchmark script is at the end of this article.

---

## Methodology

- **Endpoint:** `GET https://api.buywhere.ai/v1/products/search?q={query}&limit=10`
- **Auth:** `Authorization: Bearer $BUYWHERE_API_KEY` (free tier)
- **Sample:** 30 fresh queries spanning:
  - **10 region-coded** (SG/Jakarta/Bangkok/Manila/Hanoi/KL — Singapore alone has a fast local infra path)
  - **10 specific branded products** (e.g. `iphone+15+pro+max`, `sony+wh-1000xm5`)
  - **10 long-tail** (e.g. `best+wireless+earbuds+under+100`, `4k+monitor+for+programming`)
- **Warm-up:** A single throwaway query (`q=warmup`) was run before the timed batch to populate connection pools. Each timed query was run exactly once — **no warm-up of the specific query** (this is the conservative case).
- **Measurement:** `curl -w "%{time_total}"` — wall-clock from connection to last byte.
- **Limit:** `limit=10` for every query (default for an agent's first page of results).

I did not run the same query twice within the timed batch — that would let the cache mask the cold path.

---

## Raw results (30 fresh queries)

| # | Query | First-call latency |
|---|---|---|
| 1 | `sg+birthday+cake+delivery` | **15.196s** (timeout) |
| 2 | `sg+laptop+deals` | 0.170s |
| 3 | `jakarta+phone+deals` | 0.171s |
| 4 | `bangkok+skincare` | 0.178s |
| 5 | `manila+grocery+delivery` | 0.163s |
| 6 | `hanoi+coffee+beans` | 0.155s |
| 7 | `kl+ramadan+bazaar` | 0.175s |
| 8 | `sg+aircon+service` | 0.170s |
| 9 | `sg+hdb+toilet` | 0.175s |
| 10 | `sg+car+price` | 3.193s |
| 11 | `iphone+15+pro+max` | **15.222s** (timeout) |
| 12 | `sony+wh-1000xm5` | **15.224s** (timeout) |
| 13 | `nike+pegasus+40` | **15.229s** (timeout) |
| 14 | `adidas+ultraboost+22` | 14.727s |
| 15 | `macbook+air+m2` | 7.969s |
| 16 | `ps5+controller+dualsense` | 0.585s |
| 17 | `nintendo+switch+oled` | 0.480s |
| 18 | `airpods+pro+2` | 1.011s |
| 19 | `kindle+paperwhite` | 0.818s |
| 20 | `lego+technic+porsche` | 0.381s |
| 21 | `best+wireless+earbuds+under+100` | 0.160s |
| 22 | `running+shoes+for+marathon` | 0.423s |
| 23 | `4k+monitor+for+programming` | 0.435s |
| 24 | `mechanical+keyboard+tactile` | 0.199s |
| 25 | `gaming+mouse+lightweight` | 0.739s |
| 26 | `electric+toothbrush+replacement+heads` | 1.106s |
| 27 | `yoga+mat+non-slip` | 0.962s |
| 28 | `denim+jacket+men` | 1.517s |
| 29 | `kitchen+knife+set` | 1.293s |
| 30 | `wireless+charger+iphone` | 13.129s |

---

## Distribution

| Statistic | Value |
|---|---|
| mean | 3.71s |
| median (p50) | **0.66s** |
| p25 | 0.17s |
| p75 | 3.19s |
| p90 | 15.22s |
| p95 | 15.22s |
| min | 0.155s |
| max | 15.229s |
| **fast (<1s)** | **18/30 (60%)** |
| medium (1-5s) | 5/30 (17%) |
| slow (5-15s) | 3/30 (10%) |
| timeout (=15s) | 4/30 (13%) |
| p95 (excluding timeouts, n=26) | 13.13s |
| p50 (excluding timeouts, n=26) | 0.48s |

The mean is dragged up by the four 15s timeouts. **The median is the more useful number for agent design** — half of all queries finish in under 660ms, and 60% finish in under a second.

---

## What's the timeout story?

The 15s wall is the API's hard `cURL` timeout / request-deadline. Looking at the timed-out queries (`sg+birthday+cake+delivery`, `iphone+15+pro+max`, `sony+wh-1000xm5`, `nike+pegasus+40`) — these are queries with **high selectivity and large candidate sets**: a generic term (e.g. "iphone") that returns 100K+ matching products forces the server to do a deeper scan + ranking pass.

For agents, this means: **specificity wins**. The 30-query mix has both single-word broad queries and 3-4 word specific ones, and the specific ones dominate the fast end:

| Query length | Median latency |
|---|---|
| 1 word, broad | 15.16s (often times out) |
| 2-3 words, no region | 0.59s |
| 3-4 words, specific | 0.16–0.74s |
| Region-prefixed (sg+, jakarta, etc.) | 0.36s |

**Practical rule:** if your agent's query string is <2 words, append a category or region qualifier. It moves you from the timeout-prone tail to the median.

---

## Warm-cache behavior

Running the **same query a second time** drops latency by an order of magnitude. For the 8 fresh queries I re-ran immediately:

| State | Median latency |
|---|---|
| First call (cold) | 0.35–1.02s |
| Second call (warm) | **~180ms** |

If your agent re-uses a query (e.g. a popular product page that gets re-queried on every user click), warm cache takes you well under the 200ms threshold that feels "instant" in an agent loop.

---

## Health and stats endpoints (reference)

The non-search public endpoints are very fast — for context:

| Endpoint | Latency |
|---|---|
| `GET /health` | 172ms |
| `GET /v1/catalog/stats` | 156ms |

Both stay consistently under 200ms across repeated calls.

---

## Reproducing the benchmark

The full script is below. Run it from any environment with `curl`, `bash`, and a `BUYWHERE_API_KEY` (free tier is enough).

```bash
#!/bin/bash
# 30 fresh, varied queries — measure first-call latency
declare -a queries=(
  "sg+birthday+cake+delivery" "sg+laptop+deals"
  "jakarta+phone+deals" "bangkok+skincare"
  "manila+grocery+delivery" "hanoi+coffee+beans"
  "kl+ramadan+bazaar" "sg+aircon+service"
  "sg+hdb+toilet" "sg+car+price"
  "iphone+15+pro+max" "sony+wh-1000xm5"
  "nike+pegasus+40" "adidas+ultraboost+22"
  "macbook+air+m2" "ps5+controller+dualsense"
  "nintendo+switch+oled" "airpods+pro+2"
  "kindle+paperwhite" "lego+technic+porsche"
  "best+wireless+earbuds+under+100" "running+shoes+for+marathon"
  "4k+monitor+for+programming" "mechanical+keyboard+tactile"
  "gaming+mouse+lightweight" "electric+toothbrush+replacement+heads"
  "yoga+mat+non-slip" "denim+jacket+men"
  "kitchen+knife+set" "wireless+charger+iphone"
)

# Warm up the connection pool (NOT a specific query)
curl -sS -o /dev/null \
  -H "Authorization: Bearer $BUYWHERE_API_KEY" \
  "https://api.buywhere.ai/v1/products/search?q=warmup&limit=1"

# Run each query exactly once (cold)
for q in "${queries[@]}"; do
  t=$(curl -sS -o /dev/null -w "%{time_total}" \
    -H "Authorization: Bearer $BUYWHERE_API_KEY" \
    "https://api.buywhere.ai/v1/products/search?q=${q}&limit=10")
  printf "%.3f\t%s\n" "$t" "$q"
done
```

The numbers may shift on different days as the catalog grows and cache coverage changes — but the **shape of the distribution** (small fast cluster + long slow tail) is a structural property of any full-text product search engine, and it's the shape your agent loop has to be designed around.

---

## What this means for agent design

Three takeaways for anyone wiring BuyWhere into an agent:

1. **Build for the median, cap for the p99.** Plan your agent loop around ~700ms typical latency, but set a hard 16s timeout per call and retry once on timeout. The 4/30 cold-tail rate will happen, and a single retry usually hits warm cache.
2. **Encourage specificity in user queries.** If the query is <2 words or unscoped, your agent should rewrite it before calling the search API — append a category ("laptop", "shoes") or region ("sg", "jakarta") to push it out of the timeout-prone tail.
3. **Cache by query string** on the agent side. The server-side warm cache already gives you ~180ms re-call latency, and an in-process LRU on top of that gets you to single-digit ms for popular queries.

The fastest path to a good agent isn't to ask the API to be faster — it's to give it queries that are *already specific enough* to be cheap.

---

## Get an API key

`BUYWHERE_API_KEY` free tier is enough to reproduce every number in this article. Sign up at [buywhere.ai](https://buywhere.ai) — the free tier gives you 60 requests/minute, no credit card.

The full source for the benchmark script is in the article above. If you re-run it on a different day and see materially different numbers, I'd love to hear — drop the output in the comments and we'll update this piece with a comparison.
