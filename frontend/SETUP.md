# Skylark Drones BI Agent — Setup & Deployment Guide

## Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ (`node --version`)
- npm or yarn
- Monday.com API token (you have this ✅)
- Groq API key (you have this ✅)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file and add secrets
cp .env.example .env.local
# Edit .env.local and add your actual credentials:
# - NEXT_PUBLIC_MONDAY_API_KEY
# - GROQ_API_KEY
# - NEXT_PUBLIC_WORK_ORDERS_BOARD_ID
# - NEXT_PUBLIC_DEALS_BOARD_ID

# 3. Start development server
npm run dev

# 4. Open browser
# http://localhost:3000
```

You should see the chat interface. Try asking: "How is our pipeline?"

---

## Detailed Setup

### 1. Install Node Dependencies

```bash
cd skylark-drones
npm install
```

This installs:
- `next` - React framework
- `react` - UI library
- `react-dom` - React DOM
- `groq-sdk` - Groq LLM API client
- `axios` - HTTP client
- `typescript` - Type checker
- `tailwindcss` - CSS framework

Expected time: 2-3 minutes (first time only)

### 2. Configure Environment Variables

#### Create `.env.local`

```bash
cp .env.example .env.local
```

#### Edit `.env.local` and add your credentials

```bash
# Monday.com Configuration
NEXT_PUBLIC_MONDAY_API_KEY=your_monday_api_token_here
NEXT_PUBLIC_WORK_ORDERS_BOARD_ID=5030994891
NEXT_PUBLIC_DEALS_BOARD_ID=5030994911

# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Skylark Drones BI Agent
NEXT_PUBLIC_API_ENDPOINT=http://localhost:3000/api
```

**Important**: `.env.local` is in `.gitignore` and will never be committed.

### 3. Run Development Server

```bash
npm run dev
```

Output should show:
```
> ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

Open http://localhost:3000 in your browser.

### 4. Test the Agent

Try these questions:
1. "How is our pipeline?" - Should show pipeline metrics
2. "What are the biggest risks?" - Should identify concentration risks
3. "Compare Energy vs Infrastructure" - Should analyze both sectors
4. "Which customers have the largest deals?" - Should list top customers

---

## Troubleshooting

### Issue: "Monday.com API error"

**Symptom**: Agent responds with "I couldn't retrieve the latest Monday.com data"

**Solutions**:
1. Verify API key is correct in `.env.local`
2. Check board IDs match your Monday.com workspace
3. Verify Monday.com token hasn't expired
4. Check that boards have data (import CSV files if needed)

### Issue: "Groq API error"

**Symptom**: Agent responds with "I encountered an error processing your query"

**Solutions**:
1. Verify Groq API key is correct in `.env.local`
2. Check you haven't exceeded Groq API rate limits
3. Verify model name is supported (should be `mixtral-8x7b-32768`)
4. Check internet connection

### Issue: Build errors with TypeScript

**Symptom**: `npm run build` fails with type errors

**Solutions**:
```bash
# Check for type errors
npm run type-check

# Might be due to missing node_modules
rm -rf node_modules
npm install

# Try building again
npm run build
```

### Issue: Port 3000 is already in use

**Solution**:
```bash
# Start on different port
PORT=3001 npm run dev

# Then open http://localhost:3001
```

### Issue: Changes not showing up

**Solution**:
1. Make sure you're editing files in `pages/`, `components/`, or `lib/`
2. Next.js should hot-reload automatically
3. If not, stop dev server (Ctrl+C) and restart: `npm run dev`

---

## Deployment to Vercel (Recommended)

### Step 1: Push Code to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit: Skylark Drones BI Agent"

# Create a new repository on GitHub
# https://github.com/new

# Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/skylark-drones.git
git branch -M main
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to https://vercel.com
2. Sign in or create account
3. Click "New Project"
4. Import from GitHub
5. Select your `skylark-drones` repository
6. Vercel should auto-detect Next.js

### Step 3: Add Environment Variables

