$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ToolsRoot = Join-Path $ProjectRoot "tools"
$DocsRoot = Join-Path $ProjectRoot "docs"
$ReportsRoot = Join-Path $ProjectRoot "reports"

$LauncherScript = Join-Path $ToolsRoot "launch_raftop_demo.ps1"
$ShortcutScript = Join-Path $ToolsRoot "create_raftop_demo_desktop_shortcut.ps1"
$EvidenceScript = Join-Path $ToolsRoot "generate_pre_demo_evidence_report.ps1"
$PreDemoScript = Join-Path $ToolsRoot "raftop_pre_demo_check.ps1"
$MasterScript = Join-Path $ToolsRoot "verify_phase35_master_readiness.ps1"

$OperatorGuide = Join-Path $DocsRoot "RAFTOP_DEMO_OPERATOR_GUIDE.md"
$LatestEvidenceReport = Join-Path $ReportsRoot "raftop_pre_demo_evidence_latest.txt"
$DesktopShortcut = "C:\Users\Administrator\Desktop\RAFTOP DEMO LAUNCHER.lnk"

$Failures = 0
$Warnings = 0

function Section {
    param([string]$Title)

    Write-Host ""
    Write-Host "============================================================"
    Write-Host $Title
    Write-Host "============================================================"
}

function Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Warn {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
    $script:Warnings += 1
}

function Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    $script:Failures += 1
}

function Check-Path {
    param(
        [string]$Label,
        [string]$Path
    )

    if (Test-Path $Path) {
        Ok $Label
    }
    else {
        Fail "$Label missing: $Path"
    }
}

function Check-FileContains {
    param(
        [string]$Label,
        [string]$Path,
        [string]$Pattern
    )

    if (!(Test-Path $Path)) {
        Fail "Missing file for $Label`: $Path"
        return
    }

    $found = Select-String -Path $Path -Pattern $Pattern -Quiet

    if ($found) {
        Ok $Label
    }
    else {
        Fail "$Label missing pattern: $Pattern"
    }
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Phase 35 Demo Operations Verification" -ForegroundColor Cyan
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray

Section "1. Required Folders"

Check-Path "Tools folder exists" $ToolsRoot
Check-Path "Docs folder exists" $DocsRoot
Check-Path "Reports folder exists" $ReportsRoot

Section "2. Required Demo Scripts"

Check-Path "Demo launcher script exists" $LauncherScript
Check-Path "Desktop shortcut creator exists" $ShortcutScript
Check-Path "Evidence report generator exists" $EvidenceScript
Check-Path "Pre-demo check script exists" $PreDemoScript
Check-Path "Phase 35 master readiness script exists" $MasterScript

Section "3. Script Status Markers"

Check-FileContains `
    -Label "Demo launcher has final ready marker" `
    -Path $LauncherScript `
    -Pattern "RAFTOP_DEMO_LAUNCH_READY"

Check-FileContains `
    -Label "Shortcut creator has final ready marker" `
    -Path $ShortcutScript `
    -Pattern "DEMO_SHORTCUT_READY"

Check-FileContains `
    -Label "Evidence generator has final ready marker" `
    -Path $EvidenceScript `
    -Pattern "PRE_DEMO_EVIDENCE_READY"

Check-FileContains `
    -Label "Pre-demo check has final ready marker" `
    -Path $PreDemoScript `
    -Pattern "RAFTOP_PRE_DEMO_READY"

Check-FileContains `
    -Label "Phase 35 master script has final ready marker" `
    -Path $MasterScript `
    -Pattern "PHASE35_MASTER_READY"

Section "4. Desktop Shortcut"

Check-Path "RAFTOP DEMO LAUNCHER desktop shortcut exists" $DesktopShortcut

Section "5. Operator Guide"

Check-Path "Demo Operator Guide exists" $OperatorGuide

Check-FileContains `
    -Label "Operator Guide has RAFTOP title" `
    -Path $OperatorGuide `
    -Pattern "RAFTOP CPAP CARE Pro"

Check-FileContains `
    -Label "Operator Guide references demo launcher" `
    -Path $OperatorGuide `
    -Pattern "RAFTOP DEMO LAUNCHER"

Check-FileContains `
    -Label "Operator Guide includes Patient Portal step" `
    -Path $OperatorGuide `
    -Pattern "patient/dashboard"

Check-FileContains `
    -Label "Operator Guide includes Security Center step" `
    -Path $OperatorGuide `
    -Pattern "tenant/security"

Check-FileContains `
    -Label "Operator Guide includes Failed Login Audit step" `
    -Path $OperatorGuide `
    -Pattern "tenant/security/failed-logins"

Check-FileContains `
    -Label "Operator Guide includes hard demo readiness rule" `
    -Path $OperatorGuide `
    -Pattern "RAFTOP_PRE_DEMO_READY"

Section "6. Evidence Report"

if (Test-Path $LatestEvidenceReport) {
    Ok "Latest evidence report exists"

    Check-FileContains `
        -Label "Latest evidence report has READY decision" `
        -Path $LatestEvidenceReport `
        -Pattern "Evidence Decision: READY"

    Check-FileContains `
        -Label "Latest evidence report has commercial approval" `
        -Path $LatestEvidenceReport `
        -Pattern "Commercial Demo Status: APPROVED"
}
else {
    Warn "Latest evidence report not found. Run tools\generate_pre_demo_evidence_report.ps1 before demo."
}

Section "7. Demo Operations Decision"

Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0 -and $Warnings -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: DEMO_OPERATIONS_READY" -ForegroundColor Green
    exit 0
}

if ($Failures -eq 0 -and $Warnings -gt 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: DEMO_OPERATIONS_READY_WITH_WARNINGS" -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: DEMO_OPERATIONS_BLOCKED" -ForegroundColor Red
exit 1