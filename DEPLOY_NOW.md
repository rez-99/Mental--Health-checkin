# 🚀 Deploy Your App - Single Clear Path

Follow these steps in order. Each step builds on the previous one.

---

## Step 1: Put Code on GitHub

### 1.1 Initialize Git (if not already done)
```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool
git init
git add .
git commit -m "Student check-in app with backend + Neon"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `student-checkin` (or your choice)
3. **Don't** check "Initialize with README" (you already have files)
4. Click **"Create repository"**

### 1.3 Push to GitHub
GitHub will show you commands. Run these (replace `YOUR_USERNAME`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/student-checkin.git
git branch -M main
git push -u origin main
```

✅ **Done when:** Your code is visible on GitHub

---

## Step 2: Deploy Backend to Render

### 2.1 Sign Up / Log In
1. Go to https://render.com
2. Sign up with GitHub (easiest - one click)

### 2.2 Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account (if not already)
3. Select your repository: `student-checkin` (or your repo name)
4. Click **"Connect"**

### 2.3 Configure Service
Fill in these settings:

**Name:** `student-checkin-api` (or your choice)

**Region:** Choose closest to you

**Branch:** `main`

**Root Directory:** `server` ⚠️ **IMPORTANT**

**Runtime:** `Node`

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm run dev
```

### 2.4 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these **3 variables**:

1. **DATABASE_URL**
   - Value: Your Neon connection string
   - Example: `postgresql://user:pass@ep-xxx.neon.tech/neondb?schema=public`

2. **JWT_SECRET**
   - Value: Any long random string
   - Example: `dev-secret-abc123xyz789-change-in-production`

3. **FRONTEND_URL**
   - Value: `http://localhost:5173` (we'll update later)

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Wait 2-5 minutes (watch the build logs)
3. When done, you'll get a URL like: `https://student-checkin-api.onrender.com`

### 2.6 Test Backend
Open in browser:
```
https://your-service-name.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

✅ **Done when:** Health endpoint returns JSON

**Save your backend URL:** `https://________________.onrender.com`

---

## Step 3: Point Frontend at Cloud API

### 3.1 Update .env.production
Edit `student-checkin/.env.production`:

```env
VITE_API_URL="https://your-service-name.onrender.com"
```

Replace with your actual Render URL from Step 2.

### 3.2 Test Build Locally (Optional)
```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm run build
```

If it builds successfully, you're ready!

✅ **Done when:** `.env.production` has your Render URL

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Sign Up / Log In
1. Go to https://vercel.com
2. Sign up with GitHub (easiest - one click)

### 4.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select: `student-checkin` (or your repo name)

### 4.3 Configure Project
Vercel will auto-detect, but verify:

**Framework Preset:** `Vite` (should auto-detect)

**Root Directory:** `student-checkin` ⚠️ **IMPORTANT**

**Build Command:** 
```bash
npm run build
```
(Should be auto-filled)

**Output Directory:** 
```
dist
```
(Should be auto-filled)

### 4.4 Add Environment Variable
Click **"Environment Variables"** and add:

**VITE_API_URL**
- Value: `https://your-service-name.onrender.com` (same as Step 3)
- Environment: Check **Production**, **Preview**, **Development**

### 4.5 Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. You'll get a URL like: `https://student-checkin.vercel.app`

### 4.6 Test Frontend
1. Open your Vercel URL in browser
2. Complete a check-in
3. Check browser DevTools → Network tab
4. Should see: `POST https://your-backend.onrender.com/api/students/.../check-ins`
5. Status should be `201 Created`

### 4.7 Verify in Database
Go to Neon SQL Editor and run:
```sql
SELECT * FROM "check_ins" ORDER BY created_at DESC LIMIT 10;
```

You should see new rows from your cloud app! 🎉

✅ **Done when:** Check-ins work from Vercel URL and appear in Neon database

**Save your frontend URL:** `https://________________.vercel.app`

---

## Step 5: Update Backend CORS (Optional but Recommended)

### 5.1 Update Render Environment
1. Go back to Render dashboard
2. Open your backend service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL`:
   ```
   https://your-frontend-url.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy

✅ **Done when:** CORS is configured (no errors when using Vercel frontend)

---

## ✅ You're Live!

Your app is now:
- ✅ Backend running on Render
- ✅ Frontend running on Vercel
- ✅ Database on Neon
- ✅ Full flow working: Frontend → Backend → Database

---

## Next: Mobile App (When Ready)

Once you have:
- ✅ Backend URL working: `https://________________.onrender.com`
- ✅ Frontend URL working: `https://________________.vercel.app`

Tell me and I'll walk you through turning your web app into an Android app step-by-step.

---

## Troubleshooting

### "Build failed" in Render
- Check build logs in Render dashboard
- Make sure `Root Directory` is `server`
- Verify `package.json` has `dev` script

### "Build failed" in Vercel
- Check build logs in Vercel dashboard
- Make sure `Root Directory` is `student-checkin`
- Verify `package.json` has `build` script

### "API not connecting"
- Check `VITE_API_URL` in Vercel environment variables
- Make sure it's `https://` not `http://`
- Verify backend is accessible (test `/health` endpoint)

### "CORS error"
- Update `FRONTEND_URL` in Render backend
- Make sure it matches your Vercel URL exactly
- Redeploy backend after updating

