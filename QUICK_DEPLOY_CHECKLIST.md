# ✅ Quick Deployment Checklist

## Phase 1: Backend Deployment (Render)

- [ ] Push code to GitHub
- [ ] Sign up at https://render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Set Root Directory: `server`
- [ ] Set Build Command: `npm install && npm run build`
- [ ] Set Start Command: `npm run start`
- [ ] Add environment variable: `DATABASE_URL` (Neon connection string)
- [ ] Add environment variable: `JWT_SECRET` (random string)
- [ ] Add environment variable: `FRONTEND_URL` (localhost for now)
- [ ] Deploy and wait for URL
- [ ] Test: `https://your-api.onrender.com/health`
- [ ] ✅ Backend deployed!

## Phase 2: Frontend Deployment (Vercel)

- [ ] Update `student-checkin/.env.production` with backend URL
- [ ] Sign up at https://vercel.com
- [ ] Import GitHub repository
- [ ] Set Root Directory: `student-checkin`
- [ ] Verify Build Command: `npm run build`
- [ ] Verify Output Directory: `dist`
- [ ] Add environment variable: `VITE_API_URL` (your Render URL)
- [ ] Deploy and wait for URL
- [ ] Test frontend → should connect to backend
- [ ] ✅ Frontend deployed!

## Phase 3: Update Backend CORS

- [ ] Go to Render dashboard
- [ ] Update `FRONTEND_URL` environment variable with Vercel URL
- [ ] Backend auto-redeploys
- [ ] Test frontend again → no CORS errors
- [ ] ✅ CORS configured!

## Phase 4: Mobile App Setup

- [ ] Install Capacitor: `npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios`
- [ ] Initialize: `npx cap init`
- [ ] Configure `capacitor.config.ts` (webDir: 'dist')
- [ ] Build: `npm run build`
- [ ] Copy: `npx cap copy`
- [ ] Open Android: `npx cap open android` (or iOS)
- [ ] Test on device/emulator
- [ ] ✅ Mobile app working!

## Phase 5: App Store Submission (When Ready)

### Android (Google Play)
- [ ] Create Google Play Developer account ($25)
- [ ] Generate signed AAB in Android Studio
- [ ] Create app listing in Play Console
- [ ] Add screenshots, description, icon
- [ ] Upload AAB file
- [ ] Submit for review

### iOS (App Store)
- [ ] Create Apple Developer account ($99/year)
- [ ] Archive app in Xcode
- [ ] Upload to App Store Connect
- [ ] Create app listing
- [ ] Add screenshots, description, icon
- [ ] Submit for review

## Estimated Time

- **Backend deployment:** 15-20 minutes
- **Frontend deployment:** 10-15 minutes
- **Mobile setup:** 30-60 minutes (first time)
- **App store submission:** 2-4 hours (first time)

## Need Help?

- Backend issues → Check `DEPLOY_BACKEND.md`
- Frontend issues → Check `DEPLOY_FRONTEND.md`
- Mobile issues → Check `SETUP_MOBILE.md`
- General roadmap → Check `DEPLOYMENT_ROADMAP.md`

