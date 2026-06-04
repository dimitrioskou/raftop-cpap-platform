# RAFTOP CPAP CARE Pro
# Phase 75 - Add AirView / SleepHQ / 80 Hours Compliance mapping to buyer-only pack
# ASCII-safe version. Greek text is written as HTML entities.
# Updates public buyer-only page and ZIP/PDF pack.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"

$BuyerViewIndex = Join-Path $Root "enterprise-frontend\public\raftopoulos-buyer-view\index.html"

$DeliveryRoot = Join-Path $Root "client-delivery"
$PackDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0"
$PackIndex = Join-Path $PackDir "index.html"
$PackPdf = Join-Path $PackDir "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf"
$PackZip = Join-Path $DeliveryRoot "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.zip"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase75_airview_sleephq_80hours_mapping_" + $Timestamp + ".md")

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

function Update-BuyerHtml {
    param([string]$Path)

    if (!(Test-Path $Path)) {
        Add-Result ("HTML exists: " + $Path) "FAIL" "File missing."
        return
    }

    $Html = Get-Content -Path $Path -Raw -Encoding UTF8

    # Remove old Phase 75 block if rerun.
    $Html = [regex]::Replace($Html, '(?s)<!-- PHASE75_MAPPING_BLOCK_START -->.*?<!-- PHASE75_MAPPING_BLOCK_END -->', '')
    $Html = [regex]::Replace($Html, '(?s)<!-- PHASE75_GUIDE_SCRIPT_START -->.*?<!-- PHASE75_GUIDE_SCRIPT_END -->', '')

    $MappingBlock = @'
<!-- PHASE75_MAPPING_BLOCK_START -->
<section class="compare-box" id="airview-sleephq-80hours-map">
  <h2>&#935;&#940;&#961;&#964;&#951;&#962; &#945;&#957;&#964;&#953;&#963;&#964;&#959;&#943;&#967;&#953;&#963;&#951;&#962;: AirView / SleepHQ / 80 Hours Compliance</h2>
  <p>
    &#913;&#965;&#964;&#942; &#951; &#949;&#957;&#972;&#964;&#951;&#964;&#945; &#948;&#949;&#943;&#967;&#957;&#949;&#953; &#963;&#949; &#945;&#960;&#955;&#942; &#947;&#955;&#974;&#963;&#963;&#945; &#960;&#959;&#953;&#959; &#956;&#941;&#961;&#959;&#962; &#964;&#951;&#962; RAFTOP CPAP CARE Pro
    &#954;&#945;&#955;&#973;&#960;&#964;&#949;&#953; &#955;&#959;&#947;&#953;&#954;&#942; AirView-like, &#960;&#959;&#953;&#959; &#954;&#945;&#955;&#973;&#960;&#964;&#949;&#953; SleepHQ-style &#945;&#957;&#940;&#955;&#965;&#963;&#951; &#954;&#945;&#953; &#960;&#959;&#953;&#959; &#949;&#955;&#941;&#947;&#967;&#949;&#953; &#964;&#951;&#957; &#954;&#961;&#943;&#963;&#953;&#956;&#951;
    &#963;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951; 80 &#969;&#961;&#974;&#957; / &#956;&#942;&#957;&#945;.
  </p>

  <div class="metrics">
    <div class="metric">
      <small>AirView-like</small>
      <strong>ATLAS</strong>
      <p>&#922;&#959;&#965;&#956;&#960;&#943;: <b>ATLAS / AirView-like Monitoring</b></p>
    </div>
    <div class="metric">
      <small>SleepHQ-style</small>
      <strong>CPAP Analysis</strong>
      <p>&#922;&#959;&#965;&#956;&#960;&#943;: <b>SleepHQ-style CPAP Analysis</b></p>
    </div>
    <div class="metric">
      <small>Compliance</small>
      <strong>80h / month</strong>
      <p>&#922;&#959;&#965;&#956;&#960;&#943;: <b>80 Hours Compliance</b></p>
    </div>
    <div class="metric">
      <small>Rescue</small>
      <strong>Follow-up</strong>
      <p>&#922;&#959;&#965;&#956;&#960;&#943;: <b>Compliance Rescue</b></p>
    </div>
  </div>
</section>
<!-- PHASE75_MAPPING_BLOCK_END -->
'@

    # Insert mapping after first compare-box if exists, otherwise before grid.
    if ($Html.IndexOf('<section class="grid">', [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        $Html = $Html.Replace('<section class="grid">', $MappingBlock + "`r`n" + '<section class="grid">')
    } else {
        $Html = $Html.Replace('</main>', $MappingBlock + "`r`n" + '</main>')
    }

    # Add buttons after ATLAS button if possible.
    $OldAtlasButton = '<button onclick="showGuide(''atlas'', this)">ATLAS</button>'
    $NewAtlasButtons = @'
<button onclick="showGuide('atlas', this)">ATLAS / AirView-like Monitoring</button>
        <button onclick="showGuide('airviewOperational', this)">AirView-like Patient Monitoring</button>
        <button onclick="showGuide('sleephqAnalysis', this)">SleepHQ-style CPAP Analysis</button>
        <button onclick="showGuide('compliance80h', this)">80 Hours Compliance</button>
        <button onclick="showGuide('complianceRescue', this)">Compliance Rescue</button>
'@

    if ($Html.Contains($OldAtlasButton)) {
        $Html = $Html.Replace($OldAtlasButton, $NewAtlasButtons)
    } elseif ($Html.IndexOf("ATLAS", [System.StringComparison]::OrdinalIgnoreCase) -ge 0 -and $Html.IndexOf("80 Hours Compliance", [System.StringComparison]::OrdinalIgnoreCase) -lt 0) {
        $Html = $Html.Replace('</div>' + "`r`n" + '    </div>' + "`r`n" + "`r`n" + '    <div class="panel output"', $NewAtlasButtons + "`r`n" + '</div>' + "`r`n" + '    </div>' + "`r`n" + "`r`n" + '    <div class="panel output"')
    }

    $ScriptBlock = @'
<!-- PHASE75_GUIDE_SCRIPT_START -->
<script>
(function () {
  const phase75Items = {
    atlas: {
      title: "ATLAS / AirView-like Monitoring",
      body: `
        <p><b>Το ATLAS είναι το σημείο που λειτουργεί σαν AirView-like operational monitoring layer για τη Ραυτόπουλος.</b></p>
        <ul>
          <li>Δείχνει ποιοι CPAP ασθενείς χρειάζονται προσοχή.</li>
          <li>Βάζει προτεραιότητα σε no-data, χαμηλή χρήση, compliance risk και follow-up ανάγκες.</li>
          <li>Η διαφορά είναι ότι δεν μένει μόνο στην προβολή δεδομένων. Μετατρέπει την εικόνα σε ενέργεια.</li>
        </ul>
        <span class="badge">AirView-like monitoring</span><span class="badge">ATLAS priority</span><span class="badge">Follow-up action</span>`
    },
    airviewOperational: {
      title: "AirView-like Patient Monitoring",
      body: `
        <p>Αυτό το κουμπί εξηγεί την AirView-like πλευρά της πλατφόρμας.</p>
        <ul>
          <li>Κεντρική εικόνα ασθενών CPAP.</li>
          <li>Ορατότητα σε συσκευές, δεδομένα και απουσία δεδομένων.</li>
          <li>Εντοπισμός ασθενών που χρειάζονται διαχείριση.</li>
          <li>Χρήσιμο για εταιρεία με μεγάλο CPAP χαρτοφυλάκιο.</li>
        </ul>
        <p><b>Με απλά λόγια:</b> εδώ η Ραυτόπουλος βλέπει οργανωμένα το CPAP portfolio της.</p>
        <span class="badge">Patient management</span><span class="badge">Device visibility</span>`
    },
    sleephqAnalysis: {
      title: "SleepHQ-style CPAP Analysis",
      body: `
        <p>Αυτό το κουμπί δείχνει τη SleepHQ-style λογική: όχι απλώς λίστα ασθενών, αλλά κατανόηση της πορείας CPAP χρήσης.</p>
        <ul>
          <li>Πώς πηγαίνει η χρήση CPAP με τον χρόνο.</li>
          <li>Πού εμφανίζεται πτώση στη χρήση.</li>
          <li>Πού υπάρχουν ενδείξεις που χρειάζονται follow-up.</li>
          <li>Πώς μπορεί να εξηγηθεί καλύτερα η πορεία θεραπείας.</li>
        </ul>
        <p><b>Με απλά λόγια:</b> εδώ η Ραυτόπουλος δεν βλέπει μόνο αν υπάρχουν δεδομένα. Βλέπει τι σημαίνουν επιχειρησιακά.</p>
        <span class="badge">CPAP trend insight</span><span class="badge">SleepHQ-style analysis</span>`
    },
    compliance80h: {
      title: "80 Hours Compliance",
      body: `
        <p>Αυτό το κουμπί δείχνει τον έλεγχο συμμόρφωσης με βάση τον κρίσιμο στόχο 80 ωρών χρήσης CPAP ανά μήνα.</p>
        <ul>
          <li>Ποιοι ασθενείς πλησιάζουν τον στόχο.</li>
          <li>Ποιοι ασθενείς είναι κάτω από τον στόχο.</li>
          <li>Ποιοι χρειάζονται άμεση επικοινωνία πριν χαθεί η συμμόρφωση.</li>
          <li>Ποιοι πρέπει να μπουν σε ATLAS priority / follow-up.</li>
        </ul>
        <p><b>Με απλά λόγια:</b> εδώ η Ραυτόπουλος βλέπει ποιοι ασθενείς κινδυνεύουν να μη συμπληρώσουν τις 80 ώρες.</p>
        <span class="badge">80h/month rule</span><span class="badge">Compliance risk</span>`
    },
    complianceRescue: {
      title: "Compliance Rescue",
      body: `
        <p>Το Compliance Rescue δείχνει ποιους ασθενείς μπορεί να προλάβει η ομάδα με σωστό follow-up.</p>
        <ul>
          <li>Ασθενείς με πτώση χρήσης αλλά ακόμη αναστρέψιμη πορεία.</li>
          <li>Ασθενείς που χρειάζονται τηλεφώνημα, οδηγία ή έλεγχο συσκευής.</li>
          <li>Περιπτώσεις που μπορούν να βελτιωθούν πριν χαθεί ο στόχος συμμόρφωσης.</li>
        </ul>
        <p><b>Με απλά λόγια:</b> εδώ η πλατφόρμα δείχνει πού αξίζει να δράσει πρώτα η ομάδα.</p>
        <span class="badge">Rescue opportunity</span><span class="badge">Follow-up priority</span>`
    }
  };

  const originalShowGuide = window.showGuide;

  window.showGuide = function (key, btn) {
    if (phase75Items[key]) {
      const output = document.getElementById("output");
      document.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      if (btn) btn.classList.add("active");
      if (output) {
        output.innerHTML = `<h2>${phase75Items[key].title}</h2>${phase75Items[key].body}`;
      }
      return;
    }

    if (typeof originalShowGuide === "function") {
      return originalShowGuide(key, btn);
    }
  };
})();
</script>
<!-- PHASE75_GUIDE_SCRIPT_END -->
'@

    $Html = $Html.Replace('</body>', $ScriptBlock + "`r`n" + '</body>')

    Set-Content -Path $Path -Value $Html -Encoding UTF8
    Add-Result ("Updated HTML: " + $Path) "PASS" "Phase 75 mapping added."
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 75 AirView SleepHQ 80h Mapping" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 75 AirView SleepHQ 80h Mapping..."
Write-Host ""

Update-BuyerHtml $BuyerViewIndex
Update-BuyerHtml $PackIndex

# Regenerate PDF
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
        Add-Result "Updated PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
    } else {
        Add-Result "Updated PDF generated" "WARN" "PDF exists but size is small."
    }
} else {
    Add-Result "Updated PDF generated" "WARN" "PDF was not created."
}

# Recreate ZIP
if (Test-Path $PackZip) { Remove-Item $PackZip -Force }
Compress-Archive -Path (Join-Path $PackDir "*") -DestinationPath $PackZip -Force

if (Test-Path $PackZip) {
    Add-Result "Updated buyer-only ZIP created" "PASS" $PackZip
} else {
    Add-Result "Updated buyer-only ZIP created" "FAIL" $PackZip
}

$PublicHtml = Get-Content -Path $BuyerViewIndex -Raw -Encoding UTF8
$PackHtml = Get-Content -Path $PackIndex -Raw -Encoding UTF8

$Required = @(
    "PHASE75_MAPPING_BLOCK_START",
    "PHASE75_GUIDE_SCRIPT_START",
    "ATLAS / AirView-like Monitoring",
    "AirView-like Patient Monitoring",
    "SleepHQ-style CPAP Analysis",
    "80 Hours Compliance",
    "Compliance Rescue",
    "80h/month rule",
    "SleepHQ-style analysis",
    "AirView-like monitoring"
)

foreach ($Marker in $Required) {
    if (ContainsText $PublicHtml $Marker) { Add-Result ("Public marker: " + $Marker) "PASS" "Found." } else { Add-Result ("Public marker: " + $Marker) "FAIL" "Missing." }
    if (ContainsText $PackHtml $Marker) { Add-Result ("Pack marker: " + $Marker) "PASS" "Found." } else { Add-Result ("Pack marker: " + $Marker) "FAIL" "Missing." }
}

$Forbidden = @(
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

foreach ($Text in $Forbidden) {
    if (ContainsText $PublicHtml $Text) { Add-Result ("Public forbidden absent: " + $Text) "FAIL" "Found." } else { Add-Result ("Public forbidden absent: " + $Text) "PASS" "Absent." }
    if (ContainsText $PackHtml $Text) { Add-Result ("Pack forbidden absent: " + $Text) "FAIL" "Found." } else { Add-Result ("Pack forbidden absent: " + $Text) "PASS" "Absent." }
}

# ZIP inspection
if (Test-Path $PackZip) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($PackZip)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "index.html") { Add-Result "ZIP contains index.html" "PASS" "Entry found." } else { Add-Result "ZIP contains index.html" "FAIL" "Entry missing." }
        if ($ZipEntries -contains "RAFTOP_CLIENT_BUYER_ONLY_VIEW_EL_v1.0.pdf") { Add-Result "ZIP contains PDF" "PASS" "Entry found." } else { Add-Result "ZIP contains PDF" "WARN" "PDF missing." }
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
    $FinalStatus = "PHASE75_AIRVIEW_SLEEPHQ_80HOURS_MAPPING_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE75_AIRVIEW_SLEEPHQ_80HOURS_MAPPING_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE75_AIRVIEW_SLEEPHQ_80HOURS_MAPPING_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 75 AirView SleepHQ 80h Mapping"
Write-Host "============================================================"
Write-Host ""
Write-Host "Public buyer URL after Render redeploy:"
Write-Host "https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/"
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