$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase32-runtime-feature-gates-navigation.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RuntimeFeatureGate from './components/RuntimeFeatureGate';"
$afterImport = "import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';"

if ($content -notlike "*RuntimeFeatureGate*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$content = $content.Replace(
'        <Link to="/sales/raftopoulos/executive-pilot-close" style={executivePilotCloseLink}>
          Executive Pilot Close
        </Link>',
'        <RuntimeFeatureGate feature="executiveMetrics">
          <Link to="/sales/raftopoulos/executive-pilot-close" style={executivePilotCloseLink}>
            Executive Pilot Close
          </Link>
        </RuntimeFeatureGate>'
)

$content = $content.Replace(
'        <Link to="/sales/raftopoulos/rollout-roadmap" style={rolloutRoadmapLink}>
          Rollout Roadmap
        </Link>',
'        <RuntimeFeatureGate feature="rolloutRoadmap">
          <Link to="/sales/raftopoulos/rollout-roadmap" style={rolloutRoadmapLink}>
            Rollout Roadmap
          </Link>
        </RuntimeFeatureGate>'
)

$content = $content.Replace(
'        <Link to="/tenant/atlas" style={navLink}>
          ATLAS
        </Link>',
'        <RuntimeFeatureGate feature="atlas">
          <Link to="/tenant/atlas" style={navLink}>
            ATLAS
          </Link>
        </RuntimeFeatureGate>'
)

$content = $content.Replace(
'        <Link to="/tenant/atlas/action-center" style={navLink}>
          Action Center
        </Link>',
'        <RuntimeFeatureGate feature="actionCenter">
          <Link to="/tenant/atlas/action-center" style={navLink}>
            Action Center
          </Link>
        </RuntimeFeatureGate>'
)

$content = $content.Replace(
'        <Link to="/tenant/closed-loop" style={navLink}>
          Closed Loop
        </Link>',
'        <RuntimeFeatureGate feature="closedLoop">
          <Link to="/tenant/closed-loop" style={navLink}>
            Closed Loop
          </Link>
        </RuntimeFeatureGate>'
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 Runtime Feature Gates wired into navigation." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""