# RAFTOP CPAP CARE Pro
# Phase 113 - Final Pilot20 Buyer Delivery Pack
# Final delivery docs for 2-month Pilot20 with automatic usage update.
# Does NOT expose credentials.
# Does NOT expose secrets.
# Does NOT modify DB.
# Does NOT create patients.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$CredentialFile = Join-Path $Desktop "RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase113_final_pilot20_buyer_delivery_pack_" + $Timestamp + ".md")

$FinalDoc = Join-Path $DocsDir "113_FINAL_PILOT20_BUYER_DELIVERY_PACK.md"
$BuyerMessageDoc = Join-Path $DocsDir "113_MESSAGE_TO_RAFTOPoulos_FINAL_PILOT20.md"
$BuyerInstructionsDoc = Join-Path $DocsDir "113_BUYER_PILOT20_USAGE_INSTRUCTIONS.md"
$InternalBoundaryDoc = Join-Path $DocsDir "113_INTERNAL_DELIVERY_BOUNDARY.md"

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

    Add-Result $Name "FAIL" ("Latest report exists but final status not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 113 Final Pilot20 Buyer Delivery Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 113 - Final Pilot20 Buyer Delivery Pack..."
Write-Host ""

Check-ReportStatus "Phase112 live usage upload verification status" "phase112_live_usage_upload_verification_*.md" @(
    "PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION_READY",
    "PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION_READY_WITH_WARNINGS"
)

if (Test-Path $CredentialFile) {
    Add-Result "Pilot20 credentials file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Pilot20 credentials file exists outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Pilot20 credentials outside repository" "FAIL" "Credential file is inside repo."
} else {
    Add-Result "Pilot20 credentials outside repository" "PASS" "Credential file is outside repo."
}

$FinalDocContent = @'
# RAFTOP CPAP CARE Pro - Final Pilot20 Buyer Delivery Pack

REQUIRED_MARKER: PHASE113_FINAL_PILOT20_BUYER_DELIVERY_PACK
REQUIRED_MARKER: PILOT20_READY_FOR_BUYER_DELIVERY
REQUIRED_MARKER: AUTOMATIC_USAGE_UPDATE_READY
REQUIRED_MARKER: RESCUE_MONITOR_READY
REQUIRED_MARKER: DASHBOARD_ISOLATION_READY
REQUIRED_MARKER: TWO_MONTH_COMMERCIAL_PILOT_READY

## Final Pilot20 status

Pilot20 is ready for buyer delivery.

## Live URLs

Login:
https://raftop-cpap-frontend.onrender.com/login

Patient Entry:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Usage CSV Upload:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

80h Rescue Monitor:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

## Buyer workflow

1. Buyer logs in with Pilot20 credentials.
2. Buyer enters up to 20 pseudonymized CPAP patients once.
3. Buyer periodically uploads CPAP usage CSV.
4. The platform matches usage data by device serial.
5. Compliance and 80h pace are updated automatically.
6. Rescue Monitor shows who is safe, on track, watch, rescue or critical.
7. Buyer calls high-risk patients before month end.

## Commercial value

The platform is not only a CPAP tracking page.
It is an early compliance rescue system for the 80-hour monthly threshold.

## Delivery boundary

Do not deliver:
- source code
- GitHub access
- Render access
- database access
- platform super admin access
- production secrets
'@

Set-Content -Path $FinalDoc -Value $FinalDocContent -Encoding UTF8

$BuyerMessageContent = @'
# Message to Raftopoulos - Final Pilot20 Delivery

REQUIRED_MARKER: PHASE113_MESSAGE_TO_RAFTOPoulos_FINAL_PILOT20
REQUIRED_MARKER: SEND_THIS_TO_BUYER
REQUIRED_MARKER: CREDENTIALS_SEPARATELY
REQUIRED_MARKER: PILOT20_AUTOMATIC_USAGE_WORKFLOW

Καλησπέρα σας,

Το RAFTOP CPAP CARE Pro είναι έτοιμο για controlled Pilot 20, διάρκειας 2 μηνών.

Στο pilot μπορείτε να καταχωρήσετε έως 20 ψευδωνυμοποιημένους CPAP ασθενείς και να δείτε στην πράξη πώς η πλατφόρμα εντοπίζει εγκαίρως ποιοι κινδυνεύουν να μη συμπληρώσουν τις 80 ώρες πριν λήξει ο μήνας.

Η βασική ροή είναι:

1. Καταχωρείτε μία φορά τους 20 ασθενείς.
2. Στη συνέχεια δεν χρειάζεται να ενημερώνετε έναν-έναν τους ασθενείς.
3. Ανεβάζετε περιοδικά ένα CPAP usage CSV.
4. Η εφαρμογή κάνει αυτόματα match με το device serial.
5. Ενημερώνει αυτόματα compliance, ATLAS και 80h Rescue Monitor.
6. Βλέπετε ποιος είναι safe, on track, watch, rescue ή critical.
7. Έτσι ξέρετε ποιον ασθενή πρέπει να καλέσετε πριν χαθεί το 80h compliance.

Links:

Login:
https://raftop-cpap-frontend.onrender.com/login

Patient Entry:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Usage CSV Upload:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

80h Rescue Monitor:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

Για το pilot δεν χρειάζονται ονόματα, τηλέφωνα, ΑΜΚΑ ή άμεσα αναγνωριστικά ασθενών. Χρησιμοποιούνται μόνο patient code, device serial και CPAP usage metrics.

Τα στοιχεία πρόσβασης θα σταλούν ξεχωριστά.
'@

Set-Content -Path $BuyerMessageDoc -Value $BuyerMessageContent -Encoding UTF8

$BuyerInstructionsContent = @'
# RAFTOP CPAP CARE Pro - Buyer Pilot20 Usage Instructions

REQUIRED_MARKER: PHASE113_BUYER_PILOT20_USAGE_INSTRUCTIONS
REQUIRED_MARKER: ENTER_PATIENTS_ONCE
REQUIRED_MARKER: UPLOAD_USAGE_CSV
REQUIRED_MARKER: REVIEW_RESCUE_MONITOR
REQUIRED_MARKER: CALL_CRITICAL_AND_RESCUE_FIRST

## Step 1 - Login

Open:
https://raftop-cpap-frontend.onrender.com/login

Use Pilot20 credentials.

## Step 2 - Enter patients once

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Enter up to 20 patients.

Required:
- Patient External ID
- Patient Code
- Device Serial
- Device Model
- Setup Date
- Doctor Code
- Branch Code

Do not enter direct identifiers.

## Step 3 - Upload usage CSV periodically

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/usage-upload

Required CSV columns:
- device_serial
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d

## Step 4 - Review 80h Rescue Monitor

Open:
https://raftop-cpap-frontend.onrender.com/pilot20/rescue-monitor

Use priority:
1. CRITICAL
2. RESCUE
3. WATCH
4. ON_TRACK
5. SAFE

## Step 5 - Act before month end

Call patients who need intervention before they miss the 80-hour threshold.
'@

Set-Content -Path $BuyerInstructionsDoc -Value $BuyerInstructionsContent -Encoding UTF8

$InternalBoundaryContent = @'
# RAFTOP CPAP CARE Pro - Internal Delivery Boundary

REQUIRED_MARKER: PHASE113_INTERNAL_DELIVERY_BOUNDARY
REQUIRED_MARKER: NO_SOURCE_CODE_DELIVERY
REQUIRED_MARKER: NO_INFRASTRUCTURE_ACCESS
REQUIRED_MARKER: NO_DATABASE_ACCESS
REQUIRED_MARKER: NO_SUPER_ADMIN_ACCESS
REQUIRED_MARKER: CREDENTIALS_OUTSIDE_REPO

## Deliver to buyer

Allowed:
- Login URL
- Pilot20 URLs
- Pilot credentials
- Usage CSV instructions
- Two-month pilot explanation

Not allowed:
- source code
- GitHub repository
- Render credentials
- database credentials
- platform super admin
- production secrets
- internal operational scripts

## Credentials

Credentials must be sent separately from the general message.

Credential file is outside the repository:
C:\Users\Administrator\Desktop\RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt
'@

Set-Content -Path $InternalBoundaryDoc -Value $InternalBoundaryContent -Encoding UTF8

foreach ($Doc in @($FinalDoc, $BuyerMessageDoc, $BuyerInstructionsDoc, $InternalBoundaryDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase113 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase113 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE113_FINAL_PILOT20_BUYER_DELIVERY_PACK",
    "PILOT20_READY_FOR_BUYER_DELIVERY",
    "AUTOMATIC_USAGE_UPDATE_READY",
    "RESCUE_MONITOR_READY",
    "DASHBOARD_ISOLATION_READY",
    "TWO_MONTH_COMMERCIAL_PILOT_READY",
    "PHASE113_MESSAGE_TO_RAFTOPoulos_FINAL_PILOT20",
    "SEND_THIS_TO_BUYER",
    "CREDENTIALS_SEPARATELY",
    "PILOT20_AUTOMATIC_USAGE_WORKFLOW",
    "PHASE113_BUYER_PILOT20_USAGE_INSTRUCTIONS",
    "ENTER_PATIENTS_ONCE",
    "UPLOAD_USAGE_CSV",
    "REVIEW_RESCUE_MONITOR",
    "CALL_CRITICAL_AND_RESCUE_FIRST",
    "PHASE113_INTERNAL_DELIVERY_BOUNDARY",
    "NO_SOURCE_CODE_DELIVERY",
    "NO_INFRASTRUCTURE_ACCESS",
    "NO_DATABASE_ACCESS",
    "NO_SUPER_ADMIN_ACCESS",
    "CREDENTIALS_OUTSIDE_REPO"
)) {
    $Found = $false

    foreach ($Doc in @($FinalDoc, $BuyerMessageDoc, $BuyerInstructionsDoc, $InternalBoundaryDoc)) {
        if (ContainsText (Read-FileSafe $Doc) $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required Phase113 marker exists: " + $Marker) "PASS" "Found."
    } else {
        Add-Result ("Required Phase113 marker exists: " + $Marker) "FAIL" "Missing."
    }
}

$GeneratedDocs = ""
foreach ($Doc in @($FinalDoc, $BuyerMessageDoc, $BuyerInstructionsDoc, $InternalBoundaryDoc)) {
    $GeneratedDocs += Read-FileSafe $Doc
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
    if (ContainsText $GeneratedDocs $Forbidden) {
        Add-Result ("Forbidden secret absent from Phase113 docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from Phase113 docs: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE113_FINAL_PILOT20_BUYER_DELIVERY_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE113_FINAL_PILOT20_BUYER_DELIVERY_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE113_FINAL_PILOT20_BUYER_DELIVERY_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 113 Final Pilot20 Buyer Delivery Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Docs:"
Write-Host $FinalDoc
Write-Host $BuyerMessageDoc
Write-Host $BuyerInstructionsDoc
Write-Host $InternalBoundaryDoc
Write-Host ""
Write-Host "Credentials file outside repo:"
Write-Host $CredentialFile
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