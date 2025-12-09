@echo off
echo Starting Vite dev server for Android access...
echo.

REM Allow port 5173 through Windows Firewall (requires admin)
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=5173 >nul 2>&1

echo Your IP address: 
ipconfig | findstr /i "IPv4"
echo.
echo Starting server...
echo Once started, access from Android: http://YOUR_IP:5173
echo.
echo Press Ctrl+C to stop the server
echo.

npm run dev -- --host

