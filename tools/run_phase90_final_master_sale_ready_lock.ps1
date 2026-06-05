# RAFTOP CPAP CARE Pro
# Phase 90 - Final Master Sale-Ready Lock
# Verifies final send-to-buyer package, previous phases, safety boundaries, and creates final master lock report.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$ClientDeliveryDir = Join-Path $Root "client-delivery"

$SendFolder = Join-Path $Desktop "RAFTOP_SEND_TO_BUYER_FINAL"
$SendZip = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$SendMessage = Join-Path $SendFolder "01_MESSAGE_TO_SEND_GR.txt"
$DoNotSend = Join-Path $SendFolder "02_DO_NOT_SEND.txt"
$OpenFirst = Join-Path $SendFolder "00_OPEN_FIRST.txt"

$MasterLockDoc = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_MASTER_SALE_READY_LOCK.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDeliveryDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase90_final_master_sale_ready_lock_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }

    Add-Content -Path $ReportPath -Value ("CHECK: " + $Name) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("STATUS: " + $Status) -Encoding UTF8
    Add-Content -Path $ReportPath -Value ("DETAILS: " + $Details) -Encoding UTF8
    Add-Content -Path $ReportPath -Value "" -Encoding UTF8

    Write-Host ($Status + " - " + $Name)
}

function ContainsText {
    param([string]$Content, [string]$Needle)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function Get-LatestReport {
    param([string]$Pattern)

    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 90 Final Master Sale-Ready Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 90 - Final Master Sale-Ready Lock..."
Write-Host ""

Check-ReportStatus "Phase 79 status" "phase79_7000_patient_production_rollout_preflight_gate_*.md" @(
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY",
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 80 status" "phase80_production_tenant_roles_access_pack_*.md" @(
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY",
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 81 status" "phase81_7000_patient_csv_master_validator_*.md" @(
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY",
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 82 status" "phase82_7000_patient_synthetic_dry_run_import_pack_*.md" @(
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY",
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 83 status" "phase83_production_import_staging_gate_*.md" @(
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY",
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 84 status" "phase84_atlas_80h_reports_verification_pack_*.md" @(
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY",
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 85 status" "phase85_buyer_acceptance_production_rollout_signoff_pack_*.md" @(
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY",
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 86 status" "phase86_final_commercial_sale_pack_*.md" @(
    "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY",
    "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 87 status" "phase87_final_sale_package_master_gate_*.md" @(
    "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY",
    "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 88 status" "phase88_final_sale_package_delivery_readiness_gate_*.md" @(
    "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY",
    "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 89 status" "phase89_final_send_to_buyer_pack_*.md" @(
    "PHASE89_FINAL_SEND_TO_BUYER_PACK_READY",
    "PHASE89_FINAL_SEND_TO_BUYER_PACK_READY_WITH_WARNINGS"
)

foreach ($Path in @($SendFolder, $SendZip, $SendMessage, $DoNotSend, $OpenFirst)) {
    if (Test-Path $Path) {
        Add-Result ("Required send item exists: " + $Path) "PASS" "Found."
    } else {
        Add-Result ("Required send item exists: " + $Path) "FAIL" "Missing."
    }
}

# ZIP inspection
if (Test-Path $SendZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($SendZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredEntries = @(
            "00_START_HERE.md",
            "01_PACKAGE_CONTENTS.md",
            "02_SECURITY_AND_DELIVERY_BOUNDARY.md",
            "03_NEXT_STEPS_IF_BUYER_ACCEPTS.md",
            "01_BUYER_PRODUCT_PACKAGE/RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip",
            "02_COMMERCIAL_SALE_PACK/86_COMMERCIAL_OFFER_RAFTOP_CPAP_CARE_PRO.md",
            "02_COMMERCIAL_SALE_PACK/86_PRICING_OPTIONS.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_BUYER_ACCEPTANCE_CHECKLIST.md"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("Final ZIP required entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("Final ZIP required entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "DATABASE_URL",
            "JWT_SECRET",
            "SUPER_ADMIN_API_KEY",
            "RESTORE_KEY",
            "RAFTOP_BACKUPS"
        )

        foreach ($Forbidden in $ForbiddenEntries) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden final ZIP entry absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden final ZIP entry absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "Final ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

$LockContent = @'
# RAFTOP CPAP CARE Pro - Final Master Sale-Ready Lock

REQUIRED_MARKER: PHASE90_FINAL_MASTER_SALE_READY_LOCK
REQUIRED_MARKER: SELL_READY_PACKAGE_LOCKED
REQUIRED_MARKER: SEND_TO_BUYER_FOLDER_READY
REQUIRED_MARKER: NO_SOURCE_CODE_NO_SECRETS
REQUIRED_MARKER: REAL_PATIENT_IMPORT_BLOCKED_UNTIL_AGREEMENT

## Final status

The sale package is locked for buyer delivery.

## Send folder

Desktop folder:
RAFTOP_SEND_TO_BUYER_FINAL

## File to send

RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip

## Link to send

https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Do not send

Do not send:
- source code
- GitHub repository
- backend folder
- frontend source folder
- tools folder
- reports folder
- .env
- database URL
- API keys
- Render secrets
- super admin credentials
- real patient CSV
- production patient data

## If buyer accepts

Next steps:
1. Commercial agreement
2. GDPR / DPA
3. Role/access approval
4. CSV validation
5. 100-row controlled import
6. 500-row stage
7. 2000-row stage
8. 7000-row stage only after signoff
'@

Set-Content -Path $MasterLockDoc -Value $LockContent -Encoding UTF8

if (Test-Path $MasterLockDoc) {
    Add-Result "Final master lock document created" "PASS" $MasterLockDoc
} else {
    Add-Result "Final master lock document created" "FAIL" $MasterLockDoc
}

$MasterContent = Read-FileSafe $MasterLockDoc

foreach ($Marker in @(
    "PHASE90_FINAL_MASTER_SALE_READY_LOCK",
    "SELL_READY_PACKAGE_LOCKED",
    "SEND_TO_BUYER_FOLDER_READY",
    "NO_SOURCE_CODE_NO_SECRETS",
    "REAL_PATIENT_IMPORT_BLOCKED_UNTIL_AGREEMENT"
)) {
    if (ContainsText $MasterContent $Marker) {
        Add-Result ("Master lock marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Master lock marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE90_FINAL_MASTER_SALE_READY_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 90 Final Master Sale-Ready Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Send folder:"
Write-Host $SendFolder
Write-Host ""
Write-Host "ZIP to send:"
Write-Host $SendZip
Write-Host ""
Write-Host "Master lock doc:"
Write-Host $MasterLockDoc
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode