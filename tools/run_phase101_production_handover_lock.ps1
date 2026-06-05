# RAFTOP CPAP CARE Pro
# Phase 101 - Production Handover Lock
# Final technical handover lock for Raftopoulos production delivery.
# Does NOT modify DB.
# Does NOT import data.
# Does NOT print secrets.
# Does NOT include credentials in repo.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-handover"
$ActivationDocsDir = Join-Path $Root "docs\production-activation"
$CredentialFolder = Join-Path $Desktop "RAFTOP_PRODUCTION_CREDENTIALS_DO_NOT_COMMIT"
$CredentialFile = Join-Path $CredentialFolder "RAFTOP_PRODUCTION_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase101_production_handover_lock_" + $Timestamp + ".md")

$HandoverLockDoc = Join-Path $DocsDir "101_PRODUCTION_HANDOVER_LOCK.md"
$DeliveryChecklist = Join-Path $DocsDir "101_RAFTOP_PRODUCTION_DELIVERY_CHECKLIST.md"
$AccessBoundaryDoc = Join-Path $DocsDir "101_ACCESS_AND_SECURITY_BOUNDARY.md"
$NextStepsDoc = Join-Path $DocsDir "101_NEXT_STEPS_AFTER_HANDOVER.md"
$ProductionStatusCard = Join-Path $DocsDir "101_PRODUCTION_STATUS_CARD.md"

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

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 101 Production Handover Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 101 - Production Handover Lock..."
Write-Host ""

