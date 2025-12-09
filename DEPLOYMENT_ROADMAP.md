# 🚀 Deployment Roadmap - From Localhost to App Stores

## Current Status
✅ Backend API working (localhost:4000)
✅ Frontend working (localhost:5173)
✅ Database connected (Neon PostgreSQL)
✅ Full check-in flow working

## Phase 1: Deploy Backend to Cloud

### Step 1.1: Choose a Host
**Recommended (Free/Cheap):**
- **Render** (https://render.com) - Free tier, easy setup
- **Railway** (https://railway.app) - Free tier, great DX
- **Fly.io** (https://fly.io) - Free tier, good performance

### Step 1.2: Deploy Backend
1. Push `server/` folder to GitHub
2. Connect GitHub repo to your host
3. Set environment variables:
   - `DATABASE_URL` (your Neon connection string)
   - `JWT_SECRET` (long random string)
   - `FRONTEND_URL` (your frontend URL)
   - `PORT` (usually auto-set by host)
4. Set build command: `npm install && npm run build`
5. Set start command: `npm run start` (need to add this script)

### Step 1.3: Update Backend for Production
- Add `npm run start` script to `package.json`
- Update CORS to allow production frontend URL
- Test: `https://your-api-url.com/health`

**Result**: Backend running at `https://your-api-url.com`

---

## Phase 2: Deploy Frontend Web Version

### Step 2.1: Update Frontend Config
1. Create `student-checkin/.env.production`:
   ```env
   VITE_API_URL=https://your-api-url.com
   ```

2. Build:
   ```bash
   npm run build
   ```

3. Deploy `dist/` folder to:
   - **Vercel** (https://vercel.com) - Easiest
   - **Netlify** (https://netlify.com) - Also easy
   - **Render** (static site)

**Result**: Web app at `https://yourapp.vercel.app`

---

## Phase 3: Mobile App (Capacitor)

### Step 3.1: Install Capacitor
```bash
cd student-checkin
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "SafePulse Check-in" com.reza.safepulse
```

### Step 3.2: Configure for Production API
- Update `capacitor.config.ts`:
  ```typescript
  webDir: 'dist',
  server: {
    url: 'https://yourapp.vercel.app', // or your web URL
    cleartext: false
  }
  ```

### Step 3.3: Build Workflow
Every time before testing on device:
```bash
npm run build
npx cap copy
npx cap sync
```

### Step 3.4: Android Setup
```bash
npx cap open android
```
- Let Gradle sync
- Run on emulator/device
- Test API connection

### Step 3.5: iOS Setup
```bash
npx cap open ios
```
- Select Team in Xcode
- Run on simulator/device
- Test API connection

---

## Phase 4: App Store Submission

### Android (Google Play)
1. **Requirements:**
   - Google Play Developer account ($25 one-time)
   - Signed AAB file
   - App listing (name, description, screenshots)
   - Privacy policy URL
   - Content rating

2. **Build Signed AAB:**
   - Android Studio → Build → Generate Signed Bundle
   - Create keystore (save securely!)
   - Upload to Play Console

### iOS (App Store)
1. **Requirements:**
   - Apple Developer account ($99/year)
   - App Store Connect entry
   - Screenshots (multiple sizes)
   - Privacy policy URL
   - Health data disclosure

2. **Build & Upload:**
   - Xcode → Product → Archive
   - Distribute to App Store Connect
   - Submit for review

---

## Phase 5: Legal & Compliance (Before Real Users)

### Required Disclaimers
- "This app is not a diagnosis tool"
- "Not a replacement for emergency services"
- Crisis hotline numbers
- Privacy policy

### Privacy Policy Must Include
- What data is collected
- Who can see it (counsellors, admins)
- Where it's stored (encrypted database)
- How long it's kept
- Student/parent rights

### Compliance Considerations
- COPPA (if under 13)
- FERPA (educational records)
- School district policies
- Parental consent (if required)

---

## Quick Start Checklist (Today)

- [ ] Deploy backend to Render/Railway
- [ ] Get production API URL
- [ ] Update frontend `.env.production` with API URL
- [ ] Build frontend: `npm run build`
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Install Capacitor: `npm install @capacitor/...`
- [ ] Initialize Capacitor: `npx cap init`
- [ ] Build and test on Android/iOS emulator
- [ ] Verify API connection works from mobile

---

## Next Steps After Mobile Works

1. Fix mobile-specific bugs (keyboard, scrolling, etc.)
2. Add app icons and splash screens
3. Create privacy policy page
4. Add required disclaimers to app
5. Generate signed builds
6. Create app store listings
7. Submit for review

---

## Important Notes

⚠️ **Before real school deployment:**
- Legal/privacy review
- Clear disclaimers
- Supervisor/clinician backing
- Crisis resources clearly displayed

✅ **Safe for:**
- Beta/demo versions
- Competition entries
- Prototype testing
- Development

