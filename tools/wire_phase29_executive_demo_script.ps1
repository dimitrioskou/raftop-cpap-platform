$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase29-executive-demo-script.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RaftopoulosExecutiveDemoScriptPage from './pages/RaftopoulosExecutiveDemoScriptPage';"
$afterImport = "import RaftopoulosExecutiveLeaveBehindPage from './pages/RaftopoulosExecutiveLeaveBehindPage';"

if ($content -notlike "*RaftopoulosExecutiveDemoScriptPage*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$linkBlock = @"
        <Link to="/sales/raftopoulos/executive-demo-script" style={executiveDemoScriptLink}>
          Executive Demo Script
        </Link>
"@

if ($content -notlike "*to=`"/sales/raftopoulos/executive-demo-script`"*") {
    $content = $content.Replace(
        '<Link to="/sales/raftopoulos/executive-leave-behind" style={executiveLeaveBehindLink}>
          Executive Leave-behind
        </Link>',
        '<Link to="/sales/raftopoulos/executive-leave-behind" style={executiveLeaveBehindLink}>
          Executive Leave-behind
        </Link>

' + $linkBlock
    )
}

$routeLine = '      <Route path="/sales/raftopoulos/executive-demo-script" element={<RaftopoulosExecutiveDemoScriptPage />} />'

if ($content -notlike "*path=`"/sales/raftopoulos/executive-demo-script`"*") {
    $content = $content.Replace(
        '      <Route path="/sales/raftopoulos/executive-leave-behind" element={<RaftopoulosExecutiveLeaveBehindPage />} />',
        '      <Route path="/sales/raftopoulos/executive-leave-behind" element={<RaftopoulosExecutiveLeaveBehindPage />} />
' + $routeLine
    )
}

$styleBlock = @"

const executiveDemoScriptLink = {
  ...linkBase,
  background: '#1e3a8a'
};
"@

if ($content -notlike "*const executiveDemoScriptLink*") {
    $content = $content.Replace(
        "const executiveLeaveBehindLink = {
  ...linkBase,
  background: '#0f766e'
};",
        "const executiveLeaveBehindLink = {
  ...linkBase,
  background: '#0f766e'
};$styleBlock"
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 29 Executive Demo Script route wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""