# Vibe Budget Planner Deployment Script (PowerShell - Vercel Version)

Write-Host "--- Vibe Budget Planner Deployment Script (Vercel) ---" -ForegroundColor Cyan

# 1. Check for required tools
function Check-Command($cmd) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Host "Error: $cmd is not installed or not in PATH." -ForegroundColor Red
        if ($cmd -eq "vercel") { Write-Host "Install with: npm install -g vercel" }
        if ($cmd -eq "supabase") { Write-Host "Install with: https://supabase.com/docs/guides/cli" }
        exit 1
    }
}

Write-Host "[1/6] Checking prerequisites..."
Check-Command "node"
Check-Command "npm"
Check-Command "vercel"
Check-Command "supabase"

# 2. Setup .env file
Write-Host "[2/6] Checking environment variables..."
if (-not (Test-Path ".env")) {
    Write-Host ".env file not found. Creating from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "!!! ACTION REQUIRED !!!" -ForegroundColor Red
    Write-Host "Please edit the '.env' file with your Supabase credentials and allowed email." -ForegroundColor Red
    Write-Host "After editing, run this script again." -ForegroundColor Red
    exit 1
}

# 3. Install dependencies
Write-Host "[3/6] Installing dependencies..." -ForegroundColor Green
npm i

# 4. Supabase Setup
Write-Host "[4/6] Pushing Supabase migrations..." -ForegroundColor Green
$projectRef = "nyrrzixqsyiuxuiaomri" # From supabase.rtf
Write-Host "Ensuring project is linked (Project Ref: $projectRef)..."
supabase link --project-ref $projectRef --non-interactive
supabase db push --non-interactive

# 5. Build
Write-Host "[5/6] Building project..." -ForegroundColor Green
npm run build

# 6. Deploy to Vercel
Write-Host "[6/6] Deploying to Vercel..." -ForegroundColor Green
# Using --prod to deploy to production
# Vercel will prompt for link if not linked, or use existing linkage
vercel --prod --yes

Write-Host "`n--- Deployment complete! ---" -ForegroundColor Cyan
Write-Host "Make sure you have added VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to Vercel Project Settings (Environment Variables)."