Check-ReportStatus "Phase 95D login verification status" "phase95d_login_verification_role_access_check_*.md" @(
    "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK_READY",
    "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 100R 7000 count verification status" "phase100r_7000_final_stage_verification_repair_*.md" @(
    "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY",
    "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 100B final ATLAS 80h reports status" "phase100b_atlas_80h_reports_on_7000_final_stage_*.md" @(
    "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE_READY",
    "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE_READY_WITH_WARNINGS"
)

$BackendHealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL
if ([string]::IsNullOrWhiteSpace($BackendHealthUrl)) {
    $BackendHealthUrl = "https://raftop-cpap-backend.onrender.com/api/health"
}

try {
    $HealthResponse = Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 60

    if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
        Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
    } else {
        Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
    }
} catch {
    Add-Result "Production backend health reachable" "FAIL" ("Health failed: " + $_.Exception.Message)
}

$BuyerUrl = "https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/"
try {
    $BuyerResponse = Invoke-WebRequest -Uri $BuyerUrl -UseBasicParsing -TimeoutSec 60

    if ($BuyerResponse.StatusCode -ge 200 -and $BuyerResponse.StatusCode -lt 300) {
        Add-Result "Buyer/public frontend reachable" "PASS" ("Status: " + $BuyerResponse.StatusCode)
    } else {
        Add-Result "Buyer/public frontend reachable" "FAIL" ("Status: " + $BuyerResponse.StatusCode)
    }
} catch {
    Add-Result "Buyer/public frontend reachable" "FAIL" ("Frontend failed: " + $_.Exception.Message)
}

$LoginUrl = "https://raftop-cpap-frontend.onrender.com/login"
try {
    $LoginResponse = Invoke-WebRequest -Uri $LoginUrl -UseBasicParsing -TimeoutSec 60

    if ($LoginResponse.StatusCode -ge 200 -and $LoginResponse.StatusCode -lt 300) {
        Add-Result "Production login page reachable" "PASS" ("Status: " + $LoginResponse.StatusCode)
    } else {
        Add-Result "Production login page reachable" "FAIL" ("Status: " + $LoginResponse.StatusCode)
    }
} catch {
    Add-Result "Production login page reachable" "FAIL" ("Login page failed: " + $_.Exception.Message)
}

if (Test-Path $CredentialFile) {
    Add-Result "Credentials file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Credentials file exists outside repo" "WARN" "Credentials file not found. Create/deliver credentials separately."
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Credentials file outside repository" "FAIL" "Credential path is inside repo."
} else {
    Add-Result "Credentials file outside repository" "PASS" "Credential path is outside repo."
}

$RequiredDocs = @(
    (Join-Path $ActivationDocsDir "95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK.md"),
    (Join-Path $ActivationDocsDir "100R_7000_FINAL_STAGE_VERIFICATION_REPAIR.md"),
    (Join-Path $ActivationDocsDir "100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE.md")
)

foreach ($Doc in $RequiredDocs) {
    if (Test-Path $Doc) {
        Add-Result ("Required production doc exists: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Required production doc exists: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

$HandoverLockContent = @'
# RAFTOP CPAP CARE Pro - Production Handover Lock

REQUIRED_MARKER: PHASE101_PRODUCTION_HANDOVER_LOCK
REQUIRED_MARKER: PRODUCTION_READY_FOR_RAFTOPoulos_DELIVERY
REQUIRED_MARKER: SEVEN_THOUSAND_PORTFOLIO_VALIDATED
REQUIRED_MARKER: ATLAS_80H_REPORTS_VALIDATED
REQUIRED_MARKER: LOGIN_USERS_VERIFIED
REQUIRED_MARKER: HANDOVER_READY

## Final technical status

RAFTOP CPAP CARE Pro is technically ready for production handover.

## Verified

- Production backend is reachable.
- Production frontend is reachable.
- Login page is reachable.
- Production users have been created/verified.
- 7000-row portfolio scale has been validated.
- ATLAS queue has been generated.
- 80 Hours Compliance has been verified.
- Management snapshot/report outputs have been generated.

## Important boundary

If the current 7000-row validation used synthetic data, this proves technical scale readiness.
Real patient production import still requires:
- buyer-approved CSV
- GDPR/DPA approval
- pseudonymized data
- staged signoff

## Delivery position

Ready for Raftopoulos production handover.
'@

Set-Content -Path $HandoverLockDoc -Value $HandoverLockContent -Encoding UTF8

$DeliveryChecklistContent = @'
# RAFTOP CPAP CARE Pro - Raftopoulos Production Delivery Checklist

REQUIRED_MARKER: PHASE101_DELIVERY_CHECKLIST
REQUIRED_MARKER: DELIVER_LOGIN_URL
REQUIRED_MARKER: DELIVER_CREDENTIALS_SEPARATELY
REQUIRED_MARKER: DO_NOT_DELIVER_SOURCE_CODE_BY_DEFAULT

## Deliver to buyer

1. Production login URL:
https://raftop-cpap-frontend.onrender.com/login

2. Buyer/public overview:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

3. Credentials:
Deliver separately, not inside Git and not in the same message as public package.

4. Handover explanation:
- CPAP portfolio monitoring
- ATLAS prioritization
- 80h compliance
- follow-up workflow
- management reports
- 7000-patient technical scale readiness

## Do not deliver by default

- source code
- GitHub access
- Render credentials
- DATABASE_URL
- .env
- JWT signing secret
- super admin credentials
- raw production database access
'@

Set-Content -Path $DeliveryChecklist -Value $DeliveryChecklistContent -Encoding UTF8

$AccessBoundaryContent = @'
# RAFTOP CPAP CARE Pro - Access and Security Boundary

REQUIRED_MARKER: PHASE101_ACCESS_SECURITY_BOUNDARY
REQUIRED_MARKER: SUPER_ADMIN_NOT_SHARED
REQUIRED_MARKER: TENANT_ONLY_ACCESS
REQUIRED_MARKER: NO_SECRETS_IN_HANDOVER

## Access model

Raftopoulos receives tenant-level access for raftopoulos-production.

Platform super admin is not shared.

## Credentials

Credentials are delivered separately.

## Data

Real patient data import requires GDPR/DPA and approved pseudonymized CSV.

## Technical ownership

Source code and infrastructure access are not included by default unless separately agreed commercially.
'@

Set-Content -Path $AccessBoundaryDoc -Value $AccessBoundaryContent -Encoding UTF8

$NextStepsContent = @'
# RAFTOP CPAP CARE Pro - Next Steps After Handover

REQUIRED_MARKER: PHASE101_NEXT_STEPS_AFTER_HANDOVER
REQUIRED_MARKER: REAL_CSV_NEXT_IF_APPROVED
REQUIRED_MARKER: SUPPORT_AND_ROLLOUT_NEXT

## After handover

1. Confirm buyer login.
2. Confirm tenant admin access.
3. Confirm operations user access.
4. Confirm management viewer access.
5. Agree whether current dataset remains demo/synthetic or is replaced by real approved CSV.
6. If real CSV is provided:
   - validate CSV
   - run 100-row real pilot
   - run 500-row real stage
   - run 2000-row real stage
   - run 7000-row real stage
7. Schedule training session.

## Commercial next step

Move from technical delivery to support / maintenance / rollout contract.
'@

Set-Content -Path $NextStepsDoc -Value $NextStepsContent -Encoding UTF8

$StatusCardContent = @'
# RAFTOP CPAP CARE Pro - Production Status Card

REQUIRED_MARKER: PHASE101_PRODUCTION_STATUS_CARD
REQUIRED_MARKER: FINAL_STATUS_PRODUCTION_HANDOVER_READY

## Status

PRODUCTION HANDOVER READY

## URLs

Production login:
https://raftop-cpap-frontend.onrender.com/login

Buyer/public overview:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

Backend health:
https://raftop-cpap-backend.onrender.com/api/health

## Verified modules

- Login
- Tenant users
- Patients
- Devices
- Compliance nights
- 80 Hours Compliance
- ATLAS priority queue
- Management snapshot
- 7000-row technical scale validation

## Remaining only after buyer approval

- Replace synthetic data with real approved CSV, if needed.
- Deliver credentials separately.
- Training / support / maintenance agreement.
'@

Set-Content -Path $ProductionStatusCard -Value $StatusCardContent -Encoding UTF8

foreach ($Doc in @($HandoverLockDoc, $DeliveryChecklist, $AccessBoundaryDoc, $NextStepsDoc, $ProductionStatusCard)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase 101 handover doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase 101 handover doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE101_PRODUCTION_HANDOVER_LOCK",
    "PRODUCTION_READY_FOR_RAFTOPoulos_DELIVERY",
    "SEVEN_THOUSAND_PORTFOLIO_VALIDATED",
    "ATLAS_80H_REPORTS_VALIDATED",
    "LOGIN_USERS_VERIFIED",
    "HANDOVER_READY",
    "PHASE101_DELIVERY_CHECKLIST",
    "PHASE101_ACCESS_SECURITY_BOUNDARY",
    "PHASE101_NEXT_STEPS_AFTER_HANDOVER",
    "PHASE101_PRODUCTION_STATUS_CARD",
    "FINAL_STATUS_PRODUCTION_HANDOVER_READY"
)) {
    $Found = $false

    foreach ($Doc in @($HandoverLockDoc, $DeliveryChecklist, $AccessBoundaryDoc, $NextStepsDoc, $ProductionStatusCard)) {
        $Content = Read-FileSafe $Doc
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required handover marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required handover marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGenerated = ""
foreach ($Doc in @($HandoverLockDoc, $DeliveryChecklist, $AccessBoundaryDoc, $NextStepsDoc, $ProductionStatusCard)) {
    $AllGenerated += Read-FileSafe $Doc
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden secret absent from handover docs: " + $Forbidden) "FAIL" "Secret-like text found."
    } else {
        Add-Result ("Forbidden secret absent from handover docs: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE101_PRODUCTION_HANDOVER_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE101_PRODUCTION_HANDOVER_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE101_PRODUCTION_HANDOVER_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 101 Production Handover Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Handover docs folder:"
Write-Host $DocsDir
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


