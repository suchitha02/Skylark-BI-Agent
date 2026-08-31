# Skylark Drones BI Agent — Decision Log (Extended)

> **Note**: The canonical, 2-page decision log required by the assignment is at the repo root: `/DECISION_LOG.md`. This file is a longer, more detailed version kept for reference; it has been corrected below to match what was actually shipped (an earlier draft of this file described a monorepo architecture that isn't the one deployed).

## Executive Summary
Built an AI-powered business intelligence agent that answers founder-level questions about pipeline, operations, and sector performance by integrating with Monday.com boards and reasoning over normalized data with Groq LLM.

---

## Key Decisions

### 1. Tech Stack: Separate Express Backend + Next.js Frontend

**Decision**: Separate Express/Node backend (deployed to Render) and Next.js chat frontend (deployed to Vercel), communicating over a REST API — **not** a single Next.js monorepo with API routes.

*(Correction: an earlier draft of this section described a single-Next.js-app architecture. That was the original plan but is not what was ultimately built or deployed — the actual deployment target requested was Render for the backend and Vercel for the frontend, so a real separate backend was needed.)*

**Why**:
- Matches the two deployment targets required (Render for backend, Vercel for frontend)
- Clear separation of concerns: backend owns Monday.com/Groq credentials and all business logic, frontend is a thin chat client
- Backend can be iterated on, redeployed, and debugged independently of the frontend
- TypeScript throughout (backend `.ts` run via `tsx`, frontend via Next.js's built-in support)

**Considered**: Single Next.js app with API routes
- Simpler single-deploy story, but doesn't match "Render for backend, Vercel for frontend"
- Decided to match the requested infrastructure split over minimizing deploy count

**Trade-off**: Two services to deploy, configure (CORS, env vars) and keep in sync, vs. one — but this is what "separate frontend/backend on separate platforms" requires.

---

### 2. Monday.com: Direct API (Not MCP)

**Decision**: Direct Monday.com GraphQL API via axios, not MCP (Model Context Protocol)

**Why**:
- Direct control over queries and error handling
- Clearer debugging when things break
- Monday.com SDK is lightweight (~30KB)
- MCP would add abstraction layer without clear benefit here

**Considered**: Monday.com MCP server
- Would be more "modern" but adds dependency on MCP ecosystem
- MCP is still early (fewer examples, less community support)
- Direct API is battle-tested and reliable

**Trade-off**: Slightly more code to handle API details vs MCP abstraction

---

### 3. Agent Architecture: Tool Calling (Not Blind LLM)

**Decision**: Groq LLM with function calling, not free-form LLM responses

**Why**:
- **No hallucinated numbers**: Tools calculate metrics deterministically
- **Auditability**: Can trace exactly which data was used for each number
- **Consistency**: Same question always gets same answer (within data freshness window)
- **Reliability**: Agent can't invent data if tools return nothing

**Example Problem**: Asking LLM "What's our pipeline?" could hallucinate "$15M" when actual is "$8.4M"
**Example Solution**: Tool `get_pipeline_overview()` always returns exact calculated value

**Trade-off**: More setup work defining tools vs simpler free-form prompting
**Payoff**: Founder trust (numbers are real, not AI guesses)

---

### 4. Analytics: Deterministic Code Layer

**Decision**: Separate `lib/analytics.ts` with explicit metric definitions, not LLM-computed

**Why**:
- **Correctness**: Financial calculations must be bug-free
- **Reproducibility**: Same data → same metric (no LLM variance)
- **Explainability**: Can show exact formula used
- **Performance**: Milliseconds vs seconds (no API call needed)

**Metrics Calculated Deterministically**:
- Pipeline value = SUM(deals.value where value > 0)
- Sector performance = GROUP BY sector with aggregations
- Customer quality = Cross-board join + scoring logic

**LLM Used For**:
- Interpreting query intent
- Orchestrating tool calls
- Explaining results in English
- Identifying insights/risks from metrics

**Trade-off**: More code (~300 lines analytics) vs less code (everything in prompt)
**Payoff**: Founder can trust the numbers

---

### 5. Data Cleaning: Normalization Layer Before Reasoning

**Decision**: Dedicate effort to `lib/data-normalizer.ts` before passing to agent

**Why**:
- "Garbage in, garbage out" — bad data = bad answers
- Real business data is messy (inconsistent dates, missing values, sector name variants)
- Normalizing once prevents repeated issues
- Data quality report makes limitations transparent

**Normalization Handled**:
- Missing value patterns: `""`, `"N/A"`, `"null"`, `"-"`
- Dates: ISO, EU (DD/MM/YYYY), text (Aug 31, 2026)
- Sector names: `Energy` ↔ `ENERGY` ↔ `Energy Sector`
- Currency: `"₹8,50,000"` → `850000`
- Customer names: Strip `Inc.`, `Ltd.`, `Pvt.` for matching

**Data Quality Tracking**:
- Count invalid records per category
- Report to user so they know "5 deals excluded for missing values"

**Trade-off**: Upfront effort (~250 lines) vs band-aid fixes throughout system
**Payoff**: Clean data flowing through entire system

---

### 6. Revenue Metrics: Work Order Completion x Avg Won-Deal Value

**Decision**: No actual revenue field in dataset; estimate revenue from completed work orders, valued at the average of "Won" deals, and expose it to the agent as a real tool (`get_revenue_overview`).

**Why**:
- Dataset has pipeline (Deals) and operations (Work Orders) but no revenue field
- Completed work orders represent delivered value; average Won-deal value is the closest real, data-derived stand-in for "what a typical delivered project is worth" (chosen over a hardcoded placeholder number)
- Exposed as a first-class tool so the agent can actually answer revenue questions instead of having no data to reach for

**Implementation** (`Analytics.calculateRevenue`):
```
basis = deals where stage == 'Won' (fallback: all deals with value > 0, if no Won deals exist)
avg_deal_value = mean(basis.value)
total_revenue = count(completed_work_orders) * avg_deal_value
by_sector / by_customer = group completed_orders by sector/customer, valued at avg_deal_value
```

**Limitation**: Still an estimate, not real revenue data — every tool response and the `RevenueMetrics.isEstimated` flag say so explicitly, and the agent's system prompt is instructed to always caveat revenue figures as estimates.

**Future Improvement**: Add an actual revenue/invoice field to either board when available, and drop the proxy entirely.

---

### 7. Leadership Update Feature: Interpretation

**Decision**: Leadership update = an on-demand, structured summary generated by a dedicated deterministic tool, not a scheduled/automated report.

**How Implemented**:
- A single tool, `generate_leadership_update`, composes pipeline totals, estimated revenue, operational health, top 3 sectors, concentration/delay risk flags, and data-quality notes into one structured block
- The agent's system prompt instructs it to call this tool (instead of chaining several individual tools itself) whenever the user asks for a "leadership update," "executive summary," or "status update"
- Built as one deterministic function rather than leaving the orchestration entirely to the LLM, so the output shape is consistent every time

**Why Not Automated/Scheduled**:
- Timing context matters ("this week" vs "this month") and the data has no reliable timestamp to diff against
- Would need historical snapshots to say "what's changed since last time," which is out of scope
- Better to let the founder pull an update on demand

**Trade-off**: Manual query vs scheduled report
**Payoff**: More flexible, founder controls timing, and the response shape is deterministic rather than depending on the LLM correctly chaining 5 tool calls on its own

---

### 8. Scope: What Was Intentionally Not Built

**Excluded (Time Constraints)**:
1. **User authentication** — Single-user demo agent, not multi-tenant
2. **Dashboards** — Focus on conversational interface, charts are future work
3. **Automated alerts** — "Deal at risk" notifications not implemented
4. **Historical trends** — No forecasting or trend analysis
5. **Email export** — No report sending via email
6. **Custom metrics** — Users can't define new metrics (would need UI)
7. **Webhook integration** — Real-time sync not implemented

**Why These Decisions**:
- Assignment is 6 hours; must prioritize core agent functionality
- Better to build 1 feature excellently than 5 features poorly
- These are clear candidates for "what would you build next"

**Interview Answer**: "With another week, I'd add dashboard visualizations with KPI cards, historical trend analysis with forecasting, and automated risk alerts. The architecture is designed to support these without major refactoring."

---

### 9. Deployment: Vercel (Not Docker/AWS)

**Decision**: Deploy to Vercel (serverless), not self-hosted Docker or AWS EC2

**Why**:
- Next.js is purpose-built for Vercel
- One-click deployment: `git push` → live
- No DevOps needed (recruiter can click link immediately)
- Free tier supports demo traffic
- Edge functions for API routes

**Considered**: AWS/Docker approach
- Would demonstrate DevOps skills but adds deployment complexity
- Recruiter might not want to spin up EC2, configure, etc.
- Decided rapid access > infrastructure resume-building

**Trade-off**: Serverless cold starts vs always-warm dedicated servers
**Payoff**: Immediate demo-ability

---

### 10. Groq LLM: Why Not Claude?

**Decision**: Groq API (openai/gpt-oss-20b) instead of Claude

**Why**:
- User provided Groq key, so preferred that path
- Groq is extremely fast (500+ tokens/sec)
- GPT-OSS-20B (via Groq) is capable for business reasoning
- Function calling support is excellent
- Clear performance advantage for real-time agent

**Note on AI Usage**: 
- Claude used for architecture design and coding guidance
- Cursor used for code generation
- Groq used for production inference

**Future**: Could easily swap Claude in (same tool calling pattern)

---

## What I'd Do Differently With More Time

### 1. Evaluation Framework (2 hours)
Define test cases:
- Q: "How is Energy sector doing?" → Expected metrics + tolerance
- Q: "Which customer has largest deal?" → Expected name + value
- Q: "What are the risks?" → Expected risk identification

Run against test queries, track accuracy over time.

### 2. Better Caching (1 hour)
- Cache Monday.com data for 5 minutes (refreshes automatically)
- Avoid redundant API calls within session
- Show "Data as of X minutes ago"

### 3. Role-Based Access Control (1-2 hours)
- Sales team sees only Deals + relevant sectors
- Operations team sees only Work Orders
- Executive sees everything
- Manager sees their own team's data

### 4. Advanced Analytics (3 hours)
- Trend analysis (pipeline growth/decline quarter-over-quarter)
- Deal win rate by sector
- Average project delay by customer
- Revenue forecast based on historical patterns

### 5. Richer UI (2-3 hours)
- Executive dashboard with KPI cards
- Charts: pipeline funnel, sector distribution, timeline
- Query history in sidebar
- Export to PDF/email capability

---

## Lessons Learned

1. **Data quality is non-negotiable** — Spent disproportionate time on normalization, but payoff is clean reasoning
2. **Transparency builds trust** — Showing "Data quality: 92%" matters more than hiding issues
3. **Deterministic + LLM is the sweet spot** — Not all-LLM, not all-code
4. **Rapid iteration beats perfect architecture** — Next.js + Vercel > microservices for prototype
5. **Founder perspective matters** — "What's our pipeline?" is the right question, not "How many records?"

---

## Final Assessment

**Delivered**: A working, deployed AI agent that founders can use immediately to answer business questions across multiple Monday.com boards.

**Demonstrates**: Full-stack engineering, AI/LLM reasoning, data engineering, product thinking, and sound engineering judgment.

**Interview Ready**: Architecture is explainable, decisions are justified, limitations are documented.

---

*Decision Log maintained through development. Last update: August 31, 2026*
