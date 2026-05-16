$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$PagePath = Join-Path $ProjectRoot "enterprise-frontend\src\pages\TenantAtlasActionCenterPage.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\pages\TenantAtlasActionCenterPage.backup.before-endpoint-fix.js"

if (!(Test-Path $PagePath)) {
    throw "TenantAtlasActionCenterPage.js not found: $PagePath"
}

Copy-Item $PagePath $BackupPath -Force

$content = Get-Content $PagePath -Raw

$content = $content.Replace(
    "/api/tenant/atlas/action-center",
    "/api/tenant/atlas"
)

$content = $content.Replace(
    "/api/tenant/atlas/${encodeURIComponent(actionId)}/create-task",
    "/api/tenant/tasks-unified"
)

$content = $content.Replace(
    "/api/tenant/atlas/action-center/${encodeURIComponent(actionId)}/create-task",
    "/api/tenant/tasks-unified"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($PagePath, $content, $utf8NoBom)

Write-Host ""
Write-Host "ATLAS Action Center endpoint fixed." -ForegroundColor Green
Write-Host "Updated: $PagePath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""