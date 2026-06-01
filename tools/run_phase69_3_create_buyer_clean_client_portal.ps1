# RAFTOP CPAP CARE Pro
# Phase 69.3 - Buyer-Clean Client Portal
# Safe: creates a buyer-facing clean HTML/PDF/ZIP portal.
# Does not modify application code.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DeliveryRoot = Join-Path $Root "client-delivery"

$OutDir = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0"
$ZipPath = Join-Path $DeliveryRoot "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0.zip"
$HtmlPath = Join-Path $OutDir "index.html"
$PdfPath = Join-Path $OutDir "RAFTOP_CLIENT_PORTAL_BUYER_CLEAN_v1.0.pdf"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DeliveryRoot -Force | Out-Null

if (Test-Path $OutDir) {
    Remove-Item $OutDir -Recurse -Force
}

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase69_3_buyer_clean_client_portal_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 69.3 Buyer-Clean Client Portal" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 69.3 Buyer-Clean Client Portal..."
Write-Host ""

$Html = @'
<!doctype html>
<html lang="el">
<head>
<meta charset="utf-8">
<title>RAFTOP CPAP CARE Pro - Client Portal v1.0</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  background: #f4f6f8;
  color: #111827;
}
.header {
  background: #0f172a;
  color: #ffffff;
  padding: 38px 48px;
}
.header h1 {
  margin: 0;
  font-size: 34px;
}
.header p {
  max-width: 1050px;
  color: #cbd5e1;
  line-height: 1.6;
  font-size: 16px;
}
.wrap {
  max-width: 1180px;
  margin: 0 auto;
  padding: 30px;
}
.notice {
  background: #ffffff;
  border-left: 7px solid #0f172a;
  padding: 20px 24px;
  border-radius: 14px;
  margin-bottom: 22px;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 18px;
  margin: 22px 0;
}
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 22px;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
}
.card h2 {
  margin-top: 0;
  color: #0f172a;
  font-size: 20px;
}
.card p, .card li {
  color: #374151;
  line-height: 1.6;
  font-size: 14px;
}
.section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 24px;
  margin: 22px 0;
  box-shadow: 0 1px 8px rgba(15, 23, 42, 0.08);
}
.section h2 {
  margin-top: 0;
  color: #0f172a;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
}
th, td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
  font-size: 14px;
  vertical-align: top;
}
th {
  background: #f3f4f6;
}
.badge {
  display: inline-block;
  background: #e5e7eb;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  margin-right: 6px;
}
.footer {
  color: #6b7280;
  font-size: 12px;
  margin: 28px 0;
}
@media print {
  body { background: #ffffff; }
  .card, .section, .notice { box-shadow: none; }
}
</style>
</head>

<body>
<header class="header">
  <h1>RAFTOP CPAP CARE Pro - Client Portal v1.0</h1>
  <p>
    Buyer-facing start portal for the controlled operational launch of RAFTOP CPAP CARE Pro.
    This portal summarizes the platform purpose, access flow, onboarding process, data intake,
    support model and resale preparation for doctors and clinics.
  </p>
</header>

<main class="wrap">

  <div class="notice">
    <strong>First step:</strong>
    Review this portal before the kickoff meeting. The goal is to align users, roles,
    data boundaries, first sample data and the first operational review.
  </div>

  <section class="section">
    <h2>1. What RAFTOP CPAP CARE Pro Provides</h2>
    <p>
      RAFTOP CPAP CARE Pro is a CPAP operations and follow-up visibility layer for Raftopoulos.
      It supports structured monitoring, no-data awareness, compliance risk visibility,
      ATLAS action organization, operational follow-up and management reporting.
    </p>
    <p>
      The platform is intended to support operational control and reporting. It is not a diagnostic medical device. It is not a diagnostic
      medical device and does not replace physician judgment.
    </p>
    <p>
      <span class="badge">Operations</span>
      <span class="badge">CPAP follow-up</span>
      <span class="badge">ATLAS actions</span>
      <span class="badge">Reporting</span>
      <span class="badge">Resale preparation</span>
    </p>
  </section>

  <div class="grid">
    <div class="card">
      <h2>Platform Access</h2>
      <p>
        Access is provided through the agreed production environment. User credentials are provided
        separately through a controlled process after named users and roles are confirmed.
      </p>
      <ul>
        <li>Buyer Admin</li>
        <li>CPAP Operations User</li>
        <li>Management Viewer</li>
        <li>Technical/Data Contact</li>
      </ul>
    </div>

    <div class="card">
      <h2>Tenant Activation</h2>
      <p>
        The Raftopoulos environment is activated with a defined commercial path, user roles,
        support level, data boundary and first operational review date.
      </p>
      <ul>
        <li>Tenant status confirmed</li>
        <li>Roles confirmed</li>
        <li>Access route tested</li>
        <li>Support owner confirmed</li>
      </ul>
    </div>

    <div class="card">
      <h2>Data Intake</h2>
      <p>
        The first data sample should use structured CSV format with controlled identifiers.
        Demo, anonymized or pseudonymized data is preferred for the initial review.
      </p>
      <ul>
        <li>patient_reference_code</li>
        <li>device_reference_code</li>
        <li>date</li>
        <li>usage_hours</li>
        <li>no_data_status</li>
        <li>leak_metric</li>
        <li>ahi_metric</li>
      </ul>
    </div>

    <div class="card">
      <h2>Onboarding</h2>
      <p>
        Onboarding starts with a 60-minute kickoff and continues with first-user activation,
        first data sample review, ATLAS workflow review and first management summary.
      </p>
      <ul>
        <li>Kickoff meeting</li>
        <li>User activation</li>
        <li>Data sample review</li>
        <li>First operational review</li>
      </ul>
    </div>

    <div class="card">
      <h2>Support Model</h2>
      <p>
        Support covers agreed access, workflow, data intake and operational usage questions.
        New modules, integrations, custom dashboards or expanded rollout items are handled through
        a separate change request process.
      </p>
      <ul>
        <li>Access support</li>
        <li>Workflow support</li>
        <li>Data intake clarification</li>
        <li>Change request handling</li>
      </ul>
    </div>

    <div class="card">
      <h2>Doctor / Clinic Resale</h2>
      <p>
        After the internal Raftopoulos workflow is stable, the platform can support structured
        resale packages for doctors and clinics through reporting, dashboard access and managed
        CPAP visibility services.
      </p>
      <ul>
        <li>Basic CPAP Report</li>
        <li>Doctor Dashboard</li>
        <li>Clinic Plan</li>
        <li>Tenant provisioning process</li>
      </ul>
    </div>
  </div>

  <section class="section">
    <h2>2. Operational Start Sequence</h2>
    <table>
      <tr>
        <th>Step</th>
        <th>Action</th>
        <th>Expected Output</th>
      </tr>
      <tr>
        <td>1</td>
        <td>Confirm receipt of the client portal package</td>
        <td>Delivery acknowledged</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Confirm buyer sponsor, operations owner and technical/data contact</td>
        <td>Named owner list</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Confirm first users and roles</td>
        <td>User setup list</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Confirm credential delivery method</td>
        <td>Controlled access process</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Prepare first sample data</td>
        <td>CSV/data preview ready</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Run 60-minute kickoff</td>
        <td>Scope, users, data and next review aligned</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Book first operational review</td>
        <td>Review scheduled 3 to 7 days after kickoff</td>
      </tr>
    </table>
  </section>

  <section class="section">
    <h2>3. First 7 Days Plan</h2>
    <table>
      <tr>
        <th>Day</th>
        <th>Focus</th>
      </tr>
      <tr>
        <td>Day 1</td>
        <td>Kickoff, owners, access process and data boundary confirmation</td>
      </tr>
      <tr>
        <td>Day 2</td>
        <td>User role confirmation and first login test</td>
      </tr>
      <tr>
        <td>Day 3</td>
        <td>First CSV/data sample review</td>
      </tr>
      <tr>
        <td>Day 4</td>
        <td>No-data and compliance risk review</td>
      </tr>
      <tr>
        <td>Day 5</td>
        <td>ATLAS action workflow review</td>
      </tr>
      <tr>
        <td>Day 6</td>
        <td>Management reporting and summary review</td>
      </tr>
      <tr>
        <td>Day 7</td>
        <td>Blocker list, feedback and next operational decision</td>
      </tr>
    </table>
  </section>

  <section class="section">
    <h2>4. Data Intake Template</h2>
    <p>The recommended initial CSV structure is:</p>
    <table>
      <tr>
        <th>Field</th>
        <th>Description</th>
      </tr>
      <tr><td>patient_reference_code</td><td>Pseudonymized patient reference</td></tr>
      <tr><td>device_reference_code</td><td>Pseudonymized device reference</td></tr>
      <tr><td>date</td><td>Therapy data date in YYYY-MM-DD format</td></tr>
      <tr><td>usage_hours</td><td>CPAP usage hours</td></tr>
      <tr><td>no_data_status</td><td>yes/no indicator for missing data</td></tr>
      <tr><td>leak_metric</td><td>Leak value if available</td></tr>
      <tr><td>ahi_metric</td><td>AHI value if available</td></tr>
      <tr><td>follow_up_status</td><td>none, open, in_progress, completed or blocked</td></tr>
      <tr><td>assigned_owner</td><td>Responsible person/team</td></tr>
      <tr><td>notes</td><td>Short operational note</td></tr>
    </table>
  </section>

  <section class="section">
    <h2>5. Support and Change Request Boundary</h2>
    <p>
      Standard support covers agreed access, route availability, onboarding usage, data intake
      clarification, ATLAS workflow guidance, reporting usage guidance and incident triage.
    </p>
    <p>
      New features, new dashboards, new integrations, mobile application work, large custom reports,
      expanded doctor/clinic rollout and advanced automation require separate written scope,
      commercial approval and timeline.
    </p>
  </section>

  <section class="section">
    <h2>6. Resale Preparation</h2>
    <p>
      Raftopoulos can use the platform to create structured CPAP visibility services for doctors
      and clinics. The recommended resale approach starts after the internal operational workflow
      has been validated.
    </p>
    <table>
      <tr>
        <th>Package</th>
        <th>Indicative Positioning</th>
      </tr>
      <tr>
        <td>Basic CPAP Report</td>
        <td>Periodic patient visibility and risk summary</td>
      </tr>
      <tr>
        <td>Doctor Dashboard</td>
        <td>Ongoing visibility for assigned CPAP patients</td>
      </tr>
      <tr>
        <td>Clinic Plan</td>
        <td>Multi-user clinic overview and management reporting</td>
      </tr>
    </table>
  </section>

  <section class="section">
    <h2>7. Handover Checklist</h2>
    <table>
      <tr>
        <th>Item</th>
        <th>Status</th>
      </tr>
      <tr><td>Client portal received</td><td>To confirm</td></tr>
      <tr><td>Buyer sponsor confirmed</td><td>To confirm</td></tr>
      <tr><td>Operations owner confirmed</td><td>To confirm</td></tr>
      <tr><td>Technical/data contact confirmed</td><td>To confirm</td></tr>
      <tr><td>First users confirmed</td><td>To confirm</td></tr>
      <tr><td>Credential delivery process confirmed</td><td>To confirm</td></tr>
      <tr><td>First data sample planned</td><td>To confirm</td></tr>
      <tr><td>Kickoff scheduled</td><td>To confirm</td></tr>
      <tr><td>First operational review scheduled</td><td>To confirm</td></tr>
    </table>
  </section>

  <div class="notice">
    <strong>Next step:</strong>
    Schedule the 60-minute kickoff to confirm users, roles, credential delivery method,
    data boundary, first data sample and first operational review date.
  </div>

  <p class="footer">
    RAFTOP CPAP CARE Pro - Client Portal v1.0. This portal is for controlled onboarding,
    operational use and commercial rollout preparation.
  </p>

</main>
</body>
</html>
'@

Set-Content -Path $HtmlPath -Value $Html -Encoding UTF8

if (Test-Path $HtmlPath) {
    Add-Result "Buyer-clean index.html created" "PASS" $HtmlPath
} else {
    Add-Result "Buyer-clean index.html created" "FAIL" $HtmlPath
}

$HtmlCheck = Get-Content -Path $HtmlPath -Raw -Encoding UTF8

$RequiredMarkers = @(
    "Client Portal v1.0",
    "Operational Start Sequence",
    "First 7 Days Plan",
    "Data Intake Template",
    "Support and Change Request Boundary",
    "Resale Preparation",
    "Handover Checklist",
    "not a diagnostic medical device"
)

foreach ($Marker in $RequiredMarkers) {
    if ($HtmlCheck.IndexOf($Marker, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        Add-Result ("Required marker: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required marker: " + $Marker) "FAIL" "Marker missing."
    }
}

$ForbiddenText = @(
    "do not give",
    "do not send",
    "ChatGPT",
    "developer-only",
    "internal scripts",
    "GitHub",
    "source code",
    ".env",
    "Render secrets",
    "GitHub secrets",
    "raw logs",
    "tools",
    "developer reports"
)

foreach ($Text in $ForbiddenText) {
    if ($HtmlCheck.IndexOf($Text, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
        Add-Result ("Buyer-clean forbidden text absent: " + $Text) "FAIL" "Forbidden buyer-facing text found."
    } else {
        Add-Result ("Buyer-clean forbidden text absent: " + $Text) "PASS" "Forbidden text absent."
    }
}

# Generate PDF using Microsoft Edge
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
            Add-Result "Buyer-clean PDF generated" "PASS" ("PDF size bytes: " + $PdfItem.Length)
        } else {
            Add-Result "Buyer-clean PDF generated" "WARN" "PDF exists but size is small."
        }
    } else {
        Add-Result "Buyer-clean PDF generated" "WARN" "PDF was not created."
    }
} else {
    Add-Result "Buyer-clean PDF generated" "WARN" "Microsoft Edge not found."
}

Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $ZipPath -Force

if (Test-Path $ZipPath) {
    Add-Result "Buyer-clean portal ZIP created" "PASS" $ZipPath
} else {
    Add-Result "Buyer-clean portal ZIP created" "FAIL" $ZipPath
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE69_3_BUYER_CLEAN_CLIENT_PORTAL_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE69_3_BUYER_CLEAN_CLIENT_PORTAL_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE69_3_BUYER_CLEAN_CLIENT_PORTAL_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 69.3 Buyer-Clean Client Portal"
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

