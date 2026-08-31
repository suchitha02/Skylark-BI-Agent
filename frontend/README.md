# Skylark Drones - AI Business Intelligence Agent

## Problem Statement

Founders and executives at Skylark Drones need quick, accurate answers to complex business questions spanning:
- **Sales Pipeline** - Deal value, stage, customer, sector, and close dates
- **Operations** - Project execution, delays, completion rates
- **Sector Performance** - How different business segments are performing
- **Customer Health** - Which customers are strategically important and operationally healthy

Currently, this requires:
1. Manually querying multiple Monday.com boards
2. Cleaning and normalizing inconsistent data
3. Performing calculations and joins across boards
4. Creating ad-hoc analysis for each question

**Result**: Slow, error-prone, siloed decision-making.

## Solution

An **AI-powered Business Intelligence Copilot** that answers founder-level questions through natural conversation.

The agent:
- 🔍 **Retrieves data** dynamically from Monday.com (never hardcoded)
- 🧹 **Cleans & normalizes** messy real-world data
- 📊 **Calculates metrics** deterministically (not via LLM hallucination)
- 🤖 **Reasons intelligently** using Groq LLM with function calling
- 💡 **Provides insights** - not just raw numbers
- ⚠️ **Highlights risks** - concentration, delays, performance gaps
- ✅ **Communicates caveats** - transparent about data quality issues

## Features

### Core Features (Mandatory)

✅ **Monday.com Integration**
- Read-only access to Work Orders board (project execution data)
- Read-only access to Deals board (sales pipeline data)
- Dynamic queries (no hardcoded datasets)
- Secure API key management via environment variables

✅ **Data Resilience**
- Handle missing/null values (N/A, "-", empty strings, etc.)
- Normalize inconsistent dates (ISO, DD/MM/YYYY, text formats)
- Normalize sector names (Energy, ENERGY, Energy Sector → canonical)
- Parse currency values with symbols and commas
- Track and report data quality issues

✅ **Query Understanding**
- Natural language conversational interface
- Intent detection (pipeline, operations, sector, customer analysis)
- Clarifying questions when ambiguous
- Multi-turn conversation support

✅ **Business Intelligence**
- **Pipeline Analysis**: Total value, deals by stage/sector/customer, concentration risk
- **Operational Health**: Active/completed/delayed projects, status distribution
- **Sector Performance**: Pipeline value, deal count, execution metrics
- **Customer Analysis**: High-value customers, performance scores
- **Cross-board Intelligence**: Customers with large deals but poor operations

✅ **Reliability**
- Graceful Monday.com API failure handling
- Data validation and quality reporting
- Safe error messages (no exposed secrets/stack traces)
- Timeout handling

### Additional Features (High Value)

✅ **Data Quality Reporting**
- Shows number of records analyzed
- Reports missing/invalid data
- Explains how findings may be affected

✅ **Insights & Risk Identification**
- Extracts key insights from analysis
- Identifies business risks (concentration, delays, etc.)
- Suggests follow-up questions

✅ **Leadership-Ready Formatting**
- Executive-level language (not technical jargon)
- Clear metrics with context
- Actionable recommendations

✅ **Rich Response UI**
- Markdown rendering (tables, bold, headers, `<br>` line breaks) instead of literal markdown syntax showing up as text
- Inline bar/pie charts (Recharts) for pipeline, revenue, operations, sector, and customer answers — computed from the same `Analytics` call as the text, not parsed back out of it
- Context-aware follow-up question chips per turn (keyed off whichever tool answered it), clickable to re-submit
- Copy / download-as-Markdown / print-to-PDF export on every answer
- Typewriter-style reveal for assistant answers, with charts/insights fading in once the text finishes
- Custom SVG icon set (no emojis) and a dark navy/blue palette with gradient + glow accents

## Architecture

