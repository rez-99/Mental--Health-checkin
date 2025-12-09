# Deployment Guide - Student Check-In System

This guide walks you through setting up the full-stack application with a real backend.

## Architecture Overview

- **Frontend**: React + TypeScript (Vite) - `student-checkin/`
- **Backend**: Node.js + Express + TypeScript - `server/`
- **Database**: PostgreSQL with Prisma ORM

## Quick Start

### 1. Backend Setup

```bash
cd server
npm install
```

### 2. Database Setup

1. **Create a PostgreSQL database** (local or cloud):
   - Local: Install PostgreSQL and create a database
   - Cloud: Use Neon, Supabase, Railway, or AWS RDS

2. **Configure environment variables:**
   ```bash
   cp env.example .env
   # Edit .env with your DATABASE_URL
   ```

3. **Run migrations:**
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

### 3. Start Backend

```bash
npm run dev
```

The API will run on `http://localhost:4000`

### 4. Frontend Setup

```bash
cd student-checkin
npm install
```

### 5. Configure Frontend API URL

Create `student-checkin/.env`:
```
VITE_API_URL=http://localhost:4000
```

### 6. Start Frontend

```bash
npm run dev
```

## Development Workflow

### Mock Authentication (Development Only)

For development, the frontend uses mock JWT tokens. In production, you'll integrate with:
- Auth0
- Clerk
- Azure AD
- Google Workspace SSO

### Testing the API

1. **Health check:**
   ```bash
   curl http://localhost:4000/health
   ```

2. **Create a check-in (with mock token):**
   ```bash
   curl -X POST http://localhost:4000/api/students/student_123/check-ins \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $(echo '{"sub":"student_123","role":"STUDENT","schoolId":"school_1"}' | base64)" \
     -d '{
       "mood": 3,
       "sleepQuality": 3,
       "concentration": 3,
       "energy": 3,
       "worries": 2,
       "burden": 2
     }'
   ```

## Production Deployment

### Backend Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy to:**
   - Render.com
   - Railway
   - Fly.io
   - AWS/GCP

3. **Set environment variables:**
   - `DATABASE_URL` - Production PostgreSQL URL
   - `FRONTEND_URL` - Your frontend domain
   - `JWT_SECRET` - Strong secret (or use JWKS)
   - Auth provider credentials

### Frontend Deployment

1. **Build:**
   ```bash
   npm run build
   ```

2. **Deploy to:**
   - Vercel
   - Netlify
   - Static hosting

3. **Set environment variable:**
   - `VITE_API_URL` - Your backend API URL

## Next Steps

1. **Set up real authentication:**
   - Integrate Auth0/Clerk
   - Update `src/api.ts` to get real tokens
   - Update backend to verify JWT signatures

2. **Add more endpoints:**
   - Student consent flow
   - Counsellor notes
   - Follow-up tracking
   - Reports/analytics

3. **Set up monitoring:**
   - Error tracking (Sentry)
   - Logging (Winston/Pino)
   - Metrics (Prometheus)

4. **Security:**
   - Rate limiting
   - Input validation
   - SQL injection prevention (Prisma handles this)
   - CORS configuration

5. **Compliance:**
   - Audit logging (already in schema)
   - Data retention policies
   - Privacy controls

## Database Schema

See `server/prisma/schema.prisma` for the full schema. Key tables:
- `schools` - School information
- `users` - Staff (counsellors, admins)
- `students` - Student records
- `check_ins` - Weekly check-in data
- `audit_logs` - Compliance logging

## API Endpoints

### Student
- `POST /api/students/:studentId/check-ins` - Create check-in
- `GET /api/students/:studentId/check-ins` - Get history

### Counsellor
- `GET /api/dashboard/overview` - Dashboard data

## Support

For issues or questions, check:
- Backend logs: `server/` directory
- Frontend console: Browser DevTools
- Database: Use Prisma Studio (`npm run prisma:studio`)

