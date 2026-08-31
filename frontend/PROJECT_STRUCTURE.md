# Project Structure

## Directory Overview

```
skylark-drones/
├── pages/                          # Next.js pages & API routes
│   ├── api/
│   │   └── query.ts               # Main API endpoint for agent queries
│   ├── _app.tsx                   # App wrapper (imports global CSS)
│   ├── _document.tsx              # HTML document structure
│   └── index.tsx                  # Main chat page
│
├── components/                     # React components
│   └── ChatInterface.tsx           # Chat UI with message display
│
├── lib/                            # Core business logic
│   ├── types.ts                   # TypeScript interfaces & types
│   ├── monday-client.ts           # Monday.com API integration
│   ├── data-normalizer.ts         # Data cleaning & normalization
│   ├── analytics.ts               # Metric calculations
│   └── agent.ts                   # AI agent with Groq LLM
│
├── styles/                         # Styling
│   └── globals.css                # Tailwind CSS directives
│
├── public/                         # Static assets (created by Next.js)
│
├── .env.example                   # Environment variable template
├── .env.local                     # Local secrets (NOT committed)
├── .gitignore                     # Git ignore rules
├── tsconfig.json                  # TypeScript configuration
├── tailwind.config.js             # Tailwind CSS configuration
├── next.config.js                 # Next.js configuration
├── postcss.config.js              # PostCSS configuration
├── package.json                   # Dependencies & scripts
├── README.md                      # Comprehensive documentation
├── DECISION_LOG.md                # Technical decisions & trade-offs
└── PROJECT_STRUCTURE.md           # This file
```

## File Descriptions

### Core Logic Files (`lib/`)

**`types.ts`** (200 lines)
- Type definitions for Monday.com data
- Internal data model (Deal, WorkOrder)
- Agent context and response types
- Business metrics types (Pipeline, Revenue, Operational)

**`monday-client.ts`** (80 lines)
- Monday.com GraphQL API wrapper
- Handles authentication via API key
- Fetches items from boards
- Error handling for API failures

**`data-normalizer.ts`** (350 lines)
- Cleans messy data from Monday.com
- Normalizes dates (multiple formats)
- Normalizes text (sectors, statuses, customer names)
- Handles missing values and currency parsing
- Generates data quality reports
- ~40% of the codebase by importance

**`analytics.ts`** (300 lines)
- Deterministic metric calculations
- Pipeline analysis (by stage, sector, customer)
- Operational metrics (active, completed, delayed projects)
- Sector performance scoring
- Cross-board customer quality analysis
- Currency/date formatting utilities

**`agent.ts`** (250 lines)
- Groq LLM integration with function calling
- Defines available tools (6 total)
- Executes tool logic deterministically
- Orchestrates multi-turn conversations
- Extracts insights and risks from responses

### Frontend Files

**`pages/index.tsx`** (30 lines)
- Main entry point
- Renders ChatInterface component

**`pages/_app.tsx`** (10 lines)
- App wrapper
- Imports global CSS

**`pages/_document.tsx`** (10 lines)
- HTML structure

**`components/ChatInterface.tsx`** (350 lines)
- Chat UI component
- Message display and input
- Loading states
- Error handling
- Example questions
- Response formatting (metrics, insights, risks, caveats)

### API Routes

**`pages/api/query.ts`** (100 lines)
- POST endpoint `/api/query`
- Request validation
- Orchestrates data flow:
  1. Fetch from Monday.com
  2. Normalize data
  3. Calculate metrics
  4. Create agent context
  5. Query agent
  6. Return response

## Data Flow

### User Query → Agent Response

```
1. User types question in ChatInterface
   ↓
2. POST /api/query with { query: "..." }
   ↓
3. API route validates request
   ↓
4. MondayClient.getWorkOrders() & getDeals()
   ↓
5. DataNormalizer processes each item
   ↓
6. Analytics calculates metrics
   ↓
7. Agent.query() is called with context
   ↓
8. Groq LLM with function calling
   ↓
9. Tools execute (get_pipeline_overview, etc.)
   ↓
10. LLM generates response with insights
    ↓
11. Response returned to frontend
    ↓
12. ChatInterface displays answer + metrics + risks
```

## Key Abstractions

### MondayClient
Hides details of Monday.com GraphQL API. Always returns typed `MondayBoardItem[]`.

### DataNormalizer
Converts messy Monday.com data to clean `Deal[]` and `WorkOrder[]` arrays.

### Analytics
Deterministic calculations producing metrics. No randomness, fully auditable.

### SkylarkAgent
LLM orchestration with function calling. Translates natural language to tool calls.

## Scaling Considerations

**Current**: ~1500 total lines of code (excluding dependencies)

**If scale to 10k deals / 500 work orders**:
- Add board-level caching (5 min TTL)
- Paginate Monday.com requests (currently limit: 500 items)
- Consider connection pooling for API

**If scale to 100+ users**:
- Add user authentication
- Per-user data filtering
- Implement request rate limiting
- Move Monday.com credentials to secure store

## Development Workflow

### Adding a New Feature

**Example: Add "revenue forecast" capability**

1. Add types to `lib/types.ts`
   ```typescript
   interface RevenueForecast {
     month: string;
     amount: number;
     confidence: number;
   }
   ```

2. Add calculation to `lib/analytics.ts`
   ```typescript
   static calculateForecast(deals: Deal[]): RevenueForecast[] { ... }
   ```

3. Add tool to `lib/agent.ts`
   ```typescript
   function: {
     name: 'get_revenue_forecast',
     ...
   }
   ```

4. Implement tool execution in agent
   ```typescript
   case 'get_revenue_forecast':
     return this.executeForecast(toolInput);
   ```

5. Test in UI

### Testing Locally

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test queries
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "How is our pipeline?"}'
```

## Performance Notes

**API Response Time**: 2-5 seconds typical
- Monday.com fetch: 0.5-1s
- Data processing: 0.1-0.2s
- Groq inference: 1-3s
- Response formatting: 0.5s

**Optimization Opportunities**:
- Cache Monday.com data for 5 minutes
- Parallel API calls if needed
- Reduce prompt size if LLM gets slower
- Pre-calculate common metrics

## Security Checklist

- ✅ API keys in `.env.local` (not committed)
- ✅ Groq key server-side only
- ✅ Monday.com queries server-side only
- ✅ No secrets in error messages
- ✅ Input validation on all API endpoints
- ✅ No SQL injection (GraphQL, not SQL)
- ✅ `.gitignore` configured correctly

## Deployment Checklist

Before deploying to production:

- [ ] Test with fresh environment variables
- [ ] Verify Monday.com boards are accessible
- [ ] Verify Groq API key is valid
- [ ] Test with realistic data volume
- [ ] Check error messages are user-friendly
- [ ] Verify no secrets in logs
- [ ] Load test with concurrent queries
- [ ] Set up monitoring/alerting
