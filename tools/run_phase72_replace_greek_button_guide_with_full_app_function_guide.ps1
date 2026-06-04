# RAFTOP CPAP CARE Pro
# Phase 72 - Replace Greek portal button guide with full app function guide
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
$AppUrl = "https://raftop-cpap-frontend.onrender.com/login"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase72_full_app_function_guide_greek_portal_" + $Timestamp + ".md")

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
    if (Test-Path $Path) { return Get-Content -Path $Path -Raw -Encoding UTF8 }
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 72 Full Greek App Function Guide" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 72 Full Greek App Function Guide..."
Write-Host ""

if (Test-Path $HtmlPath) { Add-Result "Greek portal index.html exists" "PASS" $HtmlPath } else { Add-Result "Greek portal index.html exists" "FAIL" $HtmlPath }
if (Test-Path $PortalDir) { Add-Result "Greek portal folder exists" "PASS" $PortalDir } else { Add-Result "Greek portal folder exists" "FAIL" $PortalDir }

$Html = Read-FileSafe $HtmlPath

# Remove previous Phase 71 guide/style blocks.
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
.app-guide-category {
  margin-top: 22px;
  padding-top: 14px;
  border-top: 1px solid #e5e7eb;
}
.app-guide-category h3 {
  color: #0f172a;
  margin-bottom: 8px;
}
.app-guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 10px;
  margin-top: 10px;
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
  font-weight: 700;
}
.app-guide-button:hover {
  background: #e2e8f0;
}
.app-guide-output {
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 18px;
  margin-top: 18px;
}
.app-guide-output h3 {
  margin-top: 0;
  color: #0f172a;
}
.app-guide-output p {
  line-height: 1.65;
}
.app-guide-output ul {
  margin-top: 8px;
}
.app-guide-output li {
  margin: 6px 0;
}
.app-guide-note {
  background: #ecfdf5;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 14px;
  margin: 14px 0;
  color: #065f46;
  font-weight: 700;
}
</style>
<!-- RAFTOP_APP_ACCESS_GUIDE_STYLE_END -->
'@

$GuideBlock = @'
<!-- RAFTOP_APP_ACCESS_GUIDE_START -->
<section class="app-access-panel" id="raftop-live-app-access">
  <h2>&#902;&#956;&#949;&#963;&#951; &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951; &#963;&#964;&#951;&#957; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;</h2>
  <p>
    &#913;&#960;&#972; &#949;&#948;&#974; &#945;&#957;&#959;&#943;&#947;&#949;&#953; &#951; live &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942; RAFTOP CPAP CARE Pro.
    &#932;&#959; &#960;&#945;&#961;&#945;&#954;&#940;&#964;&#969; &#954;&#959;&#965;&#956;&#960;&#943; &#959;&#948;&#951;&#947;&#949;&#943; &#963;&#964;&#951; &#963;&#949;&#955;&#943;&#948;&#945; &#963;&#973;&#957;&#948;&#949;&#963;&#951;&#962;.
  </p>
  <a class="app-primary-button" href="__APP_URL__" target="_blank" rel="noopener noreferrer">
    &#902;&#957;&#959;&#953;&#947;&#956;&#945; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962; RAFTOP
  </a>

  <div class="app-guide-note">
    &#927; &#959;&#948;&#951;&#947;&#972;&#962; &#960;&#945;&#961;&#945;&#954;&#940;&#964;&#969; &#949;&#958;&#951;&#947;&#949;&#943; &#964;&#951; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#943;&#945; &#954;&#940;&#952;&#949; &#954;&#959;&#965;&#956;&#960;&#953;&#959;&#973; &#964;&#951;&#962; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962;. &#916;&#949;&#957; &#949;&#943;&#957;&#945;&#953; &#949;&#963;&#969;&#964;&#949;&#961;&#953;&#954;&#941;&#962; &#963;&#951;&#956;&#949;&#953;&#974;&#963;&#949;&#953;&#962; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962;.
  </div>

  <h2>&#913;&#957;&#945;&#955;&#965;&#964;&#953;&#954;&#972;&#962; &#959;&#948;&#951;&#947;&#972;&#962; &#954;&#959;&#965;&#956;&#960;&#953;&#974;&#957;</h2>
  <p>
    &#928;&#945;&#964;&#942;&#963;&#964;&#949; &#963;&#949; &#954;&#940;&#952;&#949; &#954;&#959;&#965;&#956;&#960;&#943; &#947;&#953;&#945; &#957;&#945; &#948;&#949;&#943;&#964;&#949; &#964;&#953; &#954;&#940;&#957;&#949;&#953;, &#964;&#953; &#960;&#955;&#951;&#961;&#959;&#966;&#959;&#961;&#943;&#945; &#948;&#943;&#957;&#949;&#953; &#954;&#945;&#953; &#960;&#974;&#962; &#946;&#959;&#951;&#952;&#940; &#964;&#951; &#929;&#945;&#965;&#964;&#972;&#960;&#959;&#965;&#955;&#959;&#962;.
  </p>

  <div class="app-guide-category">
    <h3>Executive / Presentation buttons</h3>
    <div class="app-guide-grid">
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('executiveDemoHome')">Executive Demo Home</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('executiveDemoScript')">Executive Demo Script</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('qualityProfit')">Quality &amp; Profit</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotWalkthrough')">Pilot Walkthrough</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('demoLauncher')">Demo Launcher</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotLauncher')">Pilot Launcher</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('decisionLauncher')">Decision Launcher</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('salesSnapshot')">Sales Snapshot</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotProposal')">Pilot Proposal</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('decisionRoom')">Decision Room</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('objections')">Objections</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotSuccess')">Pilot Success</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotPlaybook')">Pilot Playbook</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('rolloutRoadmap')">Rollout Roadmap</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('presentationFlow')">Presentation Flow</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('finalDemoScript')">Final Demo Script</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('pilotApprovalDecision')">Pilot Approval Decision</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('executivePilotClose')">Executive Pilot Close</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('executiveLeaveBehind')">Executive Leave-behind</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('statistics')">Statistics</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('executiveReport')">Executive Report</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('businessImpact')">Business Impact</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('dashboard')">Dashboard</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('patientPortal')">Patient Portal</button>
    </div>
  </div>

  <div class="app-guide-category">
    <h3>Platform Operations buttons</h3>
    <div class="app-guide-grid">
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('patients')">Patients</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('devices')">Devices</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('patientSignals')">Patient Signals</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('atlas')">ATLAS</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('actionCenter')">Action Center</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('closedLoop')">Closed Loop</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('tasks')">Tasks</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('followUp')">Follow-up</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('notes')">Notes</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('referrals')">Referrals</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('notifications')">Notifications</button>
    </div>
  </div>

  <div class="app-guide-category">
    <h3>Executive metrics</h3>
    <div class="app-guide-grid">
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('operationalEfficiency')">Operational Efficiency</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('readinessScore')">Readiness Score</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('unresolvedRiskLoad')">Unresolved Risk Load</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('activeInterventions')">Active Interventions</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('complianceRescue')">Compliance Rescue</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('burdenIndex')">Burden Index</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('refresh')">Refresh</button>
      <button type="button" class="app-guide-button" onclick="raftopShowGuide('safeFallback')">Safe Fallback</button>
    </div>
  </div>

  <div id="raftop-guide-output" class="app-guide-output">
    <h3>&#917;&#960;&#953;&#955;&#941;&#958;&#964;&#949; &#941;&#957;&#945; &#954;&#959;&#965;&#956;&#960;&#943; &#947;&#953;&#945; &#957;&#945; &#948;&#949;&#943;&#964;&#949; &#945;&#957;&#945;&#955;&#965;&#964;&#953;&#954;&#942; &#949;&#960;&#949;&#958;&#942;&#947;&#951;&#963;&#951;.</h3>
  </div>
