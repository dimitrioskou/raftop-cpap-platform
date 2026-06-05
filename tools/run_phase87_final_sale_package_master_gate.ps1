# RAFTOP CPAP CARE Pro
# Phase 87 - Final Sale Package Master Gate
# ASCII-safe script.
# Creates final buyer sale package ZIP.
# Does not include source code, tools, reports, secrets, .env, backend, frontend, GitHub, or database credentials.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$ClientDeliveryDir = Join-Path $Root "client-delivery"
$CommercialDocsDir = Join-Path $Root "docs\commercial-sale-pack"
$ProductionDocsDir = Join-Path $Root "docs\production-rollout"

$BuyerZip = Join-Path $ClientDeliveryDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip"

$FinalSaleDir = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0"
$FinalSaleZip = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"

$FinalReadme = Join-Path $FinalSaleDir "00_START_HERE.md"
$FinalContents = Join-Path $FinalSaleDir "01_PACKAGE_CONTENTS.md"
$FinalBoundary = Join-Path $FinalSaleDir "02_SECURITY_AND_DELIVERY_BOUNDARY.md"
$FinalNextSteps = Join-Path $FinalSaleDir "03_NEXT_STEPS_IF_BUYER_ACCEPTS.md"

$BuyerFolder = Join-Path $FinalSaleDir "01_BUYER_PRODUCT_PACKAGE"
$CommercialFolder = Join-Path $FinalSaleDir "02_COMMERCIAL_SALE_PACK"
$RolloutFolder = Join-Path $FinalSaleDir "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDeliveryDir -Force | Out-Null

if (Test-Path $FinalSaleDir) {
    Remove-Item $FinalSaleDir -Recurse -Force
}

if (Test-Path $FinalSaleZip) {
    Remove-Item $FinalSaleZip -Force
}

New-Item -ItemType Directory -Path $FinalSaleDir -Force | Out-Null
New-Item -ItemType Directory -Path $BuyerFolder -Force | Out-Null
New-Item -ItemType Directory -Path $CommercialFolder -Force | Out-Null
New-Item -ItemType Directory -Path $RolloutFolder -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase87_final_sale_package_master_gate_" + $Timestamp + ".md")

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

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }

    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 87 Final Sale Package Master Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 87 - Final Sale Package Master Gate..."
Write-Host ""

