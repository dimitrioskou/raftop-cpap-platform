$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ServerPath = Join-Path $ProjectRoot "enterprise-backend\src\server.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-backend\src\server.backup.before-phase32-tenant-provisioning.js"

Copy-Item $ServerPath $BackupPath -Force

$content = Get-Content $ServerPath -Raw

$importLine = "const superAdminTenantProvisioningRoutes = require('./routes/super-admin/tenantProvisioning');"
$afterImport = "const superAdminTenantProfilesRoutes = require('./routes/superAdmin/tenantProfiles');"

if ($content -notlike "*tenantProvisioning*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$routeLine = "app.use('/api/super-admin/tenant-provisioning', superAdminTenantProvisioningRoutes);"
$afterRoute = "app.use('/api/super-admin/tenant-profiles', superAdminTenantProfilesRoutes);"

if ($content -notlike "*'/api/super-admin/tenant-provisioning'*") {
    $content = $content.Replace($afterRoute, "$afterRoute`r`n$routeLine")
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($ServerPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 tenant provisioning route wired successfully." -ForegroundColor Green
Write-Host "Updated: $ServerPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""