In Vercel dashboard:
1. Go to project settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_MONDAY_API_KEY = your_key_here
NEXT_PUBLIC_WORK_ORDERS_BOARD_ID = 5030994891
NEXT_PUBLIC_DEALS_BOARD_ID = 5030994911
GROQ_API_KEY = your_groq_key_here
NEXT_PUBLIC_APP_NAME = Skylark Drones BI Agent
NEXT_PUBLIC_API_ENDPOINT = https://your-deployment.vercel.app/api
```

### Step 4: Deploy

Click "Deploy" button in Vercel dashboard.

Within 2-5 minutes, your agent will be live at:
```
https://your-deployment.vercel.app
```

Share this URL with recruiters!

### Step 5: Automatic Deployments

Now every time you push to GitHub:
```bash
git push origin main
```

Vercel automatically rebuilds and deploys. No manual steps needed.

---

## Production Deployment Checklist

Before sharing with recruiters:

- [ ] Environment variables are set in Vercel
- [ ] `.env.local` file is NOT in git (check `.gitignore`)
- [ ] Test the live URL in different browsers
- [ ] Try multiple queries to verify agent is responsive
- [ ] Check that data loads without errors
- [ ] Verify Monday.com board IDs are correct
- [ ] Set up monitoring (Vercel provides free analytics)

---

## Monitoring & Logs

### View Logs in Vercel

1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. See real-time errors and requests

### Local Logging

During development, errors print to console:
```bash
# In terminal where you ran `npm run dev`
# You'll see API errors, data issues, etc.
```

---

## Building & Optimizing

### Production Build

```bash
# Build the application
npm run build

# Start production server locally (for testing)
npm run start
```

### Performance Optimization

Current response time: ~2-5 seconds

If you need faster responses:

1. **Cache Monday.com data**
   - Modify `pages/api/query.ts` to cache for 5 minutes
   - Reduces API calls significantly

2. **Optimize prompts**
   - Shorten system prompt
   - Reduce tool descriptions
   - Fewer example patterns

3. **Parallel requests**
   - Fetch Work Orders and Deals in parallel
   - Save ~0.5 seconds

---

## Development Workflow

### Making Changes

The development server automatically reloads on file changes:

```bash
# Terminal stays running
npm run dev

# Edit any file in pages/, components/, lib/, styles/
# Browser automatically reloads

# Ctrl+C to stop
```

### Adding a New Feature

Example: Add "show all deals" feature

1. Add tool to `lib/agent.ts`
2. Implement in agent's tool execution
3. Tool automatically available to LLM
4. User can ask "Show me all deals"

### Running TypeScript Check

```bash
# Check for type errors without building
npm run type-check

# Fix issues by editing TypeScript files
```

### ESLint

```bash
# Check code style
npm run lint

# Most issues can be auto-fixed
npm run lint -- --fix
```

---

## File Management

### Environment Variables
- `.env.example` - Template (commit this)
- `.env.local` - Your secrets (never commit)

### Git Workflow

```bash
# Only commit source files
git add pages lib components styles *.json *.js *.md .gitignore

# NEVER commit
# - .env.local
# - node_modules/
# - .next/
```

---

## Useful Commands

```bash
# Start dev server with auto-reload
npm run dev

# Production build
npm run build

# Run production build locally
npm run start

# Type checking
npm run type-check

# Linting
npm run lint

# Linting with auto-fix
npm run lint -- --fix

# Clean build (if things break)
rm -rf .next node_modules
npm install
npm run build
```

---

## Questions for Interview

When recruiters ask:

**"How do I run this locally?"**
```
1. Clone the repo
2. npm install
3. Add your Monday.com API key and Groq key to .env.local
4. npm run dev
5. Open http://localhost:3000
```

**"How is it deployed?"**
```
It's on Vercel, which auto-deploys when I push to GitHub. The URL is [link]. 
It takes ~2-5 seconds per query because it fetches from Monday.com and runs inference on Groq.
```

**"What if Monday.com API goes down?"**
```
The agent gracefully returns an error message. I could add caching to prevent this, which is documented in the Decision Log.
```

**"Can I scale this?"**
```
Yes, the architecture supports it. With more time, I'd add:
1. Database caching (Redis) for Monday.com data
2. User authentication for multi-tenant access
3. Dashboard visualizations
4. Historical trend analysis
```

---

## Performance Expectations

| Action | Time |
|--------|------|
| Load homepage | <1s |
| Submit query | <100ms |
| Fetch Monday.com | 0.5-1s |
| Process data | 0.1-0.2s |
| Groq inference | 1-3s |
| Display answer | <1s |
| **Total** | **2-5s** |

---

## Support

### If Something Breaks

1. Check the error message in browser console (F12)
2. Check Vercel logs (if deployed)
3. Check `.env.local` for missing variables
4. Try restarting dev server: `Ctrl+C` then `npm run dev`
5. Check git status for uncommitted `.env.local` changes

### Debugging

Enable verbose logging by adding to `lib/agent.ts`:

```typescript
console.log('Agent context:', agentContext);
console.log('Groq response:', response);
```

---

## Next Steps

1. **Setup locally** (5 min) - Follow Quick Start above
2. **Test agent** (5 min) - Try example questions
3. **Deploy to Vercel** (10 min) - Follow deployment steps
4. **Share with recruiters** - Send live URL
5. **Prepare for discussion** - Know answers to interview questions above

---

**You're all set! 🚀**

The agent is ready to demo. Start with `npm run dev` and try asking business questions.

Questions? Check README.md or DECISION_LOG.md for more context.