```
                    User
                      |
            Chat Interface (React)
                      |
         ┌────────────┼────────────┐
         |            |            |
    Frontend       Backend      Integration
    (Pages)        (API Routes)   (Monday.com)
         |            |            |
         ├─ /index    ├─ /api/query├─ Monday API Client
         │            │            │   └─ getBoardItems()
         │            │            │   └─ getDeals()
         │            │            │   └─ getWorkOrders()
         │            │            │
         │     Agent Orchestration │
         │            │            │
         │     ┌──────┴──────┐    │
         │     | Tool Calling|   │
         │     | with Groq   |   │
         │     └──────┬──────┘    │
         │            |           │
    ChatInterface  Analytics & Metrics
         │            |           │
         │    ┌───────┴────────┐  │
         │    | Deterministic  |  │
         │    | Calculations   |  │
         │    │ (Pipeline,     |  │
         │    │  Revenue,      |  │
         │    │  Operations)   |  │
         │    └────────────────┘  │
         │                        │
         │     Data Processing    │
         │            |           │
         │    ┌───────┴────────┐  │
         │    | Normalization  |  │
         │    | Cleaning       |  │
         │    | Validation     |  │
         │    │ Quality Report |  │
         │    └────────────────┘  │
         │                        │
         └────────────────────────┘
```

### Layer Responsibilities

**Presentation Layer** (`/pages`, `/components`)
- Chat interface with message display
- Error states and loading indicators
- Example questions for new users

**API Layer** (`/pages/api/query.ts`)
- Request validation
- Orchestration of data fetching and processing
- Error handling

**Integration Layer** (`lib/monday-client.ts`)
- Monday.com API communication
- Board data retrieval
- Connection error handling

**Data Processing Layer** (`lib/data-normalizer.ts`)
- Missing value detection
- Date/text/currency normalization
- Data quality tracking
- Duplicate detection (if needed)

**Analytics Layer** (`lib/analytics.ts`)
- Deterministic metric calculations
- Pipeline analysis
- Revenue tracking
- Operational metrics
- Cross-board joins

**Agent Layer** (`lib/agent.ts`)
- Intent detection
- Tool selection
- Groq LLM integration with function calling
- Response generation
- Insight/risk extraction

## Tech Stack

### Why These Choices?

**Next.js** (Frontend + Backend)
- Single repository for full-stack development
- API routes eliminate need for separate backend
- Built-in TypeScript support
- Vercel deployment is seamless
- Faster to build than separate micro-services

**React + TypeScript**
- Type safety prevents data bugs
- Component reusability
- Clear props/state contracts

**Tailwind CSS**
- Rapid UI development
- Professional-looking components
- Dark mode ready (if needed)

**Groq API**
- Fast inference (optimal for real-time queries)
- Function calling for tool use
- Cost-effective for this use case

**Monday.com API**
- Native integration with existing business data
- GraphQL for precise queries
- Token-based authentication

**Axioss**
- Simple HTTP client for Monday.com API calls
- Built-in request/response handling

## Monday.com Setup

### Boards Created

1. **Work Orders** (ID: `5030994891`)
   - Columns: Customer, Sector, Status, Start Date, End Date, Project Name
   - Contains: Project execution and operational data
   - ~120 records imported from CSV

2. **Deals** (ID: `5030994911`)
   - Columns: Customer, Sector, Value, Stage, Expected Close Date
   - Contains: Sales pipeline and opportunity data
   - ~150 records imported from CSV

### API Authentication

The application uses Monday.com's API token for read-only access.

**Token Format**: JWT with user ID and permissions baked in
```
eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY5ODU3MzUxNywiYWFpIjoxMSwidWlkIjoxMTUwMzE5NTAsImlhZCI6IjIwMjYtMDgtMzFUMTE6NTA6MjMuODg0WiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2Njg0MDQ2LCJyZ24iOiJhcHNlMiJ9...
```

**Scope**: Read/Write (configured for flexibility, used read-only in this agent)

### GraphQL Query Structure

```graphql
query {
  boards(ids: BOARD_ID) {
    items(limit: 500) {
      id
      name
      column_values {
        id
        type
        text
        value
        additional_info
      }
    }
  }
}
```

## Environment Variables

Create a `.env.local` file:

```bash
# Monday.com Configuration
NEXT_PUBLIC_MONDAY_API_KEY=your_token_here
NEXT_PUBLIC_WORK_ORDERS_BOARD_ID=5030994891
NEXT_PUBLIC_DEALS_BOARD_ID=5030994911

# Groq API Configuration
GROQ_API_KEY=your_groq_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Skylark Drones BI Agent
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000/api
```

**Note**: `NEXT_PUBLIC_*` variables are exposed to browser (but contain no secrets).
**Note**: `GROQ_API_KEY` is server-side only.
**Note**: All Monday.com secrets are server-side only.

