$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase32-runtime-module-route-guards.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RuntimeModuleRouteGuard from './components/RuntimeModuleRouteGuard';"
$afterImport = "import RuntimeFeatureGate from './components/RuntimeFeatureGate';"

if ($content -notlike "*RuntimeModuleRouteGuard*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$content = $content.Replace(
'      <Route path="/tenant/atlas" element={<AtlasPage />} />',
'      <Route path="/tenant/atlas" element={<RuntimeModuleRouteGuard feature="atlas" title="ATLAS unavailable"><AtlasPage /></RuntimeModuleRouteGuard>} />'
)

$content = $content.Replace(
'      <Route path="/tenant/atlas/action-center" element={<AtlasActionCenterPage />} />',
'      <Route path="/tenant/atlas/action-center" element={<RuntimeModuleRouteGuard feature="actionCenter" title="Action Center unavailable"><AtlasActionCenterPage /></RuntimeModuleRouteGuard>} />'
)

$content = $content.Replace(
'      <Route path="/tenant/closed-loop" element={<ClosedLoopPage />} />',
'      <Route path="/tenant/closed-loop" element={<RuntimeModuleRouteGuard feature="closedLoop" title="Closed Loop unavailable"><ClosedLoopPage /></RuntimeModuleRouteGuard>} />'
)

$content = $content.Replace(
'      <Route path="/tenant/closed-loop/control-hub" element={<ClosedLoopPage />} />',
'      <Route path="/tenant/closed-loop/control-hub" element={<RuntimeModuleRouteGuard feature="closedLoop" title="Closed Loop unavailable"><ClosedLoopPage /></RuntimeModuleRouteGuard>} />'
)

$content = $content.Replace(
'      <Route path="/sales/raftopoulos/executive-pilot-close" element={<RaftopoulosExecutivePilotClosePage />} />',
'      <Route path="/sales/raftopoulos/executive-pilot-close" element={<RuntimeModuleRouteGuard feature="executiveMetrics" title="Executive Metrics unavailable"><RaftopoulosExecutivePilotClosePage /></RuntimeModuleRouteGuard>} />'
)

$content = $content.Replace(
'      <Route path="/sales/raftopoulos/rollout-roadmap" element={<RaftopoulosRolloutRoadmapPage />} />',
'      <Route path="/sales/raftopoulos/rollout-roadmap" element={<RuntimeModuleRouteGuard feature="rolloutRoadmap" title="Rollout Roadmap unavailable"><RaftopoulosRolloutRoadmapPage /></RuntimeModuleRouteGuard>} />'
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 Runtime Module Route Guards wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""