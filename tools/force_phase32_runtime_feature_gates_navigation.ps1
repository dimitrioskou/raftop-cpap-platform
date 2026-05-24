$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.force-phase32-runtime-feature-gates-navigation.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

if ($content -notmatch "import RuntimeFeatureGate from './components/RuntimeFeatureGate';") {
  $content = $content -replace "import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';", "import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';`r`nimport RuntimeFeatureGate from './components/RuntimeFeatureGate';"
}

function Wrap-Link {
  param(
    [string]$Content,
    [string]$Feature,
    [string]$To,
    [string]$Text
  )

  if ($Content -match "feature=`"$Feature`"") {
    return $Content
  }

  $pattern = "(?s)\s*<Link to=`"$([regex]::Escape($To))`" style=\{([^}]+)\}>\s*$([regex]::Escape($Text))\s*</Link>"
  $replacement = @"

        <RuntimeFeatureGate feature="$Feature">
          <Link to="$To" style={`$1}>
            $Text
          </Link>
        </RuntimeFeatureGate>
"@

  return [regex]::Replace($Content, $pattern, $replacement, 1)
}

$content = Wrap-Link -Content $content -Feature "atlas" -To "/tenant/atlas" -Text "ATLAS"
$content = Wrap-Link -Content $content -Feature "actionCenter" -To "/tenant/atlas/action-center" -Text "Action Center"
$content = Wrap-Link -Content $content -Feature "closedLoop" -To "/tenant/closed-loop" -Text "Closed Loop"
$content = Wrap-Link -Content $content -Feature "executiveMetrics" -To "/sales/raftopoulos/executive-pilot-close" -Text "Executive Pilot Close"
$content = Wrap-Link -Content $content -Feature "rolloutRoadmap" -To "/sales/raftopoulos/rollout-roadmap" -Text "Rollout Roadmap"

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Forced runtime feature gates into App.js navigation." -ForegroundColor Green
Write-Host "Backup: $BackupPath" -ForegroundColor Yellow
Write-Host ""