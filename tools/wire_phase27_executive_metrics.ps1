$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ServerPath = Join-Path $ProjectRoot "enterprise-backend\src\server.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-backend\src\server.backup.before-phase27-executive-metrics.js"

Copy-Item $ServerPath $BackupPath -Force

$content = Get-Content $ServerPath -Raw

$importLine = "const tenantExecutiveMetricsRoutes = require('./routes/tenant/executiveMetrics');"
$afterImport = "const tenantDashboardRoutes = require('./routes/tenant/dashboard');"

if ($content -notlike "*routes/tenant/executiveMetrics*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$routeLine = "app.use('/api/tenant/executive-metrics', tenantExecutiveMetricsRoutes);"
$afterRoute = "app.use('/api/tenant/dashboard', tenantDashboardRoutes);"

if ($content -notlike "*'/api/tenant/executive-metrics'*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ServerPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 27 Executive Metrics route wired successfully." -ForegroundColor Green
Write-Host "Updated: $ServerPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""