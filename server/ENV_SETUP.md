# .env File Setup

## Current Status

✅ `.env` file has been created from `env.example`
⚠️ **You need to update it with your actual database credentials**

## What You Need To Do

### Option 1: Use a Free Cloud Database (Easiest)

#### Neon (Recommended - Free Tier)
1. Go to https://neon.tech
2. Sign up (free)
3. Create a new project
4. Copy the connection string (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Paste it into `server/.env` as `DATABASE_URL`

#### Supabase (Alternative)
1. Go to https://supabase.com
2. Create a new project
3. Go to Settings → Database
4. Copy the connection string
5. Paste it into `server/.env` as `DATABASE_URL`

#### Railway (Alternative)
1. Go to https://railway.app
2. New Project → Add PostgreSQL
3. Copy the DATABASE_URL from variables
4. Paste it into `server/.env`

### Option 2: Local PostgreSQL

If you have PostgreSQL installed locally:

```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/student_checkin?schema=public"
```

Replace:
- `postgres` with your PostgreSQL username
- `yourpassword` with your PostgreSQL password
- `student_checkin` with your database name (create it first)

## Update Your .env File

Open `server/.env` and update these two lines:

```env
DATABASE_URL="postgresql://YOUR_ACTUAL_CONNECTION_STRING_HERE"
JWT_SECRET="generate-a-random-string-here-for-development"
```

For JWT_SECRET, you can use any random string for development, e.g.:
```env
JWT_SECRET="dev-secret-key-12345-change-in-production"
```

## After Updating .env

1. Save the file
2. Run: `npm run prisma:migrate` (creates tables)
3. Run: `npm run dev` (starts server)

## Verify It Works

After starting the server, test:
- Open: http://localhost:4000/health
- Should return: `{"status":"ok","timestamp":"..."}`

If you get a database connection error, check:
- DATABASE_URL is correct
- Database exists and is accessible
- Credentials are correct

