# Skylark Drones Backend API

## Overview

Express.js backend service for Skylark Drones AI Business Intelligence Agent.

**Responsibilities:**
- Monday.com integration
- Data normalization & cleaning
- Business analytics & metrics
- Groq LLM agent with function calling
- REST API for frontend

**Deployment**: Render.com
**URL**: https://skylark-bi-agent-fpgy.onrender.com

---

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your credentials:
# MONDAY_API_KEY=your_token
# WORK_ORDERS_BOARD_ID=5030994891
# DEALS_BOARD_ID=5030994911
# GROQ_API_KEY=your_key
# FRONTEND_URL=http://localhost:3000

# Start dev server
npm run dev

# Server runs on http://localhost:3001
```

### Test

```bash
# Health check
curl http://localhost:3001/health

# Query example
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How is our pipeline?"}'
```

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Skylark Drones Backend is running"
}
```

### Query Agent

```
POST /api/query
```

**Request:**
```json
{
  "query": "How is our pipeline?",
  "history": []
}
```

`history` is optional: an array of prior `{ role: "user" | "assistant", content: string }` turns (oldest first, current `query` NOT included), capped at 10 entries server-side. Pass the running conversation here so the agent can resolve follow-ups ("what about just Energy?") and understand answers to its own clarifying questions.

**Response:**
```json
{
  "answer": "Pipeline is ₹8.4M across 42 deals...",
  "metrics": {...},
  "insights": ["Energy accounts for 46% of total pipeline"],
  "risks": ["Two deals account for 41% of pipeline (concentration risk)"],
  "dataQualityCaveats": ["5 deals have missing values"],
  "sources": ["Work Orders Board", "Deals Board"],
  "charts": [
    { "type": "bar", "title": "Pipeline by Sector", "data": [{ "name": "Energy", "value": 3900000 }] }
  ],
  "followUpQuestions": ["What are the biggest pipeline risks?", "Compare pipeline across sectors"]
}
```

`charts` and `followUpQuestions` are both optional and both derived from whichever tool(s) the agent actually called for that turn (see `SkylarkAgent.buildCharts` / `buildFollowUps` in `agent.ts`) — never parsed back out of the LLM's free-text answer, so they can't disagree with the numbers/topic in `answer`.

---

## Architecture

### Layer Structure

```
Express Server (index.js)
    ↓
API Routes
    ├─ GET /health
    └─ POST /api/query
        ↓
    Query Handler
        ├─ Validate request
        ├─ Fetch Monday.com data
        ├─ Normalize data
        ├─ Calculate metrics
        └─ Query AI agent
            ↓
        AI Agent (agent.ts)
            ├─ Call Groq LLM
            ├─ Execute tools
            ├─ Extract insights
            └─ Generate response
```

### File Structure

```
backend/src/
├── index.js              # Express server
├── agent.ts              # Groq LLM agent with tools
├── analytics.ts          # Metric calculations
├── data-normalizer.ts    # Data cleaning
├── monday-client.ts      # Monday.com API
└── types.ts              # TypeScript types
```

---

## Core Components

### 1. Monday.com Client (`monday-client.ts`)

Fetches data from Monday.com boards.

```typescript
const client = new MondayClient(apiKey, workOrdersId, dealsId);
const workOrders = await client.getWorkOrders();
const deals = await client.getDeals();
```

**Features:**
- GraphQL API integration
- Error handling
- Timeout management
- Board item fetching with all columns

### 2. Data Normalizer (`data-normalizer.ts`)

Cleans messy business data.

**Handles:**
- Missing values (null, "", "N/A", "-")
- Date formats (ISO, EU, text)
- Text normalization (sectors, statuses)
- Currency parsing (₹, $, commas)
- Customer name cleaning

**Generates:**
- Data quality report
- Quality flags per record
- Summary of issues

### 3. Analytics (`analytics.ts`)

Deterministic metric calculations.

**Calculations:**
- Pipeline metrics (total, by stage/sector/customer)
- Operational metrics (active/completed/delayed)
- Sector performance analysis
- Customer quality analysis
- Cross-board intelligence

### 4. AI Agent (`agent.ts`)

Groq LLM with function calling.

