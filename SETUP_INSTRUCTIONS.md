# Setup Instructions - Step by Step

## ✅ Step 1: Backend Setup

### 1.1 Create .env file
**DONE** - The `.env` file has been created from `env.example`

### 1.2 Edit .env file
Open `server/.env` in a text editor and update:

**Required:**
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
JWT_SECRET="some-long-random-string-for-dev-change-this"
```

**Optional (already set):**
```env
FRONTEND_URL="http://localhost:5173"
PORT=4000
```

**To get a DATABASE_URL:**
- **Local PostgreSQL**: If you have Postgres installed, use:
  ```
  DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/student_checkin?schema=public"
  ```

- **Cloud (Free options):**
  - **Neon**: https://neon.tech (free tier)
  - **Supabase**: https://supabase.com (free tier)
  - **Railway**: https://railway.app (free tier)
  
  They'll give you a connection string like:
  ```
  postgresql://user:pass@host:5432/dbname?sslmode=require
  ```

### 1.3 Install Dependencies
```bash
cd server
npm install
```

### 1.4 Run Prisma Migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Generate Prisma client
- Create all database tables (schools, users, students, check_ins, audit_logs)

**If you get an error about DATABASE_URL:**
- Make sure your `.env` file has a valid DATABASE_URL
- Check that your PostgreSQL database exists
- Verify the connection string is correct

### 1.5 Start the API Server
```bash
npm run dev
```

You should see:
```
🚀 API server running on port 4000
📊 Frontend URL: http://localhost:5173
💾 Database: Connected
```

### 1.6 Test the Backend
Open in browser: http://localhost:4000/health

Should return: `{"status":"ok","timestamp":"..."}`

---

## ✅ Step 2: Frontend Setup

### 2.1 Create Frontend .env
Create `student-checkin/.env`:

```env
VITE_API_URL=http://localhost:4000
```

### 2.2 Install & Run Frontend
```bash
cd student-checkin
npm install
npm run dev
```

Frontend should start on http://localhost:5173

### 2.3 Test the Integration
1. Open http://localhost:5173
2. Complete a check-in
3. Open browser DevTools → Network tab
4. Look for: `POST /api/students/.../check-ins`
5. Check server console for logs

---

## Troubleshooting

### "Cannot find module '@prisma/client'"
```bash
cd server
npm run prisma:generate
```

### "Error: P1001: Can't reach database server"
- Check your DATABASE_URL in `.env`
- Make sure PostgreSQL is running (if local)
- Verify cloud database is accessible

### "Port 4000 already in use"
Change PORT in `server/.env` to another number (e.g., 4001)

### Frontend can't connect to API
- Make sure backend is running (`npm run dev` in server/)
- Check `VITE_API_URL` in `student-checkin/.env`
- Verify CORS settings in `server/src/index.ts`

### "Migration failed"
- Make sure database exists
- Check DATABASE_URL format
- Try: `npm run prisma:migrate -- --name init`

---

## What Happens When You Submit a Check-In

1. **Frontend** (`App.tsx`):
   - User completes check-in form
   - `handleCheckInSubmit` is called
   - Creates mock auth token (dev only)
   - Calls `studentApi.createCheckIn()`

2. **API Client** (`api.ts`):
   - Sends POST to `http://localhost:4000/api/students/:id/check-ins`
   - Includes JWT token in Authorization header
   - Handles errors gracefully

3. **Backend** (`server/src/index.ts`):
   - Receives request
   - Validates JWT token
   - Calculates risk scores
   - Saves to PostgreSQL via Prisma
   - Logs audit entry
   - Returns success response

4. **Fallback**:
   - If API fails, frontend continues with localStorage
   - User doesn't see an error (seamless fallback)

---

## Next Steps After Setup

1. **View Database**: `npm run prisma:studio` (opens Prisma Studio)
2. **Check Logs**: Look at server console for API requests
3. **Test Dashboard**: Use counsellor view to see data
4. **Add Real Auth**: Replace mock tokens with Auth0/Clerk

