# Setup Checklist - Follow These Steps

## ✅ Step 1: Create Neon Database (1-2 minutes)

1. Go to: **https://neon.tech**
2. Sign up (Google/GitHub is fine)
3. Click **"New Project"**
   - Name: `student-checkin`
   - Use default PostgreSQL settings
4. **Copy the connection string** - it looks like:
   ```
   postgresql://USER:PASSWORD@ep-xxxx-xxxx.neon.tech/neondb
   ```

**Status**: ⏳ Waiting for you to create Neon account and get connection string

---

## ✅ Step 2: Update server/.env

Once you have the Neon connection string:

1. Open: `C:\Users\reza_\OneDrive\Desktop\aischool\server\.env`
2. Replace with your actual Neon connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-xxxx.neon.tech/neondb?schema=public"
   JWT_SECRET="dev-secret-12345"
   ```
3. **Important**: Add `?schema=public` at the end!
4. Save the file

**Status**: ⏳ Waiting for Neon connection string

---

## ✅ Step 3: Run Prisma Migrations

After updating `.env`, run:

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\server
npm run prisma:migrate
```

This will:
- Connect to Neon
- Create all tables (schools, users, students, check_ins, audit_logs)
- Set up the database schema

**Expected output**: 
```
✔ Migration applied successfully
```

**If you get an error**: Copy/paste the exact error message

**Status**: ⏳ Waiting for Step 2 to complete

---

## ✅ Step 4: Start Backend

```bash
npm run dev
```

**Expected output**:
```
🚀 API server running on port 4000
📊 Frontend URL: http://localhost:5173
💾 Database: Connected
```

**Test it**: Open http://localhost:4000/health in browser

**Expected response**: `{"status":"ok","timestamp":"..."}`

**Status**: ⏳ Waiting for Step 3 to complete

---

## ✅ Step 5: Start Frontend

In a **new terminal**:

```bash
cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
npm run dev
```

**Expected output**: 
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Status**: ⏳ Waiting for Step 4 to complete

---

## ✅ Step 6: Test Full Flow

1. Open app: http://localhost:5173
2. Complete a check-in
3. **Check browser DevTools** → Network tab
   - Look for: `POST /api/students/.../check-ins` (status 201)
4. **Check server console** - should see request logged
5. **Data is now in Neon PostgreSQL!** 🎉

**Status**: ⏳ Ready to test once servers are running

---

## 🎉 Bonus: View Data in Neon

1. Go back to https://neon.tech
2. Open your `student-checkin` project
3. Click **"SQL Editor"** or **"Tables"**
4. Run: `SELECT * FROM check_ins;`
5. See your check-ins! 📊

---

## Troubleshooting

### "Can't reach database server"
- Check DATABASE_URL in `.env`
- Make sure you added `?schema=public` at the end
- Verify connection string from Neon is correct

### "Migration failed"
- Make sure DATABASE_URL is correct
- Try: `npm run prisma:generate` first, then `npm run prisma:migrate`

### "Port 4000 already in use"
- Change PORT in `.env` to 4001
- Update `VITE_API_URL` in frontend `.env` to match

### "Module not found"
- Run: `npm install` in server/
- Run: `npm run prisma:generate`