**Tools Available:**
- `get_pipeline_overview()` - Pipeline metrics
- `get_operational_health()` - Project status
- `get_sector_analysis()` - Industry performance
- `get_customer_analysis()` - Customer insights
- `get_top_deals()` - Largest opportunities
- `get_data_quality_report()` - Data issues
- `get_revenue_overview()` - Estimated revenue (completed work orders x avg Won-deal value; always flagged as an estimate)
- `generate_leadership_update()` - One-call structured executive summary (pipeline, revenue, ops, top sectors, risks, data quality)

**Process:**
1. Receives natural language query
2. Calls Groq LLM with tools
3. Executes deterministic tools
4. Gathers data
5. Generates executive response
6. Extracts insights & risks

---

## Environment Variables

```bash
# Monday.com
MONDAY_API_KEY=your_api_token
WORK_ORDERS_BOARD_ID=5030994891
DEALS_BOARD_ID=5030994911

# Groq LLM
GROQ_API_KEY=your_groq_key

# Server
PORT=3001 (default)
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

---

## Data Flow

### Request Processing

```
1. Receive POST /api/query with { query: "..." }
   ↓
2. Validate query (non-empty string)
   ↓
3. Initialize Monday.com client with credentials
   ↓
4. Fetch Work Orders board (limit: 500 items)
   ↓
5. Fetch Deals board (limit: 500 items)
   ↓
6. Normalize each item:
   - Parse dates
   - Clean text
   - Handle missing values
   - Track quality issues
   ↓
7. Calculate metrics:
   - Pipeline value by stage/sector/customer
   - Operational health metrics
   - Cross-board customer analysis
   ↓
8. Build agent context with all data
   ↓
9. Query Groq LLM with tools
   ↓
10. LLM selects tools and calls them
    ↓
11. Tool results gathered
    ↓
12. LLM generates response with insights
    ↓
13. Extract risks and format response
    ↓
14. Return to frontend
```

---

## Error Handling

### Monday.com API Errors

```javascript
// API 401 - Invalid token
// API 500 - Service down
// Handled by MondayClient catch block
// User sees: "Failed to retrieve data from Monday.com"
```

### Groq API Errors

```javascript
// API 401 - Invalid key
// API 429 - Rate limited
// API 500 - Service down
// Handled by agent catch block
// User sees: "Internal server error"
```

### Data Errors

```javascript
// Missing critical fields → filtered out
// Invalid dates → set to null
// Invalid numbers → set to 0
// Tracked in dataQuality report
```

---

## Performance Characteristics

### Typical Response Time: 2-5 seconds

| Step | Duration |
|------|----------|
| Receive & validate | <10ms |
| Monday.com fetch | 500-1000ms |
| Data normalization | 100-200ms |
| Calculate metrics | 50-100ms |
| Groq inference | 1000-3000ms |
| Response formatting | 50ms |
| **Total** | **2000-5000ms** |

### Optimization Tips

1. **Cache Monday.com data** (5 min TTL)
   - Reduces fetch time by 90%
   - Requires Redis/Memcached

2. **Batch queries**
   - Combine related questions
   - Reuse same data fetch

3. **Optimize prompts**
   - Shorter system prompt
   - Fewer examples
   - More concise tool descriptions

4. **Use cheaper LLM**
   - openai/gpt-oss-20b (current) - fast, accurate
   - Could use GPT-4 mini for complex queries

---

## Deployment

### Render (Recommended)

```bash
# Push to GitHub
git push origin main

# In Render dashboard:
# 1. Create new Web Service
# 2. Connect GitHub repo
# 3. Select backend directory
# 4. Set Build: npm install
# 5. Set Start: npm start
# 6. Add environment variables
# 7. Deploy
```

**Your backend URL:**
```
https://skylark-bi-agent-fpgy.onrender.com
```

### Local Deployment

```bash
# Using Node.js process manager (PM2)
pm2 start npm --name "skylark-backend" -- start

# Using systemd (Linux)
# Create /etc/systemd/system/skylark.service
```

---

## Monitoring & Debugging

### View Logs

**Render:**
```
Dashboard → Service → Logs tab
```

**Local:**
```
npm run dev
# Logs print to console
```

### Debug Queries

```bash
# Simple query
curl -X POST http://localhost:3001/api/query \
  -d '{"query": "hello"}'

