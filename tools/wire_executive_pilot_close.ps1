$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-executive-pilot-close.js"

if (!(Test-Path $AppPath)) {
    throw "App.js not found: $AppPath"
}

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import RaftopoulosExecutivePilotClosePage from './pages/RaftopoulosExecutivePilotClosePage';"
$afterImport = "import RaftopoulosPilotApprovalDecisionPage from './pages/RaftopoulosPilotApprovalDecisionPage';"

if ($content -notlike "*$importLine*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$linkBlock = @'
        <Link to="/sales/raftopoulos/executive-pilot-close" style={executivePilotCloseLink}>
          Executive Pilot Close
        </Link>
'@

$afterLink = @'
<Link to="/sales/raftopoulos/pilot-approval-decision" style={pilotApprovalDecisionLink}>
  Pilot Approval Decision
</Link>
'@

if ($content -notlike "*executive-pilot-close*") {
    $content = $content.Replace($afterLink, "$afterLink`r`n$linkBlock")
}

$routeLine = '      <Route path="/sales/raftopoulos/executive-pilot-close" element={<RaftopoulosExecutivePilotClosePage />} />'
$afterRoute = '      <Route path="/sales/raftopoulos/pilot-approval-decision" element={<RaftopoulosPilotApprovalDecisionPage />} />'

if ($content -notlike "*RaftopoulosExecutivePilotClosePage*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$styleBlock = @'
const executivePilotCloseLink = {
  ...linkBase,
  background: '#047857'
};

'@

$afterStyle = @'
const pilotApprovalDecisionLink = {
  ...linkBase,
  background: '#065f46'
};

'@

if ($content -notlike "*const executivePilotCloseLink*") {
    $content = $content.Replace($afterStyle, "$afterStyle$styleBlock")
}

Set-Content -Path $AppPath -Value $content -Encoding UTF8

Write-Host ""
Write-Host "Executive Pilot Close wiring completed." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next route:" -ForegroundColor Cyan
Write-Host "http://localhost:3001/sales/raftopoulos/executive-pilot-close" -ForegroundColor Cyan