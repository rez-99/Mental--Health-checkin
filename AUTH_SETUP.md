# Authentication & Role-Based Access Setup

This guide explains how to set up authentication and role-based access control for the AI School mental health app.

## What Was Implemented

### Backend Changes

1. **Updated Prisma Schema** (`server/prisma/schema.prisma`):
   - Added `STUDENT` and `PARENT` roles to `UserRole` enum
   - Added `password` field to `User` model (for simple login)
   - Made `authSub` optional (for SSO users)

2. **Authentication Endpoints** (`server/src/index.ts`):
   - `POST /api/login` - Login with email/password
   - `GET /api/me` - Get current user info
   - Updated auth middleware to properly verify JWT tokens
   - Added role-based route protection middleware

3. **Protected Routes**:
   - `/api/dashboard/overview` - Only accessible to COUNSELLOR and ADMIN
   - Student check-ins - Students can only view their own
   - All routes now require valid JWT token

### Frontend Changes

1. **Auth Context** (`student-checkin/src/auth.tsx`):
   - `AuthProvider` - Manages user authentication state
   - `useAuth` hook - Access auth state in components
   - `ProtectedRoute` component - Route protection based on roles

2. **Login Page** (`student-checkin/src/LoginPage.tsx`):
   - Simple email/password login form
   - Shows demo account credentials

3. **App Updates** (`student-checkin/src/App.tsx`):
   - Shows login page when not authenticated
   - Conditionally displays navigation links based on user role
   - Protects routes with `ProtectedRoute` component
   - Added logout button in header

## Setup Instructions

### Step 1: Run Database Migration

```bash
cd server
npm run prisma:generate
npm run prisma:migrate
```

This will:
- Add `STUDENT` and `PARENT` to the `UserRole` enum
- Add `password` field to the `User` table
- Make `authSub` nullable

### Step 2: Seed Demo Users

```bash
cd server
npm run seed
```

This creates demo accounts:
- **Counselor**: `counselor@demo.com` / `password`
- **Student**: `student@demo.com` / `password`
- **Parent**: `parent@demo.com` / `password`
- **Admin**: `admin@demo.com` / `password`

### Step 3: Start the Backend

```bash
cd server
npm run dev
```

The API will run on `http://localhost:4000`

### Step 4: Start the Frontend

```bash
cd student-checkin
npm run dev
```

The app will run on `http://localhost:5173`

## How It Works

### Login Flow

1. User visits the app → sees login page
2. User enters email/password → `POST /api/login`
3. Backend validates credentials → returns JWT token
4. Frontend stores token in localStorage
5. User is redirected to appropriate portal based on role

### Role-Based Access

- **STUDENT**: Can only see "Student Check-In" link and access their own check-ins
- **COUNSELLOR**: Can see "Student Check-In" and "Counselor Dashboard" links
- **PARENT**: Can only see "Parent/Caregiver Portal" link
- **ADMIN**: Can see all links (same as counselor)

### Route Protection

**Backend:**
- All API routes (except `/health` and `/api/login`) require valid JWT token
- Counselor dashboard endpoint checks for `COUNSELLOR` or `ADMIN` role
- Students can only access their own check-in data

**Frontend:**
- `ProtectedRoute` component checks authentication and role
- Navigation links only show for authorized roles
- Unauthorized access redirects to login or shows "Access Denied"

## Testing

1. **Test Student Login:**
   - Login as `student@demo.com` / `password`
   - Should only see "Student Check-In" link
   - Should NOT see "Counselor Dashboard" or "Parent Portal"

2. **Test Counselor Login:**
   - Login as `counselor@demo.com` / `password`
   - Should see "Student Check-In" and "Counselor Dashboard" links
   - Should NOT see "Parent Portal"
   - Can access `/api/dashboard/overview` endpoint

3. **Test Parent Login:**
   - Login as `parent@demo.com` / `password`
   - Should only see "Parent/Caregiver Portal" link
   - Should NOT see other links

4. **Test Unauthorized Access:**
   - Try accessing `/api/dashboard/overview` without token → 401 Unauthorized
   - Try accessing as student → 403 Forbidden

## Security Notes

⚠️ **Current Implementation (Demo/Dev Mode):**
- Passwords are stored in plain text (for demo purposes)
- JWT secret is in `.env` (use strong secret in production)
- No password hashing (use bcrypt in production)
- No rate limiting on login endpoint

✅ **For Production:**
1. Hash passwords with bcrypt before storing
2. Use strong, random JWT_SECRET
3. Add rate limiting to login endpoint
4. Implement password reset flow
5. Add session timeout
6. Consider SSO integration (Auth0, Clerk, etc.)
7. Add CSRF protection
8. Use httpOnly cookies for tokens (more secure than localStorage)

## Next Steps

1. **Add Password Hashing:**
   ```bash
   npm install bcrypt
   npm install --save-dev @types/bcrypt
   ```

2. **Add Parent-Student Relationship:**
   - Update Prisma schema to link parents to their children
   - Restrict parent access to only their children's data

3. **Add Password Reset:**
   - Create password reset token system
   - Send reset emails

4. **Add Session Management:**
   - Implement token refresh
   - Add logout endpoint that invalidates tokens

5. **Integrate Real Auth Provider:**
   - Replace simple login with Auth0, Clerk, or Supabase Auth
   - Keep role-based access control logic

## Troubleshooting

**"Cannot find module '@prisma/client'"**
```bash
cd server
npm run prisma:generate
```

**"Migration failed"**
- Make sure your database is running
- Check `DATABASE_URL` in `.env`
- Try: `npm run prisma:migrate -- --name add_roles`

**"Login fails"**
- Make sure you ran `npm run seed` to create demo users
- Check backend is running on port 4000
- Check browser console for errors

**"Can't access counselor dashboard"**
- Make sure you're logged in as a counselor
- Check browser DevTools → Network tab for 403 errors
- Verify JWT token is being sent in Authorization header

