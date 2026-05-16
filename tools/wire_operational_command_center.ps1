$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-operational-command-center.js"

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$importLine = "import OperationalCommandCenter from './components/OperationalCommandCenter';"
$afterImport = "import ExecutiveKpiRibbon from './components/ExecutiveKpiRibbon';"

if ($content -notlike "*OperationalCommandCenter*") {
    $content = $content.Replace($afterImport, "$afterImport`r`n$importLine")
}

$oldBlock = @'
        <CommercialDemoBanner />
        <ExecutiveKpiRibbon />
        <NavigationLinks />
'@

$newBlock = @'
        <CommercialDemoBanner />
        <ExecutiveKpiRibbon />
        <OperationalCommandCenter />
        <NavigationLinks />
'@

if ($content -notlike "*<OperationalCommandCenter />*") {
    $content = $content.Replace($oldBlock, $newBlock)
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Operational Command Center wired successfully." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""