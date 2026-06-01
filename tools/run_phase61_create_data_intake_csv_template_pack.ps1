# RAFTOP CPAP CARE Pro
# Phase 61 - Data Intake and CSV Template Pack
# ASCII-safe version.
# Safe: creates client-facing data intake docs and CSV templates only. Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$DocsRoot = Join-Path $Root "docs"
$ClientDir = Join-Path $DocsRoot "client-start-pack"
$DataDir = Join-Path $ClientDir "data-intake-csv-template"
$ReportsDir = Join-Path $Root "reports"

New-Item -ItemType Directory -Path $DocsRoot -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase61_data_intake_csv_template_pack_" + $Timestamp + ".md")

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

    $Path = Join-Path $DataDir $FileName
    Set-Content -Path $Path -Value $Lines -Encoding UTF8
    Write-Host "DOC READY - $FileName"
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 61 Data Intake and CSV Template Pack" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 61 Data Intake and CSV Template Pack..."
Write-Host ""

Write-Doc "01_DATA_INTAKE_REQUIREMENTS.md" @(
    "# RAFTOP CPAP CARE Pro - Data Intake Requirements",
    "",
    "Purpose:",
    "",
    "This document defines the required structure for the first CPAP data sample provided by Raftopoulos.",
    "",
    "Preferred data levels:",
    "",
    "1. demo data",
    "2. anonymized data",
    "3. pseudonymized data",
    "4. real patient data only with legal or DPA framework",
    "",
    "Preferred file type:",
    "",
    "CSV UTF-8.",
    "",
    "Accepted source formats:",
    "",
    "- CSV export",
    "- Excel export converted to CSV",
    "- structured table exported to CSV",
    "",
    "Required fields:",
    "",
    "- patient_reference_code",
    "- device_reference_code",
    "- date",
    "- usage_hours",
    "- no_data_status",
    "- leak_metric",
    "- ahi_metric",
    "- follow_up_status",
    "- assigned_owner",
    "- notes",
    "",
    "Rules:",
    "",
    "- do not send uncontrolled real patient identifiers",
    "- do not send passwords or credentials in the data file",
    "- do not mix demo and real data without clear label",
    "- do not import before preview and approval",
    "- confirm data sensitivity before transfer",
    "",
    "First data objective:",
    "",
    "Enable safe review of no-data cases, compliance risk, leak or therapy signals, follow-up status, and ATLAS actions."
)

Write-Doc "02_RAFTOP_CPAP_DATA_TEMPLATE.csv" @(
    "patient_reference_code,device_reference_code,date,usage_hours,no_data_status,leak_metric,ahi_metric,follow_up_status,assigned_owner,notes"
)

Write-Doc "03_DATA_FIELD_DICTIONARY.md" @(
    "# RAFTOP CPAP CARE Pro - Data Field Dictionary",
    "",
    "patient_reference_code",
    "",
    "Description: pseudonymized patient reference.",
    "Required: yes.",
    "Example: P-0001.",
    "Do not use full patient name unless legal/data framework is confirmed.",
    "",
    "device_reference_code",
    "",
    "Description: pseudonymized device reference.",
    "Required: yes if available.",
    "Example: D-1001.",
    "",
    "date",
    "",
    "Description: therapy data date.",
    "Required: yes.",
    "Format: YYYY-MM-DD.",
    "Example: 2026-06-01.",
    "",
    "usage_hours",
    "",
    "Description: CPAP usage hours for the date or reporting period.",
    "Required: yes if available.",
    "Format: numeric decimal.",
    "Example: 5.7.",
    "",
    "no_data_status",
    "",
    "Description: indicates whether data is missing.",
    "Required: yes.",
    "Allowed values: yes,no.",
    "Example: no.",
    "",
    "leak_metric",
    "",
    "Description: leak value if available.",
    "Required: optional.",
    "Format: numeric decimal or blank.",
    "Example: 18.5.",
    "",
    "ahi_metric",
    "",
    "Description: AHI value if available.",
    "Required: optional.",
    "Format: numeric decimal or blank.",
    "Example: 4.2.",
    "",
    "follow_up_status",
    "",
    "Description: current follow-up state.",
    "Required: optional.",
    "Allowed values: none,open,in_progress,completed,blocked.",
    "Example: open.",
    "",
    "assigned_owner",
    "",
    "Description: person or team responsible for follow-up.",
    "Required: optional.",
    "Example: operations_team.",
    "",
    "notes",
    "",
    "Description: short operational note.",
    "Required: optional.",
    "Do not include sensitive clinical narratives unless approved.",
    "",
    "Boundary:",
    "",
    "The data template supports operational review and follow-up prioritization. It does not replace physician judgment."
)

