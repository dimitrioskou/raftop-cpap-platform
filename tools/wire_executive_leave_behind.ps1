$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-executive-leave-behind.js"

if (!(Test-Path $AppPath)) {
    throw "App.js not found: $AppPath"
}

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RaftopoulosExecutiveLeaveBehindPage from './pages/RaftopoulosExecutiveLeaveBehindPage';"
$afterImport = "import RaftopoulosExecutivePilotClosePage from './pages/RaftopoulosExecutivePilotClosePage';"

if ($content -notlike "*RaftopoulosExecutiveLeaveBehindPage*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$afterLink = @'
        <Link to="/sales/raftopoulos/executive-pilot-close" style={executivePilotCloseLink}>
          Executive Pilot Close
        </Link>
'@

$linkBlock = @'
        <Link to="/sales/raftopoulos/executive-leave-behind" style={executiveLeaveBehindLink}>
          Executive Leave-behind
        </Link>
'@

if ($content -notlike "*executive-leave-behind*") {
    $content = $content.Replace($afterLink, "$afterLink`r`n$linkBlock")
}

$afterRoute = '      <Route path="/sales/raftopoulos/executive-pilot-close" element={<RaftopoulosExecutivePilotClosePage />} />'
$routeLine = '      <Route path="/sales/raftopoulos/executive-leave-behind" element={<RaftopoulosExecutiveLeaveBehindPage />} />'

if ($content -notlike "*RaftopoulosExecutiveLeaveBehindPage />}*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$afterStyle = @'
const executivePilotCloseLink = {
  ...linkBase,
  background: '#047857'
};

'@

$styleBlock = @'
const executiveLeaveBehindLink = {
  ...linkBase,
  background: '#0f766e'
};

'@

if ($content -notlike "*const executiveLeaveBehindLink*") {
    $content = $content.Replace($afterStyle, "$afterStyle$styleBlock")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Executive Leave-behind wiring completed." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next route:" -ForegroundColor Cyan
Write-Host "http://localhost:3001/sales/raftopoulos/executive-leave-behind" -ForegroundColor Cyan