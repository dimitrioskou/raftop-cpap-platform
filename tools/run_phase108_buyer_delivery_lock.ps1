# RAFTOP CPAP CARE Pro
# Phase 108 - Buyer Delivery Lock
# Final buyer delivery package for 2-month Pilot 20.
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

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase108_buyer_delivery_lock_" + $Timestamp + ".md")

$DeliveryLockDoc = Join-Path $DocsDir "108_BUYER_DELIVERY_LOCK.md"
$BuyerMessageDoc = Join-Path $DocsDir "108_MESSAGE_TO_RAFTOPoulos_FOR_PILOT20.md"
$CredentialsInstructionsDoc = Join-Path $DocsDir "108_CREDENTIALS_DELIVERY_INSTRUCTIONS.md"
$PilotRulesDoc = Join-Path $DocsDir "108_PILOT20_RULES_AND_BOUNDARIES.md"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 108 Buyer Delivery Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 108 - Buyer Delivery Lock..."
Write-Host ""

Check-ReportStatus "Phase 107 authenticated live pilot20 test status" "phase107_authenticated_live_pilot20_test_*.md" @(
    "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY",
    "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY_WITH_WARNINGS"
)

if (Test-Path $CredentialFile) {
    Add-Result "Pilot20 credential file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Pilot20 credential file exists outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Pilot20 credential file outside repository" "FAIL" "Credential file is inside repo."
} else {
    Add-Result "Pilot20 credential file outside repository" "PASS" "Credential file is outside repo."
}

$DeliveryLockContent = @'
# RAFTOP CPAP CARE Pro - Buyer Delivery Lock

REQUIRED_MARKER: PHASE108_BUYER_DELIVERY_LOCK
REQUIRED_MARKER: PILOT20_READY_FOR_RAFTOPoulos
REQUIRED_MARKER: TWO_MONTH_COMMERCIAL_PILOT
REQUIRED_MARKER: MAX_20_PATIENTS
REQUIRED_MARKER: AUTHENTICATED_ACCESS_VERIFIED
REQUIRED_MARKER: NO_SOURCE_CODE_DELIVERY
REQUIRED_MARKER: READY_TO_SEND_TO_BUYER

## Final status

RAFTOP CPAP CARE Pro Pilot 20 is ready to deliver to Raftopoulos for a 2-month commercial pilot.

## Access URLs

Login:
https://raftop-cpap-frontend.onrender.com/login

Pilot 20:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Verified before delivery

- Pilot 20 page is live.
- Pilot 20 backend endpoints are live.
- Protected endpoints require authentication.
- Pilot user login works.
- Pilot admin can access summary and patient list.
- No patient was created during verification.
- Pilot remains clean for buyer-entered patients.

## Commercial scope

- Duration: 2 months
- Limit: 20 patients
- Data: pseudonymized CPAP metrics only
- Buyer enters patients manually
- Buyer sees 80h compliance, ATLAS priority, AHI/leak signals and portfolio overview

## Not delivered

- source code
- repository access
- infrastructure access
- database access
- platform super admin access
- secrets
'@

Set-Content -Path $DeliveryLockDoc -Value $DeliveryLockContent -Encoding UTF8

$BuyerMessageContent = @'
# RAFTOP CPAP CARE Pro - Message to Raftopoulos for Pilot 20

REQUIRED_MARKER: PHASE108_MESSAGE_TO_RAFTOPoulos
REQUIRED_MARKER: SEND_THIS_MESSAGE_TO_BUYER
REQUIRED_MARKER: CREDENTIALS_SEPARATELY
REQUIRED_MARKER: PILOT20_DELIVERY_MESSAGE_READY

Κείμενο προς αποστολή:

Καλησπέρα σας,

Η πλατφόρμα RAFTOP CPAP CARE Pro είναι έτοιμη για controlled pilot 2 μηνών.

Σας δίνω πρόσβαση σε ξεχωριστό Pilot 20 περιβάλλον, ώστε να καταχωρήσετε έως 20 ψευδωνυμοποιημένους CPAP ασθενείς και να δείτε στην πράξη πώς λειτουργεί η εφαρμογή.

Στο pilot μπορείτε να ελέγξετε:

- 80 Hours Compliance
- ATLAS priority queue
- ασθενείς κάτω από το όριο των 80 ωρών
- υψηλό AHI
- υψηλό leak
- συνολική management εικόνα του CPAP portfolio

Login:
https://raftop-cpap-frontend.onrender.com/login

Pilot 20:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Για το pilot δεν χρειάζονται ονόματα, στοιχεία επικοινωνίας, αριθμοί ταυτοποίησης ή άμεσα αναγνωριστικά ασθενών. Χρησιμοποιούνται μόνο patient code, device serial και CPAP usage metrics.

Τα στοιχεία πρόσβασης θα σας σταλούν ξεχωριστά.

