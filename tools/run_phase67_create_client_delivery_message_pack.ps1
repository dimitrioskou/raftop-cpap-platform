# RAFTOP CPAP CARE Pro
# Phase 67 - Client Delivery Message and Handover Email Pack
# ASCII-safe version.
# Safe: creates client-facing delivery message docs only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$DeliveryMessageDir = Join-Path $DocsRoot "client-delivery-message"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryMessageDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase67_client_delivery_message_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $DeliveryMessageDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 67 Client Delivery Message Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 67 Client Delivery Message Pack..."
Write-Host ""

Write-Doc "01_CLIENT_DELIVERY_EMAIL.md" @(
    "# RAFTOP CPAP CARE Pro - Client Delivery Email",
    "",
    "Subject:",
    "",
    "RAFTOP CPAP CARE Pro - Client Start Pack v1.0",
    "",
    "Email:",
    "",
    "Good evening,",
    "",
    "I am sending the RAFTOP CPAP CARE Pro - Client Start Pack v1.0.",
    "",
    "The package includes the material required to start controlled platform use: access guidance, tenant activation, data intake template, onboarding runbook, support/SLA/change request boundaries, and resale launch kit for future doctor/clinic use.",
    "",
    "The first file to open is:",
    "",
    "00_START_HERE.md",
    "",
    "Important:",
    "",
    "This package does not include credentials, source code, GitHub access, database credentials, secrets, or internal scripts.",
    "",
    "Credentials must be delivered separately through a controlled channel.",
    "",
    "Recommended next step:",
    "",
    "Schedule a 60 minute kickoff to confirm users, roles, data boundary, first data sample, and first operational review date.",
    "",
    "Best regards,",
    "Dimitris"
)

Write-Doc "02_SHORT_DELIVERY_MESSAGE.md" @(
    "# RAFTOP CPAP CARE Pro - Short Delivery Message",
    "",
    "Use this for WhatsApp/Viber/SMS after email delivery.",
    "",
    "Message:",
    "",
    "Good evening. I have sent the RAFTOP CPAP CARE Pro - Client Start Pack v1.0.",
    "",
    "Please open 00_START_HERE.md first.",
    "",
    "The ZIP contains the usage start pack, onboarding material, data template, support boundaries, and resale launch kit.",
    "",
    "It does not contain credentials or source code. Credentials will be delivered separately through a controlled channel.",
    "",
    "Next step: schedule a 60 minute kickoff for users, roles, data boundary, sample data, and first operational review."
)

Write-Doc "03_DELIVERY_ATTACHMENT_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - Delivery Attachment Rules",
    "",
    "Attach only:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Do not attach:",
    "",
    "- GitHub repository",
    "- source code",
    "- enterprise-backend",
    "- enterprise-frontend",
    "- tools",
    "- reports",
    "- .env files",
    "- credentials",
    "- database URLs",
    "- Render settings",
    "- GitHub secrets",
    "- raw logs",
    "- backup folders",
    "",
    "Credential rule:",
    "",
    "Credentials must never be sent inside the same ZIP or same public thread.",
    "",
    "Security rule:",
    "",
    "Client delivery is controlled usage handover, not source-code handover."
)

Write-Doc "04_HANDOVER_CALL_AGENDA.md" @(
    "# RAFTOP CPAP CARE Pro - Handover Call Agenda",
    "",
    "Duration:",
    "",
    "60 minutes.",
    "",
    "Required attendees:",
    "",
    "- buyer sponsor",
    "- operations owner",
    "- technical/data contact",
    "- platform owner",
    "",
    "Agenda:",
    "",
    "0-10 min: confirm delivery package received.",
    "10-20 min: confirm first users and roles.",
    "20-30 min: confirm credential delivery method.",
    "30-40 min: confirm data boundary and first data sample.",
    "40-50 min: confirm first operational workflow.",
    "50-60 min: confirm blockers, support path, and first review date.",
    "",
    "Call outputs:",
    "",
    "- delivery acknowledged",
    "- kickoff complete",
    "- user list confirmed",
    "- data boundary confirmed",
    "- first review date confirmed",
    "- blocker list created",
    "",
    "Do not allow:",
    "",
    "- new feature negotiation inside handover call",
    "- source-code request without technical review boundary",
    "- credentials sent in open chat",
    "- real patient data without legal/data protection framework"
)

