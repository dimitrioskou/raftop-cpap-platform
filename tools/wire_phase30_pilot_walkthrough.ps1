$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase30-pilot-walkthrough.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RaftopoulosPilotWalkthroughScenarioPage from './pages/RaftopoulosPilotWalkthroughScenarioPage';"
$afterImport = "import RaftopoulosExecutiveDemoScriptPage from './pages/RaftopoulosExecutiveDemoScriptPage';"

if ($content -notlike "*RaftopoulosPilotWalkthroughScenarioPage*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$linkBlock = @"
        <Link to="/sales/raftopoulos/pilot-walkthrough" style={pilotWalkthroughLink}>
          Pilot Walkthrough
        </Link>
"@

if ($content -notlike "*to=`"/sales/raftopoulos/pilot-walkthrough`"*") {
    $content = $content.Replace(
        '<Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>',
        '<Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>

' + $linkBlock
    )
}

$routeLine = '      <Route path="/sales/raftopoulos/pilot-walkthrough" element={<RaftopoulosPilotWalkthroughScenarioPage />} />'

if ($content -notlike "*path=`"/sales/raftopoulos/pilot-walkthrough`"*") {
    $content = $content.Replace(
        '      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />',
        '      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />
' + $routeLine
    )
}

$styleBlock = @"

const pilotWalkthroughLink = {
  ...linkBase,
  background: '#0e7490'
};
"@

if ($content -notlike "*const pilotWalkthroughLink*") {
    $content = $content.Replace(
        "const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};",
        "const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};$styleBlock"
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 30 Pilot Walkthrough route wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""