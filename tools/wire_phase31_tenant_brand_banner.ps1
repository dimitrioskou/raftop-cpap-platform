$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase31-tenant-brand-banner.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import TenantBrandBanner from './components/TenantBrandBanner';"
$afterImport = "import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';"

if ($content -notlike "*TenantBrandBanner*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

if ($content -notlike "*<TenantBrandBanner />*") {
    $content = $content.Replace(
        "        <CommercialDemoBanner />
        <ExecutiveKpiRibbon />",
        "        <CommercialDemoBanner />
        <TenantBrandBanner />
        <ExecutiveKpiRibbon />"
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 31 Tenant Brand Banner wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""