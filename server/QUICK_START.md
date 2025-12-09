# Quick Start Guide - Neon Database Setup

## Step 1: Create Neon Database (2 minutes)

1. **Go to**: https://neon.tech
2. **Sign up** with Google/GitHub
3. **Click "New Project"**:
   - Name: `student-checkin`
   - Use default PostgreSQL settings
   - Click Create
4. **Copy the connection string** - it looks like:
   ```
   postgresql://myuser:supersecret@ep-xxxx.neon.tech/neondb
   ```

## Step 2: Update .env File

Open `server/.env` in a text editor and replace:

```env
DATABASE_URL="postgresql://YOUR_NEON_CONNECTION_STRING_HERE?schema=public"
JWT_SECRET="dev-secret-12345"
```

**Important**: Add `?schema=public` at the end of your Neon connection string!

Example:
```env
DATABASE_URL="postgresql://myuser:supersecret@ep-xxxx.neon.tech/neondb?schema=public"
JWT_SECRET="dev-secret-12345"
```

Save the file.

## Step 3: Run Migrations

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\server
npm run prisma:migrate
```

This will:
- Connect to Neon
- Create all tables (schools, users, students, check_ins, audit_logs)
- Set up the database schema

**If you get an error**, copy/paste it and we'll fix it.

## Step 4: Start Backend

```bash
npm run dev
```

You should see:
```
🚀 API server running on port 4000
📊 Frontend URL: http://localhost:5173
💾 Database: Connected
```

## Step 5: Test Backend

Open in browser: http://localhost:4000/health

Should return: `{"status":"ok","timestamp":"..."}`

✅ If you see this, backend + database are working!

## Step 6: Start Frontend

In a new terminal:

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm run dev
```

## Step 7: Test Full Flow

1. Open the app (usually http://localhost:5173)
2. Complete a check-in
3. Check browser DevTools → Network tab
4. Look for: `POST /api/students/.../check-ins` (status 201)
5. Check server console - should see the request logged
6. Data is now in Neon PostgreSQL! 🎉

## View Data in Neon

1. Go back to https://neon.tech
2. Open your project
3. Click "SQL Editor" or "Tables"
4. You should see the `check_ins` table with your data!

## Troubleshooting

### "Can't reach database server"
- Check your DATABASE_URL in `.env`
- Make sure you added `?schema=public` at the end
- Verify the connection string from Neon is correct

### "Migration failed"
- Make sure DATABASE_URL is correct
- Try: `npm run prisma:generate` first, then `npm run prisma:migrate`

### "Port 4000 already in use"
- Change PORT in `.env` to 4001 or another number
- Update `VITE_API_URL` in frontend `.env` to match

