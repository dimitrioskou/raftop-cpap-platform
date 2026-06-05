# RAFTOP CPAP CARE Pro
# Phase 94 - Production DB / Tenant Activation Discovery
# Checks production DB readiness and tenant activation prerequisites.
# Does not import real patient data.
# Does not create users.
# Does not modify production DB unless explicitly extended later.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$BackendDir = Join-Path $Root "enterprise-backend"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$ToolsDir = Join-Path $Root "tools"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase94_production_db_tenant_activation_discovery_" + $Timestamp + ".md")
$DiscoveryDoc = Join-Path $DocsDir "94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY.md"
$TenantActivationPlan = Join-Path $DocsDir "94_RAFTOPoulos_PRODUCTION_TENANT_ACTIVATION_PLAN.md"

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

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Search-CodeMarker {
    param(
        [string]$Name,
        [string]$Directory,
        [string]$Pattern,
        [string[]]$Extensions
    )

    if (!(Test-Path $Directory)) {
        Add-Result $Name "FAIL" ("Directory missing: " + $Directory)
        return
    }

    $Files = Get-ChildItem -Path $Directory -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $Extensions -contains $_.Extension.ToLower() }

    $Matches = @()

    foreach ($File in $Files) {
        $Content = Read-FileSafe $File.FullName
        if (ContainsText $Content $Pattern) {
            $Matches += $File.FullName
        }
    }

    if ($Matches.Count -gt 0) {
        Add-Result $Name "PASS" ("Found in: " + (($Matches | Select-Object -First 5) -join "; "))
    } else {
        Add-Result $Name "WARN" ("Pattern not found: " + $Pattern)
    }
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

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 94 Production DB Tenant Activation Discovery" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: discover production DB, schema, and tenant activation prerequisites." -Encoding UTF8
Add-Content -Path $ReportPath -Value "This phase does not import real patient data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 94 - Production DB / Tenant Activation Discovery..."
Write-Host ""

# Previous phase gate.
Check-ReportStatus "Phase 93 production app completion latest status" "phase93_production_app_completion_gate_*.md" @(
    "PHASE93_PRODUCTION_APP_COMPLETION_GATE_READY",
    "PHASE93_PRODUCTION_APP_COMPLETION_GATE_READY_WITH_WARNINGS"
)

# Project structure.
Test-PathExists "Backend folder exists" $BackendDir
Test-PathExists "Frontend folder exists" $FrontendDir
Test-PathExists "Tools folder exists" $ToolsDir

# Search app capabilities.
Search-CodeMarker "Backend DATABASE_URL usage exists" $BackendDir "DATABASE_URL" @(".js", ".ts", ".json", ".md", ".env", ".example")
Search-CodeMarker "Backend tenant logic exists" $BackendDir "tenant" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend user/auth logic exists" $BackendDir "user" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend patient logic exists" $BackendDir "patient" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend device logic exists" $BackendDir "device" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend import/CSV logic exists" $BackendDir "csv" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend task/followup logic exists" $BackendDir "task" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend ATLAS logic exists" $BackendDir "ATLAS" @(".js", ".ts", ".sql", ".md")
Search-CodeMarker "Backend compliance logic exists" $BackendDir "compliance" @(".js", ".ts", ".sql", ".md")

# Environment checks.
$DatabaseUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
$BackendHealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Add-Result "Production DATABASE URL env set" "WARN" "RAFTOP_PRODUCTION_DATABASE_URL is not set. DB connection not tested."
} else {
    Add-Result "Production DATABASE URL env set" "PASS" "RAFTOP_PRODUCTION_DATABASE_URL is set."
}

if ([string]::IsNullOrWhiteSpace($BackendHealthUrl)) {
    Add-Result "Production backend health URL env set" "WARN" "RAFTOP_PRODUCTION_BACKEND_HEALTH_URL is not set. Backend health not tested."
} else {
    try {
        $HealthResponse = Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 30

        if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
            Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
        } else {
            Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
        }
    } catch {
        Add-Result "Production backend health reachable" "FAIL" ("Could not reach backend health: " + $_.Exception.Message)
    }
}

# psql availability.
$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ($null -eq $PsqlCommand) {
    Add-Result "psql command available" "WARN" "psql not found in PATH. DB schema cannot be tested from this shell."
} else {
    Add-Result "psql command available" "PASS" ("psql found: " + $PsqlCommand.Source)
}