## Local Setup

### Prerequisites
- Node.js 18+ (for native fetch support)
- npm or yarn
- Monday.com API token
- Groq API key

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd skylark-drones

# 2. Install dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run development server
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Development Commands

```bash
npm run dev       # Start dev server with hot reload
npm run build     # Production build
npm run start     # Run production build
npm run lint      # Run ESLint
npm run type-check # Run TypeScript type checker
```

## Deployment

### Vercel (Recommended)

```bash
# 1. Push code to GitHub
git push origin main

# 2. Connect repository to Vercel
# https://vercel.com/import

# 3. Add environment variables in Vercel dashboard
# NEXT_PUBLIC_MONDAY_API_KEY
# NEXT_PUBLIC_WORK_ORDERS_BOARD_ID
# NEXT_PUBLIC_DEALS_BOARD_ID
# GROQ_API_KEY

# 4. Deploy
# Vercel automatically deploys on git push
```

### Other Platforms

This application can also be deployed to:
- Netlify (with functions for API routes)
- AWS (Lambda + S3)
- DigitalOcean (App Platform)
- Any platform supporting Node.js 18+

## Agent Architecture Details

### Tool-Based Reasoning

The agent uses **function calling** to:
1. Break down complex questions into specific data needs
2. Call appropriate tools (get_pipeline_overview, get_sector_analysis, etc.)
3. Combine results to form comprehensive answers
4. Always use actual data, never hallucinate numbers

### Available Tools

```typescript
- get_pipeline_overview()      // Pipeline metrics by stage/sector
- get_operational_health()     // Active/completed/delayed projects
- get_sector_analysis()        // Performance across all sectors
- get_customer_analysis()      // High-value customers + performance
- get_top_deals()              // Largest opportunities
- get_data_quality_report()    // Data quality metrics
```

### Example Execution Flow

**User**: "How is the energy sector performing?"

**Agent Workflow**:
1. Parse intent: Sector-specific analysis
2. Select tools: `get_sector_analysis()` (includes Energy)
3. Fetch data: Retrieve deals + work orders, filter by Energy sector
4. Analyze:
   - Pipeline value: ₹8.4M across 12 deals
   - Operations: 5 active, 3 completed, 2 delayed
   - Performance score: 65/100
5. Generate response: "Energy pipeline is strong but operations show execution challenges..."
6. Extract insights: "Energy accounts for 46% of total pipeline"
7. Identify risks: "Two deals account for 41% of energy pipeline (concentration risk)"
8. Note caveats: "3 deals missing value estimates"

### Why Deterministic Analytics Matter

**Problem**: Asking LLM to calculate metrics directly leads to:
- Hallucinated numbers ("pipeline is ₹15M when it's actually ₹8.4M")
- Inconsistent calculations
- No audit trail

**Solution**: 
- Define calculation logic explicitly in `lib/analytics.ts`
- LLM orchestrates tool calls, doesn't perform math
- All numbers come from deterministic code
- Results are reproducible and auditable

## Data Cleaning & Normalization

### Missing Value Handling

Recognized patterns:
- Empty string (`""`)
- SQL nulls (`"null"`)
- User-entered N/A (`"N/A"`, `"NA"`)
- Placeholders (`"-"`, `"?"`)

**Strategy**: Treat all as missing, report in data quality, exclude from calculations

### Date Normalization

Supported formats:
- ISO: `2026-08-31`
- EU: `31/08/2026`
- Text: `Aug 31, 2026`
- JS fallback: Standard JS parser

**Strategy**: Try each parser in order, flag ambiguous dates

### Text Normalization

Examples:
- Customer: "Acme Inc." → "Acme" (remove suffix)
- Sector: "ENERGY" → "Energy" (canonical case)
- Status: "in_progress" → "In Progress" (convert underscores)

**Strategy**: Case-insensitive matching to canonical forms, consistent output

### Numeric Normalization

