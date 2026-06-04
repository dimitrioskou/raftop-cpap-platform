# RAFTOP CPAP CARE Pro
# Phase 71 - Add App Link and Greek Button Guide to Greek Buyer-Clean Portal
# ASCII-safe script. Greek text is rendered through HTML entities.
# Safe: modifies only the Greek buyer-clean portal delivery artifact.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"
$PortalDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.zip"
$HtmlPath = Join-Path $PortalDir "index.html"
$PdfPath = Join-Path $PortalDir "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf"

# IMPORTANT:
# If your production frontend URL is different, change only this line.
$AppUrl = "https://raftop-cpap-frontend.onrender.com/login"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase71_app_link_button_guide_greek_portal_" + $Timestamp + ".md")

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

function Insert-BeforeIgnoreCase {
    param([string]$Content, [string]$Needle, [string]$InsertText)

    $Index = $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase)

    if ($Index -lt 0) {
        return $Content + "`r`n" + $InsertText
    }

    return $Content.Substring(0, $Index) + $InsertText + "`r`n" + $Content.Substring($Index)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 71 App Link and Greek Button Guide" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 71 App Link and Greek Button Guide..."
Write-Host ""

if (Test-Path $HtmlPath) {
    Add-Result "Greek portal index.html exists" "PASS" $HtmlPath
} else {
    Add-Result "Greek portal index.html exists" "FAIL" $HtmlPath
}

if (Test-Path $PortalDir) {
    Add-Result "Greek portal folder exists" "PASS" $PortalDir
} else {
    Add-Result "Greek portal folder exists" "FAIL" $PortalDir
}

$Html = Read-FileSafe $HtmlPath

# Remove previous Phase 71 injection if rerun
$Html = [regex]::Replace($Html, '(?s)<!-- RAFTOP_APP_ACCESS_GUIDE_STYLE_START -->.*?<!-- RAFTOP_APP_ACCESS_GUIDE_STYLE_END -->', '')
$Html = [regex]::Replace($Html, '(?s)<!-- RAFTOP_APP_ACCESS_GUIDE_START -->.*?<!-- RAFTOP_APP_ACCESS_GUIDE_END -->', '')

$StyleBlock = @'
<!-- RAFTOP_APP_ACCESS_GUIDE_STYLE_START -->
<style>
.app-access-panel {
  background: #ffffff;
  border: 1px solid #dbe3ef;
  border-radius: 16px;
  padding: 24px;
  margin: 24px 0;
  box-shadow: 0 1px 10px rgba(15, 23, 42, 0.08);
}
.app-access-panel h2 {
  color: #0f172a;
  margin-top: 0;
}
.app-primary-button {
  display: inline-block;
  background: #0f172a;
  color: #ffffff !important;
  padding: 14px 20px;
  border-radius: 10px;
  text-decoration: none;
  font-weight: bold;
  margin: 12px 0 16px 0;
}
.app-primary-button:hover {
  opacity: 0.92;
}
.app-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
  margin-top: 16px;
}
.app-guide-button {
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  color: #0f172a;
  border-radius: 10px;
  padding: 11px 12px;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
}
.app-guide-button:hover {
  background: #e2e8f0;
}
.app-guide-output {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 18px;
  margin-top: 16px;
}
.app-guide-output h3 {
  margin-top: 0;
  color: #0f172a;
}
.app-guide-output p {
  line-height: 1.6;
}
</style>
<!-- RAFTOP_APP_ACCESS_GUIDE_STYLE_END -->
'@

