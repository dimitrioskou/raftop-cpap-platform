# RAFTOP CPAP CARE Pro
# Phase 92 - Final Sale-Ready Release Tag Gate
# Final release lock before sending buyer package.
# ASCII-safe script.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$ClientDeliveryDir = Join-Path $Root "client-delivery"
$SendFolder = Join-Path $Desktop "RAFTOP_SEND_TO_BUYER_FINAL"
$SendZip = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$SendMessage = Join-Path $SendFolder "01_MESSAGE_TO_SEND_GR.txt"
$OpenFirst = Join-Path $SendFolder "00_OPEN_FIRST.txt"
$DoNotSend = Join-Path $SendFolder "02_DO_NOT_SEND.txt"

$ReleaseNote = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_RELEASE_NOTE_v1.0.md"
$TagInstruction = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_GIT_TAG_INSTRUCTION_v1.0.md"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $ClientDeliveryDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase92_final_sale_ready_release_tag_gate_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 92 Final Sale-Ready Release Tag Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 92 - Final Sale-Ready Release Tag Gate..."
Write-Host ""

Check-ReportStatus "Phase 91 buyer send negotiation pack latest status" "phase91_buyer_send_meeting_negotiation_control_pack_*.md" @(
    "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY",
    "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY_WITH_WARNINGS"
)

foreach ($Path in @($SendFolder, $SendZip, $SendMessage, $OpenFirst, $DoNotSend)) {
    if (Test-Path $Path) {
        Add-Result ("Required final send item exists: " + $Path) "PASS" "Found."
    } else {
        Add-Result ("Required final send item exists: " + $Path) "FAIL" "Missing."
    }
}

# Inspect send ZIP.
if (Test-Path $SendZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($SendZip)
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
            "03_7000_PATIENT_PRODUCTION_ROLLOUT_PACK/85_GDPR_DPA_BLOCKER_NOTICE.md"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("Final send ZIP required entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("Final send ZIP required entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env",
            "DATABASE_URL",
            "JWT_SECRET",
            "SUPER_ADMIN_API_KEY",
            "RESTORE_KEY",
            "RAFTOP_BACKUPS"
        )

        foreach ($Forbidden in $ForbiddenEntries) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden final send ZIP entry absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden final send ZIP entry absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }

    } catch {
        Add-Result "Final send ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

$ReleaseNoteContent = @'
# RAFTOP CPAP CARE Pro - Final Release Note v1.0

REQUIRED_MARKER: PHASE92_FINAL_RELEASE_NOTE
REQUIRED_MARKER: FINAL_SALE_READY_RELEASE
REQUIRED_MARKER: SEND_PACKAGE_READY
REQUIRED_MARKER: NO_SOURCE_CODE_NO_SECRETS
REQUIRED_MARKER: REAL_PATIENT_IMPORT_BLOCKED_UNTIL_AGREEMENT

## Release status

RAFTOP CPAP CARE Pro is sale-ready for buyer delivery.

## Send package

Folder:
C:\Users\Administrator\Desktop\RAFTOP_SEND_TO_BUYER_FINAL

File to send:
RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip

Buyer-only link:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

## What is included

- buyer product package
- commercial sale pack
- pricing options
- license/support scope
- resale rights terms
- 7000-patient controlled rollout pack
- buyer acceptance documents
- GDPR / DPA blocker notice
- staged import plan

## What is not included

- source code
- GitHub repository
- tools
- reports
- backend source
- frontend source
- secrets
- .env
- database URL
- API keys
- super admin credentials
- real patient CSV
- production patient data

## Next step

Send the ZIP and buyer-only link.
Then request a buyer meeting.
'@

Set-Content -Path $ReleaseNote -Value $ReleaseNoteContent -Encoding UTF8

$TagInstructionContent = @'
# RAFTOP CPAP CARE Pro - Final Git Tag Instruction

REQUIRED_MARKER: PHASE92_FINAL_GIT_TAG_INSTRUCTION
REQUIRED_MARKER: TAG_RAFTOP_FINAL_SALE_READY

After Phase 92 passes and git status is clean, run:

git tag raftop-final-sale-ready-v1.0.0
git push origin raftop-final-sale-ready-v1.0.0

If the tag already exists:

git tag -d raftop-final-sale-ready-v1.0.0
git push origin :refs/tags/raftop-final-sale-ready-v1.0.0

git tag raftop-final-sale-ready-v1.0.0
git push origin raftop-final-sale-ready-v1.0.0
'@

Set-Content -Path $TagInstruction -Value $TagInstructionContent -Encoding UTF8

foreach ($Path in @($ReleaseNote, $TagInstruction)) {
    if (Test-Path $Path) {
        Add-Result ("Release file created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Release file created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

foreach ($Marker in @(
    "PHASE92_FINAL_RELEASE_NOTE",
    "FINAL_SALE_READY_RELEASE",
    "SEND_PACKAGE_READY",
    "NO_SOURCE_CODE_NO_SECRETS",
    "REAL_PATIENT_IMPORT_BLOCKED_UNTIL_AGREEMENT",
    "PHASE92_FINAL_GIT_TAG_INSTRUCTION",
    "TAG_RAFTOP_FINAL_SALE_READY"
)) {
    $Found = $false

    foreach ($Path in @($ReleaseNote, $TagInstruction)) {
        $Content = Read-FileSafe $Path
        if (ContainsText $Content $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required release marker exists: " + $Marker) "PASS" "Found."
    } else {
        Add-Result ("Required release marker exists: " + $Marker) "FAIL" "Missing."
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
    $FinalStatus = "PHASE92_FINAL_SALE_READY_RELEASE_TAG_GATE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE92_FINAL_SALE_READY_RELEASE_TAG_GATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE92_FINAL_SALE_READY_RELEASE_TAG_GATE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 92 Final Sale-Ready Release Tag Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Send folder:"
Write-Host $SendFolder
Write-Host ""
Write-Host "ZIP to send:"
Write-Host $SendZip
Write-Host ""
Write-Host "Release note:"
Write-Host $ReleaseNote
Write-Host ""
Write-Host "Tag instruction:"
Write-Host $TagInstruction
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