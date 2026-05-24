$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ServerPath = Join-Path $ProjectRoot "enterprise-backend\src\server.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-backend\src\server.backup.before-phase32-tenant-context.js"

Copy-Item $ServerPath $BackupPath -Force

$content = Get-Content $ServerPath -Raw

$importLine = "const tenantContextRoutes = require('./routes/tenant/context');"
$afterImport = "const tenantBrandingRoutes = require('./routes/tenant/branding');"

if ($content -notlike "*routes/tenant/context*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$routeLine = "app.use('/api/tenant/context', tenantContextRoutes);"
$afterRoute = "app.use('/api/tenant/branding', tenantBrandingRoutes);"

if ($content -notlike "*'/api/tenant/context'*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ServerPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 Tenant Context route wired successfully." -ForegroundColor Green
Write-Host "Updated: $ServerPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""