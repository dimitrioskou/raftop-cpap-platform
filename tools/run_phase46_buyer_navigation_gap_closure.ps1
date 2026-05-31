# RAFTOP CPAP CARE Pro
# Phase 46.2A - Buyer Navigation Gap Closure
# Purpose: Close buyer-ready route gaps detected by Phase 46 audit.
# Safe: creates frontend pages, backs up App.js, patches only route imports/routes.
# Does not touch backend or database.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendSrc = Join-Path $Root "enterprise-frontend\src"
$PagesDir = Join-Path $FrontendSrc "pages"
$AppPath = Join-Path $FrontendSrc "App.js"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $PagesDir)) {
    New-Item -ItemType Directory -Path $PagesDir -Force | Out-Null
}

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

if (!(Test-Path $AppPath)) {
    throw "App.js not found: $AppPath"
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupPath = Join-Path $ReportsDir ("App_before_phase46_buyer_navigation_gap_closure_" + $Timestamp + ".js")
Copy-Item $AppPath $BackupPath -Force

Write-Host "Backup created:"
Write-Host $BackupPath

function Write-PageFile {
    param(
        [string]$FileName,
        [string]$Content
    )

    $Path = Join-Path $PagesDir $FileName
    Set-Content -Path $Path -Value $Content -Encoding UTF8
    Write-Host "PAGE READY - $FileName"
}

$CommonStyle = @'
const styles = {
  page: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(135deg, #07111f 0%, #10233f 45%, #172a4a 100%)",
    color: "#f8fafc",
    fontFamily: "Inter, Arial, sans-serif"
  },
  shell: {
    maxWidth: "1180px",
    margin: "0 auto"
  },
  badge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(56, 189, 248, 0.14)",
    border: "1px solid rgba(125, 211, 252, 0.25)",
    color: "#bae6fd",
    fontSize: "13px",
    fontWeight: 700,
    marginBottom: "16px"
  },
  title: {
    fontSize: "34px",
    lineHeight: 1.1,
    margin: "0 0 12px 0"
  },
  subtitle: {
    fontSize: "17px",
    lineHeight: 1.6,
    color: "#cbd5e1",
    maxWidth: "850px",
    marginBottom: "28px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "rgba(15, 23, 42, 0.72)",
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: "22px",
    padding: "20px",
    boxShadow: "0 18px 45px rgba(0,0,0,0.28)"
  },
  cardTitle: {
    fontSize: "18px",
    margin: "0 0 10px 0",
    color: "#ffffff"
  },
  text: {
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: "14px",
    margin: 0
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "22px",
    background: "rgba(15, 23, 42, 0.65)",
    borderRadius: "18px",
    overflow: "hidden"
  },
  th: {
    textAlign: "left",
    padding: "14px",
    color: "#bae6fd",
    borderBottom: "1px solid rgba(148,163,184,0.2)"
  },
  td: {
    padding: "14px",
    color: "#e2e8f0",
    borderBottom: "1px solid rgba(148,163,184,0.12)"
  }
};
'@

$BuyerSettingsPage = @"
import React from "react";

$CommonStyle

export default function BuyerSettingsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro · Enterprise Settings</div>
        <h1 style={styles.title}>Settings & Tenant Control Center</h1>
        <p style={styles.subtitle}>
          Buyer-ready settings surface for tenant configuration, roles, modules, branding,
          integrations, access state and operational governance. This page exists to make
          the enterprise settings capability visible and navigable during buyer review.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Tenant Configuration</h2>
            <p style={styles.text}>Tenant identity, active modules, commercial mode, operational limits and buyer-facing configuration readiness.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Roles & Access</h2>
            <p style={styles.text}>Admin, staff, viewer, doctor and super-admin access boundaries for controlled enterprise rollout.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Branding & Presentation</h2>
            <p style={styles.text}>Buyer/client-facing branding, commercial demo positioning and future white-label readiness.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Operational Governance</h2>
            <p style={styles.text}>Monthly reviews, change request control, security boundaries and rollout discipline.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Control Area</th>
              <th style={styles.th}>Buyer Meaning</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Tenant Context</td>
              <td style={styles.td}>Separates customer environment and commercial scope.</td>
              <td style={styles.td}>Buyer-ready route</td>
            </tr>
            <tr>
              <td style={styles.td}>Module Gating</td>
              <td style={styles.td}>Supports staged rollout and paid add-ons.</td>
              <td style={styles.td}>Governance-ready</td>
            </tr>
            <tr>
              <td style={styles.td}>Access Policy</td>
              <td style={styles.td}>Prevents uncontrolled operational use.</td>
              <td style={styles.td}>Controlled pilot boundary</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
