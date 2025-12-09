# 🚀 Deploy Backend to Render (Step-by-Step)

## Prerequisites
- ✅ GitHub account
- ✅ Neon database (already have connection string)
- ✅ Backend code in `server/` folder

## Step 1: Push to GitHub

### 1.1 Initialize Git (if not already done)
```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool
git init
git add .
git commit -m "Initial commit - Student check-in app with backend"
```

### 1.2 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `student-checkin-app` (or your choice)
3. **Don't** initialize with README (you already have files)
4. Click "Create repository"

### 1.3 Push to GitHub
```bash
git remote add origin https://github.com/YOUR_USERNAME/student-checkin-app.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Render

### 2.1 Sign Up / Log In
1. Go to https://render.com
2. Sign up with GitHub (easiest)

### 2.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account (if not already)
3. Select your repository: `student-checkin-app`
4. Click **"Connect"**

### 2.3 Configure Service
Fill in the form:

**Name:** `student-checkin-api` (or your choice)

**Region:** Choose closest to you (e.g., `Oregon (US West)`)

**Branch:** `main` (or `master`)

**Root Directory:** `server` ⚠️ **IMPORTANT** - This tells Render where your backend code is

**Runtime:** `Node`

**Build Command:** 
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm run start
```

### 2.4 Set Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these **4 variables**:

1. **DATABASE_URL**
   - Value: Your Neon connection string
   - Example: `postgresql://user:pass@ep-xxx.neon.tech/neondb?schema=public`

2. **JWT_SECRET**
   - Value: A long random string (generate one)
   - Example: `dev-secret-abc123xyz789-change-in-production`
   - You can generate one: https://randomkeygen.com/

3. **FRONTEND_URL**
   - Value: `http://localhost:5173` (for now, update later)
   - Later you'll add: `https://yourapp.vercel.app`

4. **NODE_ENV**
   - Value: `production`

### 2.5 Deploy
1. Click **"Create Web Service"**
2. Wait 2-5 minutes for deployment
3. You'll see build logs in real-time
4. When done, you'll get a URL like: `https://student-checkin-api.onrender.com`

### 2.6 Test Your Backend
Open in browser:
```
https://your-service-name.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"2024-..."}
```

✅ **Backend is live!**

## Step 3: Update Frontend

### 3.1 Update .env.production
Edit `student-checkin/.env.production`:

```env
VITE_API_URL=https://your-service-name.onrender.com
```

Replace with your actual Render URL.

### 3.2 Test Locally (Optional)
```bash
cd student-checkin
npm run build
npm run preview
```

Visit http://localhost:4173 and test a check-in.

## Troubleshooting

### "Build failed"
- Check build logs in Render dashboard
- Make sure `Root Directory` is set to `server`
- Verify `package.json` has `build` and `start` scripts

### "Database connection failed"
- Check `DATABASE_URL` in Render environment variables
- Make sure it includes `?schema=public` at the end
- Verify Neon database is accessible

### "Port already in use"
- Render sets PORT automatically, no need to configure

### "Module not found"
- Make sure `postinstall` script runs: `prisma generate`
- Check that all dependencies are in `package.json`

## Next Steps

Once backend is deployed:
1. ✅ Update frontend `.env.production` with API URL
2. ✅ Deploy frontend to Vercel (see `DEPLOY_FRONTEND.md`)
3. ✅ Update Render `FRONTEND_URL` environment variable
4. ✅ Test full flow: Frontend → Backend → Database

