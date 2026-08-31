# Deployment Guide — Vercel & Render

This guide shows you exactly how to deploy to both Vercel (Frontend) and Render (Backend).

## 🚀 Deploy to Vercel (Recommended for Frontend)

### Step 1: Go to Vercel

https://vercel.com/import

### Step 2: Import GitHub Repository

1. Click **"Import Project"**
2. Paste: `https://github.com/suchitha02/Skylark-BI-Agent`
3. Click **"Continue"**

### Step 3: Configure Project

- **Project name**: `skylark-drones` (or your choice)
- **Framework preset**: Should auto-detect **Next.js**
- **Root directory**: `./` (default)

### Step 4: Add Environment Variables

**CRITICAL**: Add these in the **Environment Variables** section BEFORE clicking Deploy:

```
NEXT_PUBLIC_MONDAY_API_KEY
Value: YOUR_MONDAY_API_TOKEN (from .env.local)

GROQ_API_KEY
Value: YOUR_GROQ_API_KEY (from .env.local)

NEXT_PUBLIC_WORK_ORDERS_BOARD_ID
Value: 5030994891

NEXT_PUBLIC_DEALS_BOARD_ID
Value: 5030994911

NEXT_PUBLIC_APP_NAME
Value: Skylark Drones BI Agent

NEXT_PUBLIC_API_ENDPOINT
Value: https://YOUR_VERCEL_URL.vercel.app/api
```

**See ENV_VARS_READY_TO_PASTE.txt for actual values**

**For the last variable, use the URL Vercel gives you after deployment (you'll update this after first deploy).**

### Step 5: Deploy

Click **"Deploy"**

Wait 2-5 minutes for deployment.

### Step 6: Update API Endpoint

After deployment, Vercel shows your URL (e.g., `https://skylark-drones.vercel.app`)

1. Go to Vercel dashboard → Your project → Settings → Environment Variables
2. Edit `NEXT_PUBLIC_API_ENDPOINT`:
   ```
   https://skylark-drones.vercel.app/api
   ```
3. Redeploy (click "Redeploy" button)

### ✅ Done!

Your app is live at: `https://skylark-drones.vercel.app`

---

## 🚀 Deploy to Render (Optional Backend Redundancy)

Render can run the same app as a backup/alternative deployment.

### Step 1: Go to Render

https://dashboard.render.com

### Step 2: Create New Service

1. Click **"New +"** in top right
2. Select **"Web Service"**
3. Select **"Build and deploy from a Git repository"**

### Step 3: Connect GitHub

1. Click **"GitHub"** to authorize
2. Select `Skylark-BI-Agent` repo
3. Click **"Connect"**

### Step 4: Configure Service

Fill out the form:

| Field | Value |
|-------|-------|
| **Name** | skylark-drones |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm run start` |
| **Instance Type** | Free (or Starter) |

### Step 5: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Add these (see ENV_VARS_READY_TO_PASTE.txt for actual values):

```
NEXT_PUBLIC_MONDAY_API_KEY = YOUR_MONDAY_API_TOKEN
GROQ_API_KEY = YOUR_GROQ_API_KEY
NEXT_PUBLIC_WORK_ORDERS_BOARD_ID = 5030994891
NEXT_PUBLIC_DEALS_BOARD_ID = 5030994911
NEXT_PUBLIC_APP_NAME = Skylark Drones BI Agent
NEXT_PUBLIC_API_ENDPOINT = https://YOUR_RENDER_URL.onrender.com/api
```

**For the last one, you'll get the URL after deployment, then update it.**

### Step 6: Deploy

Click **"Create Web Service"**

Wait 3-5 minutes for deployment (Render is slower than Vercel).

### Step 7: Update API Endpoint

After deployment, Render shows your URL (e.g., `https://skylark-drones.onrender.com`)

1. Go to Render dashboard → Your service → Environment
2. Edit `NEXT_PUBLIC_API_ENDPOINT`:
   ```
   https://skylark-drones.onrender.com/api
   ```
3. Redeploy (Render auto-redeploys on env var changes)

### ✅ Done!

Your app is live at: `https://skylark-drones.onrender.com`

---

## 📊 Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| Speed | ⚡ Fast (2-3 min) | 🐢 Slower (3-5 min) |
| Free Tier | ✅ Yes | ✅ Yes |
| Cold Starts | ✅ None | ❌ ~5 sec |
| Build | ✅ Instant | ✅ ~2 min |
| Reliability | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Best For | Production | Backup |

**Recommendation**: Use Vercel as primary (faster), Render as backup.

---

## 🧪 Test Your Deployments

### Test Vercel
```
https://skylark-drones.vercel.app

Ask: "How is our pipeline?"
```

### Test Render
```
https://skylark-drones.onrender.com

Ask: "How is our pipeline?"
```

Both should work identically.

---

## 🔄 Continuous Deployment

Both platforms auto-deploy when you push to GitHub:

```bash
# Make changes locally
git add .
git commit -m "Update feature"
git push origin main

# Vercel & Render automatically rebuild and deploy
# No manual steps needed
```

---

## 🛠️ Troubleshooting

### "Cannot find module" Error
→ Missing `GROQ_API_KEY` environment variable

**Fix**: Add it to platform's environment variables section and redeploy

### "Monday.com API Error"
→ Missing `NEXT_PUBLIC_MONDAY_API_KEY`

**Fix**: Check the key is correct and redeploy

### "Build Failed"
→ Usually dependency issue

**Fix**: Check build logs in platform dashboard, check package.json

### App loads but says "I couldn't retrieve data"
→ API endpoint URL is wrong

**Fix**: Update `NEXT_PUBLIC_API_ENDPOINT` to match your deployment URL

---

## 📝 Deployment Checklist

### Before Deploying:
- [ ] GitHub repo is public and contains all code
- [ ] No `.env.local` committed to git
- [ ] README is clear and complete
- [ ] Have all API keys ready

### Vercel Setup:
- [ ] GitHub account connected to Vercel
- [ ] Repository imported
- [ ] 6 environment variables added
- [ ] First deployment successful
- [ ] Updated `NEXT_PUBLIC_API_ENDPOINT` to Vercel URL
- [ ] Redeploy completed
- [ ] Can access `https://your-vercel-url.vercel.app`

### Render Setup:
- [ ] GitHub account connected to Render
- [ ] Repository imported
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm run start`
- [ ] 6 environment variables added
- [ ] First deployment successful
- [ ] Updated `NEXT_PUBLIC_API_ENDPOINT` to Render URL
- [ ] Redeploy completed
- [ ] Can access `https://your-render-url.onrender.com`

### Testing:
- [ ] Ask "How is our pipeline?" on both URLs
- [ ] Both return data without errors
- [ ] No console errors (F12 → Console)
- [ ] UI is responsive on mobile

---

## 🎯 Final URLs

After successful deployment, you'll have:

```
Vercel:  https://skylark-drones.vercel.app
Render:  https://skylark-drones.onrender.com
```

Both run the exact same code. Share the **Vercel URL** with recruiters (it's faster).

---

## ⚡ Performance Notes

**Vercel**:
- ~1-2 second response time
- Always warm (no cold starts)
- Recommended for production

**Render**:
- ~5-7 second first response (cold start)
- Subsequent requests ~2 seconds
- Good for backup/redundancy

---

## 📞 Support

If deployment fails:

1. Check build logs in platform dashboard
2. Verify environment variables are exactly correct
3. Check GitHub repo is public
4. Try redeploy button
5. Check https://status.vercel.com or https://render-status.com

---

**Ready to deploy? Follow the steps above!** 🚀
