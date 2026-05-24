$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ToolsRoot = Join-Path $ProjectRoot "tools"
$ReportsRoot = Join-Path $ProjectRoot "reports"

$PreDemoScript = Join-Path $ToolsRoot "raftop_pre_demo_check.ps1"

if (!(Test-Path $ReportsRoot)) {
    New-Item -ItemType Directory -Path $ReportsRoot | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$ReportPath = Join-Path $ReportsRoot "raftop_pre_demo_evidence_$Timestamp.txt"
$LatestPath = Join-Path $ReportsRoot "raftop_pre_demo_evidence_latest.txt"

function Write-Header {
    param([string]$Text)

    Add-Content -Path $ReportPath -Value ""
    Add-Content -Path $ReportPath -Value "============================================================"
    Add-Content -Path $ReportPath -Value $Text
    Add-Content -Path $ReportPath -Value "============================================================"
}

Write-Host ""
Write-Host "Generating RAFTOP pre-demo evidence report..." -ForegroundColor Cyan
Write-Host "Report: $ReportPath" -ForegroundColor Gray

Add-Content -Path $ReportPath -Value "RAFTOP CPAP CARE Pro - Pre-Demo Evidence Report"
Add-Content -Path $ReportPath -Value "Generated At: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")"
Add-Content -Path $ReportPath -Value "Project Root: $ProjectRoot"
Add-Content -Path $ReportPath -Value "Machine: $env:COMPUTERNAME"
Add-Content -Path $ReportPath -Value "User: $env:USERNAME"

Write-Header "1. Pre-Demo Gate Execution"

if (!(Test-Path $PreDemoScript)) {
    Add-Content -Path $ReportPath -Value "[FAIL] Missing pre-demo script: $PreDemoScript"
    Copy-Item $ReportPath $LatestPath -Force

    Write-Host "[FAIL] Missing pre-demo script." -ForegroundColor Red
    Write-Host "FINAL STATUS: PRE_DEMO_EVIDENCE_BLOCKED" -ForegroundColor Red
    exit 1
}

$TempOutput = Join-Path $ReportsRoot "raftop_pre_demo_temp_$Timestamp.txt"

try {
    & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $PreDemoScript *>&1 | Tee-Object $TempOutput

    $PreDemoExitCode = $LASTEXITCODE
}
catch {
    Add-Content -Path $ReportPath -Value "[FAIL] Pre-demo script crashed: $($_.Exception.Message)"
    Copy-Item $ReportPath $LatestPath -Force

    Write-Host "[FAIL] Pre-demo script crashed." -ForegroundColor Red
    Write-Host "FINAL STATUS: PRE_DEMO_EVIDENCE_BLOCKED" -ForegroundColor Red
    exit 1
}

$OutputText = Get-Content $TempOutput -Raw
Add-Content -Path $ReportPath -Value $OutputText

Write-Header "2. Final Status Extraction"

$FinalStatusLine = Select-String -Path $TempOutput -Pattern "FINAL STATUS:" | Select-Object -Last 1

if ($FinalStatusLine) {
    Add-Content -Path $ReportPath -Value $FinalStatusLine.Line
}
else {
    Add-Content -Path $ReportPath -Value "[FAIL] No FINAL STATUS line found."
}

Write-Header "3. Failure / Warning Extraction"

$Findings = Select-String -Path $TempOutput -Pattern "\[FAIL\]|\[WARNING\]" -Context 0,1

if ($Findings) {
    foreach ($finding in $Findings) {
        Add-Content -Path $ReportPath -Value $finding.Line
    }
}
else {
    Add-Content -Path $ReportPath -Value "[OK] No failures or warnings found."
}

Write-Header "4. Evidence Decision"

$FinalStatus = if ($FinalStatusLine) { $FinalStatusLine.Line } else { "" }

if ($FinalStatus -match "RAFTOP_PRE_DEMO_READY") {
    Add-Content -Path $ReportPath -Value "Evidence Decision: READY"
    Add-Content -Path $ReportPath -Value "Commercial Demo Status: APPROVED"
    Add-Content -Path $ReportPath -Value "Hard Blockers: 0"

    Copy-Item $ReportPath $LatestPath -Force
    Remove-Item $TempOutput -Force -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "Evidence report generated successfully." -ForegroundColor Green
    Write-Host "Report: $ReportPath" -ForegroundColor Green
    Write-Host "Latest: $LatestPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "FINAL STATUS: PRE_DEMO_EVIDENCE_READY" -ForegroundColor Green
    exit 0
}

if ($FinalStatus -match "RAFTOP_PRE_DEMO_READY_WITH_WARNINGS") {
    Add-Content -Path $ReportPath -Value "Evidence Decision: READY_WITH_WARNINGS"
    Add-Content -Path $ReportPath -Value "Commercial Demo Status: APPROVED_WITH_WARNINGS"
    Add-Content -Path $ReportPath -Value "Hard Blockers: 0"

    Copy-Item $ReportPath $LatestPath -Force
    Remove-Item $TempOutput -Force -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "Evidence report generated with warnings." -ForegroundColor Yellow
    Write-Host "Report: $ReportPath" -ForegroundColor Yellow
    Write-Host "Latest: $LatestPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "FINAL STATUS: PRE_DEMO_EVIDENCE_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Add-Content -Path $ReportPath -Value "Evidence Decision: BLOCKED"
Add-Content -Path $ReportPath -Value "Commercial Demo Status: NOT APPROVED"
Add-Content -Path $ReportPath -Value "Hard Blockers: Present"

Copy-Item $ReportPath $LatestPath -Force
Remove-Item $TempOutput -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Evidence report generated, but pre-demo is blocked." -ForegroundColor Red
Write-Host "Report: $ReportPath" -ForegroundColor Red
Write-Host "Latest: $LatestPath" -ForegroundColor Red
Write-Host ""
Write-Host "FINAL STATUS: PRE_DEMO_EVIDENCE_BLOCKED" -ForegroundColor Red
exit 1