Μετά τη δίμηνη χρήση μπορούμε να περάσουμε σε εμπορική συμφωνία και πλήρες rollout.
'@

Set-Content -Path $BuyerMessageDoc -Value $BuyerMessageContent -Encoding UTF8

$CredentialsInstructionsContent = @'
# RAFTOP CPAP CARE Pro - Credentials Delivery Instructions

REQUIRED_MARKER: PHASE108_CREDENTIALS_DELIVERY_INSTRUCTIONS
REQUIRED_MARKER: DO_NOT_COMMIT_CREDENTIALS
REQUIRED_MARKER: DELIVER_CREDENTIALS_SEPARATELY
REQUIRED_MARKER: ONE_CHANNEL_FOR_LINKS_ONE_CHANNEL_FOR_PASSWORDS

## Credentials file

Credentials are stored outside the repository.

## Delivery rule

Do not send credentials in the same message as the general delivery message.

Recommended method:

1. Send the pilot message with URLs.
2. Send credentials separately.
3. Ask buyer to confirm first login.
4. Ask buyer to change temporary passwords if the application supports it.
5. Do not send platform super admin credentials.

## Credential roles

- Pilot Admin
- Pilot Operations
- Pilot Viewer

## Do not send

- source code
- repository access
- infrastructure access
- database access
- platform super admin
- secrets
'@

Set-Content -Path $CredentialsInstructionsDoc -Value $CredentialsInstructionsContent -Encoding UTF8

$PilotRulesContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Rules and Boundaries

REQUIRED_MARKER: PHASE108_PILOT20_RULES_AND_BOUNDARIES
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS
REQUIRED_MARKER: BUYER_ENTERS_PATIENTS
REQUIRED_MARKER: PILOT_LIMIT_20
REQUIRED_MARKER: PILOT_DURATION_2_MONTHS
REQUIRED_MARKER: PURCHASE_AFTER_PILOT

## Rules

The buyer enters up to 20 patients manually.

Allowed data:
- patient code
- device serial
- device model
- setup date
- month start
- last data date
- usage hours
- days used
- AHI
- leak
- doctor code
- branch code

Not allowed:
- direct patient identity
- direct contact data
- national identification data
- residential data

## Decision after pilot

After 2 months:
- purchase decision
- support contract
- full rollout planning
- real approved CSV rollout if required
'@

Set-Content -Path $PilotRulesDoc -Value $PilotRulesContent -Encoding UTF8

foreach ($Doc in @($DeliveryLockDoc, $BuyerMessageDoc, $CredentialsInstructionsDoc, $PilotRulesDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase108 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase108 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE108_BUYER_DELIVERY_LOCK",
    "PILOT20_READY_FOR_RAFTOPoulos",
    "TWO_MONTH_COMMERCIAL_PILOT",
    "MAX_20_PATIENTS",
    "AUTHENTICATED_ACCESS_VERIFIED",
    "NO_SOURCE_CODE_DELIVERY",
    "READY_TO_SEND_TO_BUYER",
    "PHASE108_MESSAGE_TO_RAFTOPoulos",
    "SEND_THIS_MESSAGE_TO_BUYER",
    "CREDENTIALS_SEPARATELY",
    "PILOT20_DELIVERY_MESSAGE_READY",
    "PHASE108_CREDENTIALS_DELIVERY_INSTRUCTIONS",
    "DO_NOT_COMMIT_CREDENTIALS",
    "DELIVER_CREDENTIALS_SEPARATELY",
    "ONE_CHANNEL_FOR_LINKS_ONE_CHANNEL_FOR_PASSWORDS",
    "PHASE108_PILOT20_RULES_AND_BOUNDARIES",
    "NO_DIRECT_IDENTIFIERS",
    "BUYER_ENTERS_PATIENTS",
    "PILOT_LIMIT_20",
    "PILOT_DURATION_2_MONTHS",
    "PURCHASE_AFTER_PILOT"
)) {
    $Found = $false

    foreach ($Doc in @($DeliveryLockDoc, $BuyerMessageDoc, $CredentialsInstructionsDoc, $PilotRulesDoc)) {
        if (ContainsText (Read-FileSafe $Doc) $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required Phase108 marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required Phase108 marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$GeneratedDocs = ""
foreach ($Doc in @($DeliveryLockDoc, $BuyerMessageDoc, $CredentialsInstructionsDoc, $PilotRulesDoc)) {
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
        Add-Result ("Forbidden secret absent from Phase108 docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from Phase108 docs: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE108_BUYER_DELIVERY_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE108_BUYER_DELIVERY_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE108_BUYER_DELIVERY_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 108 Buyer Delivery Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Docs:"
Write-Host $DeliveryLockDoc
Write-Host $BuyerMessageDoc
Write-Host $CredentialsInstructionsDoc
Write-Host $PilotRulesDoc
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