</section>

<script>
(function () {
  var guideItems = {
    executiveDemoHome: { title: 'Executive Demo Home', body: '<p>&#913;&#957;&#959;&#943;&#947;&#949;&#953; &#964;&#951;&#957; &#954;&#949;&#957;&#964;&#961;&#953;&#954;&#942; &#963;&#949;&#955;&#943;&#948;&#945; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962;. &#916;&#943;&#957;&#949;&#953; &#963;&#949; &#948;&#953;&#959;&#943;&#954;&#951;&#963;&#951; &#954;&#945;&#953; &#945;&#947;&#959;&#961;&#945;&#963;&#964;&#942; &#963;&#965;&#957;&#959;&#960;&#964;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945; &#964;&#951;&#962; &#945;&#958;&#943;&#945;&#962; &#964;&#951;&#962; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945;&#962;.</p><ul><li>&#932;&#953; &#948;&#943;&#957;&#949;&#953;: executive overview.</li><li>&#915;&#953;&#945;&#964;&#943; &#967;&#961;&#942;&#963;&#953;&#956;&#959;: &#958;&#949;&#954;&#953;&#957;&#940; &#951; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951; &#967;&#969;&#961;&#943;&#962; &#964;&#949;&#967;&#957;&#953;&#954;&#942; &#960;&#959;&#955;&#965;&#960;&#955;&#959;&#954;&#972;&#964;&#951;&#964;&#945;.</li></ul>' },
    executiveDemoScript: { title: 'Executive Demo Script', body: '<p>&#917;&#956;&#966;&#945;&#957;&#943;&#950;&#949;&#953; &#948;&#959;&#956;&#951;&#956;&#941;&#957;&#951; &#961;&#959;&#942; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962; &#947;&#953;&#945; &#964;&#951;&#957; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945;. &#914;&#959;&#951;&#952;&#940; &#957;&#945; &#966;&#945;&#957;&#949;&#943; &#964;&#953; &#960;&#961;&#959;&#946;&#955;&#942;&#956;&#945; &#955;&#973;&#957;&#949;&#953; &#954;&#945;&#953; &#960;&#974;&#962; &#960;&#945;&#961;&#959;&#965;&#963;&#953;&#940;&#950;&#949;&#964;&#945;&#953;.</p><ul><li>&#932;&#953; &#948;&#943;&#957;&#949;&#953;: &#963;&#949;&#953;&#961;&#940; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962;.</li><li>&#935;&#961;&#942;&#963;&#951;: &#963;&#964;&#945;&#952;&#949;&#961;&#972; demo &#963;&#949; &#945;&#947;&#959;&#961;&#945;&#963;&#964;&#942;.</li></ul>' },
    qualityProfit: { title: 'Quality & Profit', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#974;&#962; &#951; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945; &#963;&#965;&#957;&#948;&#941;&#949;&#953; &#960;&#959;&#953;&#972;&#964;&#951;&#964;&#945; &#960;&#945;&#961;&#945;&#954;&#959;&#955;&#959;&#973;&#952;&#951;&#963;&#951;&#962; &#956;&#949; &#949;&#960;&#953;&#967;&#949;&#953;&#961;&#951;&#963;&#953;&#945;&#954;&#972; &#972;&#966;&#949;&#955;&#959;&#962;.</p><ul><li>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#960;&#959;&#965; &#967;&#961;&#949;&#953;&#940;&#950;&#959;&#957;&#964;&#945;&#953; follow-up.</li><li>&#914;&#959;&#951;&#952;&#940; &#963;&#964;&#951; &#956;&#949;&#943;&#969;&#963;&#951; &#945;&#960;&#974;&#955;&#949;&#953;&#945;&#962; &#945;&#963;&#952;&#949;&#957;&#974;&#957; &#954;&#945;&#953; &#967;&#961;&#972;&#957;&#959;&#965;.</li></ul>' },
    pilotWalkthrough: { title: 'Pilot Walkthrough', body: '<p>&#927;&#948;&#951;&#947;&#949;&#943; &#946;&#942;&#956;&#945;-&#946;&#942;&#956;&#945; &#964;&#959; &#960;&#953;&#955;&#959;&#964;&#953;&#954;&#972;. &#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#953; &#952;&#945; &#947;&#943;&#957;&#949;&#953; &#963;&#964;&#951;&#957; &#960;&#961;&#974;&#964;&#951; &#948;&#959;&#954;&#953;&#956;&#945;&#963;&#964;&#953;&#954;&#942; &#960;&#949;&#961;&#943;&#959;&#948;&#959;.</p>' },
    demoLauncher: { title: 'Demo Launcher', body: '<p>&#931;&#965;&#947;&#954;&#949;&#957;&#964;&#961;&#974;&#957;&#949;&#953; &#964;&#945; &#963;&#951;&#956;&#949;&#943;&#945; &#964;&#959;&#965; demo &#963;&#949; &#941;&#957;&#945; &#963;&#951;&#956;&#949;&#943;&#959;. &#935;&#961;&#951;&#963;&#953;&#956;&#959;&#960;&#959;&#953;&#949;&#943;&#964;&#945;&#953; &#947;&#953;&#945; &#947;&#961;&#942;&#947;&#959;&#961;&#951; &#949;&#954;&#954;&#943;&#957;&#951;&#963;&#951; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962;.</p>' },
    pilotLauncher: { title: 'Pilot Launcher', body: '<p>&#917;&#954;&#954;&#953;&#957;&#949;&#943; &#964;&#951; &#955;&#959;&#947;&#953;&#954;&#942; &#964;&#959;&#965; pilot. &#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#953; &#967;&#961;&#949;&#953;&#940;&#950;&#949;&#964;&#945;&#953; &#947;&#953;&#945; &#957;&#945; &#958;&#949;&#954;&#953;&#957;&#942;&#963;&#949;&#953; &#951; &#960;&#961;&#974;&#964;&#951; &#949;&#955;&#949;&#947;&#967;&#972;&#956;&#949;&#957;&#951; &#967;&#961;&#942;&#963;&#951;.</p>' },
    decisionLauncher: { title: 'Decision Launcher', body: '<p>&#914;&#959;&#951;&#952;&#940; &#964;&#951; &#948;&#953;&#959;&#943;&#954;&#951;&#963;&#951; &#957;&#945; &#960;&#949;&#961;&#940;&#963;&#949;&#953; &#945;&#960;&#972; demo &#963;&#949; &#945;&#960;&#972;&#966;&#945;&#963;&#951;. &#931;&#965;&#947;&#954;&#949;&#957;&#964;&#961;&#974;&#957;&#949;&#953; &#964;&#945; &#954;&#961;&#953;&#964;&#942;&#961;&#953;&#945; &#947;&#953;&#945; &#949;&#960;&#972;&#956;&#949;&#957;&#959; &#946;&#942;&#956;&#945;.</p>' },
    salesSnapshot: { title: 'Sales Snapshot', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#949;&#956;&#960;&#959;&#961;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945;: &#960;&#959;&#953;&#945; &#945;&#958;&#943;&#945; &#960;&#945;&#961;&#940;&#947;&#949;&#953; &#951; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945;, &#960;&#974;&#962; &#956;&#960;&#959;&#961;&#949;&#943; &#957;&#945; &#960;&#959;&#965;&#955;&#951;&#952;&#949;&#943; &#954;&#945;&#953; &#960;&#959;&#953;&#945; &#963;&#951;&#956;&#949;&#943;&#945; &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#948;&#949;&#953; &#959; &#945;&#947;&#959;&#961;&#945;&#963;&#964;&#942;&#962;.</p>' },
    pilotProposal: { title: 'Pilot Proposal', body: '<p>&#928;&#945;&#961;&#959;&#965;&#963;&#953;&#940;&#950;&#949;&#953; &#960;&#961;&#972;&#964;&#945;&#963;&#951; &#960;&#953;&#955;&#959;&#964;&#953;&#954;&#942;&#962; &#949;&#966;&#945;&#961;&#956;&#959;&#947;&#942;&#962;: &#948;&#953;&#940;&#961;&#954;&#949;&#953;&#945;, &#967;&#961;&#942;&#963;&#964;&#949;&#962;, &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945;, &#963;&#964;&#972;&#967;&#959;&#953;, &#954;&#961;&#953;&#964;&#942;&#961;&#953;&#945; &#949;&#960;&#953;&#964;&#965;&#967;&#943;&#945;&#962;.</p>' },
    decisionRoom: { title: 'Decision Room', body: '<p>&#931;&#965;&#947;&#954;&#949;&#957;&#964;&#961;&#974;&#957;&#949;&#953; &#964;&#945; &#954;&#961;&#943;&#963;&#953;&#956;&#945; &#963;&#964;&#959;&#953;&#967;&#949;&#943;&#945; &#947;&#953;&#945; &#945;&#960;&#972;&#966;&#945;&#963;&#951;: &#945;&#958;&#943;&#945;, &#954;&#943;&#957;&#948;&#965;&#957;&#959;&#953;, rollout, &#949;&#960;&#972;&#956;&#949;&#957;&#945; &#946;&#942;&#956;&#945;&#964;&#945;.</p>' },
    objections: { title: 'Objections', body: '<p>&#917;&#958;&#951;&#947;&#949;&#943; &#963;&#965;&#957;&#942;&#952;&#949;&#953;&#962; &#945;&#957;&#964;&#953;&#961;&#961;&#942;&#963;&#949;&#953;&#962; &#954;&#945;&#953; &#964;&#953; &#963;&#951;&#956;&#945;&#943;&#957;&#959;&#965;&#957;: &#954;&#972;&#963;&#964;&#959;&#962;, &#967;&#961;&#972;&#957;&#959;&#962;, &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945;, &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951;, &#965;&#960;&#959;&#963;&#964;&#942;&#961;&#953;&#958;&#951;.</p>' },
    pilotSuccess: { title: 'Pilot Success', body: '<p>&#927;&#961;&#943;&#950;&#949;&#953; &#964;&#953; &#952;&#949;&#969;&#961;&#949;&#943;&#964;&#945;&#953; &#949;&#960;&#953;&#964;&#965;&#967;&#951;&#956;&#941;&#957;&#959; pilot: &#967;&#961;&#942;&#963;&#951;, &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945;, &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962;, &#948;&#953;&#959;&#953;&#954;&#951;&#964;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945;, &#945;&#960;&#972;&#966;&#945;&#963;&#951; &#949;&#960;&#941;&#954;&#964;&#945;&#963;&#951;&#962;.</p>' },
    pilotPlaybook: { title: 'Pilot Playbook', body: '<p>&#916;&#943;&#957;&#949;&#953; &#960;&#961;&#945;&#954;&#964;&#953;&#954;&#972; &#960;&#955;&#940;&#957;&#959; &#949;&#954;&#964;&#941;&#955;&#949;&#963;&#951;&#962; pilot: &#960;&#959;&#953;&#959;&#962; &#954;&#940;&#957;&#949;&#953; &#964;&#953;, &#960;&#972;&#964;&#949; &#947;&#943;&#957;&#949;&#964;&#945;&#953;, &#964;&#953; &#956;&#949;&#964;&#961;&#953;&#941;&#964;&#945;&#953;.</p>' },
    rolloutRoadmap: { title: 'Rollout Roadmap', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#974;&#962; &#951; &#960;&#955;&#945;&#964;&#966;&#972;&#961;&#956;&#945; &#956;&#960;&#959;&#961;&#949;&#943; &#957;&#945; &#960;&#949;&#961;&#940;&#963;&#949;&#953; &#945;&#960;&#972; pilot &#963;&#949; &#954;&#945;&#957;&#959;&#957;&#953;&#954;&#942; &#967;&#961;&#942;&#963;&#951; &#954;&#945;&#953; &#956;&#949;&#964;&#940; &#963;&#949; &#949;&#960;&#941;&#954;&#964;&#945;&#963;&#951; &#963;&#949; &#953;&#945;&#964;&#961;&#959;&#973;&#962;.</p>' },
    presentationFlow: { title: 'Presentation Flow', body: '<p>&#916;&#943;&#957;&#949;&#953; &#963;&#949;&#953;&#961;&#940; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;&#962; &#964;&#969;&#957; &#949;&#957;&#959;&#964;&#942;&#964;&#969;&#957; &#974;&#963;&#964;&#949; &#959; &#945;&#947;&#959;&#961;&#945;&#963;&#964;&#942;&#962; &#957;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#960;&#961;&#974;&#964;&#945; &#964;&#951;&#957; &#945;&#958;&#943;&#945; &#954;&#945;&#953; &#956;&#949;&#964;&#940; &#964;&#951; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#943;&#945;.</p>' },
    finalDemoScript: { title: 'Final Demo Script', body: '<p>&#917;&#943;&#957;&#945;&#953; &#964;&#949;&#955;&#953;&#954;&#972; &#963;&#949;&#957;&#940;&#961;&#953;&#959; demo &#947;&#953;&#945; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951; &#963;&#949; &#945;&#960;&#959;&#966;&#945;&#963;&#953;&#963;&#964;&#953;&#954;&#972; &#945;&#947;&#959;&#961;&#945;&#963;&#964;&#942;.</p>' },
    pilotApprovalDecision: { title: 'Pilot Approval Decision', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#945; &#963;&#951;&#956;&#949;&#943;&#945; &#960;&#959;&#965; &#967;&#961;&#949;&#953;&#940;&#950;&#959;&#957;&#964;&#945;&#953; &#947;&#953;&#945; &#941;&#947;&#954;&#961;&#953;&#963;&#951; pilot &#942; &#956;&#949;&#964;&#940;&#946;&#945;&#963;&#951; &#963;&#949; &#954;&#945;&#957;&#959;&#957;&#953;&#954;&#942; &#967;&#961;&#942;&#963;&#951;.</p>' },
    executivePilotClose: { title: 'Executive Pilot Close', body: '<p>&#931;&#965;&#957;&#959;&#968;&#943;&#950;&#949;&#953; &#964;&#959; &#954;&#955;&#949;&#943;&#963;&#953;&#956;&#959; &#964;&#959;&#965; pilot: &#945;&#960;&#959;&#964;&#949;&#955;&#941;&#963;&#956;&#945;&#964;&#945;, &#956;&#945;&#952;&#942;&#956;&#945;&#964;&#945;, &#949;&#960;&#972;&#956;&#949;&#957;&#949;&#962; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962;.</p>' },
    executiveLeaveBehind: { title: 'Executive Leave-behind', body: '<p>&#928;&#945;&#961;&#940;&#947;&#949;&#953; &#942; &#948;&#949;&#943;&#967;&#957;&#949;&#953; &#965;&#955;&#953;&#954;&#972; &#960;&#959;&#965; &#956;&#941;&#957;&#949;&#953; &#963;&#964;&#951; &#948;&#953;&#959;&#943;&#954;&#951;&#963;&#951; &#956;&#949;&#964;&#940; &#964;&#951;&#957; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951;.</p>' },
    statistics: { title: 'Statistics', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#963;&#964;&#945;&#964;&#953;&#963;&#964;&#953;&#954;&#940; &#963;&#964;&#959;&#953;&#967;&#949;&#943;&#945; &#967;&#961;&#942;&#963;&#951;&#962;, &#954;&#953;&#957;&#948;&#973;&#957;&#959;&#965;, &#949;&#957;&#949;&#961;&#947;&#949;&#953;&#974;&#957; &#954;&#945;&#953; &#945;&#960;&#959;&#948;&#959;&#964;&#953;&#954;&#972;&#964;&#951;&#964;&#945;&#962;.</p>' },
    executiveReport: { title: 'Executive Report', body: '<p>&#916;&#943;&#957;&#949;&#953; &#963;&#965;&#957;&#959;&#960;&#964;&#953;&#954;&#942; &#945;&#957;&#945;&#966;&#959;&#961;&#940; &#947;&#953;&#945; &#948;&#953;&#959;&#943;&#954;&#951;&#963;&#951;: &#964;&#953; &#963;&#965;&#956;&#946;&#945;&#943;&#957;&#949;&#953;, &#960;&#959;&#953;&#959;&#953; &#954;&#943;&#957;&#948;&#965;&#957;&#959;&#953; &#965;&#960;&#940;&#961;&#967;&#959;&#965;&#957;, &#964;&#953; &#954;&#949;&#961;&#948;&#943;&#950;&#949;&#953; &#951; &#949;&#964;&#945;&#953;&#961;&#949;&#943;&#945;.</p>' },
    businessImpact: { title: 'Business Impact', body: '<p>&#917;&#958;&#951;&#947;&#949;&#943; &#964;&#959; &#949;&#960;&#953;&#967;&#949;&#953;&#961;&#951;&#963;&#953;&#945;&#954;&#972; &#972;&#966;&#949;&#955;&#959;&#962;: &#956;&#949;&#943;&#969;&#963;&#951; &#967;&#945;&#956;&#941;&#957;&#969;&#957; follow-up, &#954;&#945;&#955;&#973;&#964;&#949;&#961;&#951; &#959;&#961;&#947;&#940;&#957;&#969;&#963;&#951;, &#948;&#965;&#957;&#945;&#964;&#972;&#964;&#951;&#964;&#945; &#956;&#949;&#964;&#945;&#960;&#974;&#955;&#951;&#963;&#951;&#962;.</p>' },
    dashboard: { title: 'Dashboard', body: '<p>&#917;&#943;&#957;&#945;&#953; &#954;&#949;&#957;&#964;&#961;&#953;&#954;&#942; &#959;&#952;&#972;&#957;&#951; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#953;&#954;&#942;&#962; &#949;&#953;&#954;&#972;&#957;&#945;&#962;. &#916;&#949;&#943;&#967;&#957;&#949;&#953; &#963;&#965;&#957;&#959;&#960;&#964;&#953;&#954;&#940; &#964;&#959; &#966;&#959;&#961;&#964;&#943;&#959; &#949;&#961;&#947;&#945;&#963;&#943;&#945;&#962; &#954;&#945;&#953; &#964;&#951;&#957; &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951; CPAP follow-up.</p>' },
    patientPortal: { title: 'Patient Portal', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#951;&#957; &#945;&#963;&#952;&#949;&#957;&#959;&#954;&#949;&#957;&#964;&#961;&#953;&#954;&#942; &#960;&#955;&#949;&#965;&#961;&#940;: &#964;&#953; &#956;&#960;&#959;&#961;&#949;&#943; &#957;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#941;&#957;&#945;&#962; &#945;&#963;&#952;&#949;&#957;&#942;&#962; &#947;&#953;&#945; &#964;&#951; &#967;&#961;&#942;&#963;&#951; CPAP &#954;&#945;&#953; &#964;&#951;&#957; &#960;&#959;&#961;&#949;&#943;&#945; &#964;&#959;&#965;.</p>' },

    patients: { title: 'Patients', body: '<p>&#913;&#957;&#959;&#943;&#947;&#949;&#953; &#964;&#951; &#955;&#943;&#963;&#964;&#945; &#945;&#963;&#952;&#949;&#957;&#974;&#957;. &#916;&#943;&#957;&#949;&#953; &#945;&#957;&#945;&#950;&#942;&#964;&#951;&#963;&#951;, &#941;&#955;&#949;&#947;&#967;&#959;, &#960;&#961;&#959;&#946;&#959;&#955;&#942; &#954;&#945;&#964;&#940;&#963;&#964;&#945;&#963;&#951;&#962; &#954;&#945;&#953; &#960;&#961;&#972;&#963;&#946;&#945;&#963;&#951; &#963;&#949; &#966;&#940;&#954;&#949;&#955;&#959; &#945;&#963;&#952;&#949;&#957;&#959;&#973;&#962;.</p>' },
    devices: { title: 'Devices', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#964;&#953;&#962; &#963;&#965;&#963;&#954;&#949;&#965;&#941;&#962; CPAP, &#963;&#949; &#960;&#959;&#953;&#959;&#957; &#945;&#963;&#952;&#949;&#957;&#942; &#945;&#957;&#942;&#954;&#959;&#965;&#957;, &#954;&#945;&#953; &#945;&#957; &#965;&#960;&#940;&#961;&#967;&#949;&#953; &#961;&#959;&#942; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#969;&#957; &#942; &#960;&#961;&#972;&#946;&#955;&#951;&#956;&#945; &#963;&#973;&#957;&#948;&#949;&#963;&#951;&#962;.</p>' },
    patientSignals: { title: 'Patient Signals', body: '<p>&#931;&#965;&#947;&#954;&#949;&#957;&#964;&#961;&#974;&#957;&#949;&#953; &#963;&#942;&#956;&#945;&#964;&#945; &#945;&#960;&#972; &#964;&#959;&#965;&#962; &#945;&#963;&#952;&#949;&#957;&#949;&#943;&#962;: no-data, &#967;&#945;&#956;&#951;&#955;&#942; &#967;&#961;&#942;&#963;&#951;, &#945;&#965;&#958;&#951;&#956;&#941;&#957;&#959; risk, &#945;&#957;&#940;&#947;&#954;&#951; follow-up.</p>' },
    atlas: { title: 'ATLAS', body: '<p>&#932;&#959; ATLAS &#959;&#961;&#947;&#945;&#957;&#974;&#957;&#949;&#953; &#964;&#945; &#963;&#942;&#956;&#945;&#964;&#945; &#963;&#949; &#960;&#961;&#959;&#964;&#949;&#961;&#945;&#953;&#972;&#964;&#951;&#964;&#949;&#962;. &#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#959;&#953;&#949;&#962; &#965;&#960;&#959;&#952;&#941;&#963;&#949;&#953;&#962; &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#954;&#953;&#957;&#951;&#952;&#959;&#973;&#957; &#960;&#961;&#974;&#964;&#945;.</p>' },
    actionCenter: { title: 'Action Center', body: '<p>&#917;&#943;&#957;&#945;&#953; &#964;&#959; &#963;&#951;&#956;&#949;&#943;&#959; &#949;&#957;&#949;&#961;&#947;&#949;&#953;&#974;&#957;. &#913;&#960;&#972; &#949;&#948;&#974; &#951; &#959;&#956;&#940;&#948;&#945; &#946;&#955;&#941;&#960;&#949;&#953; &#964;&#953; &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#947;&#943;&#957;&#949;&#953; &#963;&#949; &#954;&#940;&#952;&#949; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#972;.</p>' },
    closedLoop: { title: 'Closed Loop', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#945;&#957; &#964;&#959; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#972; &#960;&#945;&#961;&#945;&#954;&#959;&#955;&#959;&#965;&#952;&#942;&#952;&#951;&#954;&#949; &#956;&#941;&#967;&#961;&#953; &#954;&#955;&#949;&#943;&#963;&#953;&#956;&#959;. &#916;&#949;&#957; &#945;&#961;&#954;&#949;&#943; &#957;&#945; &#966;&#945;&#957;&#949;&#943; &#959; &#954;&#943;&#957;&#948;&#965;&#957;&#959;&#962;, &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#966;&#945;&#957;&#949;&#943; &#954;&#945;&#953; &#951; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#945;.</p>' },
    tasks: { title: 'Tasks', body: '<p>&#916;&#951;&#956;&#953;&#959;&#965;&#961;&#947;&#949;&#943; &#954;&#945;&#953; &#960;&#945;&#961;&#945;&#954;&#959;&#955;&#959;&#965;&#952;&#949;&#943; &#949;&#961;&#947;&#945;&#963;&#943;&#949;&#962; follow-up. &#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#959;&#953;&#959;&#962; &#964;&#959; &#941;&#967;&#949;&#953;, &#960;&#972;&#964;&#949; &#960;&#961;&#941;&#960;&#949;&#953; &#957;&#945; &#947;&#943;&#957;&#949;&#953; &#954;&#945;&#953; &#945;&#957; &#959;&#955;&#959;&#954;&#955;&#951;&#961;&#974;&#952;&#951;&#954;&#949;.</p>' },
    followUp: { title: 'Follow-up', body: '<p>&#922;&#945;&#964;&#945;&#947;&#961;&#940;&#966;&#949;&#953; &#949;&#960;&#953;&#954;&#959;&#953;&#957;&#969;&#957;&#943;&#949;&#962;, &#945;&#960;&#972;&#960;&#949;&#953;&#961;&#949;&#962;, &#945;&#960;&#959;&#964;&#941;&#955;&#949;&#963;&#956;&#945; &#949;&#960;&#945;&#966;&#942;&#962; &#954;&#945;&#953; &#949;&#960;&#972;&#956;&#949;&#957;&#951; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#945; &#947;&#953;&#945; &#945;&#963;&#952;&#949;&#957;&#942;.</p>' },
    notes: { title: 'Notes', body: '<p>&#922;&#961;&#945;&#964;&#940; &#963;&#951;&#956;&#949;&#953;&#974;&#963;&#949;&#953;&#962; &#960;&#959;&#965; &#946;&#959;&#951;&#952;&#959;&#973;&#957; &#964;&#951;&#957; &#959;&#956;&#940;&#948;&#945; &#957;&#945; &#956;&#951;&#957; &#967;&#940;&#957;&#949;&#953; &#960;&#955;&#951;&#961;&#959;&#966;&#959;&#961;&#943;&#945; &#947;&#953;&#945; &#964;&#959;&#957; &#945;&#963;&#952;&#949;&#957;&#942;.</p>' },
    referrals: { title: 'Referrals', body: '<p>&#917;&#956;&#966;&#945;&#957;&#943;&#950;&#949;&#953; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#960;&#959;&#965; &#967;&#961;&#949;&#953;&#940;&#950;&#959;&#957;&#964;&#945;&#953; &#960;&#945;&#961;&#945;&#960;&#959;&#956;&#960;&#942; &#942; &#949;&#957;&#951;&#956;&#941;&#961;&#969;&#963;&#951; &#963;&#965;&#957;&#949;&#961;&#947;&#940;&#964;&#951; / &#953;&#945;&#964;&#961;&#959;&#973;.</p>' },
    notifications: { title: 'Notifications', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#949;&#953;&#948;&#959;&#960;&#959;&#953;&#942;&#963;&#949;&#953;&#962; &#947;&#953;&#945; &#963;&#951;&#956;&#945;&#957;&#964;&#953;&#954;&#940; &#947;&#949;&#947;&#959;&#957;&#972;&#964;&#945;: &#957;&#941;&#945; &#963;&#942;&#956;&#945;&#964;&#945;, &#949;&#954;&#954;&#961;&#949;&#956;&#949;&#943;&#962; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962;, &#954;&#955;&#949;&#953;&#948;&#974;&#956;&#945;&#964;&#945; follow-up.</p>' },

    operationalEfficiency: { title: 'Operational Efficiency', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#972;&#963;&#959; &#945;&#960;&#959;&#948;&#959;&#964;&#953;&#954;&#940; &#955;&#949;&#953;&#964;&#959;&#965;&#961;&#947;&#949;&#943; &#951; &#961;&#959;&#942; CPAP follow-up. &#933;&#968;&#951;&#955;&#972; &#960;&#959;&#963;&#959;&#963;&#964;&#972; &#963;&#951;&#956;&#945;&#943;&#957;&#949;&#953; &#972;&#964;&#953; &#964;&#945; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#949;&#957;&#964;&#959;&#960;&#943;&#950;&#959;&#957;&#964;&#945;&#953; &#954;&#945;&#953; &#954;&#953;&#957;&#959;&#973;&#957;&#964;&#945;&#953; &#960;&#953;&#959; &#947;&#961;&#942;&#947;&#959;&#961;&#945;.</p>' },
    readinessScore: { title: 'Readiness Score', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#972;&#963;&#959; &#941;&#964;&#959;&#953;&#956;&#959; &#949;&#943;&#957;&#945;&#953; &#964;&#959; &#960;&#949;&#961;&#953;&#946;&#940;&#955;&#955;&#959;&#957; &#947;&#953;&#945; &#967;&#961;&#942;&#963;&#951;, pilot, rollout &#942; &#949;&#960;&#941;&#954;&#964;&#945;&#963;&#951;.</p>' },
    unresolvedRiskLoad: { title: 'Unresolved Risk Load', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#972;&#963;&#945; &#963;&#951;&#956;&#945;&#957;&#964;&#953;&#954;&#940; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#960;&#945;&#961;&#945;&#956;&#941;&#957;&#959;&#965;&#957; &#945;&#957;&#959;&#953;&#967;&#964;&#940; &#967;&#969;&#961;&#943;&#962; &#959;&#955;&#959;&#954;&#955;&#951;&#961;&#969;&#956;&#941;&#957;&#951; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#945;.</p>' },
    activeInterventions: { title: 'Active Interventions', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#972;&#963;&#949;&#962; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#949;&#962; &#949;&#943;&#957;&#945;&#953; &#963;&#949; &#949;&#958;&#941;&#955;&#953;&#958;&#951;: follow-up, tasks, &#949;&#955;&#941;&#947;&#967;&#959;&#953; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#969;&#957;, &#948;&#953;&#949;&#961;&#949;&#965;&#957;&#942;&#963;&#949;&#953;&#962;.</p>' },
    complianceRescue: { title: 'Compliance Rescue', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#960;&#972;&#963;&#945; &#960;&#949;&#961;&#953;&#963;&#964;&#945;&#964;&#953;&#954;&#940; &#956;&#960;&#959;&#961;&#959;&#973;&#957; &#957;&#945; &#963;&#969;&#952;&#959;&#973;&#957; &#949;&#960;&#953;&#967;&#949;&#953;&#961;&#951;&#963;&#953;&#945;&#954;&#940; &#956;&#949; &#941;&#947;&#954;&#945;&#953;&#961;&#959; follow-up &#960;&#961;&#953;&#957; &#967;&#945;&#952;&#949;&#943; &#951; &#963;&#965;&#956;&#956;&#972;&#961;&#966;&#969;&#963;&#951;.</p>' },
    burdenIndex: { title: 'Burden Index', body: '<p>&#924;&#949;&#964;&#961;&#940; &#964;&#959; &#966;&#959;&#961;&#964;&#943;&#959; &#949;&#961;&#947;&#945;&#963;&#943;&#945;&#962; &#954;&#945;&#953; &#964;&#951;&#957; &#960;&#943;&#949;&#963;&#951; &#963;&#964;&#951;&#957; &#959;&#956;&#940;&#948;&#945; &#960;&#945;&#961;&#945;&#954;&#959;&#955;&#959;&#973;&#952;&#951;&#963;&#951;&#962;.</p>' },
    refresh: { title: 'Refresh', body: '<p>&#913;&#957;&#945;&#957;&#949;&#974;&#957;&#949;&#953; &#964;&#945; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945; &#964;&#951;&#962; &#959;&#952;&#972;&#957;&#951;&#962;. &#935;&#961;&#942;&#963;&#953;&#956;&#959; &#972;&#964;&#945;&#957; &#941;&#967;&#949;&#953; &#947;&#943;&#957;&#949;&#953; &#957;&#941;&#945; &#949;&#953;&#963;&#945;&#947;&#969;&#947;&#942; &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#969;&#957; &#942; &#957;&#941;&#945; &#949;&#957;&#941;&#961;&#947;&#949;&#953;&#945;.</p>' },
    safeFallback: { title: 'Safe Fallback', body: '<p>&#916;&#949;&#943;&#967;&#957;&#949;&#953; &#945;&#963;&#966;&#945;&#955;&#942; &#949;&#957;&#945;&#955;&#955;&#945;&#954;&#964;&#953;&#954;&#942; &#949;&#953;&#954;&#972;&#957;&#945; &#972;&#964;&#945;&#957; &#954;&#940;&#960;&#959;&#953;&#959; endpoint &#948;&#949;&#957; &#948;&#943;&#957;&#949;&#953; live &#948;&#949;&#948;&#959;&#956;&#941;&#957;&#945;. &#904;&#964;&#963;&#953; &#951; &#960;&#945;&#961;&#959;&#965;&#963;&#943;&#945;&#963;&#951; &#948;&#949;&#957; &#963;&#960;&#940;&#949;&#953; &#954;&#945;&#953; &#948;&#953;&#945;&#964;&#951;&#961;&#949;&#943; &#963;&#964;&#945;&#952;&#949;&#961;&#942; &#949;&#953;&#954;&#972;&#957;&#945;.</p>' }
  };

  window.raftopShowGuide = function (key) {
    var item = guideItems[key];
    var output = document.getElementById('raftop-guide-output');

    if (!item || !output) { return; }

    output.innerHTML = '<h3>' + item.title + '</h3>' + item.body;
  };

  window.addEventListener('DOMContentLoaded', function () {
    window.raftopShowGuide('executiveDemoHome');
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

if (ContainsText $HtmlCheck $AppUrl) { Add-Result "App URL exists in index.html" "PASS" $AppUrl } else { Add-Result "App URL exists in index.html" "FAIL" "App URL missing." }
if (ContainsText $HtmlCheck "RAFTOP_APP_ACCESS_GUIDE_START") { Add-Result "Full app guide block exists" "PASS" "Marker found." } else { Add-Result "Full app guide block exists" "FAIL" "Marker missing." }
if (ContainsText $HtmlCheck "Executive Demo Home") { Add-Result "Executive buttons documented" "PASS" "Executive Demo Home found." } else { Add-Result "Executive buttons documented" "FAIL" "Executive Demo Home missing." }
if (ContainsText $HtmlCheck "Quality &amp; Profit") { Add-Result "Quality and Profit documented" "PASS" "Quality and Profit found." } else { Add-Result "Quality and Profit documented" "FAIL" "Quality and Profit missing." }
if (ContainsText $HtmlCheck "Patient Signals") { Add-Result "Patient Signals documented" "PASS" "Patient Signals found." } else { Add-Result "Patient Signals documented" "FAIL" "Patient Signals missing." }
if (ContainsText $HtmlCheck "ATLAS") { Add-Result "ATLAS documented" "PASS" "ATLAS found." } else { Add-Result "ATLAS documented" "FAIL" "ATLAS missing." }
if (ContainsText $HtmlCheck "Action Center") { Add-Result "Action Center documented" "PASS" "Action Center found." } else { Add-Result "Action Center documented" "FAIL" "Action Center missing." }
if (ContainsText $HtmlCheck "Closed Loop") { Add-Result "Closed Loop documented" "PASS" "Closed Loop found." } else { Add-Result "Closed Loop documented" "FAIL" "Closed Loop missing." }
if (ContainsText $HtmlCheck "Safe Fallback") { Add-Result "Safe Fallback documented" "PASS" "Safe Fallback found." } else { Add-Result "Safe Fallback documented" "FAIL" "Safe Fallback missing." }
if (ContainsText $HtmlCheck "&#964;&#953; &#954;&#940;&#957;&#949;&#953;") { Add-Result "Greek explanation wording exists" "PASS" "Greek explanation marker found." } else { Add-Result "Greek explanation wording exists" "FAIL" "Greek explanation marker missing." }

$ButtonMatches = [regex]::Matches($HtmlCheck, 'class="app-guide-button"')
if ($ButtonMatches.Count -ge 40) {
    Add-Result "Full guide button count" "PASS" ("Buttons found: " + $ButtonMatches.Count)
} else {
    Add-Result "Full guide button count" "FAIL" ("Buttons found: " + $ButtonMatches.Count)
}

# Regenerate PDF
if (Test-Path $PdfPath) { Remove-Item $PdfPath -Force }

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
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }

Compress-Archive -Path (Join-Path $PortalDir "*") -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) { Add-Result "Updated Greek portal ZIP created" "PASS" $ZipPath } else { Add-Result "Updated Greek portal ZIP created" "FAIL" $ZipPath }

# Inspect ZIP
if (Test-Path $ZipPath) {
    try {
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        $Zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
        $ZipEntries = $Zip.Entries | ForEach-Object { $_.FullName.Replace("\", "/") }
        $Zip.Dispose()

        if ($ZipEntries -contains "index.html") { Add-Result "ZIP contains index.html" "PASS" "Entry found." } else { Add-Result "ZIP contains index.html" "FAIL" "Entry missing." }
        if ($ZipEntries -contains "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_EL_v1.0.pdf") { Add-Result "ZIP contains PDF" "PASS" "Entry found." } else { Add-Result "ZIP contains PDF" "FAIL" "Entry missing." }
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
    $FinalStatus = "PHASE72_FULL_APP_FUNCTION_GUIDE_GREEK_PORTAL_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE72_FULL_APP_FUNCTION_GUIDE_GREEK_PORTAL_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE72_FULL_APP_FUNCTION_GUIDE_GREEK_PORTAL_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 72 Full Greek App Function Guide"
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