Write-Doc "04_SAMPLE_DATA_ROWS.csv" @(
    "patient_reference_code,device_reference_code,date,usage_hours,no_data_status,leak_metric,ahi_metric,follow_up_status,assigned_owner,notes",
    "P-0001,D-1001,2026-06-01,6.4,no,12.5,3.1,none,operations_team,stable_usage",
    "P-0002,D-1002,2026-06-01,2.1,no,24.8,7.2,open,operations_team,compliance_risk",
    "P-0003,D-1003,2026-06-01,0,yes,,,open,data_team,no_data_case",
    "P-0004,D-1004,2026-06-01,5.2,no,38.0,5.4,in_progress,technical_team,high_leak_review",
    "P-0005,D-1005,2026-06-01,7.0,no,10.2,2.9,completed,operations_team,follow_up_completed"
)

Write-Doc "05_DATA_VALIDATION_CHECKLIST.md" @(
    "# RAFTOP CPAP CARE Pro - Data Validation Checklist",
    "",
    "Use this checklist before import or operational review.",
    "",
    "File checks:",
    "",
    "- file is CSV UTF-8",
    "- header row exists",
    "- columns match template",
    "- no extra uncontrolled columns",
    "- date format is YYYY-MM-DD",
    "- usage_hours is numeric",
    "- no_data_status uses yes/no",
    "- leak_metric is numeric or blank",
    "- ahi_metric is numeric or blank",
    "- follow_up_status uses allowed values",
    "",
    "Safety checks:",
    "",
    "- patient names removed or approved",
    "- direct identifiers removed or approved",
    "- no credentials in file",
    "- no passwords in file",
    "- no database URLs in file",
    "- data level confirmed",
    "- data source confirmed",
    "",
    "Operational checks:",
    "",
    "- no-data examples exist",
    "- compliance risk examples exist",
    "- leak/therapy issue examples exist where available",
    "- follow-up status is understandable",
    "- assigned owner field is clear",
    "",
    "Approval rule:",
    "",
    "Do not import or use data operationally before preview, validation, and approval."
)

Write-Doc "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md" @(
    "# RAFTOP CPAP CARE Pro - Data Privacy and Identifier Rules",
    "",
    "Purpose:",
    "",
    "Prevent unsafe transfer or use of patient identifiers.",
    "",
    "Preferred identifiers:",
    "",
    "- patient_reference_code",
    "- device_reference_code",
    "- pseudonymized internal reference",
    "",
    "Avoid unless legally approved:",
    "",
    "- full patient name",
    "- national ID",
    "- full address",
    "- phone number",
    "- email",
    "- insurance number",
    "- free text clinical history",
    "",
    "Real patient data rule:",
    "",
    "Real patient data requires confirmed legal/data protection framework before use.",
    "",
    "Safe transfer rule:",
    "",
    "Do not transfer sensitive files through uncontrolled chat or unsecured email threads.",
    "",
    "Minimum data principle:",
    "",
    "Send only fields needed for operational review, follow-up prioritization, and reporting.",
    "",
    "Boundary:",
    "",
    "RAFTOP supports operations and reporting. It is not a diagnostic medical device."
)

