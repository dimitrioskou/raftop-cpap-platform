# RAFTOP CPAP CARE Pro
# Phase 89 - Final Send-to-Buyer Pack
# Creates a clean Desktop folder with only the files/message intended for the buyer.
# No source code, no tools, no reports, no secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$ClientDeliveryDir = Join-Path $Root "client-delivery"

$FinalSaleZip = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$ChecksumFile = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_v1.0_SHA256.txt"
$DeliveryChecklist = Join-Path $ClientDeliveryDir "RAFTOP_FINAL_SALE_PACKAGE_DELIVERY_CHECKLIST.md"

$SendFolder = Join-Path $Desktop "RAFTOP_SEND_TO_BUYER_FINAL"
$SendZip = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
$SendChecksum = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_v1.0_SHA256.txt"
$SendChecklist = Join-Path $SendFolder "RAFTOP_FINAL_SALE_PACKAGE_DELIVERY_CHECKLIST.md"
$SendMessage = Join-Path $SendFolder "01_MESSAGE_TO_SEND_GR.txt"
$DoNotSend = Join-Path $SendFolder "02_DO_NOT_SEND.txt"
$OpenFirst = Join-Path $SendFolder "00_OPEN_FIRST.txt"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

if (Test-Path $SendFolder) {
    Remove-Item $SendFolder -Recurse -Force
}

New-Item -ItemType Directory -Path $SendFolder -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase89_final_send_to_buyer_pack_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 89 Final Send-to-Buyer Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 89 - Final Send-to-Buyer Pack..."
Write-Host ""

Check-ReportStatus "Phase 88 delivery readiness latest status" "phase88_final_sale_package_delivery_readiness_gate_*.md" @(
    "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY",
    "PHASE88_FINAL_SALE_PACKAGE_DELIVERY_READINESS_READY_WITH_WARNINGS"
)

if (Test-Path $FinalSaleZip) {
    Copy-Item $FinalSaleZip $SendZip -Force
    Add-Result "Final sale ZIP copied to send folder" "PASS" $SendZip
} else {
    Add-Result "Final sale ZIP copied to send folder" "FAIL" $FinalSaleZip
}

if (Test-Path $ChecksumFile) {
    Copy-Item $ChecksumFile $SendChecksum -Force
    Add-Result "Checksum copied to send folder" "PASS" $SendChecksum
} else {
    Add-Result "Checksum copied to send folder" "WARN" "Checksum file not found."
}

if (Test-Path $DeliveryChecklist) {
    Copy-Item $DeliveryChecklist $SendChecklist -Force
    Add-Result "Delivery checklist copied to send folder" "PASS" $SendChecklist
} else {
    Add-Result "Delivery checklist copied to send folder" "WARN" "Delivery checklist not found."
}

$OpenFirstContent = @'
RAFTOP CPAP CARE Pro - Final Send Folder

SEND ONLY:

1. RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip
2. Buyer-only link:
   https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

OPTIONAL:
3. RAFTOP_FINAL_SALE_PACKAGE_v1.0_SHA256.txt

DO NOT SEND:
- source code
- GitHub repo
- .env
- database URL
- Render secrets
- API keys
- super admin credentials
- old ZIP files
- real patient CSV
- production patient data

The buyer should open:
00_START_HERE.md inside the ZIP.
'@

Set-Content -Path $OpenFirst -Value $OpenFirstContent -Encoding UTF8

$MessageContent = @'
Καλημέρα,

Σας στέλνω το τελικό buyer package για την πλατφόρμα RAFTOP CPAP CARE Pro.

Περιλαμβάνει:
- παρουσίαση της πλατφόρμας
- πλήρη οδηγό λειτουργιών
- ATLAS / AirView-like monitoring
- SleepHQ-style CPAP analysis
- 80 Hours Compliance
- Compliance Rescue
- πλάνο controlled rollout για έως 7.000 CPAP ασθενείς
- staged import plan 100 / 500 / 2.000 / 7.000
- εμπορικό πακέτο, scope, υποστήριξη και δυνατότητα μεταπώλησης σε ιατρούς/ιατρεία

