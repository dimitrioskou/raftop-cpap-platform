# RAFTOP CPAP CARE Pro
# Phase 94C - Production Schema Bootstrap / Compatibility Repair Plan
# Creates a non-destructive SQL bootstrap/repair plan for production schema.
# Does NOT execute SQL.
# Does NOT modify production DB.
# Does NOT import patient data.
# Purpose: prepare missing production tables before tenant/users activation.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$BackendDir = Join-Path $Root "enterprise-backend"
$SqlDir = Join-Path $BackendDir "sql"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $SqlDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase94c_production_schema_bootstrap_repair_plan_" + $Timestamp + ".md")

$RepairPlanDoc = Join-Path $DocsDir "94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN.md"
$SqlFile = Join-Path $SqlDir "phase94c_production_schema_bootstrap.sql"
$ApplyGuide = Join-Path $DocsDir "94C_SQL_APPLY_GUIDE.md"
$RollbackGuide = Join-Path $DocsDir "94C_SCHEMA_ROLLBACK_GUIDE.md"

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
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
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
        Add-Result $Name "WARN" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "WARN" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 94C Production Schema Bootstrap Repair Plan" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: create non-destructive production schema repair SQL before tenant/user activation." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not execute SQL and does not modify production DB." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 94C - Production Schema Bootstrap / Compatibility Repair Plan..."
Write-Host ""

Check-ReportStatus "Phase 94 discovery latest status" "phase94_production_db_tenant_activation_discovery_*.md" @(
    "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY_READY",
    "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 94B schema mapping latest status" "phase94b_production_schema_mapping_discovery_*.md" @(
    "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY_READY",
    "PHASE94B_PRODUCTION_SCHEMA_MAPPING_DISCOVERY_READY_WITH_WARNINGS"
)

$SqlContent = @'
-- RAFTOP CPAP CARE Pro
-- Phase 94C - Production Schema Bootstrap / Compatibility Repair SQL
-- NON-DESTRUCTIVE SCRIPT
-- Creates missing production-compatible tables.
-- No table removal statements.
-- Does not delete data.
-- No table emptying statements.
-- Does not import real patient data.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Canonical tenant compatibility table.
-- Existing production DB may already use tenant_profiles.
-- This table gives stable compatibility for services/scripts expecting tenants.
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    plan_name text DEFAULT 'enterprise',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-production',
    'Raftopoulos Production',
    'active',
    'enterprise',
    'Production tenant for controlled CPAP portfolio rollout.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    updated_at = now();

-- 2. Production patients table.
-- Pseudonymized operational patient registry.
-- No direct identifiers: no AMKA, no phone, no email, no address, no full name.
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    patient_code text NOT NULL,
    doctor_external_id text,
    branch_code text,
    status text NOT NULL DEFAULT 'active',
    setup_date date,
    consent_basis text,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, patient_external_id),
    UNIQUE (tenant_slug, patient_code)
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_slug
ON public.patients (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_patients_doctor_external_id
ON public.patients (doctor_external_id);

CREATE INDEX IF NOT EXISTS idx_patients_status
ON public.patients (status);

-- 3. Production devices table.
CREATE TABLE IF NOT EXISTS public.devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    device_serial text NOT NULL,
    device_model text,
    status text NOT NULL DEFAULT 'active',
    setup_date date,
    last_data_date date,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, device_serial)
);

