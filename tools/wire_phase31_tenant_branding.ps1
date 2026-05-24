$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ServerPath = Join-Path $ProjectRoot "enterprise-backend\src\server.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-backend\src\server.backup.before-phase31-tenant-branding.js"

Copy-Item $ServerPath $BackupPath -Force

$content = Get-Content $ServerPath -Raw

$importLine = "const tenantBrandingRoutes = require('./routes/tenant/branding');"
$afterImport = "const tenantIntegrationsRoutes = require('./routes/tenant/integrations');"

if ($content -notlike "*routes/tenant/branding*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$routeLine = "app.use('/api/tenant/branding', tenantBrandingRoutes);"
$afterRoute = "app.use('/api/tenant/integrations', tenantIntegrationsRoutes);"

if ($content -notlike "*'/api/tenant/branding'*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ServerPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 31 tenant branding route wired successfully." -ForegroundColor Green
Write-Host "Updated: $ServerPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""