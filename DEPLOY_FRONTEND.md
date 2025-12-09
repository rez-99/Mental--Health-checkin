# 🌐 Deploy Frontend to Vercel (Step-by-Step)

## Prerequisites
- ✅ Backend deployed (have API URL)
- ✅ Frontend code in `student-checkin/` folder
- ✅ GitHub repository (same one or separate)

## Step 1: Update Production Config

### 1.1 Update .env.production
Edit `student-checkin/.env.production`:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

Replace with your actual backend URL from Render.

### 1.2 Test Build Locally (Optional)
```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm run build
```

This creates `dist/` folder. If it builds successfully, you're ready!

## Step 2: Deploy to Vercel

### 2.1 Sign Up / Log In
1. Go to https://vercel.com
2. Sign up with GitHub (easiest)

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. Import your GitHub repository
3. Select the repository: `student-checkin-app` (or your repo name)

### 2.3 Configure Project
Vercel will auto-detect settings, but verify:

**Framework Preset:** `Vite` (should auto-detect)

**Root Directory:** `student-checkin` ⚠️ **IMPORTANT** - This tells Vercel where your frontend code is

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

**Install Command:**
```bash
npm install
```
(Should be auto-filled)

### 2.4 Set Environment Variables
Click **"Environment Variables"** and add:

**VITE_API_URL**
- Value: `https://your-backend-url.onrender.com`
- Environment: `Production`, `Preview`, `Development` (check all)

### 2.5 Deploy
1. Click **"Deploy"**
2. Wait 1-2 minutes
3. You'll get a URL like: `https://student-checkin-app.vercel.app`

### 2.6 Test Your Frontend
1. Open the Vercel URL in browser
2. Complete a check-in
3. Check browser DevTools → Network tab
4. Should see `POST https://your-backend-url.onrender.com/api/students/.../check-ins`
5. Status should be `201 Created`

✅ **Frontend is live!**

## Step 3: Update Backend CORS

### 3.1 Update Render Environment Variables
Go back to Render dashboard:

1. Open your backend service
2. Go to **"Environment"** tab
3. Update `FRONTEND_URL`:
   ```
   https://your-frontend-url.vercel.app
   ```
4. Click **"Save Changes"**
5. Render will automatically redeploy

### 3.2 Verify CORS
Test again from your Vercel frontend - should work without CORS errors.

## Alternative: Deploy to Netlify

If you prefer Netlify:

1. Go to https://netlify.com
2. Sign up with GitHub
3. **"Add new site"** → **"Import an existing project"**
4. Select your repository
5. Build settings:
   - **Base directory:** `student-checkin`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com`
7. Deploy

## Troubleshooting

### "Build failed"
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

### "404 on routes"
- Vercel should auto-configure SPA routing
- If not, add `vercel.json`:
  ```json
  {
    "rewrites": [
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```

## Next Steps

Once frontend is deployed:
1. ✅ Update backend `FRONTEND_URL` environment variable
2. ✅ Test full flow: Web app → Backend → Database
3. ✅ Set up mobile app with Capacitor (see `SETUP_MOBILE.md`)