Write-Doc "05_CLIENT_RECEIPT_CONFIRMATION.md" @(
    "# RAFTOP CPAP CARE Pro - Client Receipt Confirmation",
    "",
    "Use this text to confirm receipt.",
    "",
    "Receipt confirmation text:",
    "",
    "We confirm receipt of RAFTOP_CLIENT_START_PACK_v1.0.zip.",
    "",
    "We understand that this package is the client-facing start pack for controlled use of RAFTOP CPAP CARE Pro and does not include credentials, source code, GitHub access, database credentials, secrets, or internal scripts.",
    "",
    "We agree that credentials will be delivered separately through a controlled channel.",
    "",
    "We agree that the next step is a 60 minute kickoff to confirm users, roles, data boundary, first data sample, and first operational review date.",
    "",
    "Fields:",
    "",
    "- company:",
    "- received by:",
    "- role:",
    "- date:",
    "- next kickoff date:",
    "- notes:"
)

Write-Doc "06_CREDENTIAL_DELIVERY_SEPARATION.md" @(
    "# RAFTOP CPAP CARE Pro - Credential Delivery Separation",
    "",
    "Purpose:",
    "",
    "Define how credentials are delivered after the client start pack.",
    "",
    "Rules:",
    "",
    "- do not include credentials in the ZIP",
    "- do not send passwords in the same email as the ZIP",
    "- do not send admin passwords in group chats",
    "- do not share one account across users",
    "- do not send database credentials",
    "- do not send Render or GitHub secrets",
    "",
    "Preferred flow:",
    "",
    "1. send client delivery ZIP",
    "2. confirm receipt",
    "3. confirm named users",
    "4. create or activate user accounts",
    "5. deliver credentials separately",
    "6. complete first login test",
    "7. request password change where applicable",
    "",
    "Rule:",
    "",
    "Delivery package first. Credentials second. Login test third."
)

Write-Doc "07_CLIENT_DELIVERY_MESSAGE_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Client Delivery Message Pack Index",
    "",
    "This folder contains the client delivery message and handover email pack.",
    "",
    "Documents:",
    "",
    "01_CLIENT_DELIVERY_EMAIL.md",
    "02_SHORT_DELIVERY_MESSAGE.md",
    "03_DELIVERY_ATTACHMENT_RULES.md",
    "04_HANDOVER_CALL_AGENDA.md",
    "05_CLIENT_RECEIPT_CONFIRMATION.md",
    "06_CREDENTIAL_DELIVERY_SEPARATION.md",
    "07_CLIENT_DELIVERY_MESSAGE_INDEX.md",
    "",
    "First document to use:",
    "",
    "01_CLIENT_DELIVERY_EMAIL.md",
    "",
    "Attachment:",
    "",
    "RAFTOP_CLIENT_START_PACK_v1.0.zip",
    "",
    "Core rule:",
    "",
    "Do not deliver credentials, source code, secrets, or internal scripts with the client start pack."
)

Write-Host ""
Write-Host "Verifying client delivery message pack..."
Write-Host ""

$RequiredDocs = @{
    "01_CLIENT_DELIVERY_EMAIL.md" = @("Client Delivery Email", "Client Start Pack v1.0", "Credentials must be delivered separately")
    "02_SHORT_DELIVERY_MESSAGE.md" = @("Short Delivery Message", "00_START_HERE.md", "source code")
    "03_DELIVERY_ATTACHMENT_RULES.md" = @("Delivery Attachment Rules", "Attach only", "not source-code handover")
    "04_HANDOVER_CALL_AGENDA.md" = @("Handover Call Agenda", "Required attendees", "first review date")
    "05_CLIENT_RECEIPT_CONFIRMATION.md" = @("Client Receipt Confirmation", "We confirm receipt", "controlled channel")
    "06_CREDENTIAL_DELIVERY_SEPARATION.md" = @("Credential Delivery Separation", "Delivery package first", "Login test third")
    "07_CLIENT_DELIVERY_MESSAGE_INDEX.md" = @("Client Delivery Message Pack Index", "First document to use", "RAFTOP_CLIENT_START_PACK_v1.0.zip")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $DeliveryMessageDir $Doc

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
    $FinalStatus = "PHASE67_CLIENT_DELIVERY_MESSAGE_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE67_CLIENT_DELIVERY_MESSAGE_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE67_CLIENT_DELIVERY_MESSAGE_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 67 Client Delivery Message Pack"
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