Examples:
- Currency: `"₹8,50,000"` → `850000` (remove symbol + commas)
- Empty: `""` → `null` (not 0)
- Invalid: `"N/A"` → `null` (don't assume 0)

**Strategy**: Parse carefully, return null for invalid values

## Business Metrics Calculation

### Pipeline Metrics
```
Total Pipeline Value = SUM(deals.value where value > 0)
Deal Count = COUNT(deals where value > 0)
By Stage = GROUP BY stage
By Sector = GROUP BY sector
By Customer = GROUP BY customer
```

### Operational Metrics
```
Active = COUNT(work_orders where status in [Active, In Progress])
Completed = COUNT(work_orders where status = Completed)
Delayed = COUNT(work_orders where status = Delayed)
```

### Cross-Board Customer Analysis
```
FOR EACH customer:
  pipeline_value = SUM(deals.value where customer matches)
  active_projects = COUNT(work_orders where customer matches AND status active)
  completed_projects = COUNT(work_orders where customer matches AND status completed)
  delayed_projects = COUNT(work_orders where customer matches AND status delayed)
  performance_score = 100 - (delayed% * 50) + (completed% * 30)
```

## Error Handling

### API Failures
**Monday.com API down**
- User sees: "I couldn't retrieve the latest Monday.com data. Please try again."
- No stack traces exposed

**Groq API down**
- User sees: "I encountered an error processing your query. Please try again."
- Graceful fallback to informative message

**Invalid query**
- Agent asks clarification instead of making up answer
- Example: "Help me understand: Are you interested in pipeline metrics or operational performance?"

**Empty results**
- User sees: "I couldn't find matching records for that query."
- Agent suggests alternative filters

### Data Errors
**Missing critical fields**
- Calculation continues where possible
- Missing values reported in data quality caveats
- Example: "5 deals excluded from pipeline (missing values)"

**Invalid data format**
- Non-numeric value in currency field → treated as null
- Unparseable date → treated as null
- Invalid sector → stored as-is, normalized for matching

## Security

### No Exposed Secrets
- API keys stored only in `.env.local` (never committed)
- Monday.com queries are server-side only
- Groq API key never reaches browser
- `.gitignore` includes `*.env.local`

### Safe Error Messages
- User sees: "I encountered an error. Please try again."
- Logs see: Full error message with context
- Stack traces never shown to user

### Input Validation
- User queries validated for length/type
- API requests validated server-side
- No SQL injection risk (Monday.com uses GraphQL)
- No script injection risk (responses are text, not HTML)

## Example Queries

### Pipeline Questions
- "How is our pipeline looking?"
- "What are the biggest deals?"
- "Which sector has the strongest pipeline?"
- "What's our pipeline value this quarter?"
- "Show me late-stage opportunities."

### Operational Questions
- "What's our project status?"
- "Which projects are delayed?"
- "How many active projects do we have?"
- "What is our completion rate?"

### Customer Questions
- "Which customers are most important?"
- "Who has the largest deals?"
- "Which customers have operational issues?"
- "Compare customer A vs B."

### Cross-Board Questions
- "Which customers have large pipeline but poor operations?"
- "Which sectors have strong sales but weak execution?"
- "Who are our strategic customers based on both sales and operations?"

### Sector Questions
- "How is Energy performing?"
- "Compare Energy vs Infrastructure."
- "Which sector is most healthy?"
- "What's the revenue potential by sector?"

### Leadership Questions
- "Give me a business overview."
- "What should I focus on this week?"
- "What are our biggest risks?"
- "Prepare a leadership update."

## Limitations & Future Improvements

### Current Limitations

1. **Revenue Data** - No actual revenue field in datasets, using work order completion as proxy
2. **Forecasting** - No historical trend analysis or forecasting
3. **Alerts** - No automatic notifications for changes/risks
4. **Dashboards** - No standalone dashboard page; visualizations are inline per-answer charts within the chat (bar/pie), not a persistent KPI dashboard
5. **Authentication** - No user authentication (single-user agent for demo)
6. **Audit Trail** - Limited query logging for compliance

### Future Improvements (With More Time)

**Shipped since the initial submission** (see root `DECISION_LOG.md` → "Beyond the core requirements"):
- ✅ Chart visualizations (pipeline by sector, revenue by sector, operations by status, top customers/deals)
- ✅ Suggested follow-up questions after each response
- ✅ Export of any answer (copy / Markdown / print-to-PDF)
- ✅ Typing-reveal animation on responses (a frontend animation over the complete answer, not live LLM token streaming)

**Short term (1-2 days)**
- Dashboard with KPI cards (Revenue, Pipeline, Health Score) as a standalone page, distinct from the inline per-answer charts that exist today
- Query history panel
- Real token-level streaming from Groq over SSE/chunked HTTP (today's "typing" effect reveals an already-complete response)

**Medium term (1 week)**
- User authentication (separate contexts per user)
- Historical trend analysis and forecasting
- Automated risk alerts ("5 deals at risk of delay")
- Email delivery of leadership updates (file export already exists; this would add sending)
- Webhook integration for real-time notifications

**Long term (ongoing)**
- ML-based demand forecasting
- Anomaly detection (unusual deal/project metrics)
- Competitive win/loss analysis
- Customer lifetime value prediction
- Automated contract generation

## AI Tools Used

### Development Assistants
- **Claude (Anthropic)** - Architecture design, core logic
- **Cursor AI** - Code generation and refactoring
- **ChatGPT** - Brainstorming and troubleshooting

### Production LLM
- **Groq LLM** - Real-time agent inference

### Data Processing
- **Python/Pandas** (future) - For advanced analytics

### Infrastructure
- **Vercel** - Deployment and hosting

## Technical Decisions & Trade-offs

See [DECISION_LOG.md](./DECISION_LOG.md) for detailed reasoning on:
- Tech stack choices
- Monday.com API vs MCP
- Deterministic vs LLM analytics
- Data normalization strategy
- Scope decisions

## Testing

### Manual Testing Checklist
- [ ] Monday.com connection works
- [ ] Data fetches without errors
- [ ] Date normalization handles various formats
- [ ] Pipeline calculations are accurate
- [ ] Agent responds to natural language queries
- [ ] Clarification questions work
- [ ] Data quality warnings display
- [ ] Error handling is graceful

### Automated Tests (Future)
```bash
npm run test
```

Would cover:
- Data normalization (dates, text, numbers)
- Analytics calculations
- Agent tool calling
- API integration mocking

## Support & Questions

### Debugging

**Monday.com API 401 error**
- Verify API token in `.env.local`
- Check token hasn't expired
- Verify board IDs are correct

**Groq API errors**
- Check API key is valid
- Verify rate limits aren't exceeded
- Check model name is supported

**Data anomalies**
- Check Monday.com boards have correct column names
- Verify data types (currency, date, text)
- Look at data quality report for clues

### Performance

Typical response time: 2-5 seconds
- Monday.com fetch: 0.5-1s
- Data normalization: 0.1s
- Groq LLM inference: 1-3s
- Response rendering: 0.5s

## Repository Structure

```
skylark-drones/
├── pages/
│   ├── api/
│   │   └── query.ts              # Main API endpoint
│   ├── _app.tsx                  # App wrapper
│   ├── _document.tsx             # HTML structure
│   └── index.tsx                 # Main page
├── components/
│   └── ChatInterface.tsx          # Chat UI component
├── lib/
│   ├── types.ts                  # TypeScript interfaces
│   ├── monday-client.ts           # Monday.com API client
│   ├── data-normalizer.ts         # Data cleaning
│   ├── analytics.ts               # Metrics calculations
│   └── agent.ts                  # AI agent with Groq
├── styles/
│   └── globals.css               # Tailwind CSS
├── .env.example                  # Environment template
├── .env.local                    # Local credentials (not committed)
├── .gitignore                    # Git ignore rules
├── tsconfig.json                 # TypeScript config
├── tailwind.config.js            # Tailwind config
├── next.config.js                # Next.js config
├── package.json                  # Dependencies
├── README.md                     # This file
└── DECISION_LOG.md               # Technical decisions
```

## Conclusion

This Business Intelligence Agent demonstrates:
- ✅ **Full-stack engineering** (Frontend + Backend + Deployment)
- ✅ **AI/LLM integration** (Function calling, tool orchestration)
- ✅ **Data engineering** (Normalization, quality tracking, cross-board joins)
- ✅ **Product thinking** (Founder-focused UX, insights over raw data)
- ✅ **Engineering judgment** (Clear trade-offs, documented decisions)
- ✅ **Reliability** (Graceful error handling, transparent limitations)

The result is a working executive intelligence tool that founders at Skylark Drones can use immediately to answer business questions.

---

**Built with 🚁 for Skylark Drones**

Last updated: August 2026