$GuideBlock = @'
<!-- RAFTOP_APP_ACCESS_GUIDE_START -->
<section class="app-access-panel" id="raftop-live-app-access">
  <h2>&#902;&#956;&#949;&#963;&#951; &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951; &#963;&#964;&#951;&#957; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;</h2>
  <p>
    &#928;&#945;&#964;&#942;&#963;&#964;&#949; &#964;&#959; &#960;&#945;&#961;&#945;&#954;&#940;&#964;&#969; &#954;&#959;&#965;&#956;&#960;&#943; &#947;&#953;&#945; &#957;&#945; &#945;&#957;&#959;&#943;&#958;&#949;&#953; &#951; live &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942; RAFTOP CPAP CARE Pro &#963;&#949; &#957;&#941;&#959; tab &#964;&#959;&#965; browser.
  </p>
  <a class="app-primary-button" href="__APP_URL__" target="_blank" rel="noopener noreferrer">
    &#902;&#957;&#959;&#953;&#947;&#956;&#945; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962;
  </a>

  <h2>&#927;&#948;&#951;&#947;&#972;&#962; &#954;&#959;&#965;&#956;&#960;&#953;&#974;&#957; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962;</h2>
  <p>
    &#928;&#945;&#964;&#942;&#963;&#964;&#949; &#954;&#940;&#952;&#949; &#954;&#959;&#965;&#956;&#960;&#943; &#947;&#953;&#945; &#957;&#945; &#948;&#949;&#943;&#964;&#949; &#963;&#964;&#945; &#949;&#955;&#955;&#951;&#957;&#953;&#954;&#940; &#964;&#953; &#954;&#940;&#957;&#949;&#953; &#951; &#945;&#957;&#964;&#943;&#963;&#964;&#959;&#953;&#967;&#951; &#949;&#957;&#972;&#964;&#951;&#964;&#945; &#964;&#951;&#962; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962;.
  </p>

  <div class="app-guide-grid">
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('login')">&#931;&#973;&#957;&#948;&#949;&#963;&#951; / Login</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('dashboard')">&#913;&#961;&#967;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945; / Dashboard</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('patients')">&#913;&#963;&#952;&#949;&#957;&#949;&#943;&#962;</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('patientProfile')">&#934;&#940;&#954;&#949;&#955;&#959;&#962; &#945;&#963;&#952;&#949;&#957;&#959;&#973;&#962;</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('devices')">&#931;&#965;&#963;&#954;&#949;&#965;&#941;&#962; CPAP</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('compliance')">&#931;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951;</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('atlas')">ATLAS</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('tasks')">&#917;&#961;&#947;&#945;&#963;&#943;&#949;&#962; / Tasks</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('reports')">&#913;&#957;&#945;&#966;&#959;&#961;&#941;&#962;</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('csv')">&#916;&#949;&#948;&#959;&#956;&#941;&#957;&#945; CSV</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('users')">&#935;&#961;&#942;&#963;&#964;&#949;&#962; / &#929;&#972;&#955;&#959;&#953;</button>
    <button type="button" class="app-guide-button" onclick="raftopShowGuide('support')">&#933;&#960;&#959;&#963;&#964;&#942;&#961;&#953;&#958;&#951;</button>
  </div>

  <div id="raftop-guide-output" class="app-guide-output">
    <h3>&#917;&#960;&#953;&#955;&#941;&#958;&#964;&#949; &#941;&#957;&#945; &#954;&#959;&#965;&#956;&#960;&#943; &#945;&#960;&#972; &#960;&#940;&#957;&#969; &#947;&#953;&#945; &#957;&#945; &#948;&#949;&#943;&#964;&#949; &#949;&#960;&#949;&#958;&#942;&#947;&#951;&#963;&#951;.</h3>
  </div>
</section>

