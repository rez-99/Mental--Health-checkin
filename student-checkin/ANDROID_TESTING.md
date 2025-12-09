# Testing on Android Device

## Quick Start

1. **Start the development server:**
   ```bash
   cd student-checkin
   npm run dev
   ```

2. **Find your computer's IP address:**
   - **Windows:** Open Command Prompt and type `ipconfig`
     - Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)
   - **Mac/Linux:** Open Terminal and type `ifconfig` or `ip addr`
     - Look for your local IP (usually 192.168.x.x)

3. **Connect your Android device:**
   - Make sure your Android phone/tablet is on the **same Wi-Fi network** as your computer
   - Open Chrome or any browser on your Android device
   - Type in the address bar: `http://YOUR_IP_ADDRESS:5173`
     - Example: `http://192.168.1.100:5173`

4. **That's it!** The app should load on your Android device.

## Alternative: Using USB Debugging (Advanced)

If you want to test via USB:

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect your device via USB
4. Use `adb reverse tcp:5173 tcp:5173` to forward the port
5. Access via `http://localhost:5173` on your device

## Troubleshooting

- **Can't connect?** Make sure both devices are on the same Wi-Fi network
- **Firewall blocking?** You may need to allow port 5173 through Windows Firewall
- **Port already in use?** The server will automatically try the next available port (check the terminal output)

## Building for Production

To create a production build that you can deploy:

```bash
npm run build
```

The built files will be in the `dist/` folder. You can:
- Deploy to a web server
- Use a service like Netlify, Vercel, or GitHub Pages
- Serve locally with `npm run preview`

