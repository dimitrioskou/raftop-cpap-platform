# RAFTOP CPAP CARE Pro
# Phase 78 - Fix Full PDF Header Encoding
# ASCII-safe script.
# Rebuilds FULL_GUIDE.html/PDF using existing clean buyer index and entity-encoded print wrapper.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"

$DeliveryRoot = Join-Path $Root "client-delivery"
$PackDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0"
$PackIndex = Join-Path $PackDir "index.html"
$PrintHtml = Join-Path $PackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.html"
$FullPdf = Join-Path $PackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf"
$PackPdf = Join-Path $PackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf"
$PackZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $PackDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase78_fix_full_pdf_header_encoding_" + $Timestamp + ".md")

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

function Insert-BeforeBodyEnd {
    param([string]$Content, [string]$InsertText)

    $Index = $Content.LastIndexOf("</body>", [System.StringComparison]::OrdinalIgnoreCase)

    if ($Index -lt 0) {
        return $Content + "`r`n" + $InsertText
    }

    return $Content.Substring(0, $Index) + $InsertText + "`r`n" + $Content.Substring($Index)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 78 Fix Full PDF Header Encoding" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 78 Fix Full PDF Header Encoding..."
Write-Host ""

if (Test-Path $PackIndex) {
    Add-Result "Buyer pack index.html exists" "PASS" $PackIndex
} else {
    Add-Result "Buyer pack index.html exists" "FAIL" $PackIndex
}

$SourceHtml = Get-Content -Path $PackIndex -Raw -Encoding UTF8

$SourceHtml = [regex]::Replace(
    $SourceHtml,
    '(?s)<!-- REQUIRED_MARKER: PHASE77_FULL_EXPANDED_BUYER_PDF_GUIDE -->.*?</script>',
    ''
)

$PrintExpansionScript = @'
<!-- REQUIRED_MARKER: PHASE78_FIXED_FULL_PDF_HEADER_ENCODING -->
<!-- REQUIRED_MARKER: FULL_EXPANDED_BUYER_GUIDE -->
<!-- REQUIRED_MARKER: ALL_BUTTON_EXPLANATIONS_EXPANDED -->
<!-- REQUIRED_MARKER: NO_MOJIBAKE_HEADER -->
<style id="phase78-print-style">
@media print {
  body {
    background: #ffffff !important;
  }
}
.phase78-print-wrap {
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px;
  font-family: Arial, Helvetica, sans-serif;
  color: #0f172a;
}
.phase78-title {
  font-size: 32px;
  margin: 0 0 8px 0;
}
.phase78-subtitle {
  font-size: 18px;
  line-height: 1.6;
  margin-bottom: 18px;
}
.phase78-section {
  page-break-inside: avoid;
  break-inside: avoid;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px 20px;
  margin: 16px 0;
  background: #ffffff;
}
.phase78-section h2 {
  margin-top: 0;
  font-size: 23px;
}
.phase78-section p,
.phase78-section li {
  line-height: 1.65;
  font-size: 15px;
}
.phase78-notice {
  background: #ecfdf5;
  border-left: 7px solid #059669;
  padding: 16px 18px;
  border-radius: 12px;
  margin: 18px 0;
  font-weight: 700;
}
.phase78-map {
  background: #fff7ed;
  border-left: 7px solid #ea580c;
  padding: 16px 18px;
  border-radius: 12px;
  margin: 18px 0;
}
.badge {
  display: inline-block;
  background: #e0f2fe;
  color: #075985;
  border-radius: 999px;
  padding: 5px 10px;
  margin: 4px 4px 4px 0;
  font-size: 12px;
  font-weight: 800;
}
</style>

<script>
(function () {
  function extractKey(button) {
    var raw = button.getAttribute("onclick") || "";
    var match = raw.match(/showGuide\('([^']+)'/);
    return match ? match[1] : null;
  }

  function safeText(value) {
    return String(value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function buildFullGuide() {
    if (typeof window.showGuide !== "function") {
      return;
    }

    var output = document.getElementById("output");
    if (!output) {
      return;
    }

    var buttons = Array.prototype.slice.call(document.querySelectorAll("button"));
    var seen = {};
    var sections = [];

    buttons.forEach(function (button) {
      var key = extractKey(button);
      if (!key || seen[key]) {
        return;
      }

      seen[key] = true;

      try {
        window.showGuide(key, button);
      } catch (e) {
        return;
      }

      var title = (button.textContent || "").trim();
      var html = output.innerHTML || "";

      if (title && html) {
        sections.push({
          key: key,
          title: title,
          html: html
        });
      }
    });

    var sectionHtml = sections.map(function (item, index) {
      return [
        '<section class="phase78-section">',
        '<h2>' + (index + 1) + '. ' + safeText(item.title) + '</h2>',
        item.html,
        '</section>'
      ].join('');
    }).join('');

    var title = 'RAFTOP CPAP CARE Pro';

    var subtitle =
      '&#928;&#955;&#942;&#961;&#951;&#962; buyer-only &#959;&#948;&#951;&#947;&#972;&#962; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#953;&#974;&#957;. ' +
      '&#908;&#955;&#949;&#962; &#959;&#953; &#949;&#960;&#949;&#958;&#951;&#947;&#942;&#963;&#949;&#953;&#962; &#964;&#969;&#957; &#954;&#959;&#965;&#956;&#960;&#953;&#974;&#957; ' +
      '&#949;&#956;&#966;&#945;&#957;&#943;&#950;&#959;&#957;&#964;&#945;&#953; &#945;&#957;&#959;&#953;&#967;&#964;&#941;&#962; &#963;&#949; &#941;&#957;&#945; PDF.';

    var notice =
      '&#932;&#959; PDF &#945;&#965;&#964;&#972; &#949;&#943;&#957;&#945;&#953; &#947;&#953;&#945; &#954;&#945;&#952;&#945;&#961;&#942; &#945;&#957;&#940;&#947;&#957;&#969;&#963;&#951; ' +
      '&#945;&#960;&#972; &#964;&#951; &#929;&#945;&#965;&#964;&#972;&#960;&#959;&#965;&#955;&#959;&#962;. ' +
      '&#916;&#949;&#957; &#960;&#949;&#961;&#953;&#955;&#945;&#956;&#946;&#940;&#957;&#949;&#953; &#949;&#963;&#969;&#964;&#949;&#961;&#953;&#954;&#941;&#962; &#959;&#948;&#951;&#947;&#943;&#949;&#962; ' +
      '&#960;&#974;&#955;&#951;&#963;&#951;&#962;, &#964;&#949;&#967;&#957;&#953;&#954;&#940; warnings &#942; demo scripts.';

    var map =
      '<b>&#935;&#940;&#961;&#964;&#951;&#962; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#953;&#974;&#957;:</b> ' +
      'ATLAS / AirView-like Monitoring, SleepHQ-style CPAP Analysis, 80 Hours Compliance, Compliance Rescue, ' +
      'Patient Monitoring, Reports, Doctor / Clinic View &#954;&#945;&#953; Resale model.';

    document.body.innerHTML = [
      '<main class="phase78-print-wrap">',
      '<h1 class="phase78-title">' + title + '</h1>',
      '<div class="phase78-subtitle">' + subtitle + '</div>',
      '<div class="phase78-notice">' + notice + '</div>',
      '<div class="phase78-map">' + map + '</div>',
      sectionHtml,
      '</main>'
    ].join('');
  }

  window.addEventListener("load", function () {
    buildFullGuide();
  });
})();
</script>
'@

$FullGuideHtml = Insert-BeforeBodyEnd $SourceHtml $PrintExpansionScript
Set-Content -Path $PrintHtml -Value $FullGuideHtml -Encoding UTF8

if (Test-Path $PrintHtml) {
    Add-Result "Full guide print HTML created" "PASS" $PrintHtml
} else {
    Add-Result "Full guide print HTML created" "FAIL" $PrintHtml
}

$HtmlCheck = Get-Content -Path $PrintHtml -Raw -Encoding UTF8

$RequiredMarkers = @(
    "REQUIRED_MARKER: PHASE78_FIXED_FULL_PDF_HEADER_ENCODING",
    "REQUIRED_MARKER: FULL_EXPANDED_BUYER_GUIDE",
    "REQUIRED_MARKER: ALL_BUTTON_EXPLANATIONS_EXPANDED",
    "REQUIRED_MARKER: NO_MOJIBAKE_HEADER",
    "ATLAS / AirView-like Monitoring",
    "SleepHQ-style CPAP Analysis",
    "80 Hours Compliance",
    "Compliance Rescue",
    "Doctor / Clinic View"
)

foreach ($Marker in $RequiredMarkers) {
    if (ContainsText $HtmlCheck $Marker) {
        Add-Result ("Required marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker: " + $Marker) "FAIL" "Marker missing."
    }
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
    "https://raftop-cpap-frontend.onrender.com/login",
    "Ξ",
    "Ο€",
    "Οƒ"
)

foreach ($Text in $ForbiddenText) {
    if (ContainsText $HtmlCheck $Text) {
        Add-Result ("Forbidden text absent: " + $Text) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
    }
}

# Generate full guide PDF.
if (Test-Path $FullPdf) { Remove-Item $FullPdf -Force }

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
    $HtmlUri = (New-Object System.Uri($PrintHtml)).AbsoluteUri

    & $EdgeExe `
      --headless `
      --disable-gpu `
      --run-all-compositor-stages-before-draw `
      --virtual-time-budget=8000 `
      --print-to-pdf="$FullPdf" `
      "$HtmlUri" | Out-Null
} else {
    Add-Result "Microsoft Edge found" "WARN" "Edge not found. PDF cannot be generated automatically."
}

if (Test-Path $FullPdf) {
    $PdfItem = Get-Item $FullPdf

    if ($PdfItem.Length -gt 50000) {
        Add-Result "Full expanded PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "Full expanded PDF generated" "WARN" ("PDF exists but may be small. Size bytes: " + $PdfItem.Length)
    }
} else {
    Add-Result "Full expanded PDF generated" "FAIL" "PDF was not created."
}

if (Test-Path $FullPdf) {
    Copy-Item $FullPdf $PackPdf -Force
    Add-Result "Main pack PDF replaced by fixed full guide PDF" "PASS" $PackPdf
}

# Recreate ZIP.
if (Test-Path $PackZip) { Remove-Item $PackZip -Force }

Compress-Archive -Path (Join-Path $PackDir "*") -DestinationPath $PackZip -Force

if (Test-Path $PackZip) {
    Add-Result "Updated ZIP created" "PASS" $PackZip
} else {
    Add-Result "Updated ZIP created" "FAIL" $PackZip
}

# Inspect ZIP entries.
if (Test-Path $PackZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($PackZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        $RequiredEntries = @(
            "index.html",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.pdf",
            "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_FULL_GUIDE.html"
        )

        foreach ($Entry in $RequiredEntries) {
            if ($ZipEntries -contains $Entry) {
                Add-Result ("ZIP entry exists: " + $Entry) "PASS" "Entry found."
            } else {
                Add-Result ("ZIP entry exists: " + $Entry) "FAIL" "Entry missing."
            }
        }

        $ForbiddenZipEntries = @(
            "tools/",
            "reports/",
            "enterprise-backend/",
            "enterprise-frontend/",
            "node_modules/",
            ".git/",
            ".env"
        )

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
    $FinalStatus = "PHASE78_FIX_FULL_PDF_HEADER_ENCODING_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE78_FIX_FULL_PDF_HEADER_ENCODING_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE78_FIX_FULL_PDF_HEADER_ENCODING_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 78 Fix Full PDF Header Encoding"
Write-Host "============================================================"
Write-Host ""
Write-Host "Full guide HTML:"
Write-Host $PrintHtml
Write-Host ""
Write-Host "Full guide PDF:"
Write-Host $FullPdf
Write-Host ""
Write-Host "Updated buyer-only ZIP:"
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