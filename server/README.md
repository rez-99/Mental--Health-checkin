# Student Check-In API

Backend API for the student mental health check-in system.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database URL and other config
   ```

3. **Set up database:**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT verification (dev only)
- `FRONTEND_URL` - Frontend URL for CORS
- `PORT` - Server port (default: 4000)

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Student Endpoints
- `POST /api/students/:studentId/check-ins` - Create a new check-in

### Counsellor Endpoints
- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/students/:studentId/check-ins` - Get student check-in history

## Authentication

All endpoints (except `/health`) require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token should contain:
- `sub` - User ID
- `role` - User role (STUDENT, COUNSELLOR, ADMIN)
- `schoolId` - School ID

## Database

Uses Prisma ORM with PostgreSQL. Run migrations to set up the schema:
```bash
npm run prisma:migrate
```

View database in Prisma Studio:
```bash
npm run prisma:studio
```