CREATE INDEX IF NOT EXISTS idx_devices_tenant_slug
ON public.devices (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_devices_patient_external_id
ON public.devices (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_devices_last_data_date
ON public.devices (last_data_date);

-- 4. Production compliance nights / records table.
CREATE TABLE IF NOT EXISTS public.compliance_nights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    device_serial text,
    record_date date NOT NULL,
    month_start date,
    usage_hours numeric(8,2) DEFAULT 0,
    month_usage_hours numeric(8,2) DEFAULT 0,
    usage_hours_30d numeric(8,2) DEFAULT 0,
    days_used_30d integer DEFAULT 0,
    ahi_avg_30d numeric(8,2),
    leak_avg_30d numeric(8,2),
    is_80h_compliant boolean GENERATED ALWAYS AS (month_usage_hours >= 80) STORED,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, patient_external_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_slug
ON public.compliance_nights (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_compliance_patient_external_id
ON public.compliance_nights (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_compliance_month_start
ON public.compliance_nights (month_start);

CREATE INDEX IF NOT EXISTS idx_compliance_80h
ON public.compliance_nights (is_80h_compliant);

-- 5. Generic tasks compatibility table.
-- atlas_tasks may already exist. This table supports endpoints/tools expecting tasks.
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text,
    task_type text NOT NULL DEFAULT 'follow_up',
    title text NOT NULL,
    description text,
    priority text NOT NULL DEFAULT 'medium',
    status text NOT NULL DEFAULT 'open',
    assigned_to text,
    due_date date,
    source text DEFAULT 'manual',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_slug
ON public.tasks (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_tasks_patient_external_id
ON public.tasks (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
ON public.tasks (status);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
ON public.tasks (priority);

-- 6. Import audit table.
CREATE TABLE IF NOT EXISTS public.import_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    import_batch_id text,
    import_stage text,
    source_filename text,
    row_count integer DEFAULT 0,
    status text NOT NULL DEFAULT 'created',
    notes text,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_audit_tenant_slug
ON public.import_audit_logs (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_import_audit_batch
ON public.import_audit_logs (import_batch_id);

-- 7. Safety view for latest patient compliance snapshot.
CREATE OR REPLACE VIEW public.patient_compliance_latest AS
SELECT DISTINCT ON (tenant_slug, patient_external_id)
    tenant_slug,
    patient_external_id,
    device_serial,
    record_date,
    month_start,
    month_usage_hours,
    usage_hours_30d,
    days_used_30d,
    ahi_avg_30d,
    leak_avg_30d,
    is_80h_compliant,
    data_source,
    created_at
FROM public.compliance_nights
ORDER BY tenant_slug, patient_external_id, record_date DESC;

COMMIT;
'@

Set-Content -Path $SqlFile -Value $SqlContent -Encoding UTF8

if (Test-Path $SqlFile) {
    Add-Result "Bootstrap SQL file created" "PASS" $SqlFile
} else {
    Add-Result "Bootstrap SQL file created" "FAIL" $SqlFile
}

$SqlCheck = Read-FileSafe $SqlFile

$RequiredSqlMarkers = @(
    "CREATE TABLE IF NOT EXISTS public.tenants",
    "CREATE TABLE IF NOT EXISTS public.patients",
    "CREATE TABLE IF NOT EXISTS public.devices",
    "CREATE TABLE IF NOT EXISTS public.compliance_nights",
    "CREATE TABLE IF NOT EXISTS public.tasks",
    "CREATE TABLE IF NOT EXISTS public.import_audit_logs",
    "CREATE OR REPLACE VIEW public.patient_compliance_latest",
    "raftopoulos-production"
)

foreach ($Marker in $RequiredSqlMarkers) {
    if (ContainsText $SqlCheck $Marker) {
        Add-Result ("SQL marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("SQL marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$ForbiddenSql = @(
    "DROP TABLE",
    "TRUNCATE",
    "DELETE FROM",
    "ALTER TABLE public.users DROP",
    "DROP DATABASE",
    "DROP SCHEMA"
)

foreach ($Forbidden in $ForbiddenSql) {
    if (ContainsText $SqlCheck $Forbidden) {
        Add-Result ("Forbidden destructive SQL absent: " + $Forbidden) "FAIL" "Forbidden SQL found."
    } else {
        Add-Result ("Forbidden destructive SQL absent: " + $Forbidden) "PASS" "Absent."
    }
}

$RepairPlanContent = @'
# RAFTOP CPAP CARE Pro - Production Schema Bootstrap Repair Plan

REQUIRED_MARKER: PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN
REQUIRED_MARKER: NON_DESTRUCTIVE_SQL_ONLY
REQUIRED_MARKER: CREATES_PATIENTS_DEVICES_COMPLIANCE_TASKS
REQUIRED_MARKER: BEFORE_PHASE95_TENANT_USERS

## Purpose

This phase creates a non-destructive SQL bootstrap script to complete the minimum production schema needed before tenant/user activation.

## Current production DB issue

The current production database appears to have partial schema:
- users exists
- tenant_profiles exists
- tenant_subscriptions exists
- atlas_tasks exists
- demo tables exist

Missing production-compatible tables include:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs

## Created SQL file

enterprise-backend/sql/phase94c_production_schema_bootstrap.sql

## What the SQL does

It creates, if missing:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs
- patient_compliance_latest view

It also inserts/updates:
- raftopoulos-production tenant

## What the SQL does not do

It does not:
- table removal
- table emptying
- delete data
- import real patient data
- create production users
- expose secrets

## Next phase

Phase 94D must apply the SQL to production DB only after review.
Phase 95 can run only after schema apply and verification.
'@

Set-Content -Path $RepairPlanDoc -Value $RepairPlanContent -Encoding UTF8

$ApplyGuideContent = @'
# RAFTOP CPAP CARE Pro - Phase 94C SQL Apply Guide

REQUIRED_MARKER: PHASE94C_SQL_APPLY_GUIDE
REQUIRED_MARKER: REVIEW_BEFORE_APPLY
REQUIRED_MARKER: APPLY_IN_PHASE94D_ONLY

## Do not apply blindly

This phase only creates the SQL.
Apply happens in Phase 94D.

## SQL file

enterprise-backend/sql/phase94c_production_schema_bootstrap.sql

## Required before applying

1. Confirm DATABASE_URL is correct.
2. Confirm backend health is OK.
3. Confirm psql works.
4. Review SQL file.
5. Confirm no DROP/TRUNCATE/DELETE exists.

## Phase 94D will run

psql $env:RAFTOP_PRODUCTION_DATABASE_URL -f .\enterprise-backend\sql\phase94c_production_schema_bootstrap.sql

Only after review.
'@

Set-Content -Path $ApplyGuide -Value $ApplyGuideContent -Encoding UTF8

$RollbackGuideContent = @'
# RAFTOP CPAP CARE Pro - Phase 94C Schema Rollback Guide

REQUIRED_MARKER: PHASE94C_SCHEMA_ROLLBACK_GUIDE
REQUIRED_MARKER: NO_AUTOMATIC_ROLLBACK
REQUIRED_MARKER: MANUAL_REVIEW_REQUIRED

## Rollback principle

Because this SQL is non-destructive and uses CREATE TABLE IF NOT EXISTS, rollback is usually not required.

## If rollback is requested

Do not drop production data blindly.

Manual review is required before removing:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs
- patient_compliance_latest view

## Production safety

No patient data should be imported before schema is verified and buyer/GDPR approval exists.
'@

Set-Content -Path $RollbackGuide -Value $RollbackGuideContent -Encoding UTF8

foreach ($Path in @($RepairPlanDoc, $ApplyGuide, $RollbackGuide)) {
    if (Test-Path $Path) {
        Add-Result ("Phase 94C doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase 94C doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN",
    "NON_DESTRUCTIVE_SQL_ONLY",
    "CREATES_PATIENTS_DEVICES_COMPLIANCE_TASKS",
    "BEFORE_PHASE95_TENANT_USERS",
    "PHASE94C_SQL_APPLY_GUIDE",
    "REVIEW_BEFORE_APPLY",
    "APPLY_IN_PHASE94D_ONLY",
    "PHASE94C_SCHEMA_ROLLBACK_GUIDE",
    "NO_AUTOMATIC_ROLLBACK",
    "MANUAL_REVIEW_REQUIRED"
)) {
    $Found = $false

    foreach ($Path in @($RepairPlanDoc, $ApplyGuide, $RollbackGuide)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required doc marker exists: " + $Marker) "FAIL" "Marker missing."
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
    $FinalStatus = "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 94C Production Schema Bootstrap Repair Plan"
Write-Host "============================================================"
Write-Host ""
Write-Host "SQL file:"
Write-Host $SqlFile
Write-Host ""
Write-Host "Repair plan:"
Write-Host $RepairPlanDoc
Write-Host ""
Write-Host "Apply guide:"
Write-Host $ApplyGuide
Write-Host ""
Write-Host "Rollback guide:"
Write-Host $RollbackGuide
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
