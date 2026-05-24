$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase33-demo-routes.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import DemoRoutes from './routes/DemoRoutes';"

if ($content -notlike "*./routes/DemoRoutes*") {
    $content = $content.Replace(
        "import ClientDemoStartPage from './pages/ClientDemoStartPage';",
        "import ClientDemoStartPage from './pages/ClientDemoStartPage';`r`n$importLine"
    )
}

$oldRoutes = @"
      <Route path="/demo/raftopoulos/start" element={<ClientDemoStartPage mode="snapshot" />} />
      <Route path="/demo/raftopoulos/pilot" element={<ClientDemoStartPage mode="pilot" />} />
      <Route path="/demo/raftopoulos/decision-room" element={<ClientDemoStartPage mode="decision-room" />} />
"@

$newRoutes = @"
      <DemoRoutes />
"@

if ($content -like "*<Route path=`"/demo/raftopoulos/start`"*") {
    $content = $content.Replace($oldRoutes, $newRoutes)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 33 DemoRoutes wired into App.js." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""