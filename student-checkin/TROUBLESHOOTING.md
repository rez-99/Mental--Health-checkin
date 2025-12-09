# Troubleshooting Android Access Issues

## Quick Fixes to Try:

### 1. **Check if server is running with network access**
   The server needs to be started with `--host` flag:
   ```bash
   cd student-checkin
   npm run dev -- --host
   ```
   
   You should see output like:
   ```
   VITE v7.x.x  ready in xxx ms
   
   ➜  Local:   http://localhost:5173/
   ➜  Network: http://192.168.1.67:5173/
   ```

### 2. **Windows Firewall - Allow Port 5173**
   
   **Option A: Using PowerShell (Run as Administrator)**
   ```powershell
   New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
   ```
   
   **Option B: Using Windows Firewall GUI**
   1. Open "Windows Defender Firewall with Advanced Security"
   2. Click "Inbound Rules" → "New Rule"
   3. Select "Port" → Next
   4. Select "TCP" and enter port "5173" → Next
   5. Select "Allow the connection" → Next
   6. Check all profiles → Next
   7. Name it "Vite Dev Server" → Finish

### 3. **Verify Same Wi-Fi Network**
   - Your computer IP: `192.168.1.67`
   - Make sure your Android device is on the **same Wi-Fi network**
   - Check your Android device's Wi-Fi settings to confirm

### 4. **Try Different Port**
   If 5173 doesn't work, try a different port:
   ```bash
   npm run dev -- --host --port 3000
   ```
   Then access: `http://192.168.1.67:3000`

### 5. **Alternative: Use ngrok (Works from anywhere)**
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 5173
   ```
   This gives you a public URL that works from any network.

### 6. **Check Server Output**
   When you run `npm run dev -- --host`, you should see:
   ```
   Network: http://192.168.1.67:5173/
   ```
   Use that exact URL on your Android device.

### 7. **Test from Computer First**
   Try accessing `http://192.168.1.67:5173` from your computer's browser first.
   If that doesn't work, the server isn't configured correctly.

### 8. **Build and Serve Static Files (Alternative)**
   If dev server doesn't work, build and serve:
   ```bash
   npm run build
   npm run preview -- --host
   ```

## Still Not Working?

1. **Check antivirus software** - It might be blocking the connection
2. **Try mobile hotspot** - Create a hotspot from your computer and connect Android to it
3. **Use USB debugging** - Connect via USB and use port forwarding
4. **Deploy online** - Use Netlify/Vercel for instant access from anywhere

