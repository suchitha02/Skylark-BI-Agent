# Skylark Drones BI Agent — Deployment Guide

## Architecture Overview

The application is split into two independent services:

```
┌─────────────────────────────────┐
│   Frontend (Vercel)             │
│  - React + Next.js              │
│  - Chat UI                      │
│  - Static assets                │
│  - Calls backend API            │
└────────────┬────────────────────┘
             │ API calls
             ▼
┌─────────────────────────────────┐
│   Backend (Render)              │
│  - Express.js server            │
│  - Monday.com integration       │
│  - Data normalization           │
│  - Analytics                    │
│  - Groq LLM agent               │
└─────────────────────────────────┘
```

**Benefits:**
- ✅ Independent scaling
- ✅ Separate CI/CD pipelines
- ✅ Different deployment platforms
- ✅ Easy to maintain and update
- ✅ Better security (secrets isolated)

---

## Prerequisites

- GitHub account (repository)
- Vercel account (for frontend)
- Render account (for backend)
- Monday.com API token
- Groq API key

---

## Part 1: Deploy Backend to Render

### Step 1: Push Backend to GitHub

```bash
cd backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/YOUR_USERNAME/skylark-drones-backend.git
git push -u origin main
```

Or add to monorepo:
```bash
# If deploying as part of larger repo
git add backend/
git commit -m "Add backend service"
git push
```

### Step 2: Create Render Service

1. Go to https://render.com
2. Sign in or create account
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Select the `backend` directory as root
6. Set configuration:
   - **Name**: `skylark-drones-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter for production)

### Step 3: Add Environment Variables

In Render dashboard, go to Environment:

```
MONDAY_API_KEY=your_monday_api_token
WORK_ORDERS_BOARD_ID=5030994891
DEALS_BOARD_ID=5030994911
GROQ_API_KEY=your_groq_api_key
FRONTEND_URL=https://skylark-bi-agent-frontend-pi.vercel.app
NODE_ENV=production
```

### Step 4: Deploy

Click "Create Web Service". Render will automatically:
1. Clone your repository
2. Install dependencies
3. Build the application
4. Deploy to a public URL

**Your backend will be available at:**
```
https://skylark-bi-agent-fpgy.onrender.com
```

### Step 5: Test Backend

```bash
curl https://skylark-bi-agent-fpgy.onrender.com/health

# Should respond:
# {"status":"ok","message":"Skylark Drones Backend is running"}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Push Frontend to GitHub

```bash
cd frontend
git init
git add .
git commit -m "Initial frontend commit"
git remote add origin https://github.com/YOUR_USERNAME/skylark-drones-frontend.git
git push -u origin main
```

Or add to monorepo:
```bash
git add frontend/
git commit -m "Add frontend service"
git push
```

### Step 2: Create Vercel Project

1. Go to https://vercel.com
2. Click "New Project"
3. Import GitHub repository
4. Select the `frontend` directory as root
5. Click "Import"

### Step 3: Add Environment Variables

In Vercel dashboard, go to Settings → Environment Variables:

```
NEXT_PUBLIC_BACKEND_URL=https://skylark-bi-agent-fpgy.onrender.com
NEXT_PUBLIC_APP_NAME=Skylark Drones BI Agent
```

**Important**: Use the exact Render backend URL you got in Step 1.

### Step 4: Deploy

Vercel will automatically:
1. Detect Next.js
2. Install dependencies
3. Build the application
4. Deploy to Vercel's global CDN

**Your frontend will be available at:**
```
https://skylark-bi-agent-frontend-pi.vercel.app
```

### Step 5: Test Frontend

Open https://skylark-bi-agent-frontend-pi.vercel.app in browser. Try asking:
```
"How is our pipeline?"
```

---

## Part 3: Update Backend with Frontend URL

Once frontend is deployed, update the backend:

1. In Render dashboard
2. Go to backend service settings
3. Update `FRONTEND_URL` to your Vercel URL
4. Redeploy

This ensures CORS works correctly.

---

## Local Development

### Terminal 1: Start Backend

```bash
cd backend
npm install
# Create .env.local with credentials
cp .env.example .env.local
npm run dev
# Runs on http://localhost:3001
```

### Terminal 2: Start Frontend

```bash
cd frontend
npm install
# Create .env.local
cp .env.example .env.local
# Add NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
npm run dev
# Runs on http://localhost:3000
```

### Test Locally

1. Open http://localhost:3000
2. Ask: "How is our pipeline?"
3. Should see response within 2-5 seconds

---

## Deployment Checklist

### Backend (Render)
- [ ] Repository pushed to GitHub
- [ ] Render service created
- [ ] Environment variables added:
  - [ ] MONDAY_API_KEY
  - [ ] WORK_ORDERS_BOARD_ID
  - [ ] DEALS_BOARD_ID
  - [ ] GROQ_API_KEY
  - [ ] FRONTEND_URL
  - [ ] NODE_ENV=production