Write-Doc "07_IMPORT_PREVIEW_AND_APPROVAL.md" @(
    "# RAFTOP CPAP CARE Pro - Import Preview and Approval",
    "",
    "Purpose:",
    "",
    "Define the process before data is used in the platform.",
    "",
    "Preview steps:",
    "",
    "1. Receive CSV file.",
    "2. Confirm source and date range.",
    "3. Confirm data level: demo, anonymized, pseudonymized, or real.",
    "4. Validate headers.",
    "5. Validate row format.",
    "6. Check sensitive identifiers.",
    "7. Check sample rows.",
    "8. Confirm no-data/compliance/leak examples.",
    "9. Approve for demo or operational use.",
    "",
    "Approval fields:",
    "",
    "- file name",
    "- data owner",
    "- data source",
    "- date range",
    "- patient count",
    "- data level",
    "- approved by",
    "- approval date",
    "",
    "Reject file if:",
    "",
    "- columns do not match",
    "- date format is wrong",
    "- identifiers are uncontrolled",
    "- data sensitivity is unclear",
    "- file contains credentials or secrets",
    "",
    "Rule:",
    "",
    "Preview first. Import second. Never reverse this order."
)

Write-Doc "08_DATA_INTAKE_PACK_INDEX.md" @(
    "# RAFTOP CPAP CARE Pro - Data Intake and CSV Template Pack Index",
    "",
    "This folder contains the client-facing data intake and CSV template pack.",
    "",
    "Documents:",
    "",
    "01_DATA_INTAKE_REQUIREMENTS.md",
    "02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
    "03_DATA_FIELD_DICTIONARY.md",
    "04_SAMPLE_DATA_ROWS.csv",
    "05_DATA_VALIDATION_CHECKLIST.md",
    "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md",
    "07_IMPORT_PREVIEW_AND_APPROVAL.md",
    "08_DATA_INTAKE_PACK_INDEX.md",
    "",
    "First file to use:",
    "",
    "02_RAFTOP_CPAP_DATA_TEMPLATE.csv",
    "",
    "First document to read:",
    "",
    "01_DATA_INTAKE_REQUIREMENTS.md",
    "",
    "Important:",
    "",
    "This pack is client-facing. It does not include source code, credentials, secrets, internal scripts, or developer-only notes."
)

Write-Host ""
Write-Host "Verifying data intake and CSV template pack..."
Write-Host ""

$RequiredDocs = @{
    "01_DATA_INTAKE_REQUIREMENTS.md" = @("Data Intake Requirements", "CSV UTF-8", "patient_reference_code")
    "02_RAFTOP_CPAP_DATA_TEMPLATE.csv" = @("patient_reference_code", "usage_hours", "assigned_owner")
    "03_DATA_FIELD_DICTIONARY.md" = @("Data Field Dictionary", "YYYY-MM-DD", "no_data_status")
    "04_SAMPLE_DATA_ROWS.csv" = @("P-0001", "compliance_risk", "no_data_case")
    "05_DATA_VALIDATION_CHECKLIST.md" = @("Data Validation Checklist", "Approval rule", "no_data_status")
    "06_DATA_PRIVACY_AND_IDENTIFIER_RULES.md" = @("Data Privacy", "Minimum data principle", "Real patient data")
    "07_IMPORT_PREVIEW_AND_APPROVAL.md" = @("Import Preview", "Preview first", "Reject file")
    "08_DATA_INTAKE_PACK_INDEX.md" = @("Data Intake", "First file to use", "client-facing")
}

foreach ($Doc in $RequiredDocs.Keys) {
    $Path = Join-Path $DataDir $Doc

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
    $FinalStatus = "PHASE61_DATA_INTAKE_CSV_TEMPLATE_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE61_DATA_INTAKE_CSV_TEMPLATE_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE61_DATA_INTAKE_CSV_TEMPLATE_PACK_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 61 Data Intake and CSV Template Pack"
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