# RAFTOP CPAP CARE Pro
# Phase 70 - Greek Buyer-Clean Client Portal
# ASCII-safe version using GZip Base64 HTML payload.
# Safe: creates Greek buyer-facing HTML/PDF/ZIP portal only.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"

$OutDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.zip"
$HtmlPath = Join-Path $OutDir "index.html"
$PdfPath = Join-Path $OutDir "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryRoot -Force | Out-Null

if (Test-Path $OutDir) { Remove-Item $OutDir -Recurse -Force }
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase70_greek_buyer_clean_client_portal_" + $Timestamp + ".md")

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
        return Get-Content -Path $Path -Raw -Encoding UTF8
    }
    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 70 Greek Buyer-Clean Client Portal" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 70 Greek Buyer-Clean Client Portal..."
Write-Host ""

$HtmlGzipBase64 = @'
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
'@

$Html = Expand-GzipBase64ToText $HtmlGzipBase64
Set-Content -Path $HtmlPath -Value $Html -Encoding UTF8

if (Test-Path $HtmlPath) {
    Add-Result "Greek buyer-clean index.html created" "PASS" $HtmlPath
} else {
    Add-Result "Greek buyer-clean index.html created" "FAIL" $HtmlPath
}

$HtmlCheck = Read-FileSafe $HtmlPath

$RequiredMarkers = @(
    "REQUIRED_MARKER: GREEK_PORTAL",
    "REQUIRED_MARKER: BUYER_CLEAN",
    "REQUIRED_MARKER: SELF_CONTAINED",
    "RAFTOP CPAP CARE Pro"
)

foreach ($Marker in $RequiredMarkers) {
    if (ContainsText $HtmlCheck $Marker) {
        Add-Result ("Required marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker: " + $Marker) "FAIL" "Marker missing."
    }
}

if (ContainsText $HtmlCheck "href=") {
    Add-Result "Self-contained HTML has no href dependencies" "FAIL" "href attribute found."
} else {
    Add-Result "Self-contained HTML has no href dependencies" "PASS" "No href attributes found."
}

$ForbiddenText = @(
    "do not give",
    "do not send",
    "ChatGPT",
    "developer-only",
    "internal scripts",
    ".env",
    "Render secrets",
    "GitHub secrets",
    "raw logs",
    "tools/",
    "reports/"
)

foreach ($Text in $ForbiddenText) {
    if (ContainsText $HtmlCheck $Text) {
        Add-Result ("Forbidden text absent: " + $Text) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
    }
}

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
    $HtmlUri = (New-Object System.Uri($HtmlPath)).AbsoluteUri
    & $EdgeExe --headless --disable-gpu --print-to-pdf="$PdfPath" "$HtmlUri" | Out-Null

    if (Test-Path $PdfPath) {
        $PdfItem = Get-Item $PdfPath
        if ($PdfItem.Length -gt 1000) {
            Add-Result "Greek buyer-clean PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
        } else {
            Add-Result "Greek buyer-clean PDF generated" "WARN" "PDF exists but size is small."
        }
    } else {
        Add-Result "Greek buyer-clean PDF generated" "WARN" "PDF was not created."
    }
} else {
    Add-Result "Greek buyer-clean PDF generated" "WARN" "Microsoft Edge not found."
}

Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Add-Result "Greek buyer-clean portal ZIP created" "PASS" $ZipPath
} else {
    Add-Result "Greek buyer-clean portal ZIP created" "FAIL" $ZipPath
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE70_GREEK_BUYER_CLEAN_CLIENT_PORTAL_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE70_GREEK_BUYER_CLEAN_CLIENT_PORTAL_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE70_GREEK_BUYER_CLEAN_CLIENT_PORTAL_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 70 Greek Buyer-Clean Client Portal"
Write-Host "============================================================"
Write-Host ""
Write-Host "Portal folder:"
Write-Host $OutDir
Write-Host ""
Write-Host "Portal ZIP:"
Write-Host $ZipPath
Write-Host ""
Write-Host "Portal HTML:"
Write-Host $HtmlPath
Write-Host ""
Write-Host "Portal PDF:"
Write-Host $PdfPath
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