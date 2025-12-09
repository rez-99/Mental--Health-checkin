# 🚀 START HERE - Quick Setup

## Prerequisites Checklist

- [ ] Created Neon account at https://neon.tech
- [ ] Created project named "student-checkin"
- [ ] Copied connection string from Neon
- [ ] Updated `server/.env` with your Neon connection string

## Quick Commands

### Option 1: Use the Setup Script (Easiest)

```powershell
cd C:\Users\reza_\OneDrive\Desktop\aischool\server
.\run-setup.ps1
```

This will:
1. Check your .env file
2. Generate Prisma client
3. Run migrations
4. Tell you if anything fails

### Option 2: Manual Steps

```powershell
# Step 1: Generate Prisma client
npm run prisma:generate

# Step 2: Run migrations
npm run prisma:migrate

# Step 3: Start server
npm run dev
```

## What to Expect

### ✅ Success Looks Like:

**After `npm run prisma:migrate`:**
```
✔ Migration applied successfully
```

**After `npm run dev`:**
```
🚀 API server running on port 4000
📊 Frontend URL: http://localhost:5173
💾 Database: Connected
```

**Test in browser:** http://localhost:4000/health
- Should return: `{"status":"ok","timestamp":"..."}`

### ❌ Common Errors:

**"Can't reach database server"**
- Check DATABASE_URL in `.env`
- Make sure you added `?schema=public` at the end
- Verify Neon connection string is correct

**"Migration failed"**
- Make sure database exists
- Check connection string format
- Try: `npm run prisma:generate` first

**"Port 4000 already in use"**
- Change PORT in `.env` to 4001
- Update frontend `.env` to match

## Once Backend is Running

1. **Start frontend** (new terminal):
   ```powershell
   cd C:\Users\reza_\OneDrive\Desktop\aischool\student-checkin
   npm run dev
   ```

2. **Test the app:**
   - Open http://localhost:5173
   - Complete a check-in
   - Check browser DevTools → Network tab
   - Look for: `POST /api/students/.../check-ins` (status 201)

3. **Verify in Neon:**
   - Go to https://neon.tech
   - Open your project
   - SQL Editor → Run: `SELECT * FROM check_ins;`
   - See your data! 🎉

## Need Help?

If you get any errors, copy/paste the exact error message and I'll help fix it!

