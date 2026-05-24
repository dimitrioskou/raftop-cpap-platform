# RAFTOP CPAP CARE Pro
# Phase 38.4B - Fix Submodule Env Blocker
# Safe ASCII-only script

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase38_submodule_env_blocker_fix_" + $Timestamp + ".md")

$PrivateBackupRoot = Join-Path (Split-Path -Parent $Root) "RAFTOP_PRIVATE_ENV_BACKUP"
$PrivateBackupDir = Join-Path $PrivateBackupRoot ("submodule_env_backup_" + $Timestamp)

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.4B Submodule Env Blocker Fix" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""

Write-Host ""
Write-Host "Running submodule env blocker fix..."
Write-Host ""

$LegacyBackendEnv = Join-Path $Root "backend\.env"

if (Test-Path $LegacyBackendEnv) {
    if (!(Test-Path $PrivateBackupDir)) {
        New-Item -ItemType Directory -Path $PrivateBackupDir -Force | Out-Null
    }

    $Target = Join-Path $PrivateBackupDir "backend__env"
    Move-Item -Path $LegacyBackendEnv -Destination $Target -Force

    Write-ReportLine ("MOVED: backend\.env -> " + $Target)
    Write-Host "MOVED - backend\.env moved to private backup"
} else {
    Write-ReportLine "NO_BACKEND_ENV_FOUND"
    Write-Host "PASS - backend\.env not found"
}

# Add defensive ignore rule to root .gitignore.
$GitIgnorePath = Join-Path $Root ".gitignore"

if (!(Test-Path $GitIgnorePath)) {
    Set-Content -Path $GitIgnorePath -Value "" -Encoding UTF8
}

$Rules = @(
"",
"# RAFTOP legacy/submodule env protection",
"backend/.env",
"backend/.env.*"
)

$Existing = Get-Content -Path $GitIgnorePath -ErrorAction SilentlyContinue

foreach ($Rule in $Rules) {
    if ($Rule -eq "") {
        Add-Content -Path $GitIgnorePath -Value "" -Encoding UTF8
    } elseif ($Existing -notcontains $Rule) {
        Add-Content -Path $GitIgnorePath -Value $Rule -Encoding UTF8
        Write-ReportLine ("GITIGNORE_ADDED: " + $Rule)
    }
}

Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_SUBMODULE_ENV_BLOCKER_FIXED"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.4B Submodule Env Blocker Fix"
Write-Host "============================================================"
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "Private backup location:"
Write-Host $PrivateBackupDir
Write-Host ""
Write-Host "FINAL STATUS: PHASE38_SUBMODULE_ENV_BLOCKER_FIXED"
Write-Host ""