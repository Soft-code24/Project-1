# SavorBite Backend — Staging Startup Script
# Usage: .\backend\start-staging.ps1
# This loads backend/.env.staging explicitly and starts the backend on port 5000.

# Safety check: verify we are NOT pointing to production Supabase
$envFile = "backend/.env.staging"
if (-not (Test-Path $envFile)) {
    Write-Error "ERROR: backend/.env.staging not found. Create it first."
    exit 1
}

# Load .env.staging manually (dotnet-style)
$envContent = Get-Content $envFile -Raw
$envVars = @{}
foreach ($line in $envContent -split "`n") {
    $line = $line.Trim()
    if ($line -match '^([^=#]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

# Apply to environment
foreach ($key in $envVars.Keys) {
    [Environment]::SetEnvironmentVariable($key, $envVars[$key], [EnvironmentVariableTarget]::Process)
}

# Verify we are NOT pointing to production
$supabaseUrl = $envVars['SUPABASE_URL']
if ($supabaseUrl -match 'vdzhcaalzeljiwstrzui') {
    Write-Error "ERROR: SUPABASE_URL points to PRODUCTION Supabase. Aborting."
    exit 1
}

if (-not ($supabaseUrl -match 'kipgcxalqvmkwlcnfxwt')) {
    Write-Error "ERROR: SUPABASE_URL does not point to staging Supabase. Aborting."
    exit 1
}

Write-Host "Starting SavorBite backend in STAGING mode..."
Write-Host "Supabase URL: $supabaseUrl"
Write-Host "Port: $($envVars['PORT'])"
Write-Host ""

# Start the backend
cd backend
npm run dev