- [ ] Deployment successful
- [ ] Health check passes: `/health`
- [ ] Backend accessible via public URL

### Frontend (Vercel)
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables added:
  - [ ] NEXT_PUBLIC_BACKEND_URL
  - [ ] NEXT_PUBLIC_APP_NAME
- [ ] Deployment successful
- [ ] Can access at public URL
- [ ] Can connect to backend
- [ ] Queries return results

### End-to-End
- [ ] Frontend loads without errors
- [ ] Can type query in chat
- [ ] Backend responds with data
- [ ] Insights and risks display
- [ ] Data quality notes show
- [ ] No console errors

---

## Troubleshooting

### Backend Issues

**Render shows build failure**
```
Check build logs in Render dashboard
Common issues:
- Missing environment variables
- Node version mismatch (should be 18.x)
- npm install failure
```

**Backend doesn't respond to queries**
```
1. Check health endpoint: https://backend-url/health
2. Verify environment variables are set
3. Check Render logs for errors
4. Verify Monday.com API key is valid
```

**CORS errors in frontend**
```
Make sure backend FRONTEND_URL matches your Vercel URL
Update in Render dashboard and redeploy
```

### Frontend Issues

**Vercel shows build error**
```
1. Check build logs in Vercel dashboard
2. Verify all dependencies in package.json
3. Ensure .next directory is not in git
4. Check Node version compatibility
```

**Frontend can't reach backend**
```
1. Verify NEXT_PUBLIC_BACKEND_URL is set correctly
2. Open browser DevTools → Network tab
3. Check if API calls are reaching correct URL
4. Verify backend is responding (test in browser)
```

**Queries timeout**
```
1. Check Render backend is running (not sleeping on free tier)
2. Verify Monday.com API is accessible
3. Check Groq API key is valid
4. Try simpler query first (e.g., "hello")
```

### Connection Issues

**Backend says "Cannot reach Vercel"**
```
This is normal - backend doesn't need to reach frontend
Update FRONTEND_URL in Render if frontend changed
Redeploy backend
```

**Frontend says "Cannot reach backend"**
```
1. Check NEXT_PUBLIC_BACKEND_URL is correct
2. Verify backend is running (check Render logs)
3. Try accessing backend URL directly in browser
4. Check if Monday.com API is accessible
```

---

## Performance Optimization

### Frontend (Vercel)

**Enable caching:**
```javascript
// vercel.json
{
  "crons": [{
    "path": "/api/revalidate",
    "schedule": "0 0 * * *"
  }]
}
```

**Reduce bundle size:**
- Tree-shake unused components
- Lazy load non-critical components
- Minify CSS/JS (automatic)

### Backend (Render)

**Optimize cold starts:**
- Backend runs on Node.js (fast startup)
- Use `npm start` directly (not build tool)
- Pre-warm connections on deploy

**Reduce API calls:**
- Add caching layer (Redis future)
- Cache Monday.com data for 5 minutes
- Batch queries when possible

---

## Monitoring & Debugging

### View Logs

**Render (Backend):**
1. Go to Render dashboard
2. Select your service
3. Click "Logs" tab
4. See real-time logs

**Vercel (Frontend):**
1. Go to Vercel dashboard
2. Select your project
3. Click "Logs" tab
4. See build and runtime logs

### Monitor Performance

**Vercel Analytics:**
- Automatic in Vercel dashboard
- Shows page load times
- Shows API latencies

**Render Metrics:**
- CPU usage
- Memory usage
- Request count
- Error rates

---

## Cost Estimation

### Vercel (Frontend)
- **Free tier**: Enough for demo/low traffic
- **Pro**: $20/month for production
- **Enterprise**: Custom pricing

### Render (Backend)
- **Free tier**: Limited, restarts after 15 min inactivity
- **Starter**: $7/month, always on
- **Standard**: $12/month, more capacity

**Total estimated cost**: $0-27/month depending on usage

---

## Updating Deployments

### Update Backend

```bash
cd backend
# Make changes
git add .
git commit -m "Update backend"
git push origin main
# Render automatically redeploys on push
```

### Update Frontend

```bash
cd frontend
# Make changes
git add .
git commit -m "Update frontend"
git push origin main
# Vercel automatically redeploys on push
```

### Update Environment Variables

**Without redeploying:**
1. Go to dashboard (Render or Vercel)
2. Settings → Environment Variables
3. Update value
4. Click "Redeploy" button

---

## Summary

You now have:
- ✅ **Backend on Render**: `https://skylark-bi-agent-fpgy.onrender.com`
- ✅ **Frontend on Vercel**: `https://skylark-bi-agent-frontend-pi.vercel.app`
- ✅ **Automatic deployments**: Push to GitHub → auto deploy
- ✅ **Production ready**: Both services production-grade
- ✅ **Isolated concerns**: Frontend and backend separate
- ✅ **Easy to maintain**: Update either independently

**Next step**: Share the Vercel URL with recruiters. They can immediately use the app without any setup.

---

*Last updated: August 31, 2026*
