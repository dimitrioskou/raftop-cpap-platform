$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase32-tenant-provisioning-console.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import SuperAdminTenantProvisioningPage from './pages/SuperAdminTenantProvisioningPage';"
$afterImport = "import TenantBusinessImpactPage from './pages/TenantBusinessImpactPage';"

if ($content -notlike "*SuperAdminTenantProvisioningPage*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$linkBlock = @"
          <Link to="/super-admin/tenant-provisioning" style={purpleLink}>Tenant Provisioning</Link>
"@

if ($content -notlike "*to=`"/super-admin/tenant-provisioning`"*") {
    $content = $content.Replace(
        '<Link to="/super-admin/tenant-profiles" style={purpleLink}>Tenant Profiles</Link>',
        '<Link to="/super-admin/tenant-profiles" style={purpleLink}>Tenant Profiles</Link>
' + $linkBlock
    )
}

$routeLine = '      <Route path="/super-admin/tenant-provisioning" element={<TechnicalRoute><SuperAdminTenantProvisioningPage /></TechnicalRoute>} />'

if ($content -notlike "*path=`"/super-admin/tenant-provisioning`"*") {
    $content = $content.Replace(
        '      <Route path="/super-admin/tenant-profiles" element={<TechnicalRoute><GenericEndpointPage title="Tenant Profiles" subtitle="Super admin tenant profiles." endpoint="/api/super-admin/tenant-profiles" admin /></TechnicalRoute>} />',
        '      <Route path="/super-admin/tenant-profiles" element={<TechnicalRoute><GenericEndpointPage title="Tenant Profiles" subtitle="Super admin tenant profiles." endpoint="/api/super-admin/tenant-profiles" admin /></TechnicalRoute>} />
' + $routeLine
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 Tenant Provisioning Console wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""