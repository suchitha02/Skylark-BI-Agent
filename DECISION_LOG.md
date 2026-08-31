# Decision Log — Skylark Drones BI Agent

*Canonical decision log (2-page target). Superseded, more verbose drafts live in `frontend/DECISION_LOG.md`.*

## What was built

An AI agent that answers founder-level questions (pipeline, operations, sectors, customers, and estimated revenue) by querying two Monday.com boards (Work Orders, Deals) live via the GraphQL API, normalizing the messy real-world data, computing metrics deterministically in code, and using a Groq-hosted LLM with function calling to interpret the question, call the right metric tool(s), and explain the result. Deployed as a separate Express/Node backend (Render) and Next.js chat frontend (Vercel).

## Beyond the core requirements

A few additions on top of the assignment's ask, aimed at making the tool feel like a product rather than a script:

- **Inline charts.** Answers that touch pipeline, revenue, operations, sectors, customers, or a leadership update carry up to 2 `ChartSeries` (bar/pie) computed by `agent.ts` from the *same* `Analytics` call that produced the text, not parsed back out of the LLM's prose — a chart can never disagree with the number stated next to it. Rendered client-side with Recharts.
- **Context-aware follow-up questions.** After each answer, the agent proposes 2-3 next questions drawn from a curated per-tool pool (`SkylarkAgent.FOLLOW_UP_POOL`), keyed off whichever tool actually answered that turn — clicking one re-submits it, so a session can flow founder → pipeline → risks → leadership update without retyping.
- **Export/share on every answer.** Copy to clipboard, download as Markdown, or open a print view (browser "Save as PDF") — all client-side, no extra backend endpoint.
- **Typing animation.** Assistant answers reveal progressively rather than popping in whole, with charts/insights/follow-ups fading in only once the text finishes. This is a frontend reveal of an already-complete response, not token-level streaming from Groq — chosen deliberately over real SSE/chunked streaming for reliability across the Render↔Vercel hop (proxy buffering on a free-tier host is a common way "streaming" silently stops working after deploy).
- **Markdown rendering + a from-scratch SVG icon set.** Agent answers (bold, headers, tables, `<br>` inside cells) render as actual formatted output (`react-markdown` + `remark-gfm` + `rehype-raw`/`rehype-sanitize`) instead of literal markdown syntax; every icon in the UI is a hand-drawn stroke SVG, no emoji, no icon-font dependency.

## Key assumptions

- **Column mapping by title, not id.** Monday.com auto-generates opaque, per-board column ids (e.g. `color_mm6r8ekx`). These are not stable across boards or re-imports, so every field lookup matches on the human-readable column **title** (fetched via `boards.columns { id title }`), substring-matched against a keyword list per field (e.g. `customer` → `['customer', 'company', 'client', 'account']`). This was the fix for the "0 valid records" bug.
- **No revenue field exists in the data.** Revenue is estimated as `(completed work orders) × (average value of Won deals)`, and every revenue answer is explicitly labeled an estimate, both in the tool output and in the returned `isEstimated` flag. This was picked over a hardcoded number so the estimate at least moves with real data.
- **"Completed" work orders map to delivered value**, "Won" deals map to closed revenue-generating pipeline. Everything else (Active, Delayed, In Progress, etc.) is treated as not-yet-revenue.
- **Missing/placeholder values** (`""`, `N/A`, `null`, `-`, `?`, etc.) are normalized to `null` rather than dropped outright, so a record with one bad field isn't silently discarded — it's flagged in the data-quality report instead.

## Trade-offs chosen and why

| Decision | Alternative considered | Why this way |
|---|---|---|
| Separate Express backend + Next.js frontend, on Render + Vercel | Single Next.js app with API routes | Backend needed a long-lived process for iterative Monday.com/Groq debugging and clean separation of the two deploy targets requested (Render for backend, Vercel for frontend). This is the actual architecture that shipped — an earlier draft of this log described a monorepo-API-routes approach that was **not** what was ultimately built; that inconsistency has been corrected here. |
| Direct Monday.com GraphQL API via `axios` | Monday.com MCP server | Direct control over query shape and error handling while debugging a live schema change (`items` → `items_page`); MCP added an abstraction layer with no clear benefit for a single, well-understood API. |
| Deterministic analytics layer (`analytics.ts`) + LLM only for orchestration/explanation | Let the LLM compute metrics itself | Prevents hallucinated numbers. The LLM picks tools and narrates; every number it reports came from a pure function over the normalized data, so the same question always gets the same number. |
| `openai/gpt-oss-20b` on Groq | `mixtral-8x7b-32768`, then `llama-3.3-70b-versatile`, then `llama-3.1-8b-instant` | All three Llama/Mixtral options were decommissioned on this Groq account's current model catalog (confirmed via repeated `model_not_found` errors, then cross-checked in the Groq playground). `openai/gpt-oss-20b` is the current text + tool-calling model actually available. |
| Conversation history sent per-request (last 10 messages), no server-side session store | Full session/thread persistence with a database | Assignment scope and 6-hour budget didn't justify a persistence layer; passing recent history from the client is enough for the agent to handle a follow-up or answer its own clarifying question, without adding infrastructure. |

## How "leadership updates" was interpreted

Read literally, the optional requirement is under-specified (no cadence, format, or audience given). Interpretation: a **leadership update is an on-demand, structured summary** a founder can pull whenever they want to brief someone else — not a scheduled report, since scheduling implies infra (cron, email delivery, a "what changed since last time" diff) that's out of scope for a conversational prototype. A dedicated `generate_leadership_update` tool composes pipeline totals, estimated revenue, operational health, the top 3 sectors, concentration/delay risk flags, and data-quality notes into one deterministic block, triggered when the user asks for a "leadership update," "executive summary," or "status update." This is intentionally a single deterministic tool rather than relying on the LLM to chain 5 separate tool calls correctly every time.

## What I'd do differently with more time

1. **Server-side conversation sessions** (a session id + short-lived store) instead of the client re-sending history on every call — more robust and cheaper on tokens as conversations grow.
2. **Caching the Monday.com fetch** (5-minute TTL) — every query currently re-fetches both boards in full.
3. **A real evaluation set** of question → expected-metric pairs, run against the deployed agent after every change, instead of manual spot-checking.
4. **Real token-level streaming** from Groq over SSE/chunked HTTP, once the deployment target's proxy behavior is confirmed to pass it through reliably — today's typing animation reveals an already-complete response rather than live tokens.
5. **Actual revenue data** — if Skylark tracks realized revenue anywhere (even outside Monday.com), wiring that in would remove the biggest asterisk in the whole system.
6. **Click-through charts** — clicking a bar/sector in a chart could re-query the agent scoped to that sector, instead of only the fixed follow-up-question chips.

*Last updated: August 31, 2026.*
