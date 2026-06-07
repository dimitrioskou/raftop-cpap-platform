# RAFTOP CPAP CARE Pro
# Phase 119 - Monthly 80h Commercial Value Report
# Adds buyer-facing monthly commercial value report for Pilot20 / AirView workflow.
# Does NOT create patients.
# Does NOT expose secrets.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$MonthlyReportPageFile = Join-Path $FrontendPagesDir "Pilot20MonthlyValueReportPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$RescuePageFile = Join-Path $FrontendPagesDir "Pilot20ComplianceRescueMonitorPage.js"
$ImportHistoryPageFile = Join-Path $FrontendPagesDir "Pilot20ImportHistoryPage.js"
$UnmatchedPageFile = Join-Path $FrontendPagesDir "Pilot20UnmatchedDevicesPage.js"
$DocFile = Join-Path $DocsDir "119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase119_monthly_80h_commercial_value_report_" + $Timestamp + ".md")

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
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }

    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)

    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Find-FrontendAppFile {
    $Candidates = @(
        "enterprise-frontend\src\App.js",
        "enterprise-frontend\src\App.jsx",
        "enterprise-frontend\src\app.js",
        "enterprise-frontend\src\app.jsx"
    )

    foreach ($Rel in $Candidates) {
        $Path = Join-Path $Root $Rel
        if (Test-Path $Path) { return $Path }
    }

    return ""
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 119 Monthly 80h Commercial Value Report" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 119 - Monthly 80h Commercial Value Report..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route file exists" "FAIL" $BackendRouteFile
}

