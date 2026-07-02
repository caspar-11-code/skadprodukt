# Publikacja SkądTo? — walidacja -> build -> treści -> commit -> push (Cloudflare Pages auto-deploy)
# Użycie:  powershell -ExecutionPolicy Bypass -File tools\publish.ps1 [-Message "opis zmiany"]
param([string]$Message = "aktualizacja bazy produktow")

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

Write-Host "[1/4] Walidacja danych..." -ForegroundColor Cyan
node tools\validate.js
if ($LASTEXITCODE -ne 0) { Write-Host "Walidacja nie przeszla - przerwano." -ForegroundColor Red; exit 1 }

Write-Host "[2/4] Build serwisu..." -ForegroundColor Cyan
node build.js
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[3/4] Generowanie tresci Shorts/social..." -ForegroundColor Cyan
node tools\generate_shorts.js
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "[4/4] Commit + push (Cloudflare Pages wdrozy automatycznie)..." -ForegroundColor Cyan
git add -A
git commit -m $Message
if ($LASTEXITCODE -ne 0) { Write-Host "Brak zmian do commita." -ForegroundColor Yellow; exit 0 }
git push
Write-Host "Gotowe. Deploy na Cloudflare Pages ruszy automatycznie (~1 min)." -ForegroundColor Green