"@

$BuyerCompliancePage = @"
import React from "react";

$CommonStyle

export default function BuyerCompliancePage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro · Compliance Operations</div>
        <h1 style={styles.title}>CPAP Compliance & Risk Control</h1>
        <p style={styles.subtitle}>
          Buyer-ready compliance surface for usage visibility, no-data detection,
          compliance risk, leak / therapy issue visibility and ATLAS follow-up linkage.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Usage Visibility</h2>
            <p style={styles.text}>Shows whether patients are using CPAP consistently enough to remain operationally safe and commercially protected.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>No-Data Detection</h2>
            <p style={styles.text}>Turns missing data into visible operational blind spots that can trigger connectivity or patient follow-up.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Compliance Risk</h2>
            <p style={styles.text}>Prioritizes patients with low or declining usage so the team can act before the case deteriorates.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Leak / Therapy Signals</h2>
            <p style={styles.text}>Surfaces likely mask, comfort or therapy issues that can affect patient experience and adherence.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Signal</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Management Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>No Data</td>
              <td style={styles.td}>Connectivity check / patient call</td>
              <td style={styles.td}>Reduces blind spots</td>
            </tr>
            <tr>
              <td style={styles.td}>Low Usage</td>
              <td style={styles.td}>Compliance follow-up</td>
              <td style={styles.td}>Protects adherence and renewal value</td>
            </tr>
            <tr>
              <td style={styles.td}>High Leak</td>
              <td style={styles.td}>Mask check / technical review</td>
              <td style={styles.td}>Improves quality of service</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
"@

$BuyerReportsPage = @"
import React from "react";

$CommonStyle

export default function BuyerReportsPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro · Executive Reporting</div>
        <h1 style={styles.title}>Reports & Management Visibility</h1>
        <p style={styles.subtitle}>
          Buyer-ready reporting route for monthly executive summaries, ATLAS action
          performance, Quality & Profit interpretation, unresolved defects and rollout decisions.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Monthly Executive Report</h2>
            <p style={styles.text}>Summarizes patient risk, no-data, compliance, leak issues, ATLAS performance and decisions needed.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>ATLAS Action Summary</h2>
            <p style={styles.text}>Shows created, open, closed, blocked and escalated actions so management sees operational discipline.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Quality & Profit Trends</h2>
            <p style={styles.text}>Connects operational defects to management impact without overpromising unsupported ROI.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Rollout Decision Support</h2>
            <p style={styles.text}>Turns pilot and monthly results into annual license, extension, add-on or expansion decisions.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Report Type</th>
              <th style={styles.th}>Frequency</th>
              <th style={styles.th}>Decision Supported</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Weekly Pilot Review</td>
              <td style={styles.td}>Weekly</td>
              <td style={styles.td}>Action closure and course correction</td>
            </tr>
            <tr>
              <td style={styles.td}>Monthly Executive Report</td>
              <td style={styles.td}>Monthly</td>
              <td style={styles.td}>Management priorities</td>
            </tr>
            <tr>
              <td style={styles.td}>Final Pilot Report</td>
              <td style={styles.td}>End of pilot</td>
              <td style={styles.td}>Annual license / extended pilot / stop</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
"@

$BuyerDoctorClinicPage = @"
import React from "react";

$CommonStyle

