# RAFTOP CPAP CARE Pro
# Phase 88 - Final Sale Package Delivery Readiness Gate
# ASCII-safe script.
# Verifies final sale package ZIP, copies it to Desktop, creates checksum and final delivery checklist.
# Does not include source code, tools, reports, secrets, .env, backend, frontend, DB credentials.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$ClientDeliveryDir = Join-Path $Root "client-delivery"
$FinalSaleDir = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0"
$FinalSaleZip = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"

$DesktopZip = Join-Path $Desktop "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$ChecksumFile = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0_SHA256.txt"
$DesktopChecksumFile = Join-Path $Desktop "RAFTOP_FINAL_SALE_PACKAGE_v1.0_SHA256.txt"
$DeliveryChecklist = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_DELIVERY_CHECKLIST.md"
$DesktopChecklist = Join-Path $Desktop "RAFTOP_FINAL_SALE_PACKAGE_DELIVERY_CHECKLIST.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDeliveryDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase88_final_sale_package_delivery_readiness_gate_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 88 Final Sale Package Delivery Readiness Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 88 - Final Sale Package Delivery Readiness Gate..."
Write-Host ""

Check-ReportStatus "Phase 87 final sale package latest status" "phase87_final_sale_package_master_gate_*.md" @(
    "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY",
    "PHASE87_FINAL_SALE_PACKAGE_MASTER_GATE_READY_WITH_WARNINGS"
)

if (Test-Path $FinalSaleDir) {
    Add-Result "Final sale package folder exists" "PASS" $FinalSaleDir
} else {
    Add-Result "Final sale package folder exists" "FAIL" $FinalSaleDir
}

if (Test-Path $FinalSaleZip) {
    $ZipInfo = Get-Item $FinalSaleZip
    Add-Result "Final sale package ZIP exists" "PASS" ("Found. Size bytes: " + $ZipInfo.Length)
} else {
    Add-Result "Final sale package ZIP exists" "FAIL" $FinalSaleZip
}

# Inspect final ZIP.
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
            "02_COMMERCIAL_SALE_PACK/86_LICENSE_AND_SUPPORT_SCOPE.md",
            "02_COMMERCIAL_SALE_PACK/86_RESALE_RIGHTS_TERMS.md",
            "02_COMMERCIAL_SALE_PACK/86_PAYMENT_MILESTONES.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_BUYER_ACCEPTANCE_CHECKLIST.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_PRODUCTION_ROLLOUT_SIGNOFF.md",
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_GDPR_DPA_BLOCKER_NOTICE.md"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("ZIP required entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("ZIP required entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenEntryPatterns = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "RAFTOP_BACKUPS",
            "DATABASE_URL",
            "JWT_SECRET",
            "SUPER_ADMIN_API_KEY",
            "RESTORE_KEY"
        )

        foreach ($Forbidden in $ForbiddenEntryPatterns) {
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

# Check final sale folder content for forbidden paths.
if (Test-Path $FinalSaleDir) {
    $AllFiles = Get-ChildItem -Path $FinalSaleDir -Recurse -File -ErrorAction SilentlyContinue

    $ForbiddenPathPatterns = @(
        "\tools\",
        "\reports\",
        "\enterprise-backend\",
        "\enterprise-frontend\",
        "\node_modules\",
        "\.git\",
        ".env",
        "RAFTOP_BACKUPS"
    )

    foreach ($Forbidden in $ForbiddenPathPatterns) {
        $Matches = $AllFiles | Where-Object { $_.FullName -like ("*" + $Forbidden + "*") }

        if ($Matches.Count -eq 0) {
            Add-Result ("Forbidden final folder path absent: " + $Forbidden) "PASS" "No matching paths."
        } else {
            Add-Result ("Forbidden final folder path absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches.FullName -join "; "))
        }
    }
}

# Copy ZIP to Desktop.
if (Test-Path $FinalSaleZip) {
    Copy-Item $FinalSaleZip $DesktopZip -Force

    if (Test-Path $DesktopZip) {
        Add-Result "Final ZIP copied to Desktop" "PASS" $DesktopZip
    } else {
        Add-Result "Final ZIP copied to Desktop" "FAIL" $DesktopZip
    }
}

# Create SHA256 checksum.
if (Test-Path $FinalSaleZip) {
    try {
        $Hash = Get-FileHash -Path $FinalSaleZip -Algorithm SHA256

        $ChecksumContent = @(
            "RAFTOP CPAP CARE Pro - Final Sale Package SHA256",
            "",
            ("File: " + $FinalSaleZip),
            ("SHA256: " + $Hash.Hash),
            "",
            "Use this checksum to confirm the ZIP was not altered after delivery."
        )

        Set-Content -Path $ChecksumFile -Value $ChecksumContent -Encoding UTF8
        Copy-Item $ChecksumFile $DesktopChecksumFile -Force

        Add-Result "SHA256 checksum created" "PASS" $ChecksumFile
        Add-Result "SHA256 checksum copied to Desktop" "PASS" $DesktopChecksumFile
    } catch {
        Add-Result "SHA256 checksum created" "FAIL" ("Could not create checksum: " + $_.Exception.Message)
    }
}

$ChecklistContent = @'
# RAFTOP CPAP CARE Pro - Final Delivery Checklist

REQUIRED_MARKER: PHASE88_FINAL_DELIVERY_CHECKLIST
REQUIRED_MARKER: FINAL_ZIP_READY_TO_SEND
REQUIRED_MARKER: SEND_ONLY_MASTER_PACKAGE
REQUIRED_MARKER: NO_SOURCE_CODE_NO_SECRETS

## Final file to send

Send only this ZIP:

RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip

## Also send the buyer-only link

https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## Do not send

Do not send:
- old ZIP files
- source code
- GitHub repository
- Render account access
- database URL
- .env
- API keys
- super admin credentials
- production patient data
- real patient CSV

## Buyer opens first

Inside the ZIP, buyer should open:

00_START_HERE.md

Then:
01_BUYER_PRODUCT_PACKAGE/RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip

Inside the buyer ZIP:
RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf

## If buyer accepts

Next steps:
1. Agree commercial option.
2. Sign agreement.
3. Confirm GDPR / DPA.
4. Confirm tenant users.
5. Validate CSV.
6. Start 100-row controlled import.
7. Then 500, 2000, 7000 only after signoff.
'@

Set-Content -Path $DeliveryChecklist -Value $ChecklistContent -Encoding UTF8
Copy-Item $DeliveryChecklist $DesktopChecklist -Force

if (Test-Path $DeliveryChecklist) {
    Add-Result "Final delivery checklist created" "PASS" $DeliveryChecklist
} else {
    Add-Result "Final delivery checklist created" "FAIL" $DeliveryChecklist
}

if (Test-Path $DesktopChecklist) {
    Add-Result "Final delivery checklist copied to Desktop" "PASS" $DesktopChecklist
} else {
    Add-Result "Final delivery checklist copied to Desktop" "FAIL" $DesktopChecklist
}

# Git warning.
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
    $FinalStatus = "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 88 Final Sale Package Delivery Readiness Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Final sale package ZIP:"
Write-Host $FinalSaleZip
Write-Host ""
Write-Host "Desktop ZIP:"
Write-Host $DesktopZip
Write-Host ""
Write-Host "Checksum:"
Write-Host $ChecksumFile
Write-Host ""
Write-Host "Delivery checklist:"
Write-Host $DeliveryChecklist
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