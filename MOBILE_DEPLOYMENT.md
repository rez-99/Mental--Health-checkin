# 📱 Mobile App Deployment Guide

## Prerequisites
- ✅ Backend deployed to cloud (Render/Railway/etc.)
- ✅ Frontend web version deployed (Vercel/Netlify)
- ✅ Production API URL ready

## Step 1: Install Capacitor

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

## Step 2: Initialize Capacitor

```bash
npx cap init "SafePulse Check-in" com.reza.safepulse
```

When prompted:
- **App name**: SafePulse Check-in (or your choice)
- **App ID**: com.reza.safepulse (or your choice - must be unique)
- **Web dir**: dist (where Vite builds to)

## Step 3: Configure Capacitor

After init, edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reza.safepulse',
  appName: 'SafePulse Check-in',
  webDir: 'dist',
  server: {
    // For development: point to your local server
    // url: 'http://localhost:5173',
    // cleartext: true
    
    // For production: point to your deployed web app
    // url: 'https://yourapp.vercel.app',
    // cleartext: false
  }
};

export default config;
```

## Step 4: Build Workflow

Every time you want to test on mobile:

```bash
# 1. Build the web app
npm run build

# 2. Copy to native projects
npx cap copy

# 3. Sync native plugins
npx cap sync
```

## Step 5: Android Development

### 5.1 Open Android Project
```bash
npx cap open android
```

This opens Android Studio.

### 5.2 First Time Setup
1. Let Gradle sync (may take a few minutes)
2. Wait for "Build successful"
3. Connect Android device or start emulator
4. Click Run ▶️

### 5.3 Test
- App should open on device/emulator
- Test check-in flow
- Verify API calls work (check Network tab in Chrome DevTools via USB debugging)

### 5.4 Common Issues
- **CORS errors**: Make sure backend CORS includes your app
- **API not connecting**: Check `VITE_API_URL` in `.env.production`
- **Build errors**: Make sure you ran `npm run build` first

## Step 6: iOS Development

### 6.1 Requirements
- Mac computer
- Xcode installed
- Apple Developer account (free for testing, $99/year for App Store)

### 6.2 Open iOS Project
```bash
npx cap open ios
```

This opens Xcode.

### 6.3 First Time Setup
1. Select your Team in Xcode (Signing & Capabilities)
2. Choose simulator or connected iPhone
3. Click Run ▶️

### 6.4 Test
- App should open on simulator/device
- Test check-in flow
- Verify API calls work

## Step 7: Production Builds

### Android (AAB for Play Store)
1. Android Studio → Build → Generate Signed Bundle / APK
2. Choose "Android App Bundle (AAB)"
3. Create new keystore (save password securely!)
4. Build the bundle
5. Upload `.aab` file to Google Play Console

### iOS (IPA for App Store)
1. Xcode → Product → Archive
2. Wait for archive to complete
3. Distribute App → App Store Connect
4. Upload
5. Complete metadata in App Store Connect
6. Submit for review

## Step 8: App Store Requirements

### Google Play Store
- [ ] Google Play Developer account ($25)
- [ ] App name and description
- [ ] Screenshots (phone, tablet)
- [ ] App icon (512x512)
- [ ] Feature graphic (1024x500)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Signed AAB file

### Apple App Store
- [ ] Apple Developer account ($99/year)
- [ ] App name and description
- [ ] Screenshots (multiple iPhone sizes)
- [ ] App icon (1024x1024)
- [ ] Privacy policy URL
- [ ] Health data disclosure
- [ ] Signed IPA file

## Step 9: Required Legal Text

Add to your app (in a "About" or "Info" section):

```
This app is not a diagnosis tool and does not provide medical advice.

If you are in immediate danger or experiencing a mental health crisis, 
please contact:
- Emergency services: 911 (US) or your local emergency number
- Crisis Text Line: Text HOME to 741741
- National Suicide Prevention Lifeline: 988

This app is designed to help school staff identify students who may 
benefit from additional support. It is not a replacement for 
professional mental health care.
```

## Quick Commands Reference

```bash
# Build web app
npm run build

# Copy to native
npx cap copy

# Sync plugins
npx cap sync

# Open Android
npx cap open android

# Open iOS
npx cap open ios

# Check Capacitor version
npx cap --version
```

## Troubleshooting

### "Module not found" errors
- Run `npm install` in student-checkin/
- Make sure you installed all Capacitor packages

### "Build failed"
- Make sure you ran `npm run build` first
- Check that `dist/` folder exists

### "API not connecting"
- Check `VITE_API_URL` in `.env.production`
- Make sure backend is deployed and accessible
- Check CORS settings in backend

### "App crashes on launch"
- Check browser console (if using web version)
- Check Xcode/Android Studio logs
- Verify API URL is correct

