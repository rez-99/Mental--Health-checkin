# 📱 Setup Mobile App with Capacitor

## Prerequisites
- ✅ Backend deployed (API URL ready)
- ✅ Frontend deployed (web version working)
- ✅ Updated `.env.production` with production API URL

## Step 1: Install Capacitor

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

This installs:
- `@capacitor/core` - Core Capacitor library
- `@capacitor/cli` - Command-line tools
- `@capacitor/android` - Android support
- `@capacitor/ios` - iOS support

## Step 2: Initialize Capacitor

```bash
npx cap init
```

When prompted, enter:

**App name:** `SafePulse Check-in` (or your choice - shows on phone)

**App ID:** `com.reza.safepulse` (or `com.yourname.yourapp` - must be unique)

**Web dir:** `dist` (where Vite builds to)

This creates `capacitor.config.ts` file.

## Step 3: Configure Capacitor

Edit `student-checkin/capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.reza.safepulse',
  appName: 'SafePulse Check-in',
  webDir: 'dist',
  // For production: point to your deployed web app
  // server: {
  //   url: 'https://yourapp.vercel.app',
  //   cleartext: false
  // }
};

export default config;
```

**Important:** 
- `webDir` must be `'dist'` (where Vite builds)
- Don't uncomment `server` section yet (we'll use local build first)

## Step 4: Build Workflow

Every time you want to test on mobile:

```bash
# 1. Build the web app (creates dist/ folder)
npm run build

# 2. Copy web build to native projects
npx cap copy

# 3. Sync native plugins (if you add any later)
npx cap sync
```

## Step 5: Android Setup

### 5.1 Install Android Studio
1. Download: https://developer.android.com/studio
2. Install (includes Android SDK)
3. Open Android Studio → Let it download components

### 5.2 Open Android Project
```bash
npx cap open android
```

This opens Android Studio.

### 5.3 First Time Setup in Android Studio
1. **Wait for Gradle sync** (may take 5-10 minutes first time)
2. **Connect device or start emulator:**
   - Device: Enable USB debugging on phone, connect via USB
   - Emulator: Tools → Device Manager → Create Virtual Device

3. **Click Run ▶️** (green play button)

### 5.4 Test
- App should open on device/emulator
- Test check-in flow
- Verify API calls work (check Network tab via Chrome DevTools)

### 5.5 Common Android Issues

**"Gradle sync failed"**
- Wait longer (first sync is slow)
- Check internet connection
- Try: File → Invalidate Caches → Restart

**"SDK not found"**
- Android Studio → Tools → SDK Manager
- Install Android SDK (API 33 or 34)

**"App crashes on launch"**
- Check Android Studio Logcat for errors
- Make sure you ran `npm run build` first
- Verify API URL in `.env.production`

## Step 6: iOS Setup (Mac Only)

### 6.1 Requirements
- Mac computer
- Xcode installed (from App Store)
- Apple Developer account (free for testing, $99/year for App Store)

### 6.2 Open iOS Project
```bash
npx cap open ios
```

This opens Xcode.

### 6.3 First Time Setup in Xcode
1. **Select Team:**
   - Xcode → Signing & Capabilities
   - Select your Apple ID (or create free account)

2. **Choose device:**
   - iPhone simulator (any model)
   - Or connected iPhone

3. **Click Run ▶️**

### 6.4 Test
- App should open on simulator/device
- Test check-in flow
- Verify API calls work

### 6.5 Common iOS Issues

**"No signing certificate"**
- Xcode → Preferences → Accounts
- Add your Apple ID
- Select Team in project settings

**"Build failed"**
- Make sure you ran `npm run build` first
- Check Xcode build logs
- Try: Product → Clean Build Folder

## Step 7: Production Builds

### Android: Generate Signed AAB

1. **Android Studio:**
   - Build → Generate Signed Bundle / APK
   - Choose "Android App Bundle (AAB)"

2. **Create Keystore:**
   - Click "Create new..."
   - Save keystore file (keep password safe!)
   - Fill in details

3. **Build:**
   - Select release build variant
   - Click "Finish"
   - AAB file location shown

4. **Upload to Play Store:**
   - Go to Google Play Console
   - Create app listing
   - Upload AAB file
   - Fill metadata, screenshots, etc.
   - Submit for review

### iOS: Generate IPA

1. **Xcode:**
   - Product → Archive
   - Wait for archive to complete

2. **Distribute:**
   - Click "Distribute App"
   - Choose "App Store Connect"
   - Follow prompts
   - Upload

3. **App Store Connect:**
   - Go to https://appstoreconnect.apple.com
   - Complete app listing
   - Add screenshots, description, etc.
   - Submit for review

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
- Run `npm install` again
- Make sure all Capacitor packages installed

### "Build failed"
- Always run `npm run build` first
- Check that `dist/` folder exists
- Verify `capacitor.config.ts` has `webDir: 'dist'`

### "API not connecting"
- Check `VITE_API_URL` in `.env.production`
- Make sure it's production URL (not localhost)
- Verify backend CORS allows your app

### "App shows blank screen"
- Check browser console (if using web version)
- Check Xcode/Android Studio logs
- Verify build completed successfully

## Next Steps

Once mobile app works:
1. ✅ Test on real device
2. ✅ Fix mobile-specific bugs (keyboard, scrolling, etc.)
3. ✅ Add app icons and splash screens
4. ✅ Generate signed builds
5. ✅ Submit to app stores