# Complex query
curl -X POST http://localhost:3001/api/query \
  -d '{"query": "How is the Energy sector performing?"}'

# Empty query (should error)
curl -X POST http://localhost:3001/api/query \
  -d '{"query": ""}'
```

### Check Monday.com Connection

```javascript
// In node REPL
import { MondayClient } from './src/monday-client.ts';
const client = new MondayClient(key, workId, dealId);
await client.getWorkOrders(); // Should return array
```

---

## Testing

### Unit Tests (Future)

```bash
npm test
```

Would test:
- Data normalization (dates, text, currency)
- Analytics calculations (pipeline, metrics)
- Agent tool execution
- API validation

### Integration Tests (Future)

```bash
npm run test:integration
```

Would test:
- Monday.com API integration
- Groq API integration
- End-to-end query flow

### Current Testing

Manual testing:
```bash
npm run dev
curl http://localhost:3001/health
curl -X POST http://localhost:3001/api/query -d '{"query": "pipeline?"}'
```

---

## Security

✅ **Secrets Management**
- API keys in environment variables only
- No secrets in code
- .env.local not in git

✅ **API Security**
- Input validation (query length/type)
- CORS configured for frontend only
- No sensitive data in error messages
- No stack traces exposed

✅ **Data Security**
- Monday.com read-only tokens
- No data stored locally
- No logging of sensitive data
- Clean response objects

---

## Future Improvements

### Short Term (1-2 days)
- [ ] Add Redis caching for Monday.com
- [ ] Implement request queuing
- [ ] Add query history logging
- [ ] Improve error messages

### Medium Term (1 week)
- [ ] Add user authentication
- [ ] Implement rate limiting
- [ ] Add query analytics
- [ ] Support historical data

### Long Term
- [ ] Database integration
- [ ] Advanced caching strategies
- [ ] Webhook support
- [ ] Custom metrics API

---

## Troubleshooting

### "Cannot connect to Monday.com"
```
1. Verify MONDAY_API_KEY is set
2. Check if token has expired
3. Verify board IDs are correct
4. Check internet connection
```

### "Groq API error"
```
1. Verify GROQ_API_KEY is valid
2. Check rate limits
3. Try simpler query
4. Check if API is accessible
```

### "Port already in use"
```bash
PORT=3002 npm run dev
# Or kill process using port 3001
```

### "Data is incomplete or wrong"
```
Check dataQuality report in response
May indicate:
- Missing fields in Monday.com
- Data normalization issues
- Incomplete records
```

---

## API Reference Quick Lookup

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/api/query` | POST | AI agent query |

| Tool | Returns | Use Case |
|------|---------|----------|
| `get_pipeline_overview` | Pipeline metrics | Deal analysis |
| `get_operational_health` | Project status | Operations overview |
| `get_sector_analysis` | Sector metrics | Industry performance |
| `get_customer_analysis` | Customer data | Account insight |
| `get_top_deals` | Top opportunities | Deal focus |
| `get_data_quality_report` | Data issues | Quality check |
| `get_revenue_overview` | Estimated revenue | Revenue questions |
| `generate_leadership_update` | Structured exec summary | Leadership updates |

---

## Support & Questions

### How to ask for help
1. Check logs: `npm run dev` output
2. Test endpoint: `curl http://localhost:3001/health`
3. Review: DEPLOYMENT_GUIDE.md

### Common Issues
→ See: DEPLOYMENT_GUIDE.md Troubleshooting

### Architecture Questions
→ See: ../DEPLOYMENT_GUIDE.md

---

## Summary

Backend service that:
- ✅ Fetches data from Monday.com dynamically
- ✅ Cleans and normalizes messy data
- ✅ Calculates accurate business metrics
- ✅ Powers AI agent with function calling
- ✅ Returns executive-level insights
- ✅ Handles errors gracefully
- ✅ Scales to production traffic

**Deploy to Render, connect to frontend, and you're live.** 🚀

---

*Last updated: August 31, 2026*
