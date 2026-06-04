# RAFTOP CPAP CARE Pro
# Phase 76 - Encoding-clean buyer-only view
# Fixes mojibake / corrupted Greek text in public buyer view and ZIP pack.
# ASCII-safe script. Greek HTML is stored as GZip Base64 UTF-8.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"

$BuyerViewDir = Join-Path $Root "enterprise-frontend\public\raftopoulos-buyer-view"
$BuyerViewIndex = Join-Path $BuyerViewDir "index.html"

$DeliveryRoot = Join-Path $Root "client-delivery"
$PackDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0"
$PackIndex = Join-Path $PackDir "index.html"
$PackPdf = Join-Path $PackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf"
$PackZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $BuyerViewDir -Force | Out-Null
New-Item -ItemType Directory -Path $PackDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase76_fix_buyer_view_encoding_clean_" + $Timestamp + ".md")

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

function ContainsCharCode {
    param([string]$Content, [int]$Code)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }

    foreach ($Char in $Content.ToCharArray()) {
        if ([int][char]$Char -eq $Code) {
            return $true
        }
    }

    return $false
}

function Expand-GzipBase64ToText {
    param([string]$Base64Text)

    $Clean = $Base64Text -replace "\s", ""
    $Bytes = [Convert]::FromBase64String($Clean)

    $InputStream = New-Object System.IO.MemoryStream(,$Bytes)
    $GzipStream = New-Object System.IO.Compression.GzipStream($InputStream, [System.IO.Compression.CompressionMode]::Decompress)
    $OutputStream = New-Object System.IO.MemoryStream

    $GzipStream.CopyTo($OutputStream)
    $GzipStream.Dispose()
    $InputStream.Dispose()

    return [System.Text.Encoding]::UTF8.GetString($OutputStream.ToArray())
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 76 Encoding-Clean Buyer View" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 76 Encoding-Clean Buyer View..."
Write-Host ""

$HtmlGzipBase64 = @'
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
'@

$Html = Expand-GzipBase64ToText $HtmlGzipBase64

Set-Content -Path $BuyerViewIndex -Value $Html -Encoding UTF8
Set-Content -Path $PackIndex -Value $Html -Encoding UTF8

if (Test-Path $BuyerViewIndex) { Add-Result "Public buyer view written" "PASS" $BuyerViewIndex } else { Add-Result "Public buyer view written" "FAIL" $BuyerViewIndex }
if (Test-Path $PackIndex) { Add-Result "Pack index written" "PASS" $PackIndex } else { Add-Result "Pack index written" "FAIL" $PackIndex }

$PublicHtml = Get-Content -Path $BuyerViewIndex -Raw -Encoding UTF8
$PackHtml = Get-Content -Path $PackIndex -Raw -Encoding UTF8

$RequiredMarkers = @(
    "REQUIRED_MARKER: PHASE76_ENCODING_CLEAN_BUYER_VIEW",
    "REQUIRED_MARKER: BUYER_ONLY_VIEW",
    "REQUIRED_MARKER: AIRVIEW_CONTEXT",
    "REQUIRED_MARKER: SLEEPHQ_CONTEXT",
    "REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE",
    "ATLAS / AirView-like Monitoring",
    "AirView-like Patient Monitoring",
    "SleepHQ-style CPAP Analysis",
    "80 Hours Compliance",
    "Compliance Rescue",
    "80h/month rule",
    "Compliance risk"
)

foreach ($Marker in $RequiredMarkers) {
    if (ContainsText $PublicHtml $Marker) { Add-Result ("Public marker: " + $Marker) "PASS" "Found." } else { Add-Result ("Public marker: " + $Marker) "FAIL" "Missing." }
    if (ContainsText $PackHtml $Marker) { Add-Result ("Pack marker: " + $Marker) "PASS" "Found." } else { Add-Result ("Pack marker: " + $Marker) "FAIL" "Missing." }
}

$ForbiddenText = @(
    "Executive Demo Script",
    "Pilot Proposal",
    "Decision Launcher",
    "Objections",
    "Bearer token",
    "fallback active",
    "Authorization",
    "ChatGPT",
    "https://raftop-cpap-frontend.onrender.com/login"
)

foreach ($Text in $ForbiddenText) {
    if (ContainsText $PublicHtml $Text) { Add-Result ("Public forbidden absent: " + $Text) "FAIL" "Found." } else { Add-Result ("Public forbidden absent: " + $Text) "PASS" "Absent." }
    if (ContainsText $PackHtml $Text) { Add-Result ("Pack forbidden absent: " + $Text) "FAIL" "Found." } else { Add-Result ("Pack forbidden absent: " + $Text) "PASS" "Absent." }
}

# Mojibake guard: corrupted Greek often appears with U+039E and U+20AC.
if (ContainsCharCode $PublicHtml 0x039E) { Add-Result "Public mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Public mojibake Xi absent" "PASS" "Absent." }
if (ContainsCharCode $PackHtml 0x039E) { Add-Result "Pack mojibake Xi absent" "FAIL" "U+039E found." } else { Add-Result "Pack mojibake Xi absent" "PASS" "Absent." }
if (ContainsCharCode $PublicHtml 0x20AC) { Add-Result "Public mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Public mojibake Euro absent" "PASS" "Absent." }
if (ContainsCharCode $PackHtml 0x20AC) { Add-Result "Pack mojibake Euro absent" "FAIL" "U+20AC found." } else { Add-Result "Pack mojibake Euro absent" "PASS" "Absent." }

# Regenerate PDF.
if (Test-Path $PackPdf) { Remove-Item $PackPdf -Force }

$EdgeCandidates = @(
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$EdgeExe = $null
foreach ($Candidate in $EdgeCandidates) {
    if (Test-Path $Candidate) {
        $EdgeExe = $Candidate
        break
    }
}

if ($null -ne $EdgeExe) {
    $HtmlUri = (New-Object System.Uri($PackIndex)).AbsoluteUri
    & $EdgeExe --headless --disable-gpu --print-to-pdf="$PackPdf" "$HtmlUri" | Out-Null
}

if (Test-Path $PackPdf) {
    $PdfItem = Get-Item $PackPdf
    if ($PdfItem.Length -gt 1000) {
        Add-Result "PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "PDF generated" "WARN" "PDF exists but size is small."
    }
} else {
    Add-Result "PDF generated" "WARN" "PDF was not created."
}

# Recreate ZIP.
if (Test-Path $PackZip) { Remove-Item $PackZip -Force }
Compress-Archive -Path (Join-Path $PackDir "*") -DestinationPath $PackZip -Force

if (Test-Path $PackZip) { Add-Result "Buyer-only ZIP created" "PASS" $PackZip } else { Add-Result "Buyer-only ZIP created" "FAIL" $PackZip }

if (Test-Path $PackZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($PackZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "index.html") { Add-Result "ZIP contains index.html" "PASS" "Entry found." } else { Add-Result "ZIP contains index.html" "FAIL" "Entry missing." }
        if ($ZipEntries -contains "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf") { Add-Result "ZIP contains PDF" "PASS" "Entry found." } else { Add-Result "ZIP contains PDF" "WARN" "PDF missing." }

        $ForbiddenZipEntries = @("tools/", "reports/", "enterprise-backend/", "enterprise-frontend/", "node_modules/", ".git/", ".env")
        foreach ($Forbidden in $ForbiddenZipEntries) {
            $Matches = $ZipEntries | Where-Object { $_ -like ("*" + $Forbidden + "*") }
            if ($Matches.Count -eq 0) {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "PASS" "No matching entries."
            } else {
                Add-Result ("Forbidden ZIP content absent: " + $Forbidden) "FAIL" ("Found: " + ($Matches -join "; "))
            }
        }
    } catch {
        Add-Result "ZIP inspection" "FAIL" ("Could not inspect ZIP: " + $_.Exception.Message)
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE76_ENCODING_CLEAN_BUYER_VIEW_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE76_ENCODING_CLEAN_BUYER_VIEW_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE76_ENCODING_CLEAN_BUYER_VIEW_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 76 Encoding-Clean Buyer View"
Write-Host "============================================================"
Write-Host ""
Write-Host "Public buyer URL after Render redeploy:"
Write-Host "https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/"
Write-Host ""
Write-Host "Public buyer local file:"
Write-Host $BuyerViewIndex
Write-Host ""
Write-Host "Buyer-only ZIP:"
Write-Host $PackZip
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