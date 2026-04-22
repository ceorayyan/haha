# Next.js Frontend Development Server Starter
# This script starts the Next.js development server

Write-Host "Starting Next.js Frontend..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Starting development server..." -ForegroundColor Green
Write-Host "Frontend will be available at http://localhost:3000" -ForegroundColor Cyan
Write-Host ""

npm run dev
