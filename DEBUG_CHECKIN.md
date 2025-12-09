# 🔍 Debug Check-In Issues - Step-by-Step Guide

## Problem: Check-ins not saving / No success modal

Follow these steps in order to identify and fix the issue.

---

## Step 1: Fix CORS on Render (Most Likely Issue)

### 1.1 Go to Render Dashboard
1. Open https://render.com
2. Log in
3. Click on your backend service (e.g., `student-checkin-api`)

### 1.2 Update Environment Variable
1. Click **"Environment"** in the left menu
2. Find `FRONTEND_URL` in the list
3. Click to edit it
4. Change from: `http://localhost:5173`
5. Change to: `https://your-vercel-app.vercel.app` (your actual Vercel URL)
6. Click **"Save Changes"**

### 1.3 Restart Service
1. At the top of the service page, click **"Manual Deploy"** → **"Deploy latest commit"**
2. OR click **"Restart"** if available
3. Wait 1-2 minutes for restart

### 1.4 Verify CORS is Fixed
1. Open your Vercel URL in browser
2. Press F12 → Console tab
3. Try a check-in
4. Look for CORS errors - they should be gone now

---

## Step 2: Verify Frontend API URL

### 2.1 Check Vercel Environment Variables
1. Go to https://vercel.com
2. Open your project
3. Go to **Settings** → **Environment Variables**
4. Verify `VITE_API_URL` is set to your Render backend URL:
   ```
   https://your-backend.onrender.com
   ```
5. Make sure it's enabled for **Production**, **Preview**, and **Development**

### 2.2 Test API URL in Browser Console
1. Open your Vercel URL
2. Press F12 → Console
3. Type:
   ```javascript
   console.log('API URL:', import.meta.env.VITE_API_URL)
   ```
4. Press Enter
5. Should show your Render backend URL

---

## Step 3: Test Check-In Flow

### 3.1 Open Browser DevTools
1. Open your Vercel URL
2. Press F12
3. Go to **Console** tab
4. Keep it open while testing

### 3.2 Complete a Check-In
1. Click "Start my check-in"
2. Fill out all questions
3. Click submit

### 3.3 Check Console Logs
Look for one of these:

**✅ Success:**
```
✅ Check-in submitted to API: {id: "...", ...}
```

**❌ Error (CORS):**
```
❌ Failed to submit check-in to API: Error: Failed to fetch
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**❌ Error (404/500):**
```
❌ Failed to submit check-in to API: Error: HTTP 404
```

**❌ Error (Network):**
```
❌ Failed to submit check-in to API: Error: NetworkError when attempting to fetch resource
```

### 3.4 Check Network Tab
1. In DevTools, go to **Network** tab
2. Filter by "check-ins" or "api"
3. Look for `POST /api/students/.../check-ins`
4. Check:
   - **Status**: Should be `201 Created` (green)
   - **Request URL**: Should be your Render backend
   - **Response**: Should show JSON with check-in data

---

## Step 4: Check Success Modal

### 4.1 Verify Modal Logic
The success modal should appear if:
- `submitted === true` ✅
- `lastSaved !== null` ✅

### 4.2 Check if Modal is Rendering
1. After submitting, check browser console
2. Look for any React errors
3. Check if `setSubmitted(true)` was called
4. Check if `setLastSaved(...)` was called

### 4.3 Manual Test
In browser console, type:
```javascript
// This should show the modal (if React DevTools is available)
// Or check the React component state
```

---

## Step 5: Verify Database (Neon)

### 5.1 Check Check-Ins Table
1. Go to https://neon.tech
2. Open your project
3. Click **"SQL Editor"**
4. Run this query:
   ```sql
   SELECT *
   FROM "check_ins"
   ORDER BY created_at DESC
   LIMIT 10;
   ```

### 5.2 What to Look For
- **New rows** should appear after each check-in
- **created_at** should be recent (current time)
- **mood, sleepQuality, concentration, etc.** should have your values
- **risk_level** should be "green", "yellow", or "red"

### 5.3 Check Students Table
```sql
SELECT *
FROM "students"
LIMIT 10;
```

Should show at least one student (the demo student we auto-create).

---

## Step 6: Common Issues & Fixes

### Issue: CORS Error
**Symptom:** Console shows "blocked by CORS policy"

**Fix:**
1. Update `FRONTEND_URL` in Render (Step 1)
2. Restart Render service
3. Try again

### Issue: 404 Not Found
**Symptom:** Console shows "HTTP 404"

**Fix:**
1. Check API URL in Vercel env vars
2. Verify backend is running (test `/health` endpoint)
3. Check Render logs for errors

### Issue: 500 Server Error
**Symptom:** Console shows "HTTP 500"

**Fix:**
1. Check Render logs for error details
2. Verify `DATABASE_URL` is correct in Render
3. Check if database is accessible

### Issue: No Success Modal
**Symptom:** Check-in completes but no popup

**Fix:**
1. Check browser console for React errors
2. Verify `setSubmitted(true)` is called
3. Verify `setLastSaved(...)` is called
4. Check if modal CSS is loading

### Issue: Check-in Not Saving
**Symptom:** No new rows in Neon

**Fix:**
1. Check if API call is succeeding (Step 3)
2. Check Render logs for database errors
3. Verify `DATABASE_URL` in Render is correct

---

## Quick Checklist

After fixing CORS, test this:

- [ ] Render `FRONTEND_URL` = your Vercel URL
- [ ] Render service restarted
- [ ] Vercel `VITE_API_URL` = your Render URL
- [ ] Browser console shows API call (success or error)
- [ ] Success modal appears after check-in
- [ ] Neon `check_ins` table has new row

---

## Get Help

If you're still stuck, share:

1. **Console error message** (copy/paste the exact error)
2. **Network tab** - screenshot of the API request (status, URL, response)
3. **Neon query result** - first row from `SELECT * FROM "check_ins" ORDER BY created_at DESC LIMIT 1;`
4. **Render logs** - any errors from the backend

With that info, I can tell you exactly what's wrong!