# DB schema test if possible.
if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl) -and $null -ne $PsqlCommand) {
    try {
        $TableQuery = "select table_name from information_schema.tables where table_schema='public' order by table_name;"
        $TablesOutput = & psql $DatabaseUrl -t -c $TableQuery 2>&1
        $PsqlExit = $LASTEXITCODE

        if ($PsqlExit -eq 0) {
            Add-Result "Production DB connection works" "PASS" "psql query executed."
            $TablesText = ($TablesOutput | Out-String)

            Add-Content -Path $ReportPath -Value "DB_TABLES:" -Encoding UTF8
            Add-Content -Path $ReportPath -Value $TablesText -Encoding UTF8
            Add-Content -Path $ReportPath -Value "" -Encoding UTF8

            $RequiredTables = @(
                "tenants",
                "users",
                "patients",
                "devices",
                "tasks"
            )

            foreach ($Table in $RequiredTables) {
                if (ContainsText $TablesText $Table) {
                    Add-Result ("Production DB table exists: " + $Table) "PASS" "Table found."
                } else {
                    Add-Result ("Production DB table exists: " + $Table) "WARN" "Table not found. Schema/bootstrap may be required."
                }
            }

            # Tenant existence check.
            $TenantQuery = "select count(*) from tenants where slug='raftopoulos-production' or name ilike '%Raftopoulos%';"
            $TenantOutput = & psql $DatabaseUrl -t -c $TenantQuery 2>&1
            $TenantExit = $LASTEXITCODE

            if ($TenantExit -eq 0) {
                $TenantCountText = (($TenantOutput | Out-String).Trim())

                if ($TenantCountText -match "^[0-9]+$" -and [int]$TenantCountText -gt 0) {
                    Add-Result "Raftopoulos production tenant exists" "PASS" ("Tenant count: " + $TenantCountText)
                } else {
                    Add-Result "Raftopoulos production tenant exists" "WARN" "Tenant not found. It must be created in Phase 95."
                }
            } else {
                Add-Result "Raftopoulos tenant query works" "WARN" ("Tenant query failed: " + ($TenantOutput | Out-String))
            }

        } else {
            Add-Result "Production DB connection works" "FAIL" ("psql failed: " + ($TablesOutput | Out-String))
        }
    } catch {
        Add-Result "Production DB connection works" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$DiscoveryContent = @'
# RAFTOP CPAP CARE Pro - Production DB / Tenant Activation Discovery

REQUIRED_MARKER: PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY
REQUIRED_MARKER: DB_DISCOVERY_BEFORE_TENANT_CREATION
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION_NEXT
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT

## Purpose

This document marks the production activation discovery step.

## Required before production user delivery

1. Backend health URL confirmed.
2. Production DATABASE_URL confirmed.
3. DB schema discovered.
4. Required tables confirmed or bootstrapped.
5. Raftopoulos production tenant created.
6. Tenant admin user created.
7. Operations users created.
8. Viewer user created.
9. Credentials delivered separately.
10. CSV validation completed before any real import.

## Hard stop

No real patient data import before agreement, GDPR/DPA, CSV validation, and staged signoff.
'@

Set-Content -Path $DiscoveryDoc -Value $DiscoveryContent -Encoding UTF8

$TenantPlanContent = @'
# RAFTOP CPAP CARE Pro - Raftopoulos Production Tenant Activation Plan

REQUIRED_MARKER: PHASE94_TENANT_ACTIVATION_PLAN
REQUIRED_MARKER: TENANT_SLUG_RAFTOPoulos_PRODUCTION
REQUIRED_MARKER: USERS_NEXT_PHASE
REQUIRED_MARKER: CREDENTIALS_SEPARATE

## Tenant to activate

Tenant name:
Raftopoulos Production

Tenant slug:
raftopoulos-production

Purpose:
Production tenant for controlled CPAP monitoring rollout.

## Initial roles

Platform Super Admin:
Platform owner only.

Tenant Admin:
Raftopoulos management account.

Operations Users:
Follow-up / support team.

Management Viewer:
Read-only dashboard and reports.

Doctor Users:
Future stage.

Patient Users:
Future stage.

## Next phase

Phase 95 must create:
- tenant activation SQL / API plan
- role creation plan
- user creation plan
- credentials pack template
- rollback / disable plan

## Security

Credentials are delivered separately.
Super admin credentials are not shared.
'@

Set-Content -Path $TenantActivationPlan -Value $TenantPlanContent -Encoding UTF8

foreach ($Path in @($DiscoveryDoc, $TenantActivationPlan)) {
    if (Test-Path $Path) {
        Add-Result ("Activation doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Activation doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY",
    "DB_DISCOVERY_BEFORE_TENANT_CREATION",
    "TENANT_RAFTOPoulos_PRODUCTION_NEXT",
    "NO_REAL_PATIENT_IMPORT",
    "PHASE94_TENANT_ACTIVATION_PLAN",
    "TENANT_SLUG_RAFTOPoulos_PRODUCTION",
    "USERS_NEXT_PHASE",
    "CREDENTIALS_SEPARATE"
)) {
    $Found = $false

    foreach ($Path in @($DiscoveryDoc, $TenantActivationPlan)) {
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

# Git status.
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
    $FinalStatus = "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE94_PRODUCTION_DB_TENANT_ACTIVATION_DISCOVERY_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 94 Production DB / Tenant Activation Discovery"
Write-Host "============================================================"
Write-Host ""
Write-Host "Discovery doc:"
Write-Host $DiscoveryDoc
Write-Host ""
Write-Host "Tenant activation plan:"
Write-Host $TenantActivationPlan
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