export default function BuyerDoctorClinicPage() {
  return (
    <div style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.badge}>RAFTOP CPAP CARE Pro · Doctor / Clinic Expansion</div>
        <h1 style={styles.title}>Doctor & Clinic CPAP Reporting Module</h1>
        <p style={styles.subtitle}>
          Buyer-ready doctor / clinic expansion route for future resale of CPAP monitoring,
          patient summaries, compliance risk lists and co-branded reporting services.
        </p>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Doctor Patient Summaries</h2>
            <p style={styles.text}>Gives physicians filtered visibility into stable patients, risk patients and follow-up needs.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Clinic Reporting</h2>
            <p style={styles.text}>Supports clinic-level CPAP monitoring summaries, risk grouping and periodic review.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Co-Branded Service</h2>
            <p style={styles.text}>Allows Raftopoulos to move from equipment supplier to CPAP monitoring service partner.</p>
          </div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Recurring Revenue Path</h2>
            <p style={styles.text}>Creates future packages for basic reports, doctor dashboard access and clinic plans.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Package</th>
              <th style={styles.th}>Target</th>
              <th style={styles.th}>Indicative Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={styles.td}>Basic CPAP Report</td>
              <td style={styles.td}>Individual doctor</td>
              <td style={styles.td}>Monthly patient status visibility</td>
            </tr>
            <tr>
              <td style={styles.td}>Doctor Dashboard</td>
              <td style={styles.td}>Active CPAP referrer</td>
              <td style={styles.td}>Risk lists and patient summaries</td>
            </tr>
            <tr>
              <td style={styles.td}>Clinic Plan</td>
              <td style={styles.td}>Larger clinic / group</td>
              <td style={styles.td}>Group-level reporting and reviews</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
"@

Write-PageFile "BuyerSettingsPage.js" $BuyerSettingsPage
Write-PageFile "BuyerCompliancePage.js" $BuyerCompliancePage
Write-PageFile "BuyerReportsPage.js" $BuyerReportsPage
Write-PageFile "BuyerDoctorClinicPage.js" $BuyerDoctorClinicPage

$App = Get-Content -Path $AppPath -Raw

$ImportsToAdd = @(
    'import BuyerSettingsPage from "./pages/BuyerSettingsPage";',
    'import BuyerCompliancePage from "./pages/BuyerCompliancePage";',
    'import BuyerReportsPage from "./pages/BuyerReportsPage";',
    'import BuyerDoctorClinicPage from "./pages/BuyerDoctorClinicPage";'
)

foreach ($Import in $ImportsToAdd) {
    if ($App -notlike ("*" + $Import + "*")) {
        $ImportLines = [regex]::Matches($App, '(?m)^import .+;$')
        if ($ImportLines.Count -eq 0) {
            throw "Could not find import section in App.js."
        }

        $LastImport = $ImportLines[$ImportLines.Count - 1]
        $InsertIndex = $LastImport.Index + $LastImport.Length
        $App = $App.Insert($InsertIndex, "`r`n" + $Import)
    }
}

$RoutesToAdd = @(
    '          <Route path="/settings" element={<BuyerSettingsPage />} />',
    '          <Route path="/compliance" element={<BuyerCompliancePage />} />',
    '          <Route path="/reports" element={<BuyerReportsPage />} />',
    '          <Route path="/doctor" element={<BuyerDoctorClinicPage />} />',
    '          <Route path="/clinic" element={<BuyerDoctorClinicPage />} />'
)

$MissingRoutes = New-Object System.Collections.Generic.List[string]

foreach ($Route in $RoutesToAdd) {
    if ($App -notlike ("*" + $Route + "*")) {
        $MissingRoutes.Add($Route) | Out-Null
    }
}

if ($MissingRoutes.Count -gt 0) {
    if ($App -notlike "*</Routes>*") {
        throw "Could not find </Routes> in App.js. Manual route wiring required."
    }

    $RouteBlock = "`r`n" + (($MissingRoutes | Out-String).TrimEnd()) + "`r`n"

    $CatchAllMatch = [regex]::Match($App, '(?m)^\s*<Route\s+path=["'']\*["''].*$')

    if ($CatchAllMatch.Success) {
        $App = $App.Insert($CatchAllMatch.Index, $RouteBlock)
    } else {
        $CloseRoutesIndex = $App.IndexOf("</Routes>")
        $App = $App.Insert($CloseRoutesIndex, $RouteBlock)
    }
}

Set-Content -Path $AppPath -Value $App -Encoding UTF8

Write-Host ""
Write-Host "PHASE46 BUYER NAVIGATION GAP CLOSURE COMPLETE"
Write-Host "Created pages:"
Write-Host " - BuyerSettingsPage.js"
Write-Host " - BuyerCompliancePage.js"
Write-Host " - BuyerReportsPage.js"
Write-Host " - BuyerDoctorClinicPage.js"
Write-Host "Patched App.js with buyer-ready route references."
Write-Host ""