Buyer-only link:
https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/

Συνημμένο:
RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip

Σημαντικό:
Η παραγωγική εισαγωγή πραγματικών δεδομένων ασθενών γίνεται μόνο μετά από εμπορική συμφωνία, GDPR/DPA επιβεβαίωση, CSV validation και staged signoff.

Προτεινόμενο επόμενο βήμα:
να ορίσουμε σύντομη συνάντηση για να δούμε το buyer package, να συμφωνήσουμε το εμπορικό μοντέλο και να ξεκινήσουμε controlled activation.
'@

Set-Content -Path $SendMessage -Value $MessageContent -Encoding UTF8

$DoNotSendContent = @'
DO NOT SEND THESE TO BUYER:

- C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-backend
- C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-frontend
- C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\tools
- C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\reports
- GitHub repository link
- Render dashboard access
- database URL
- .env files
- JWT secret
- restore key
- super admin API key
- super admin credentials
- old ZIP files
- real patient CSV
- real patient data
- any backup folder

ONLY SEND:
- RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip
- buyer-only link
- optional SHA256 file
'@

Set-Content -Path $DoNotSend -Value $DoNotSendContent -Encoding UTF8

foreach ($Path in @($OpenFirst, $SendMessage, $DoNotSend)) {
    if (Test-Path $Path) {
        Add-Result ("Send instruction file exists: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Send instruction file exists: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# Inspect send folder.
$Files = Get-ChildItem -Path $SendFolder -Recurse -File -ErrorAction SilentlyContinue

$RequiredFiles = @(
    "00_OPEN_FIRST.txt",
    "01_MESSAGE_TO_SEND_GR.txt",
    "02_DO_NOT_SEND.txt",
    "RAFTOP_FINAL_SALE_PACKAGE_v1.0.zip"
)

foreach ($Required in $RequiredFiles) {
    $Match = $Files | Where-Object { $_.Name -eq $Required }

    if ($Match.Count -gt 0) {
        Add-Result ("Required send-folder file exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required send-folder file exists: " + $Required) "FAIL" "Missing."
    }
}

$ForbiddenNames = @(
    "tools",
    "reports",
    "enterprise-backend",
    "enterprise-frontend",
    "node_modules",
    ".git",
    ".env",
    "DATABASE_URL",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY"
)

foreach ($Forbidden in $ForbiddenNames) {
    $Matches = $Files | Where-Object {
        $_.FullName -like ("*" + $Forbidden + "*")
    }

    if ($Matches.Count -eq 0) {
        Add-Result ("Forbidden send-folder path absent: " + $Forbidden) "PASS" "No matching files."
    } else {
        Add-Result ("Forbidden send-folder path absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches.FullName -join "; "))
    }
}

# Inspect final ZIP inside send folder.
if (Test-Path $SendZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($SendZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "00_START_HERE.md") {
            Add-Result "Send ZIP contains 00_START_HERE.md" "PASS" "Entry found."
        } else {
            Add-Result "Send ZIP contains 00_START_HERE.md" "FAIL" "Entry missing."
        }

        foreach ($Forbidden in @("tools/", "reports/", "enterprise-backend/", "enterprise-frontend/", "node_modules/", ".git/", ".env")) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }

            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden send ZIP entry absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden send ZIP entry absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "Send ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

# Git warning only.
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
    $FinalStatus = "PHASE89_FINAL_SEND_TO_BUYER_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE89_FINAL_SEND_TO_BUYER_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE89_FINAL_SEND_TO_BUYER_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 89 Final Send-to-Buyer Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Send folder:"
Write-Host $SendFolder
Write-Host ""
Write-Host "ZIP to send:"
Write-Host $SendZip
Write-Host ""
Write-Host "Message to send:"
Write-Host $SendMessage
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