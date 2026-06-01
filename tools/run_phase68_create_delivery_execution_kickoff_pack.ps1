# RAFTOP CPAP CARE Pro
# Phase 68 - Delivery Execution and Kickoff Scheduling Pack
# ASCII-safe version.
# Safe: creates client-facing delivery execution docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ExecutionDir = Join-Path $DocsRoot "client-delivery-execution"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ExecutionDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase68_delivery_execution_kickoff_pack_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param([string]$Name, [string]$Status, [string]$Details)

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Write-Doc {
    param([string]$FileName, [string[]]$Lines)

    $Path = Join-Path $ExecutionDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 68 Delivery Execution and Kickoff Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 68 Delivery Execution and Kickoff Pack..."
Write-Host ""

Write-Doc "01_DELIVERY_EXECUTION_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Delivery Execution Checklist",
    "",
    "Purpose:",
    "",
    "Use this checklist when sending RAFTOP_CLIENT_START_PACK_v1.0.zip to Raftopoulos.",
    "",
    "Before sending:",
    "",
    "- confirm final ZIP exists",
    "- confirm file name: RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "- confirm delivery email text",
    "- confirm no credentials are inside ZIP",
    "- confirm no source code is attached",
    "- confirm no GitHub link is sent",
    "- confirm no .env or secrets are sent",
    "",
    "Send:",
    "",
    "- delivery email",
    "- RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Do not send:",
    "",
    "- source code",
    "- GitHub repo",
    "- backend/frontend folders",
    "- tools",
    "- reports",
    "- database URLs",
    "- Render settings",
    "- GitHub secrets",
    "- passwords",
    "",
    "After sending:",
    "",
    "- record sent date",
    "- record sent time",
    "- record recipient",
    "- request receipt confirmation",
    "- propose kickoff date",
    "",
    "Success condition:",
    "",
    "Client confirms receipt and kickoff is scheduled."
)

Write-Doc "02_CLIENT_RECEIPT_TRACKER.md" @(
    "# RAFTOP CPAP CARE Pro - Client Receipt Tracker",
    "",
    "Delivery package:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Delivery record:",
    "",
    "- sent date:",
    "- sent time:",
    "- sent by:",
    "- sent to:",
    "- delivery channel:",
    "- attachment name:",
    "- file version:",
    "- receipt confirmed: yes/no",
    "- receipt confirmed by:",
    "- receipt confirmation date:",
    "- notes:",
    "",
    "Receipt confirmation required:",
    "",
    "The buyer must confirm that the package was received and that 00_START_HERE.md will be opened first.",
    "",
    "If no receipt confirmation:",
    "",
    "- follow up within 24 hours",
    "- do not send credentials yet",
    "- do not proceed to access setup until recipient is confirmed",
    "",
    "Rule:",
    "",
    "No credentials before receipt confirmation."
)

Write-Doc "03_KICKOFF_SCHEDULING_MESSAGE.md" @(
    "# RAFTOP CPAP CARE Pro - Kickoff Scheduling Message",
    "",
    "Use this after sending the ZIP.",
    "",
    "Message:",
    "",
    "Good evening.",
    "",
    "The RAFTOP CPAP CARE Pro - Client Start Pack v1.0 has been sent.",
    "",
    "The next step is a 60 minute kickoff so we can confirm users, roles, credential delivery method, data boundary, first data sample, and the first operational review date.",
    "",
    "Required attendees:",
    "",
    "- buyer sponsor",
    "- operations owner",
    "- technical/data contact",
    "- platform owner",
    "",
    "Please confirm which day/time works best for the kickoff.",
    "",
    "Important:",
    "",
    "Credentials will be delivered separately after receipt confirmation and named user confirmation."
)

Write-Doc "04_KICKOFF_BOOKING_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Kickoff Booking Checklist",
    "",
    "Before booking kickoff, confirm:",
    "",
    "- buyer received ZIP",
    "- buyer opened 00_START_HERE.md",
    "- buyer sponsor identified",
    "- operations owner identified",
    "- technical/data contact identified",
    "- first user list requested",
    "- credential delivery channel agreed",
    "- data boundary discussion scheduled",
    "",
    "Kickoff meeting details:",
    "",
    "- date:",
    "- time:",
    "- duration: 60 minutes",
    "- channel:",
    "- attendees:",
    "- agenda sent: yes/no",
    "",
    "Kickoff agenda:",
    "",
    "0-10 min: confirm delivery and scope.",
    "10-20 min: confirm users and roles.",
    "20-30 min: confirm credential delivery method.",
    "30-40 min: confirm data boundary and first data sample.",
    "40-50 min: confirm first workflow.",
    "50-60 min: confirm first review date and blockers.",
    "",
    "Success condition:",
    "",
    "Kickoff date is confirmed and all required attendees are invited."
)

Write-Doc "05_FIRST_USERS_REQUEST_FORM.md" @(
    "# RAFTOP CPAP CARE Pro - First Users Request Form",
    "",
    "Purpose:",
    "",
    "Collect the first users before credentials are created or delivered.",
    "",
    "Required first users:",
    "",
    "1. Buyer Admin",
    "",
    "- full name:",
    "- email:",
    "- phone if needed:",
    "- role confirmed: yes/no",
    "",
    "2. CPAP Operations User",
    "",
    "- full name:",
    "- email:",
    "- phone if needed:",
    "- role confirmed: yes/no",
    "",
    "3. Management Viewer",
    "",
    "- full name:",
    "- email:",
    "- phone if needed:",
    "- role confirmed: yes/no",
    "",
    "4. Technical/Data Contact",
    "",
    "- full name:",
    "- email:",
    "- phone if needed:",
    "- role confirmed: yes/no",
    "",
    "Access rule:",
    "",
    "Do not create shared generic accounts for multiple people.",
    "",
    "Security rule:",
    "",
    "Do not send credentials until named users and delivery channel are confirmed."
)

