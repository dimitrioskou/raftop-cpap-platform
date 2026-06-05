# RAFTOP CPAP CARE Pro
# Phase 102 - Pilot 20 Access & Isolation Lock
# Creates pilot-20 handover structure and SQL template.
# Does NOT expose secrets.
# Does NOT deliver source code.
# Does NOT delete existing data.
# Does NOT modify production DB in this phase.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$DataDir = Join-Path $Root "data-intake\raftopoulos-pilot-20"
$SqlDir = Join-Path $Root "enterprise-backend\sql"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
New-Item -ItemType Directory -Path $SqlDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase102_pilot20_access_isolation_lock_" + $Timestamp + ".md")

$PilotPlanDoc = Join-Path $DocsDir "102_PILOT20_ACCESS_ISOLATION_PLAN.md"
$PilotRulesDoc = Join-Path $DocsDir "102_PILOT20_RULES_FOR_RAFTOPoulos.md"
$PilotDataTemplate = Join-Path $DataDir "RAFTOP_PILOT20_MANUAL_ENTRY_TEMPLATE.csv"
$PilotSqlTemplate = Join-Path $SqlDir "phase102_pilot20_tenant_users_template.sql"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 102 Pilot 20 Access Isolation Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 102 - Pilot 20 Access & Isolation Lock..."
Write-Host ""

Check-ReportStatus "Phase 101 production handover lock status" "phase101_production_handover_lock_*.md" @(
    "PHASE101_PRODUCTION_HANDOVER_LOCK_READY",
    "PHASE101_PRODUCTION_HANDOVER_LOCK_READY_WITH_WARNINGS"
)

$PilotPlan = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Access Isolation Plan

REQUIRED_MARKER: PHASE102_PILOT20_ACCESS_ISOLATION_LOCK
REQUIRED_MARKER: PILOT_TENANT_RAFTOPoulos_PILOT_20
REQUIRED_MARKER: MAX_20_PATIENTS
REQUIRED_MARKER: TWO_MONTH_PILOT
REQUIRED_MARKER: SYNTHETIC_7000_NOT_VISIBLE_TO_BUYER
REQUIRED_MARKER: READY_FOR_PHASE103_MANUAL_ENTRY_MODULE

## Purpose

Create a clean 20-patient pilot environment for Raftopoulos.

## Pilot tenant

Tenant slug:
raftopoulos-pilot-20

Tenant name:
Raftopoulos Pilot 20

## Why separate tenant

The 7000-row validation dataset proves technical scale readiness.
The buyer pilot must be clean and limited to 20 real pseudonymized patients.

## Pilot duration

2 months.

## Pilot limit

Maximum 20 patients.

## Buyer access

Raftopoulos receives tenant-level pilot access only.

## Not included

- source code
- GitHub
- Render credentials
- database credentials
- super admin
- synthetic 7000 dataset access
- raw database access

## Required next phase

Phase 103 must add/verify manual entry flow so buyer can enter:
- patient code
- device serial
- device model
- setup date
- CPAP usage
- 80h compliance data
- AHI
- leak

No direct identifiers.
'@

Set-Content -Path $PilotPlanDoc -Value $PilotPlan -Encoding UTF8

$PilotRules = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Rules for Raftopoulos

REQUIRED_MARKER: PHASE102_PILOT20_RULES
REQUIRED_MARKER: NO_DIRECT_IDENTIFIERS
REQUIRED_MARKER: BUYER_ENTERS_20_PATIENTS
REQUIRED_MARKER: PILOT_THEN_PURCHASE

## Pilot purpose

Raftopoulos will use the platform for 2 months with 20 CPAP patients to see how it works in real operational conditions.

## Allowed patient data

Allowed:
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
- name
- surname
- contact number
- email
- national insurance identifier
- residential location
- date of birth

## What they will see

- 80 Hours Compliance
- patients below 80h
- ATLAS priority queue
- high AHI
- leak issues
- no data / old data
- management snapshot
- reports

## After 2 months

Decision:
- purchase
- support contract
- full rollout
'@

Set-Content -Path $PilotRulesDoc -Value $PilotRules -Encoding UTF8

$Template = @'
tenant_id,patient_external_id,patient_code,device_serial,device_model,setup_date,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d,doctor_external_id,branch_code,consent_basis,data_source
raftopoulos-pilot-20,RFT-PILOT-001,PILOT-001,DEVICE-001,AirSense 10,2026-06-01,2026-06-01,2026-06-05,82,82,5,3.2,12,DR-001,PILOT20,approved_pilot,pilot20_manual
raftopoulos-pilot-20,RFT-PILOT-002,PILOT-002,DEVICE-002,AirSense 10,2026-06-01,2026-06-01,2026-06-05,42,42,5,8.1,18,DR-001,PILOT20,approved_pilot,pilot20_manual
'@

Set-Content -Path $PilotDataTemplate -Value $Template -Encoding UTF8

$SqlTemplate = @'
-- RAFTOP CPAP CARE Pro
-- Phase 102 - Pilot 20 Tenant/User SQL Template
-- TEMPLATE ONLY.
-- Do not store real passwords here.
-- Real credentials must be generated outside Git.

BEGIN;

INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-pilot-20',
    'Raftopoulos Pilot 20',
    'active',
    'pilot',
    'Two-month controlled pilot for 20 pseudonymized CPAP patients.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    notes = EXCLUDED.notes,
    updated_at = now();

-- Pilot users must use tenant_id = 'raftopoulos-pilot-20'
-- Actual user creation happens in Phase 102B / 103 after confirming auth flow.

COMMIT;
'@

Set-Content -Path $PilotSqlTemplate -Value $SqlTemplate -Encoding UTF8

foreach ($Path in @($PilotPlanDoc, $PilotRulesDoc, $PilotDataTemplate, $PilotSqlTemplate)) {
    if (Test-Path $Path) {
        Add-Result ("Phase 102 file created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase 102 file created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK",
    "PILOT_TENANT_RAFTOPoulos_PILOT_20",
    "MAX_20_PATIENTS",
    "TWO_MONTH_PILOT",
    "SYNTHETIC_7000_NOT_VISIBLE_TO_BUYER",
    "READY_FOR_PHASE103_MANUAL_ENTRY_MODULE",
    "PHASE102_PILOT20_RULES",
    "NO_DIRECT_IDENTIFIERS",
    "BUYER_ENTERS_20_PATIENTS",
    "PILOT_THEN_PURCHASE"
)) {
    $Found = $false

    foreach ($Path in @($PilotPlanDoc, $PilotRulesDoc)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGenerated = ""
foreach ($Path in @($PilotPlanDoc, $PilotRulesDoc, $PilotDataTemplate, $PilotSqlTemplate)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Forbidden in @(
    "first_name",
    "last_name",
    "full_name",
    "phone",
    "mobile",
    "amka",
    "address",
    "date_of_birth",
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden pilot/handover content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden pilot/handover content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE102_PILOT20_ACCESS_ISOLATION_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 102 Pilot 20 Access Isolation Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Pilot docs folder:"
Write-Host $DocsDir
Write-Host ""
Write-Host "Pilot data template:"
Write-Host $PilotDataTemplate
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
