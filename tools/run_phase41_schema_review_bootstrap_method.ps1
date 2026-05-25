# RAFTOP CPAP CARE Pro
# Phase 41.3B - Schema Review and Bootstrap Method Decision
# Safe ASCII-only script
# Reads latest schema discovery report only. Does not modify database.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_schema_review_bootstrap_method_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

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

function Get-LatestSchemaReport {
    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like "phase41_production_db_schema_discovery_*.md"
    } | Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) {
        return $Files[0]
    }

    return $null
}

function Get-DiscoveryValue {
    param(
        [string]$Content,
        [string]$Key
    )

    $Pattern = [regex]::Escape($Key) + "=(.*)"
    $Match = [regex]::Match($Content, $Pattern)

    if ($Match.Success) {
        return $Match.Groups[1].Value.Trim()
    }

    return ""
}

function Count-ListItems {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return 0
    }

    $Items = $Value.Split(",") | Where-Object {
        -not [string]::IsNullOrWhiteSpace($_)
    }

    return $Items.Count
}

function Find-TableBlock {
    param(
        [string]$Content,
        [string]$TableName
    )

    if ([string]::IsNullOrWhiteSpace($TableName)) {
        return ""
    }

    $Lines = $Content -split "`r?`n"
    $Capture = $false
    $Block = @()

    foreach ($Line in $Lines) {
        if ($Line -eq ("TABLE: public." + $TableName) -or $Line -match ("TABLE: .*" + [regex]::Escape($TableName) + "$")) {
            $Capture = $true
            $Block += $Line
            continue
        }

        if ($Capture -and $Line -match "^TABLE: ") {
            break
        }

        if ($Capture) {
            $Block += $Line
        }
    }

    return ($Block -join "`n")
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.3B Schema Review and Bootstrap Method Decision" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This report reviews the latest production DB schema discovery result and decides the safest bootstrap method."
Write-ReportLine "It reads reports only and does not modify the database."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 41.3B schema review and bootstrap method decision..."
Write-Host ""

$LatestSchemaReport = Get-LatestSchemaReport

if ($LatestSchemaReport -eq $null) {
    Add-Result "Latest schema discovery report" "FAIL" "No Phase 41.3 schema discovery report found."
    $Content = ""
} else {
    Add-Result "Latest schema discovery report" "PASS" ("Found: " + $LatestSchemaReport.FullName)
    $Content = Get-Content -Path $LatestSchemaReport.FullName -Raw -ErrorAction SilentlyContinue
}

if ($Content -match "FINAL STATUS: PHASE41_PRODUCTION_DB_SCHEMA_DISCOVERY_READY" -or $Content -match "FINAL STATUS: PHASE41_PRODUCTION_DB_SCHEMA_DISCOVERY_READY_WITH_WARNINGS") {
    Add-Result "Schema discovery final status" "PASS" "Latest schema discovery has acceptable final status."
} else {
    Add-Result "Schema discovery final status" "FAIL" "Latest schema discovery final status is not acceptable."
}

if ($Content -match "DB_CONNECTION: OK") {
    Add-Result "Database connection in latest discovery" "PASS" "Latest discovery connected to database."
} else {
    Add-Result "Database connection in latest discovery" "FAIL" "Latest discovery did not confirm DB connection."
}

$TenantTables = Get-DiscoveryValue $Content "tenant_tables"
$UserTables = Get-DiscoveryValue $Content "user_tables"
$SubscriptionTables = Get-DiscoveryValue $Content "subscription_module_tables"
$AuditTables = Get-DiscoveryValue $Content "audit_security_tables"
$PatientTables = Get-DiscoveryValue $Content "patient_tables"
$DeviceTables = Get-DiscoveryValue $Content "device_tables"
$AtlasTables = Get-DiscoveryValue $Content "atlas_task_tables"

$TenantCount = Count-ListItems $TenantTables
$UserCount = Count-ListItems $UserTables
$SubscriptionCount = Count-ListItems $SubscriptionTables
$AuditCount = Count-ListItems $AuditTables
$PatientCount = Count-ListItems $PatientTables
$DeviceCount = Count-ListItems $DeviceTables
$AtlasCount = Count-ListItems $AtlasTables

if ($TenantCount -gt 0) {
    Add-Result "Tenant table group" "PASS" ("Tenant tables: " + $TenantTables)
} else {
    Add-Result "Tenant table group" "FAIL" "No tenant-related tables found."
}

if ($UserCount -gt 0) {
    Add-Result "User/account table group" "PASS" ("User/account tables: " + $UserTables)
} else {
    Add-Result "User/account table group" "WARN" "No user/account-related tables found. Admin bootstrap cannot be safely designed yet."
}

if ($SubscriptionCount -gt 0) {
    Add-Result "Subscription/module table group" "PASS" ("Subscription/module tables: " + $SubscriptionTables)
} else {
    Add-Result "Subscription/module table group" "WARN" "No subscription/module-related tables found."
}

if ($AuditCount -gt 0) {
    Add-Result "Audit/security table group" "PASS" ("Audit/security tables: " + $AuditTables)
} else {
    Add-Result "Audit/security table group" "WARN" "No audit/security-related tables found."
}

if ($PatientCount -gt 0) {
    Add-Result "Patient table group" "PASS" ("Patient tables: " + $PatientTables)
} else {
    Add-Result "Patient table group" "WARN" "No patient-related tables found."
}

if ($DeviceCount -gt 0) {
    Add-Result "Device table group" "PASS" ("Device tables: " + $DeviceTables)
} else {
    Add-Result "Device table group" "WARN" "No device-related tables found."
}

if ($AtlasCount -gt 0) {
    Add-Result "ATLAS/task table group" "PASS" ("ATLAS/task tables: " + $AtlasTables)
} else {
    Add-Result "ATLAS/task table group" "WARN" "No ATLAS/task-related tables found."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "DISCOVERED TABLE GROUPS"
Write-ReportLine ""
Write-ReportLine ("tenant_tables=" + $TenantTables)
Write-ReportLine ("user_tables=" + $UserTables)
Write-ReportLine ("subscription_module_tables=" + $SubscriptionTables)
Write-ReportLine ("audit_security_tables=" + $AuditTables)
Write-ReportLine ("patient_tables=" + $PatientTables)
Write-ReportLine ("device_tables=" + $DeviceTables)
Write-ReportLine ("atlas_task_tables=" + $AtlasTables)
Write-ReportLine ""

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "BOOTSTRAP METHOD DECISION"
Write-ReportLine ""

if ($TenantCount -gt 0 -and $UserCount -gt 0) {
    Write-ReportLine "Decision:"
    Write-ReportLine "Controlled tenant and admin bootstrap can be designed."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4A - Controlled Tenant and Admin Bootstrap Script"
    Write-ReportLine ""
    Add-Result "Bootstrap method decision" "PASS" "Tenant and user tables exist. Controlled tenant/admin bootstrap can be designed."
} elseif ($TenantCount -gt 0 -and $UserCount -eq 0) {
    Write-ReportLine "Decision:"
    Write-ReportLine "Tenant bootstrap may be possible, but admin user bootstrap is blocked until user/auth schema is confirmed."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4B - User/Auth Schema Gap Review"
    Write-ReportLine ""
    Add-Result "Bootstrap method decision" "WARN" "Tenant table exists but user/account table was not discovered."
} else {
    Write-ReportLine "Decision:"
    Write-ReportLine "Bootstrap is blocked until schema migration or schema mapping is completed."
    Write-ReportLine ""
    Write-ReportLine "Recommended next phase:"
    Write-ReportLine "Phase 41.4C - Production Schema Migration Plan"
    Write-ReportLine ""
    Add-Result "Bootstrap method decision" "FAIL" "Tenant table missing or schema is too incomplete."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "TARGET TENANT"
Write-ReportLine ""
Write-ReportLine "tenant_id: raftopoulos-live"
Write-ReportLine "tenant_name: RAFTOPOULOS"
Write-ReportLine "plan: enterprise"
Write-ReportLine "status: active"
Write-ReportLine ""
Write-ReportLine "Do not insert production tenant/admin records until the selected bootstrap method is confirmed."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE41_SCHEMA_REVIEW_BOOTSTRAP_METHOD_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE41_SCHEMA_REVIEW_BOOTSTRAP_METHOD_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE41_SCHEMA_REVIEW_BOOTSTRAP_METHOD_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 41.3B Schema Review and Bootstrap Method"
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