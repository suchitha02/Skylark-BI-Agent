# Skylark Drones BI Agent — Decision Log

## Executive Summary
Built an AI-powered business intelligence agent that answers founder-level questions about pipeline, operations, and sector performance by integrating with Monday.com boards and reasoning over normalized data with Groq LLM.

---

## Key Decisions

### 1. Tech Stack: Next.js Full-Stack (Not Separate Backend)

**Decision**: Single Next.js repository with API routes, not separate frontend/backend services

**Why**:
- Faster development: One deployment, shared types, unified codebase
- Simpler for recruiting demo: No Docker, no multiple services to explain
- API routes handle Monday.com queries securely (server-side only)
- Built-in TypeScript + Tailwind = fast iteration
- Vercel deployment is one-click for Next.js projects

**Considered**: FastAPI + React alternative
- Would be more "traditional" but adds deploy complexity
- Decided speed of implementation was more valuable than architecture prestige

**Trade-off**: Less horizontally scalable than microservices, but sufficient for prototype/demo

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

### 6. Revenue Metrics: Work Order Completion as Proxy

**Decision**: No actual revenue field in dataset; using completed work orders as revenue proxy

**Why**:
- Dataset has pipeline (Deals) and operations (Work Orders) but no revenue per se
- Completed work orders represent actual delivered value
- Could ask for revenue field, but made judgment call to work with available data

**Implementation**:
```
total_revenue = count(completed_work_orders) * average_project_value
by_sector = group completed_orders by sector
```

**Limitation**: Revenue is estimated (not real revenue data)
**Noted**: In README and data quality report

**Future Improvement**: Add actual revenue field to Deals board when available

---

### 7. Leadership Update Feature: Interpretation

**Decision**: Leadership update = Structured weekly summary, not automated report

**How Implemented**:
- Agent can generate updates on-demand via natural language query
- User asks "Give me a leadership update" or "Prepare this week's summary"
- Agent returns structured output with:
  - Executive summary (2-3 sentences of business health)
  - Key metrics (pipeline, revenue, operations)
  - Top performing sectors
  - Risks to monitor
  - Data quality notes
  - Recommended focus

**Why Not Automated**:
- Timing context matters ("this week" vs "this month")
- Would need predictive analytics for "what's changed"
- Better to let founder decide when/what to report

**Trade-off**: Manual query vs scheduled report
**Payoff**: More flexible, founder controls timing

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

**Decision**: Groq API (Mixtral-8x7b) instead of Claude

**Why**:
- User provided Groq key, so preferred that path
- Groq is extremely fast (500+ tokens/sec)
- Mixtral is capable for business reasoning
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