<script>
(function () {
  var guideItems = {
    login: { title: '&#931;&#973;&#957;&#948;&#949;&#963;&#951; &#963;&#964;&#951;&#957; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945;', body: '<p>&#917;&#948;&#974; &#959; &#967;&#961;&#942;&#963;&#964;&#951;&#962; &#946;&#940;&#950;&#949;&#953; &#964;&#945; &#963;&#964;&#959;&#953;&#967;&#949;&#943;&#945; &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951;&#962; &#960;&#959;&#965; &#964;&#959;&#965; &#941;&#967;&#959;&#965;&#957; &#948;&#959;&#952;&#949;&#943; &#958;&#949;&#967;&#969;&#961;&#953;&#963;&#964;&#940;. &#916;&#949;&#957; &#967;&#961;&#949;&#953;&#940;&#950;&#949;&#964;&#945;&#953; &#949;&#947;&#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951; &#960;&#961;&#959;&#947;&#961;&#940;&#956;&#956;&#945;&#964;&#959;&#962;. &#919; &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951; &#947;&#943;&#957;&#949;&#964;&#945;&#953; &#945;&#960;&#972; browser.</p>' },
    dashboard: { title: '&#928;&#943;&#957;&#945;&#954;&#945;&#962; &#949;&#955;&#941;&#947;&#967;&#959;&#965;', body: '<p>&#916;&#943;&#957;&#949;&#953; &#947;&#961;&#942;&#947;&#959;&#961;&#951; &#949;&#953;&#954;&#972;&#957;&#945; &#964;&#951;&#962; &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951;&#962;: &#949;&#957;&#949;&#961;&#947;&#959;&#943; &#945;&#963;&#952;&#949;&#957;&#949;&#943;&#962;, &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#967;&#969;&#961;&#943;&#962; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945;, &#954;&#943;&#957;&#948;&#965;&#957;&#959;&#962; &#967;&#945;&#956;&#951;&#955;&#942;&#962; &#963;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951;&#962;, &#949;&#954;&#954;&#961;&#949;&#956;&#949;&#943;&#962; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962; &#954;&#945;&#953; &#963;&#965;&#957;&#959;&#960;&#964;&#953;&#954;&#942; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945;.</p>' },
    patients: { title: '&#923;&#943;&#963;&#964;&#945; &#945;&#963;&#952;&#949;&#957;&#974;&#957;', body: '<p>&#917;&#956;&#966;&#945;&#957;&#943;&#950;&#949;&#953; &#964;&#959;&#965;&#962; &#945;&#963;&#952;&#949;&#957;&#949;&#943;&#962; CPAP &#964;&#959;&#965; &#963;&#965;&#956;&#966;&#969;&#957;&#951;&#956;&#941;&#957;&#959;&#965; &#960;&#949;&#961;&#953;&#946;&#940;&#955;&#955;&#959;&#957;&#964;&#959;&#962;. &#913;&#960;&#972; &#949;&#948;&#974; &#947;&#943;&#957;&#949;&#964;&#945;&#953; &#945;&#957;&#945;&#950;&#942;&#964;&#951;&#963;&#951;, &#966;&#953;&#955;&#964;&#961;&#940;&#961;&#953;&#963;&#956;&#945; &#954;&#945;&#953; &#949;&#960;&#953;&#955;&#959;&#947;&#942; &#945;&#963;&#952;&#949;&#957;&#959;&#973;&#962; &#947;&#953;&#945; &#945;&#957;&#945;&#955;&#965;&#964;&#953;&#954;&#972; &#941;&#955;&#949;&#947;&#967;&#959;.</p>' },
    patientProfile: { title: '&#934;&#940;&#954;&#949;&#955;&#959;&#962; &#945;&#963;&#952;&#949;&#957;&#959;&#973;&#962;', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#951; &#963;&#965;&#947;&#954;&#949;&#957;&#964;&#961;&#969;&#964;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945; &#949;&#957;&#972;&#962; &#945;&#963;&#952;&#949;&#957;&#959;&#973;&#962;: &#963;&#964;&#959;&#953;&#967;&#949;&#943;&#945; &#945;&#957;&#945;&#966;&#959;&#961;&#940;&#962;, &#963;&#965;&#963;&#954;&#949;&#965;&#942;, &#967;&#961;&#942;&#963;&#951; CPAP, &#963;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951;, AHI, &#948;&#953;&#945;&#961;&#961;&#959;&#941;&#962;, &#963;&#951;&#956;&#949;&#953;&#974;&#963;&#949;&#953;&#962; &#954;&#945;&#953; follow-up &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951;.</p>' },
    devices: { title: '&#931;&#965;&#963;&#954;&#949;&#965;&#941;&#962; CPAP', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#959;&#953;&#949;&#962; &#963;&#965;&#963;&#954;&#949;&#965;&#941;&#962; &#949;&#943;&#957;&#945;&#953; &#963;&#965;&#957;&#948;&#949;&#948;&#949;&#956;&#941;&#957;&#949;&#962; &#956;&#949; &#945;&#963;&#952;&#949;&#957;&#949;&#943;&#962;, &#964;&#951;&#957; &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#943;&#945;&#962;, &#964;&#951;&#957; &#973;&#960;&#945;&#961;&#958;&#951; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#969;&#957; &#954;&#945;&#953; &#960;&#953;&#952;&#945;&#957;&#940; &#963;&#951;&#956;&#949;&#943;&#945; &#960;&#959;&#965; &#967;&#961;&#949;&#953;&#940;&#950;&#959;&#957;&#964;&#945;&#953; &#941;&#955;&#949;&#947;&#967;&#959;.</p>' },
    compliance: { title: '&#931;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951;', body: '<p>&#914;&#959;&#951;&#952;&#940; &#964;&#951;&#957; &#959;&#956;&#940;&#948;&#945; &#957;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#960;&#959;&#953;&#959;&#953; &#945;&#963;&#952;&#949;&#957;&#949;&#943;&#962; &#960;&#955;&#951;&#963;&#953;&#940;&#950;&#959;&#965;&#957; &#942; &#945;&#960;&#959;&#956;&#945;&#954;&#961;&#973;&#957;&#959;&#957;&#964;&#945;&#953; &#945;&#960;&#972; &#964;&#959;&#957; &#963;&#964;&#972;&#967;&#959; &#967;&#961;&#942;&#963;&#951;&#962;. &#917;&#943;&#957;&#945;&#953; &#949;&#961;&#947;&#945;&#955;&#949;&#943;&#959; &#949;&#960;&#953;&#967;&#949;&#953;&#961;&#951;&#963;&#953;&#945;&#954;&#942;&#962; &#960;&#945;&#961;&#945;&#954;&#959;&#955;&#959;&#973;&#952;&#951;&#963;&#951;&#962; &#954;&#945;&#953; &#972;&#967;&#953; &#953;&#945;&#964;&#961;&#953;&#954;&#942; &#948;&#953;&#940;&#947;&#957;&#969;&#963;&#951;.</p>' },
    atlas: { title: 'ATLAS System', body: '<p>&#927;&#961;&#947;&#945;&#957;&#974;&#957;&#949;&#953; &#964;&#953;&#962; &#963;&#951;&#956;&#945;&#957;&#964;&#953;&#954;&#941;&#962; &#965;&#960;&#959;&#952;&#941;&#963;&#949;&#953;&#962; &#963;&#949; &#960;&#961;&#959;&#964;&#949;&#961;&#945;&#953;&#972;&#964;&#951;&#964;&#949;&#962;. &#914;&#959;&#951;&#952;&#940; &#964;&#951;&#957; &#959;&#956;&#940;&#948;&#945; &#957;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#960;&#959;&#953;&#959;&#962; &#967;&#961;&#949;&#953;&#940;&#950;&#949;&#964;&#945;&#953; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#945; &#960;&#961;&#974;&#964;&#945;: no-data, &#967;&#945;&#956;&#951;&#955;&#942; &#967;&#961;&#942;&#963;&#951;, &#954;&#961;&#943;&#963;&#953;&#956;&#945; &#963;&#942;&#956;&#945;&#964;&#945; &#942; follow-up.</p>' },
    tasks: { title: '&#917;&#961;&#947;&#945;&#963;&#943;&#949;&#962; / Tasks', body: '<p>&#924;&#949;&#964;&#945;&#964;&#961;&#941;&#960;&#949;&#953; &#964;&#945; &#949;&#965;&#961;&#942;&#956;&#945;&#964;&#945; &#963;&#949; &#963;&#965;&#947;&#954;&#949;&#954;&#961;&#953;&#956;&#941;&#957;&#949;&#962; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962;. &#919; &#959;&#956;&#940;&#948;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#964;&#953; &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#947;&#943;&#957;&#949;&#953;, &#960;&#959;&#953;&#959;&#962; &#964;&#959; &#941;&#967;&#949;&#953; &#945;&#957;&#945;&#955;&#940;&#946;&#949;&#953;, &#964;&#953; &#949;&#954;&#954;&#961;&#949;&#956;&#949;&#943; &#954;&#945;&#953; &#964;&#953; &#959;&#955;&#959;&#954;&#955;&#951;&#961;&#974;&#952;&#951;&#954;&#949;.</p>' },
    reports: { title: '&#913;&#957;&#945;&#966;&#959;&#961;&#941;&#962; / Management view', body: '<p>&#916;&#943;&#957;&#949;&#953; &#963;&#965;&#957;&#959;&#960;&#964;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945; &#947;&#953;&#945; &#948;&#953;&#959;&#943;&#954;&#951;&#963;&#951;: &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951; &#945;&#963;&#952;&#949;&#957;&#974;&#957;, compliance risk, no-data &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940;, &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962; ATLAS &#954;&#945;&#953; &#963;&#951;&#956;&#949;&#943;&#945; &#960;&#959;&#965; &#967;&#961;&#949;&#953;&#940;&#950;&#959;&#957;&#964;&#945;&#953; &#945;&#960;&#972;&#966;&#945;&#963;&#951;.</p>' },
    csv: { title: '&#916;&#949;&#948;&#959;&#956;&#941;&#957;&#945; CSV', body: '<p>&#935;&#961;&#951;&#963;&#953;&#956;&#959;&#960;&#959;&#953;&#949;&#943;&#964;&#945;&#953; &#947;&#953;&#945; &#945;&#961;&#967;&#953;&#954;&#942; &#949;&#953;&#963;&#945;&#947;&#969;&#947;&#942; &#942; &#941;&#955;&#949;&#947;&#967;&#959; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#969;&#957; CPAP. &#932;&#959; CSV &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#941;&#967;&#949;&#953; &#963;&#965;&#956;&#966;&#969;&#957;&#951;&#956;&#941;&#957;&#945; &#960;&#949;&#948;&#943;&#945; &#954;&#945;&#953;, &#972;&#960;&#959;&#965; &#947;&#943;&#957;&#949;&#964;&#945;&#953;, &#968;&#949;&#965;&#948;&#969;&#957;&#965;&#956;&#959;&#960;&#959;&#953;&#951;&#956;&#941;&#957;&#959;&#965;&#962; &#954;&#969;&#948;&#953;&#954;&#959;&#973;&#962;.</p>' },
    users: { title: '&#935;&#961;&#942;&#963;&#964;&#949;&#962; &#954;&#945;&#953; &#961;&#972;&#955;&#959;&#953;', body: '<p>&#927;&#961;&#943;&#950;&#949;&#953; &#960;&#959;&#953;&#959;&#962; &#946;&#955;&#941;&#960;&#949;&#953; &#964;&#953;. &#902;&#955;&#955;&#959;&#962; &#961;&#972;&#955;&#959;&#962; &#941;&#967;&#949;&#953; &#959; buyer admin, &#940;&#955;&#955;&#959;&#962; &#959; &#967;&#961;&#942;&#963;&#964;&#951;&#962; operations, &#940;&#955;&#955;&#959;&#962; &#959; management viewer &#954;&#945;&#953; &#940;&#955;&#955;&#959;&#962; &#959; technical/data contact.</p>' },
    support: { title: '&#933;&#960;&#959;&#963;&#964;&#942;&#961;&#953;&#958;&#951;', body: '<p>&#917;&#958;&#951;&#947;&#949;&#943; &#960;&#974;&#962; &#954;&#945;&#964;&#945;&#947;&#961;&#940;&#966;&#949;&#964;&#945;&#953; &#952;&#941;&#956;&#945; &#965;&#960;&#959;&#963;&#964;&#942;&#961;&#953;&#958;&#951;&#962; &#942; change request. &#932;&#945; &#963;&#965;&#956;&#966;&#969;&#957;&#951;&#956;&#941;&#957;&#945; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#953;&#954;&#940; &#952;&#941;&#956;&#945;&#964;&#945; &#948;&#953;&#945;&#967;&#949;&#953;&#961;&#943;&#950;&#959;&#957;&#964;&#945;&#953; &#969;&#962; support, &#949;&#957;&#974; &#957;&#941;&#949;&#962; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#943;&#949;&#962; &#945;&#958;&#953;&#959;&#955;&#959;&#947;&#959;&#973;&#957;&#964;&#945;&#953; &#958;&#949;&#967;&#969;&#961;&#953;&#963;&#964;&#940;.</p>' }
  };

  window.raftopShowGuide = function (key) {
    var item = guideItems[key];
    var output = document.getElementById('raftop-guide-output');

    if (!item || !output) { return; }

    output.innerHTML = '<h3>' + item.title + '</h3>' + item.body;
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.raftopShowGuide('login');
  });
})();
</script>
<!-- RAFTOP_APP_ACCESS_GUIDE_END -->
'@

$GuideBlock = $GuideBlock.Replace("__APP_URL__", $AppUrl)

$Html = Insert-BeforeIgnoreCase $Html "</head>" $StyleBlock
$Html = Insert-BeforeIgnoreCase $Html "</main>" $GuideBlock

Set-Content -Path $HtmlPath -Value $Html -Encoding UTF8

$HtmlCheck = Read-FileSafe $HtmlPath

if (ContainsText $HtmlCheck $AppUrl) {
    Add-Result "App URL exists in index.html" "PASS" $AppUrl
} else {
    Add-Result "App URL exists in index.html" "FAIL" "App URL missing."
}

if (ContainsText $HtmlCheck "RAFTOP_APP_ACCESS_GUIDE_START") {
    Add-Result "App guide block exists" "PASS" "Marker found."
} else {
    Add-Result "App guide block exists" "FAIL" "Marker missing."
}

if (ContainsText $HtmlCheck "raftopShowGuide") {
    Add-Result "Interactive button guide JS exists" "PASS" "Function found."
} else {
    Add-Result "Interactive button guide JS exists" "FAIL" "Function missing."
}

$ButtonMatches = [regex]::Matches($HtmlCheck, 'class="app-guide-button"')
if ($ButtonMatches.Count -ge 10) {
    Add-Result "App guide button count" "PASS" ("Buttons found: " + $ButtonMatches.Count)
} else {
    Add-Result "App guide button count" "FAIL" ("Buttons found: " + $ButtonMatches.Count)
}

if (ContainsText $HtmlCheck "href=`"$AppUrl`"") {
    Add-Result "External app href exists" "PASS" "Live app link found."
} else {
    Add-Result "External app href exists" "FAIL" "Live app href missing."
}

# Regenerate PDF
if (Test-Path $PdfPath) {
    Remove-Item $PdfPath -Force
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
            Add-Result "Updated Greek portal PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
        } else {
            Add-Result "Updated Greek portal PDF generated" "WARN" "PDF exists but size is small."
        }
    } else {
        Add-Result "Updated Greek portal PDF generated" "WARN" "PDF was not created."
    }
} else {
    Add-Result "Updated Greek portal PDF generated" "WARN" "Microsoft Edge not found."
}

# Recreate ZIP
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

Compress-Archive -Path (Join-Path $PortalDir "*") -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Add-Result "Updated Greek portal ZIP created" "PASS" $ZipPath
} else {
    Add-Result "Updated Greek portal ZIP created" "FAIL" $ZipPath
}

# Inspect ZIP entries
if (Test-Path $ZipPath) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "index.html") {
            Add-Result "ZIP contains index.html" "PASS" "Entry found."
        } else {
            Add-Result "ZIP contains index.html" "FAIL" "Entry missing."
        }

        if ($ZipEntries -contains "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf") {
            Add-Result "ZIP contains PDF" "PASS" "Entry found."
        } else {
            Add-Result "ZIP contains PDF" "FAIL" "Entry missing."
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
    $FinalStatus = "PHASE71_APP_LINK_BUTTON_GUIDE_GREEK_PORTAL_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE71_APP_LINK_BUTTON_GUIDE_GREEK_PORTAL_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE71_APP_LINK_BUTTON_GUIDE_GREEK_PORTAL_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 71 App Link and Greek Button Guide"
Write-Host "============================================================"
Write-Host ""
Write-Host "App URL:"
Write-Host $AppUrl
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