Check-ReportStatus "Phase 79 preflight latest status" "phase79_7000_patient_production_rollout_preflight_gate_*.md" @(
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY",
    "PHASE79_7000_PATIENT_PRODUCTION_ROLLOUT_PREFLIGHT_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 80 tenant roles access latest status" "phase80_production_tenant_roles_access_pack_*.md" @(
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY",
    "PHASE80_PRODUCTION_TENANT_ROLES_ACCESS_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 81 CSV validator latest status" "phase81_7000_patient_csv_master_validator_*.md" @(
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY",
    "PHASE81_7000_PATIENT_CSV_MASTER_VALIDATOR_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 82 synthetic dry-run latest status" "phase82_7000_patient_synthetic_dry_run_import_pack_*.md" @(
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY",
    "PHASE82_7000_PATIENT_SYNTHETIC_DRY_RUN_IMPORT_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 83 staging gate latest status" "phase83_production_import_staging_gate_*.md" @(
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY",
    "PHASE83_PRODUCTION_IMPORT_STAGING_GATE_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 84 ATLAS 80h reports latest status" "phase84_atlas_80h_reports_verification_pack_*.md" @(
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY",
    "PHASE84_ATLAS_80H_REPORTS_VERIFICATION_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 85 buyer acceptance latest status" "phase85_buyer_acceptance_production_rollout_signoff_pack_*.md" @(
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY",
    "PHASE85_BUYER_ACCEPTANCE_PRODUCTION_ROLLOUT_SIGNOFF_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 86 commercial sale latest status" "phase86_final_commercial_sale_pack_*.md" @(
    "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY",
    "PHASE86_FINAL_COMMERCIAL_SALE_PACK_READY_WITH_WARNINGS"
)

Test-PathExists "Buyer ZIP exists" $BuyerZip
Test-PathExists "Commercial docs folder exists" $CommercialDocsDir
Test-PathExists "Production rollout docs folder exists" $ProductionDocsDir

# Copy buyer package
if (Test-Path $BuyerZip) {
    Copy-Item $BuyerZip (Join-Path $BuyerFolder "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip") -Force
    Add-Result "Buyer ZIP copied into final sale package" "PASS" "Copied buyer ZIP."
} else {
    Add-Result "Buyer ZIP copied into final sale package" "FAIL" "Buyer ZIP missing."
}

# Copy commercial docs
$CommercialFiles = @(
    "86_COMMERCIAL_OFFER_RAFTOP_CPAP_CARE_PRO.md",
    "86_PRICING_OPTIONS.md",
    "86_LICENSE_AND_SUPPORT_SCOPE.md",
    "86_RESALE_RIGHTS_TERMS.md",
    "86_PAYMENT_MILESTONES.md",
    "86_FINAL_SALES_HANDOVER_CHECKLIST.md",
    "86_BUYER_EMAIL_DRAFT.md"
)

foreach ($File in $CommercialFiles) {
    $Source = Join-Path $CommercialDocsDir $File
    $Dest = Join-Path $CommercialFolder $File

    if (Test-Path $Source) {
        Copy-Item $Source $Dest -Force
        Add-Result ("Commercial file copied: " + $File) "PASS" "Copied."
    } else {
        Add-Result ("Commercial file copied: " + $File) "FAIL" "Missing."
    }
}

# Copy production docs
$ProductionFiles = @(
    "80_PRODUCTION_TENANT_SETUP.md",
    "80_ROLE_MATRIX.csv",
    "80_ACCESS_AND_CREDENTIALS_DELIVERY_RULES.md",
    "80_7000_PATIENT_ROLLOUT_ACCESS_ONBOARDING.md",
    "80_PRODUCTION_ACCESS_SIGNOFF.md",
    "81_7000_PATIENT_CSV_SCHEMA.md",
    "81_CSV_VALIDATION_RULES.md",
    "82_7000_PATIENT_DRY_RUN_IMPORT_PLAN.md",
    "83_PRODUCTION_IMPORT_STAGING_GATE.md",
    "83_STAGE_ACCEPTANCE_CHECKLIST.csv",
    "83_IMPORT_ROLLBACK_AND_STOP_RULES.md",
    "84_ATLAS_80H_REPORTS_VERIFICATION.md",
    "85_BUYER_ACCEPTANCE_CHECKLIST.md",
    "85_PRODUCTION_ROLLOUT_SIGNOFF.md",
    "85_7000_PATIENT_IMPORT_APPROVAL_FORM.md",
    "85_GDPR_DPA_BLOCKER_NOTICE.md",
    "85_COMMERCIAL_ACCEPTANCE_NOTE.md",
    "85_FINAL_BUYER_TO_PRODUCTION_HANDOVER.md"
)

foreach ($File in $ProductionFiles) {
    $Source = Join-Path $ProductionDocsDir $File
    $Dest = Join-Path $RolloutFolder $File

    if (Test-Path $Source) {
        Copy-Item $Source $Dest -Force
        Add-Result ("Production rollout file copied: " + $File) "PASS" "Copied."
    } else {
        Add-Result ("Production rollout file copied: " + $File) "FAIL" "Missing."
    }
}

$ReadmeContent = @'
# RAFTOP CPAP CARE Pro - Final Sale Package

REQUIRED_MARKER: PHASE87_FINAL_SALE_PACKAGE
REQUIRED_MARKER: FINAL_BUYER_SALE_PACKAGE
REQUIRED_MARKER: NO_SOURCE_CODE_INCLUDED
REQUIRED_MARKER: NO_SECRETS_INCLUDED

## Start here

This package is the final commercial and buyer-facing sale package for RAFTOP CPAP CARE Pro.

It includes:
1. Buyer product package
2. Commercial sale pack
3. 7000-patient controlled production rollout pack

## Buyer-only link

https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Main buyer ZIP

Open:
01_BUYER_PRODUCT_PACKAGE/RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip

Inside the buyer ZIP, the main PDF is:
RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf

## Important boundary

This package does not include:
- source code
- GitHub repository
- .env files
- API keys
- database URL
- Render secrets
- super admin credentials
- production patient data
- real patient CSV

## Before real data import

Real 7000-patient import requires:
- commercial agreement
- GDPR / DPA
- access approval
- CSV validation
- staged signoff
- buyer acceptance
'@

Set-Content -Path $FinalReadme -Value $ReadmeContent -Encoding UTF8

$ContentsContent = @'
# Package Contents

REQUIRED_MARKER: PHASE87_PACKAGE_CONTENTS

## Folder 01_BUYER_PRODUCT_PACKAGE

Contains the buyer-only ZIP.

## Folder 02_COMMERCIAL_SALE_PACK

Contains:
- commercial offer
- pricing options
- license and support scope
- resale rights terms
- payment milestones
- final sales checklist
- buyer email draft

## Folder 03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK

Contains:
- production tenant setup
- role matrix
- access rules
- CSV schema
- validation rules
- dry-run plan
- staging gate
- rollback and stop rules
- ATLAS / 80h verification
- buyer acceptance
- import approval
- GDPR / DPA blocker notice
- production signoff
'@

Set-Content -Path $FinalContents -Value $ContentsContent -Encoding UTF8

$BoundaryContent = @'
# Security and Delivery Boundary

REQUIRED_MARKER: PHASE87_SECURITY_DELIVERY_BOUNDARY
REQUIRED_MARKER: NO_SECRETS_INCLUDED
REQUIRED_MARKER: NO_SOURCE_CODE_INCLUDED
REQUIRED_MARKER: CREDENTIALS_SEPARATE_DELIVERY

## Not included

This package must not include:
- source code
- backend
- frontend source folder
- tools folder
- reports folder
- node_modules
- .git
- .env
- secrets
- real patient data
- database backups

## Credentials

Credentials must be delivered separately after agreement and role approval.

## Super admin

Super admin credentials are not included and must not be shared.
'@

Set-Content -Path $FinalBoundary -Value $BoundaryContent -Encoding UTF8

$NextStepsContent = @'
# Next Steps if Buyer Accepts

REQUIRED_MARKER: PHASE87_NEXT_STEPS_IF_BUYER_ACCEPTS
REQUIRED_MARKER: COMMERCIAL_AGREEMENT_FIRST
REQUIRED_MARKER: GDPR_DPA_BEFORE_REAL_IMPORT
REQUIRED_MARKER: STAGED_7000_ROLLOUT

## If buyer says yes

Step 1:
Confirm commercial option.

Step 2:
Confirm payment milestone.

Step 3:
Confirm GDPR / DPA.

Step 4:
Confirm production tenant and users.

Step 5:
Validate CSV.

Step 6:
Run 100-row controlled import.

Step 7:
Run 500-row stage.

Step 8:
Run 2000-row stage.

Step 9:
Run 7000-row stage only after signoff.

## Hard stop

Do not import real patient data before agreement, GDPR / DPA, CSV validation, and stage signoff.
'@

Set-Content -Path $FinalNextSteps -Value $NextStepsContent -Encoding UTF8

Test-PathExists "Final README exists" $FinalReadme
Test-PathExists "Final contents doc exists" $FinalContents
Test-PathExists "Final boundary doc exists" $FinalBoundary
Test-PathExists "Final next steps doc exists" $FinalNextSteps

# Safety scan final sale directory
$ForbiddenNames = @(
    "tools",
    "reports/",
    "enterprise-backend",
    "enterprise-frontend",
    "node_modules",
    ".git",
    ".env",
    "RAFTOP_BACKUPS",
    "DATABASE_URL",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY"
)

$AllFinalFiles = Get-ChildItem -Path $FinalSaleDir -Recurse -File -ErrorAction SilentlyContinue

foreach ($Forbidden in $ForbiddenNames) {
    $Matches = $AllFinalFiles | Where-Object {
        $_.FullName -like ("*" + $Forbidden + "*")
    }

    if ($Matches.Count -eq 0) {
        Add-Result ("Forbidden filename/path absent: " + $Forbidden) "PASS" "No matching paths."
    } else {
        Add-Result ("Forbidden filename/path absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches.FullName -join "; "))
    }
}

# Content safety scan
$ForbiddenContent = @(
    "DATABASE_URL=",
    "JWT_SECRET=",
    "SUPER_ADMIN_API_KEY=",
    "RESTORE_KEY=",
    "Bearer ",
    "postgres://",
    "postgresql://",
    "source code included",
    "super admin credentials included",
    "real 7000 import allowed immediately",
    "GDPR not required"
)

foreach ($File in $AllFinalFiles) {
    $Content = Read-FileSafe $File.FullName

    foreach ($Forbidden in $ForbiddenContent) {
        if (ContainsText $Content $Forbidden) {
            Add-Result ("Forbidden content absent in " + $File.Name + ": " + $Forbidden) "FAIL" "Forbidden content found."
        }
    }
}

# If no content scan failures were added for each forbidden phrase, record global pass checks
foreach ($Forbidden in $ForbiddenContent) {
    $AnyFound = $false

    foreach ($File in $AllFinalFiles) {
        $Content = Read-FileSafe $File.FullName
        if (ContainsText $Content $Forbidden) {
            $AnyFound = $true
            break
        }
    }

    if (-not $AnyFound) {
        Add-Result ("Forbidden content absent package-wide: " + $Forbidden) "PASS" "Absent."
    }
}

# Create final ZIP
Compress-Archive -Path (Join-Path $FinalSaleDir "*") -DestinationPath $FinalSaleZip -Force

if (Test-Path $FinalSaleZip) {
    Add-Result "Final sale package ZIP created" "PASS" $FinalSaleZip
} else {
    Add-Result "Final sale package ZIP created" "FAIL" $FinalSaleZip
}

# Inspect ZIP
if (Test-Path $FinalSaleZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($FinalSaleZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredEntries = @(
            "00_START_HERE.md",
            "01_PACKAGE_CONTENTS.md",
            "02_SECURITY_AND_DELIVERY_BOUNDARY.md",
            "03_NEXT_STEPS_IF_BUYER_ACCEPTS.md",
            "01_BUYER_PRODUCT_PACKAGE/RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip",
            "02_COMMERCIAL_SALE_PACK/86_COMMERCIAL_OFFER_RAFTOP_CPAP_CARE_PRO.md",
            "02_COMMERCIAL_SALE_PACK/86_PRICING_OPTIONS.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_BUYER_ACCEPTANCE_CHECKLIST.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_GDPR_DPA_BLOCKER_NOTICE.md"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("ZIP entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("ZIP entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        foreach ($Forbidden in $ForbiddenNames) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden ZIP entry absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden ZIP entry absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }

    } catch {
        Add-Result "Final ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

# Git warning
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
    $FinalStatus = "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 87 Final Sale Package Master Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Final sale package folder:"
Write-Host $FinalSaleDir
Write-Host ""
Write-Host "Final sale package ZIP:"
Write-Host $FinalSaleZip
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