Write-Doc "06_CREDENTIAL_CHANNEL_CONFIRMATION.md" @(
    "# RAFTOP CPAP CARE Pro - Credential Channel Confirmation",
    "",
    "Purpose:",
    "",
    "Confirm how credentials will be delivered separately from the ZIP.",
    "",
    "Allowed credential delivery options:",
    "",
    "- direct phone confirmation plus separate temporary password delivery",
    "- separate controlled email per user",
    "- secure password manager if available",
    "- agreed controlled channel",
    "",
    "Not allowed:",
    "",
    "- credentials inside ZIP",
    "- credentials in same email as ZIP",
    "- credentials in group chat",
    "- one shared account for all users",
    "- database credentials",
    "- Render secrets",
    "- GitHub secrets",
    "",
    "Credential delivery record:",
    "",
    "- user:",
    "- role:",
    "- username/email:",
    "- delivery channel:",
    "- delivery date:",
    "- first login tested: yes/no",
    "- password change requested: yes/no",
    "",
    "Rule:",
    "",
    "ZIP first. Receipt second. Named users third. Credentials fourth. Login test fifth."
)

Write-Doc "07_FIRST_OPERATIONAL_REVIEW_BOOKING.md" @(
    "# RAFTOP CPAP CARE Pro - First Operational Review Booking",
    "",
    "Purpose:",
    "",
    "Do not stop at kickoff. Book the first operational review immediately.",
    "",
    "First operational review should cover:",
    "",
    "- user access status",
    "- first data sample status",
    "- no-data examples",
    "- compliance risk examples",
    "- ATLAS action examples",
    "- support issues",
    "- blockers",
    "- next actions",
    "",
    "Recommended timing:",
    "",
    "3 to 7 days after kickoff.",
    "",
    "Review booking fields:",
    "",
    "- date:",
    "- time:",
    "- attendees:",
    "- data sample ready: yes/no",
    "- ATLAS examples ready: yes/no",
    "- blocker list ready: yes/no",
    "",
    "Success condition:",
    "",
    "First operational review is booked before the kickoff ends."
)

Write-Doc "08_DELIVERY_EXECUTION_PACK_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Delivery Execution and Kickoff Pack Index",
    "",
    "This folder contains the delivery execution and kickoff scheduling pack.",
    "",
    "Documents:",
    "",
    "01_DELIVERY_EXECUTION_CHECKLIST.md",
    "02_CLIENT_RECEIPT_TRACKER.md",
    "03_KICKOFF_SCHEDULING_MESSAGE.md",
    "04_KICKOFF_BOOKING_CHECKLIST.md",
    "05_FIRST_USERS_REQUEST_FORM.md",
    "06_CREDENTIAL_CHANNEL_CONFIRMATION.md",
    "07_FIRST_OPERATIONAL_REVIEW_BOOKING.md",
    "08_DELIVERY_EXECUTION_PACK_INDEX.md",
    "",
    "First document to use:",
    "",
    "01_DELIVERY_EXECUTION_CHECKLIST.md",
    "",
    "Core rule:",
    "",
    "Do not deliver credentials before receipt confirmation, named user confirmation, and agreed credential channel."
)

Write-Host ""
Write-Host "Verifying delivery execution and kickoff pack..."
Write-Host ""

$RequiredDocs = @{
    "01_DELIVERY_EXECUTION_CHECKLIST.md" = @("Delivery Execution Checklist", "RAFTOP_CLIENT_START_PACK_v1.0.zip", "No credentials")
    "02_CLIENT_RECEIPT_TRACKER.md" = @("Client Receipt Tracker", "receipt confirmed", "No credentials before receipt confirmation")
    "03_KICKOFF_SCHEDULING_MESSAGE.md" = @("Kickoff Scheduling Message", "60 minute kickoff", "Credentials will be delivered separately")
    "04_KICKOFF_BOOKING_CHECKLIST.md" = @("Kickoff Booking Checklist", "required attendees", "Kickoff date is confirmed")
    "05_FIRST_USERS_REQUEST_FORM.md" = @("First Users Request Form", "Buyer Admin", "Do not create shared generic accounts")
    "06_CREDENTIAL_CHANNEL_CONFIRMATION.md" = @("Credential Channel Confirmation", "ZIP first", "Login test fifth")
    "07_FIRST_OPERATIONAL_REVIEW_BOOKING.md" = @("First Operational Review", "3 to 7 days", "booked before the kickoff ends")
    "08_DELIVERY_EXECUTION_PACK_INDEX.md" = @("Delivery Execution", "First document to use", "Do not deliver credentials")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $ExecutionDir $Doc

    if (Test-Path $Path) {
        Add-Result ("Document exists: " + $Doc) "PASS" "Document exists."
        $Content = Get-Content -Path $Path -Raw

        foreach ($Marker in $RequiredDocs[$Doc]) {
            if ($Content.IndexOf($Marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                Add-Result ("Marker in " + $Doc + ": " + $Marker) "PASS" "Marker found."
            } else {
                Add-Result ("Marker in " + $Doc + ": " + $Marker) "FAIL" "Marker missing."
            }
        }
    } else {
        Add-Result ("Document exists: " + $Doc) "FAIL" "Document missing."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE68_DELIVERY_EXECUTION_KICKOFF_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE68_DELIVERY_EXECUTION_KICKOFF_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE68_DELIVERY_EXECUTION_KICKOFF_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 68 Delivery Execution and Kickoff Pack"
Write-Host "============================================================"
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