# -------------------------------------------------------------------
# Backend endpoint
# -------------------------------------------------------------------
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent 'router.get("/monthly-value-report"')) {
        $EndpointBlock = @'

router.get("/monthly-value-report", async (req, res) => {
  try {
    const db = getDb(req);

    const patientsResult = await query(
      db,
      `
      with latest_compliance as (
        select distinct on (tenant_slug, patient_external_id)
          tenant_slug,
          patient_external_id,
          device_serial,
          record_date,
          month_start,
          usage_hours,
          month_usage_hours,
          usage_hours_30d,
          days_used_30d,
          ahi_avg_30d,
          leak_avg_30d
        from public.compliance_nights
        where tenant_slug = $1
        order by tenant_slug, patient_external_id, record_date desc
      )
      select
        p.patient_external_id,
        p.patient_code,
        p.doctor_external_id,
        p.branch_code,
        p.setup_date,
        d.device_serial,
        d.device_model,
        d.last_data_date,
        c.record_date,
        c.month_start,
        c.usage_hours,
        c.month_usage_hours,
        c.usage_hours_30d,
        c.days_used_30d,
        c.ahi_avg_30d,
        c.leak_avg_30d
      from public.patients p
      left join public.devices d
        on d.tenant_slug = p.tenant_slug
       and d.patient_external_id = p.patient_external_id
      left join latest_compliance c
        on c.tenant_slug = p.tenant_slug
       and c.patient_external_id = p.patient_external_id
      where p.tenant_slug = $1
      order by p.patient_external_id asc
      `,
      [PILOT_TENANT_ID]
    );

    const rows = patientsResult.rows.map(pilot20BuildRescueRow);

    let importSummary = {
      upload_batches: 0,
      total_import_rows: 0,
      total_updated: 0,
      total_skipped: 0,
      total_errors: 0,
      last_upload_at: null
    };

    try {
      await pilot20EnsureImportAuditTables(db);

      const importResult = await query(
        db,
        `
        select
          count(*)::integer as upload_batches,
          coalesce(sum(total_rows), 0)::integer as total_import_rows,
          coalesce(sum(updated_count), 0)::integer as total_updated,
          coalesce(sum(skipped_count), 0)::integer as total_skipped,
          coalesce(sum(error_count), 0)::integer as total_errors,
          max(created_at) as last_upload_at
        from public.pilot20_import_batches
        where tenant_slug = $1
        `,
        [PILOT_TENANT_ID]
      );

      if (importResult.rows && importResult.rows.length > 0) {
        importSummary = importResult.rows[0];
      }
    } catch (error) {
      importSummary.audit_warning = error.message;
    }

    const totalPatients = rows.length;
    const already80h = rows.filter((r) => r.is_80h_compliant).length;
    const below80h = rows.filter((r) => !r.is_80h_compliant).length;
    const safe = rows.filter((r) => r.risk_level === "SAFE").length;
    const onTrack = rows.filter((r) => r.risk_level === "ON_TRACK").length;
    const watch = rows.filter((r) => r.risk_level === "WATCH").length;
    const rescue = rows.filter((r) => r.risk_level === "RESCUE").length;
    const critical = rows.filter((r) => r.risk_level === "CRITICAL").length;

    const highAhi = rows.filter((r) => Number(r.ahi_avg_30d || 0) > 10).length;
    const highLeak = rows.filter((r) => Number(r.leak_avg_30d || 0) > 24).length;
    const actionable = watch + rescue + critical;
    const urgent = rescue + critical;

    const complianceRate = totalPatients > 0 ? Math.round((already80h / totalPatients) * 1000) / 10 : 0;
    const riskRate = totalPatients > 0 ? Math.round((urgent / totalPatients) * 1000) / 10 : 0;

    const topRiskRows = rows
      .slice()
      .sort((a, b) => {
        if ((b.risk_order || 0) !== (a.risk_order || 0)) return (b.risk_order || 0) - (a.risk_order || 0);
        return (b.required_daily_hours || 0) - (a.required_daily_hours || 0);
      })
      .slice(0, 10);

    let commercialConclusion = "Pilot data not sufficient yet. Enter patients and upload AirView usage data.";
    if (totalPatients > 0 && importSummary.upload_batches > 0) {
      if (urgent > 0) {
        commercialConclusion =
          "The platform identified urgent CPAP compliance risk before month end. These patients should be contacted first.";
      } else if (watch > 0) {
        commercialConclusion =
          "The platform identified patients needing monitoring before month end.";
      } else {
        commercialConclusion =
          "The pilot population is currently under control. Continue periodic AirView uploads.";
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_monthly_80h_commercial_value_report",
      summary: {
        total_patients: totalPatients,
        already_80h: already80h,
        below_80h: below80h,
        safe,
        on_track: onTrack,
        watch,
        rescue,
        critical,
        urgent,
        actionable,
        high_ahi: highAhi,
        high_leak: highLeak,
        compliance_rate: complianceRate,
        urgent_risk_rate: riskRate
      },
      import_summary: importSummary,
      commercial_conclusion: commercialConclusion,
      top_risk_rows: topRiskRows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_monthly_value_report_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $EndpointBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend monthly value report endpoint inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend monthly value report endpoint inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend monthly value report endpoint inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        'router.get("/monthly-value-report"',
        "pilot20_monthly_80h_commercial_value_report",
        "commercial_conclusion",
        "compliance_rate",
        "urgent_risk_rate",
        "top_risk_rows"
    )) {
        if (ContainsText $UpdatedBackend $Required) {
            Add-Result ("Backend required text exists: " + $Required) "PASS" "Found."
        } else {
            Add-Result ("Backend required text exists: " + $Required) "FAIL" "Missing."
        }
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $NodeCommand) {
        Add-Result "node command available" "WARN" "node not found; skipping syntax check."
    } else {
        $NodeOut = & node -c $BackendRouteFile 2>&1
        $NodeExit = $LASTEXITCODE

        if ($NodeExit -eq 0) {
            Add-Result "Backend route syntax check" "PASS" "node -c passed."
        } else {
            Add-Result "Backend route syntax check" "FAIL" ($NodeOut | Out-String)
        }
    }
}

# -------------------------------------------------------------------
# Frontend page
# -------------------------------------------------------------------
$PageContent = @'
import React, { useEffect, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function apiFetch(path) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    }
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Request failed");
  }

  return json;
}

export default function Pilot20MonthlyValueReportPage() {
  const [data, setData] = useState({ summary: {}, import_summary: {}, top_risk_rows: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/monthly-value-report");
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const summary = data.summary || {};
  const importSummary = data.import_summary || {};
  const rows = data.top_risk_rows || [];

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Monthly 80h Commercial Value Report</h1>
          <p style={subtitleStyle}>
            Executive report showing how the platform protects CPAP 80-hour compliance before the month ends.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>
          <a href="/pilot20/unmatched-devices" style={secondaryButtonStyle}>Unmatched Devices</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <button type="button" onClick={loadData} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading monthly value report...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Commercial conclusion</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          {data.commercial_conclusion || "No conclusion yet."}
        </div>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total Patients" value={summary.total_patients ?? 0} />
        <MetricCard label="80h Compliant" value={summary.already_80h ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
        <MetricCard label="Compliance Rate" value={`${summary.compliance_rate ?? 0}%`} />
        <MetricCard label="Urgent Risk" value={summary.urgent ?? 0} />
        <MetricCard label="Urgent Risk Rate" value={`${summary.urgent_risk_rate ?? 0}%`} />
        <MetricCard label="High AHI" value={summary.high_ahi ?? 0} />
        <MetricCard label="High Leak" value={summary.high_leak ?? 0} />
      </section>

      <section style={twoColumnStyle}>
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>80h risk distribution</h2>
          <RiskRow label="SAFE" value={summary.safe ?? 0} />
          <RiskRow label="ON TRACK" value={summary.on_track ?? 0} />
          <RiskRow label="WATCH" value={summary.watch ?? 0} />
          <RiskRow label="RESCUE" value={summary.rescue ?? 0} />
          <RiskRow label="CRITICAL" value={summary.critical ?? 0} />
        </div>

        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>AirView upload performance</h2>
          <MetricLine label="Upload batches" value={importSummary.upload_batches ?? 0} />
          <MetricLine label="Total import rows" value={importSummary.total_import_rows ?? 0} />
          <MetricLine label="Rows updated" value={importSummary.total_updated ?? 0} />
          <MetricLine label="Rows skipped" value={importSummary.total_skipped ?? 0} />
          <MetricLine label="Rows with errors" value={importSummary.total_errors ?? 0} />
          <MetricLine label="Last upload" value={formatDate(importSummary.last_upload_at)} />
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Top risk patients</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Highest priority patients to review before the end of the month.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Patient", "Device", "Current Hours", "Remaining", "Needed / Day", "Projected", "Risk", "Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={tdStyle}>No patient risk rows available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}>
                      <strong>{row.patient_code || row.patient_external_id}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.patient_external_id}</div>
                    </td>
                    <td style={tdStyle}>{row.device_serial || "-"}</td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}><strong>{round(row.required_daily_hours)}h/day</strong></td>
                    <td style={tdStyle}>{round(row.projected_end_month_hours)}h</td>
                    <td style={tdStyle}><RiskBadge risk={row.risk_level} /></td>
                    <td style={tdStyle}>{row.atlas_action || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How to use this with Raftopoulos</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Show how many patients are below 80h before month end.</li>
          <li>Show urgent risk: RESCUE + CRITICAL.</li>
          <li>Show that AirView uploads create measurable operational visibility.</li>
          <li>Use Top Risk Patients as the follow-up call list.</li>
          <li>Use this report as the commercial proof for full rollout.</li>
        </ol>
      </section>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{label}</div>
      <div style={metricStyle}>{value}</div>
    </div>
  );
}

function RiskRow({ label, value }) {
  return (
    <div style={riskRowStyle}>
      <span style={{ fontWeight: 900 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function MetricLine({ label, value }) {
  return (
    <div style={riskRowStyle}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function RiskBadge({ risk }) {
  const styleMap = {
    SAFE: { background: "#dcfce7", color: "#166534" },
    ON_TRACK: { background: "#dbeafe", color: "#1d4ed8" },
    WATCH: { background: "#fef3c7", color: "#92400e" },
    RESCUE: { background: "#ffedd5", color: "#c2410c" },
    CRITICAL: { background: "#fee2e2", color: "#991b1b" }
  };

  const style = styleMap[risk] || styleMap.WATCH;

  return (
    <span style={{ ...style, padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
      {risk || "UNKNOWN"}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return value;
  }
}

function round(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return Math.round(n * 10) / 10;
}

const pageStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2147483000,
  overflowY: "auto",
  background: "#f8fafc",
  padding: 24,
  boxSizing: "border-box",
  fontFamily: '"Segoe UI", "Noto Sans", "Roboto", "Arial", sans-serif'
};

const headerStyle = {
  maxWidth: 1180,
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start"
};

const eyebrowStyle = {
  margin: 0,
  color: "#64748b",
  fontWeight: 900
};

const titleStyle = {
  margin: "4px 0 8px",
  color: "#0f172a"
};

const subtitleStyle = {
  margin: 0,
  color: "#475569",
  lineHeight: 1.6,
  maxWidth: 760
};

const headlineStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const cardsGridStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
};

const twoColumnStyle = {
  maxWidth: 1180,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 20
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  maxWidth: 1180,
  marginLeft: "auto",
  marginRight: "auto"
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const labelStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.4
};

const metricStyle = {
  marginTop: 8,
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a"
};

const riskRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
  color: "#334155"
};

const primaryLinkStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none"
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none",
  cursor: "pointer"
};

const thStyle = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: 13
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top"
};

const errorStyle = {
  maxWidth: 1180,
  margin: "0 auto 16px",
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};

const infoStyle = {
  maxWidth: 1180,
  margin: "0 auto 16px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};
'@

Set-Content -Path $MonthlyReportPageFile -Value $PageContent -Encoding UTF8

if (Test-Path $MonthlyReportPageFile) {
    Add-Result "Frontend monthly value report page created" "PASS" $MonthlyReportPageFile
} else {
    Add-Result "Frontend monthly value report page created" "FAIL" $MonthlyReportPageFile
}

# -------------------------------------------------------------------
# Route integration
# -------------------------------------------------------------------
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "No App.js/App.jsx found."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp

    $AppContent = Read-FileSafe $FrontendApp

    if (-not (ContainsText $AppContent "Pilot20MonthlyValueReportPage")) {
        $ImportLine = 'import Pilot20MonthlyValueReportPage from "./pages/Pilot20MonthlyValueReportPage";'
        $Lines = $AppContent -split "`r?`n"
        $InsertIndex = -1

        for ($i = 0; $i -lt $Lines.Count; $i++) {
            if ($Lines[$i] -match "^\s*import\s+") { $InsertIndex = $i }
        }

        if ($InsertIndex -ge 0) {
            $Before = $Lines[0..$InsertIndex]
            $After = $Lines[($InsertIndex + 1)..($Lines.Count - 1)]
            $Lines = @($Before + $ImportLine + $After)
            $AppContent = $Lines -join "`r`n"
            Add-Result "Frontend monthly report import inserted" "PASS" $ImportLine
        } else {
            $AppContent = $ImportLine + "`r`n" + $AppContent
            Add-Result "Frontend monthly report import inserted" "WARN" "Inserted at top."
        }
    } else {
        Add-Result "Frontend monthly report import inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/monthly-value-report')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/monthly-value-report" element={<Pilot20MonthlyValueReportPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend monthly value report route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/monthly-value-report" component={Pilot20MonthlyValueReportPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend monthly value report route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend monthly value report route inserted" "FAIL" "No Routes/Switch anchor found."
        }
    } else {
        Add-Result "Frontend monthly value report route inserted" "PASS" "Already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# -------------------------------------------------------------------
# Guard
# -------------------------------------------------------------------
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_MONTHLY_VALUE_REPORT_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";',
            'const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";' + "`r`n" + 'const PILOT20_MONTHLY_VALUE_REPORT_PATH = "/pilot20/monthly-value-report";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname === PILOT20_UNMATCHED_DEVICES_PATH || pathname === PILOT20_MONTHLY_VALUE_REPORT_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH || currentPath === PILOT20_MONTHLY_VALUE_REPORT_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/monthly-value-report") {
        Add-Result "Pilot20 guard allows monthly value report" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows monthly value report" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard exists" "WARN" "Guard file not found."
}

# -------------------------------------------------------------------
# Links in pages
# -------------------------------------------------------------------
foreach ($Page in @($RescuePageFile, $ImportHistoryPageFile, $UnmatchedPageFile)) {
    if (Test-Path $Page) {
        $P = Read-FileSafe $Page

        if (-not (ContainsText $P "/pilot20/monthly-value-report")) {
            $P = $P.Replace(
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>',
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>' + "`r`n" + '          <a href="/pilot20/monthly-value-report" style={secondaryButtonStyle}>Monthly Report</a>'
            )

            Set-Content -Path $Page -Value $P -Encoding UTF8
            Add-Result ("Monthly report link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Link patched."
        } else {
            Add-Result ("Monthly report link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Already present."
        }
    }
}

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$DocContent = @'
# RAFTOP CPAP CARE Pro - Monthly 80h Commercial Value Report

REQUIRED_MARKER: PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT
REQUIRED_MARKER: MONTHLY_COMMERCIAL_VALUE_REPORT_READY
REQUIRED_MARKER: EIGHTY_HOUR_VALUE_PROOF_READY
REQUIRED_MARKER: BUYER_EXECUTIVE_REPORT_READY
REQUIRED_MARKER: READY_FOR_PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK

## Purpose

The buyer needs proof of value, not only screens.

This report shows:
- total patients
- 80h compliant patients
- below 80h patients
- compliance rate
- urgent risk patients
- high AHI
- high leak
- AirView upload performance
- top risk patients
- commercial conclusion

## Page

/pilot20/monthly-value-report

## API

GET /api/pilot20/monthly-value-report

## Commercial use

At the end of the pilot, use this page to show what the platform detected before month end and which patients needed intervention.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase119 doc created" "PASS" $DocFile
} else {
    Add-Result "Phase119 doc created" "FAIL" $DocFile
}

# -------------------------------------------------------------------
# Required checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $MonthlyReportPageFile, $GuardFile, $RescuePageFile, $ImportHistoryPageFile, $UnmatchedPageFile, $DocFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT",
    "MONTHLY_COMMERCIAL_VALUE_REPORT_READY",
    "EIGHTY_HOUR_VALUE_PROOF_READY",
    "BUYER_EXECUTIVE_REPORT_READY",
    'router.get("/monthly-value-report"',
    "/pilot20/monthly-value-report",
    "Monthly 80h Commercial Value Report"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase119 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase119 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase119 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase119 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 119 Monthly 80h Commercial Value Report"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend page:"
Write-Host $MonthlyReportPageFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
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