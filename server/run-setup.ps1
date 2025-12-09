# Setup Script for Student Check-In Backend
# Run this after updating .env with your Neon connection string

Write-Host "🚀 Student Check-In Backend Setup" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env from env.example and add your DATABASE_URL" -ForegroundColor Yellow
    exit 1
}

# Check if DATABASE_URL is set (not placeholder)
$envContent = Get-Content .env
$hasRealDb = $envContent | Select-String -Pattern 'DATABASE_URL="postgresql://' | Select-String -NotMatch -Pattern 'user:password@localhost'

if (-not $hasRealDb) {
    Write-Host "⚠️  Warning: DATABASE_URL might still be a placeholder" -ForegroundColor Yellow
    Write-Host "Make sure you've updated it with your Neon connection string!" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 0
    }
}

Write-Host "Step 1: Generating Prisma client..." -ForegroundColor Green
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Running database migrations..." -ForegroundColor Green
npm run prisma:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Migration failed!" -ForegroundColor Red
    Write-Host "Check your DATABASE_URL in .env file" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Test: http://localhost:4000/health" -ForegroundColor White
Write-Host "3. Start frontend in another terminal" -ForegroundColor White

