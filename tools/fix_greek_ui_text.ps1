$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-ui-text-safe-fix.js"

if (!(Test-Path $AppPath)) {
    throw "App.js not found: $AppPath"
}

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

$content = [regex]::Replace(
    $content,
    '<div style=\{navTitle\}>.*?</div>\s*(?=\r?\n\s*<Link to="/demo/raftopoulos/start")',
    '<div style={navTitle}>Presentation</div>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$content = [regex]::Replace(
    $content,
    '<div style=\{navTitle\}>.*?</div>\s*(?=\r?\n\s*<Link to="/tenant/patients")',
    '<div style={navTitle}>Platform Operations</div>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$content = [regex]::Replace(
    $content,
    '<div style=\{clientSafeTitle\}>.*?</div>',
    '<div style={clientSafeTitle}>Client-facing mode</div>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$content = [regex]::Replace(
    $content,
    '<div style=\{clientSafeText\}>.*?</div>',
    '<div style={clientSafeText}>This demo is safe for client presentation. Technical pages and internal audits are hidden.</div>',
    [System.Text.RegularExpressions.RegexOptions]::Singleline
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "UI text safe fix completed." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""