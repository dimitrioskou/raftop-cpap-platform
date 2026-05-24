$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-phase32-tenant-runtime-provider.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import { TenantRuntimeProvider } from './context/TenantRuntimeContext';"
$afterImport = "import TenantBrandBanner from './components/TenantBrandBanner';"

if ($content -notlike "*TenantRuntimeProvider*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$oldBlock = @"
  return (
    <div style={appShell}>
      <TenantContextBar />

      <main style={main}>
        <CommercialDemoBanner />
        <TenantBrandBanner />
        <ExecutiveKpiRibbon />
        <NavigationLinks />
        <AppRoutes />
      </main>
    </div>
  );
"@

$newBlock = @"
  return (
    <TenantRuntimeProvider>
      <div style={appShell}>
        <TenantContextBar />

        <main style={main}>
          <CommercialDemoBanner />
          <TenantBrandBanner />
          <ExecutiveKpiRibbon />
          <NavigationLinks />
          <AppRoutes />
        </main>
      </div>
    </TenantRuntimeProvider>
  );
"@

if ($content -like "*<TenantContextBar />*" -and $content -notlike "*<TenantRuntimeProvider>*") {
    $content = $content.Replace($oldBlock, $newBlock)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Phase 32 Tenant Runtime Provider wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""