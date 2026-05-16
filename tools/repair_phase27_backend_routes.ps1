$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ServerPath = Join-Path $ProjectRoot "enterprise-backend\src\server.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-backend\src\server.backup.before-phase27-route-repair.js"

Copy-Item $ServerPath $BackupPath -Force

$content = Get-Content $ServerPath -Raw

$imports = @(
"const tenantAtlasRoutes = require('./routes/tenant/atlas');",
"const atlasActionCenterForceRoute = require('./routes/tenant/atlasActionCenterForceRoute');",
"const tenantExecutiveMetricsRoutes = require('./routes/tenant/executiveMetrics');"
)

foreach ($line in $imports) {
    if ($content -notlike "*$line*") {
        $content = $content -replace "(const tenantUnifiedTasksRoutes = require\('./routes/tenant/unifiedTasks'\);)", "`$1`r`n$line"
    }
}

$routes = @(
"app.use('/api/tenant/executive-metrics', tenantExecutiveMetricsRoutes);",
"app.use('/api/tenant/atlas/action-center', atlasActionCenterForceRoute);",
"app.use('/api/tenant/atlas', tenantAtlasRoutes);"
)

foreach ($line in $routes) {
    if ($content -notlike "*$line*") {
        $content = $content -replace "(app.use\('/api/tenant/tasks-unified', tenantUnifiedTasksRoutes\);)", "`$1`r`n$line"
    }
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ServerPath, $content, $utf8NoBom)

Write-Host "Backend routes repaired." -ForegroundColor Green
Write-Host "Backup: $BackupPath" -ForegroundColor Yellow