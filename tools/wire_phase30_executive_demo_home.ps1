$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase30-executive-demo-home.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RaftopoulosExecutiveDemoHomePage from './pages/RaftopoulosExecutiveDemoHomePage';"
$afterImport = "import RaftopoulosPilotWalkthroughScenarioPage from './pages/RaftopoulosPilotWalkthroughScenarioPage';"

if ($content -notlike "*RaftopoulosExecutiveDemoHomePage*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$linkBlock = @"
        <Link to="/sales/raftopoulos/executive-demo-home" style={executiveDemoHomeLink}>
          Executive Demo Home
        </Link>
"@

if ($content -notlike "*to=`"/sales/raftopoulos/executive-demo-home`"*") {
    $content = $content.Replace(
        '<Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>',
        $linkBlock + '
        <Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>'
    )
}

$routeLine = '      <Route path="/sales/raftopoulos/executive-demo-home" element={<RaftopoulosExecutiveDemoHomePage />} />'

if ($content -notlike "*path=`"/sales/raftopoulos/executive-demo-home`"*") {
    $content = $content.Replace(
        '      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />',
        $routeLine + '
      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />'
    )
}

$styleBlock = @"

const executiveDemoHomeLink = {
  ...linkBase,
  background: '#0f172a'
};
"@

if ($content -notlike "*const executiveDemoHomeLink*") {
    $content = $content.Replace(
        "const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};",
        "$styleBlock
const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};"
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 30 Executive Demo Home route wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""