# Simple Android Setup - Step by Step

## The Problem
The server was only listening on localhost, not accessible from your Android device.

## Solution - Follow These Steps:

### Step 1: Stop any running servers
Close any terminal windows running `npm run dev`

### Step 2: Open a NEW terminal/PowerShell in the student-checkin folder

### Step 3: Run this command:
```bash
npm run dev -- --host
```

**Important:** You MUST use `-- --host` (two dashes before host)

### Step 4: Look for this in the output:
```
➜  Network: http://192.168.1.67:5173/
```

### Step 5: On your Android device:
1. Make sure it's on the **same Wi-Fi** as your computer
2. Open Chrome browser
3. Type: `http://192.168.1.67:5173`
4. The app should load!

## If it still doesn't work:

### Option A: Allow Firewall (Run PowerShell as Administrator)
```powershell
New-NetFirewallRule -DisplayName "Vite Dev" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

### Option B: Build and serve (more reliable)
```bash
npm run build
npm run preview -- --host
```
Then use the Network URL shown (usually same IP, different port)

### Option C: Use your computer's browser first
Try `http://192.168.1.67:5173` on your computer first. If that works, Android should work too.

