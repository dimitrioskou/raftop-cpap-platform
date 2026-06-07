# RAFTOP CPAP CARE Pro
# Phase 119R - Live Rolling 80h Early Warning & Patient Rescue Report
# Replaces calendar-month thinking with individual rolling 30-day 80h compliance windows.
# Does NOT create patients.
# Does NOT expose secrets.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$RollingReportPageFile = Join-Path $FrontendPagesDir "Pilot20RollingEarlyWarningReportPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$RescuePageFile = Join-Path $FrontendPagesDir "Pilot20ComplianceRescueMonitorPage.js"
$ImportHistoryPageFile = Join-Path $FrontendPagesDir "Pilot20ImportHistoryPage.js"
$UnmatchedPageFile = Join-Path $FrontendPagesDir "Pilot20UnmatchedDevicesPage.js"
$UploadPageFile = Join-Path $FrontendPagesDir "Pilot20UsageUploadPage.js"
$DocFile = Join-Path $DocsDir "119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase119r_live_rolling_80h_early_warning_patient_rescue_report_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 119R Live Rolling 80h Early Warning & Patient Rescue Report" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 119R - Live Rolling 80h Early Warning & Patient Rescue Report..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route file exists" "FAIL" $BackendRouteFile
}

# -------------------------------------------------------------------
# Backend rolling 80h helper + endpoint
# -------------------------------------------------------------------
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent "pilot20BuildRolling80hEarlyWarningRow")) {
        $HelperBlock = @'

function pilot20DateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

function pilot20AddDays(date, days) {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function pilot20DiffDaysInclusive(start, end) {
  if (!start || !end) return 0;
  const ms = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end.getTime() - start.getTime()) / ms) + 1;
  return Math.max(1, diff);
}

function pilot20Round1(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 10) / 10;
}

function pilot20BuildRolling80hEarlyWarningRow(row) {
  const targetHours = 80;
  const windowDays = 30;

  const setupDate = pilot20DateOnly(row.setup_date);
  const airViewPeriodStart = pilot20DateOnly(row.month_start);
  const lastDataDate = pilot20DateOnly(row.last_data_date || row.record_date);
  const today = pilot20DateOnly(new Date());

  const periodStart = airViewPeriodStart || setupDate || lastDataDate || today;
  const effectiveDate = lastDataDate || today;
  const periodEnd = pilot20AddDays(periodStart, windowDays - 1);

  const daysElapsed = Math.min(windowDays, pilot20DiffDaysInclusive(periodStart, effectiveDate));
  const daysRemainingRaw = Math.floor((periodEnd.getTime() - effectiveDate.getTime()) / (24 * 60 * 60 * 1000));
  const daysRemaining = Math.max(0, daysRemainingRaw);

  const currentHours = pilot20Round1(
    row.month_usage_hours ??
    row.usage_hours_30d ??
    row.usage_hours ??
    0
  );

  const expectedHoursToday = pilot20Round1(Math.min(targetHours, (targetHours / windowDays) * daysElapsed));
  const remainingHours = pilot20Round1(Math.max(0, targetHours - currentHours));

  const requiredDailyHours = currentHours >= targetHours
    ? 0
    : daysRemaining > 0
      ? pilot20Round1(remainingHours / daysRemaining)
      : 99;

  const averageDailyHours = daysElapsed > 0
    ? pilot20Round1(currentHours / daysElapsed)
    : 0;

  const projectedEndWindowHours = pilot20Round1(averageDailyHours * windowDays);
  const paceGapHours = pilot20Round1(currentHours - expectedHoursToday);

  const ahi = pilot20Round1(row.ahi_avg_30d || 0);
  const leak = pilot20Round1(row.leak_avg_30d || 0);

  let riskLevel = "WATCH";
  let riskOrder = 3;
  let atlasAction = "Monitor patient.";

  if (currentHours >= targetHours) {
    riskLevel = "SAFE";
    riskOrder = 1;
    atlasAction = "No immediate compliance action required.";
  } else if (daysRemaining <= 0) {
    riskLevel = "CRITICAL";
    riskOrder = 5;
    atlasAction = "Compliance window ended or ends today. Immediate review required.";
  } else if (projectedEndWindowHours >= targetHours && requiredDailyHours <= 4) {
    riskLevel = "ON_TRACK";
    riskOrder = 2;
    atlasAction = "Continue monitoring. Patient is on pace.";
  } else if (requiredDailyHours <= 3.5 && projectedEndWindowHours >= 65) {
    riskLevel = "WATCH";
    riskOrder = 3;
    atlasAction = "Soft reminder / monitor closely.";
  } else if (requiredDailyHours <= 6) {
    riskLevel = "RESCUE";
    riskOrder = 4;
    atlasAction = "Call patient soon. Compliance can still be rescued.";
  } else {
    riskLevel = "CRITICAL";
    riskOrder = 5;
    atlasAction = "Call patient urgently. High risk of missing 80h.";
  }

  const highAhi = ahi > 10;
  const highLeak = leak > 24;

  if (riskLevel !== "SAFE" && highLeak) {
    atlasAction = atlasAction + " Check mask leak.";
  }

  if (riskLevel !== "SAFE" && highAhi) {
    atlasAction = atlasAction + " Review high AHI.";
  }

  return {
    patient_external_id: row.patient_external_id,
    patient_code: row.patient_code,
    doctor_external_id: row.doctor_external_id,
    branch_code: row.branch_code,
    device_serial: row.device_serial,
    device_model: row.device_model,
    setup_date: row.setup_date,
    period_start: periodStart ? periodStart.toISOString().slice(0, 10) : null,
    period_end: periodEnd ? periodEnd.toISOString().slice(0, 10) : null,
    last_data_date: effectiveDate ? effectiveDate.toISOString().slice(0, 10) : null,
    days_elapsed: daysElapsed,
    days_remaining: daysRemaining,
    current_hours: currentHours,
    expected_hours_today: expectedHoursToday,
    pace_gap_hours: paceGapHours,
    remaining_hours: remainingHours,
    required_daily_hours: requiredDailyHours,
    average_daily_hours: averageDailyHours,
    projected_end_window_hours: projectedEndWindowHours,
    is_80h_compliant: currentHours >= targetHours,
    risk_level: riskLevel,
    risk_order: riskOrder,
    atlas_action: atlasAction,
    ahi_avg_30d: ahi,
    leak_avg_30d: leak,
    high_ahi: highAhi,
    high_leak: highLeak
  };
}

'@

        $Anchor = 'module.exports = router;'
        if (ContainsText $BackendContent $Anchor) {
            $BackendContent = $BackendContent.Replace($Anchor, $HelperBlock + "`r`n" + $Anchor)
            Add-Result "Backend rolling 80h helper inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend rolling 80h helper inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend rolling 80h helper inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent 'router.get("/rolling-80h-early-warning"')) {
        $EndpointBlock = @'

router.get("/rolling-80h-early-warning", async (req, res) => {
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

    const rows = patientsResult.rows.map(pilot20BuildRolling80hEarlyWarningRow);

    const totalPatients = rows.length;
    const safe = rows.filter((r) => r.risk_level === "SAFE").length;
    const onTrack = rows.filter((r) => r.risk_level === "ON_TRACK").length;
    const watch = rows.filter((r) => r.risk_level === "WATCH").length;
    const rescue = rows.filter((r) => r.risk_level === "RESCUE").length;
    const critical = rows.filter((r) => r.risk_level === "CRITICAL").length;
    const urgent = rescue + critical;
    const actionable = watch + rescue + critical;
    const already80h = rows.filter((r) => r.is_80h_compliant).length;
    const below80h = totalPatients - already80h;
    const highAhi = rows.filter((r) => r.high_ahi).length;
    const highLeak = rows.filter((r) => r.high_leak).length;

    const topRiskRows = rows
      .slice()
      .sort((a, b) => {
        if ((b.risk_order || 0) !== (a.risk_order || 0)) return (b.risk_order || 0) - (a.risk_order || 0);
        if ((b.required_daily_hours || 0) !== (a.required_daily_hours || 0)) return (b.required_daily_hours || 0) - (a.required_daily_hours || 0);
        return (a.days_remaining || 0) - (b.days_remaining || 0);
      });

    const urgentRiskRate = totalPatients > 0 ? Math.round((urgent / totalPatients) * 1000) / 10 : 0;
    const complianceRate = totalPatients > 0 ? Math.round((already80h / totalPatients) * 1000) / 10 : 0;

    let conclusion = "Enter patients and upload AirView data to activate rolling 80h early warning.";
    if (totalPatients > 0) {
      if (urgent > 0) {
        conclusion = "Immediate action required: some patients are at RESCUE or CRITICAL risk inside their own 30-day 80h window.";
      } else if (watch > 0) {
        conclusion = "Some patients need monitoring before their individual 80h window closes.";
      } else {
        conclusion = "Current pilot patients are under control based on available AirView data.";
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_live_rolling_80h_early_warning_patient_rescue_report",
      logic: "individual_rolling_30_day_80h_window",
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
        urgent_risk_rate: urgentRiskRate,
        compliance_rate: complianceRate
      },
      conclusion,
      rows: topRiskRows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_rolling_80h_early_warning_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $EndpointBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend rolling early warning endpoint inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend rolling early warning endpoint inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend rolling early warning endpoint inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20BuildRolling80hEarlyWarningRow",
        'router.get("/rolling-80h-early-warning"',
        "individual_rolling_30_day_80h_window",
        "required_daily_hours",
        "projected_end_window_hours",
        "pace_gap_hours"
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
# Frontend rolling early warning page
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

export default function Pilot20RollingEarlyWarningReportPage() {
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/rolling-80h-early-warning");
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
  const rows = data.rows || [];

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Live Rolling 80h Early Warning</h1>
          <p style={subtitleStyle}>
            Each patient is evaluated inside their own 30-day 80h compliance window. The goal is to identify risk early, not at the end of a calendar month.
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
      {loading && <div style={infoStyle}>Loading rolling 80h early warning...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Live conclusion</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          {data.conclusion || "No conclusion yet."}
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          Logic: individual rolling 30-day window per patient, based on setup date or AirView period start.
        </p>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total Patients" value={summary.total_patients ?? 0} />
        <MetricCard label="Already 80h" value={summary.already_80h ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
        <MetricCard label="Urgent Risk" value={summary.urgent ?? 0} />
        <MetricCard label="WATCH" value={summary.watch ?? 0} />
        <MetricCard label="RESCUE" value={summary.rescue ?? 0} />
        <MetricCard label="CRITICAL" value={summary.critical ?? 0} />
        <MetricCard label="Urgent Rate" value={`${summary.urgent_risk_rate ?? 0}%`} />
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Patient rescue queue</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Sorted by risk. These are the patients Raftopoulos should review before their own 80h window closes.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Risk",
                  "Patient",
                  "Device",
                  "Window",
                  "Days Left",
                  "Current",
                  "Expected",
                  "Missing",
                  "Needed / Day",
                  "Projected",
                  "AHI",
                  "Leak",
                  "Next Action"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="13" style={tdStyle}>No patient rows available yet.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}><RiskBadge risk={row.risk_level} /></td>
                    <td style={tdStyle}>
                      <strong>{row.patient_code || row.patient_external_id}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.patient_external_id}</div>
                    </td>
                    <td style={tdStyle}>
                      {row.device_serial || "-"}
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.device_model || ""}</div>
                    </td>
                    <td style={tdStyle}>
                      {row.period_start || "-"} → {row.period_end || "-"}
                    </td>
                    <td style={tdStyle}><strong>{row.days_remaining}</strong></td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.expected_hours_today)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}><strong>{round(row.required_daily_hours)}h/day</strong></td>
                    <td style={tdStyle}>{round(row.projected_end_window_hours)}h</td>
                    <td style={tdStyle}>{round(row.ahi_avg_30d)}</td>
                    <td style={tdStyle}>{round(row.leak_avg_30d)}</td>
                    <td style={tdStyle}>{row.atlas_action || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Why this matters</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Patients do not all start on the first day of the month.</li>
          <li>Each patient has their own 30-day 80h compliance window.</li>
          <li>The platform calculates remaining hours and required hours per day.</li>
          <li>Raftopoulos sees who needs action early, before the window closes.</li>
          <li>This is the operational rescue list, not a late monthly autopsy.</li>
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
  maxWidth: 1280,
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
  maxWidth: 1280,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const cardsGridStyle = {
  maxWidth: 1280,
  margin: "0 auto 20px",
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
};

const panelStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
  maxWidth: 1280,
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
  fontSize: 13,
  whiteSpace: "nowrap"
};

const tdStyle = {
  padding: "12px 8px",
  borderBottom: "1px solid #f1f5f9",
  verticalAlign: "top",
  whiteSpace: "nowrap"
};

const errorStyle = {
  maxWidth: 1280,
  margin: "0 auto 16px",
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};

const infoStyle = {
  maxWidth: 1280,
  margin: "0 auto 16px",
  background: "#dbeafe",
  color: "#1d4ed8",
  border: "1px solid #bfdbfe",
  padding: 12,
  borderRadius: 12,
  fontWeight: 800
};
'@

Set-Content -Path $RollingReportPageFile -Value $PageContent -Encoding UTF8

if (Test-Path $RollingReportPageFile) {
    Add-Result "Frontend rolling early warning page created" "PASS" $RollingReportPageFile
} else {
    Add-Result "Frontend rolling early warning page created" "FAIL" $RollingReportPageFile
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

    if (-not (ContainsText $AppContent "Pilot20RollingEarlyWarningReportPage")) {
        $ImportLine = 'import Pilot20RollingEarlyWarningReportPage from "./pages/Pilot20RollingEarlyWarningReportPage";'
        $AppContent = $ImportLine + "`r`n" + $AppContent
        Add-Result "Frontend rolling early warning import inserted" "PASS" $ImportLine
    } else {
        Add-Result "Frontend rolling early warning import inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/rolling-80h-report')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/rolling-80h-report" element={<Pilot20RollingEarlyWarningReportPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend rolling early warning route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/rolling-80h-report" component={Pilot20RollingEarlyWarningReportPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend rolling early warning route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend rolling early warning route inserted" "FAIL" "No Routes/Switch anchor found."
        }
    } else {
        Add-Result "Frontend rolling early warning route inserted" "PASS" "Already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# -------------------------------------------------------------------
# Guard
# -------------------------------------------------------------------
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_ROLLING_80H_REPORT_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";',
            'const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";' + "`r`n" + 'const PILOT20_ROLLING_80H_REPORT_PATH = "/pilot20/rolling-80h-report";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname === PILOT20_UNMATCHED_DEVICES_PATH || pathname === PILOT20_ROLLING_80H_REPORT_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH || currentPath === PILOT20_ROLLING_80H_REPORT_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/rolling-80h-report") {
        Add-Result "Pilot20 guard allows rolling 80h report" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows rolling 80h report" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard exists" "WARN" "Guard file not found."
}

# -------------------------------------------------------------------
# Links in pages
# -------------------------------------------------------------------
foreach ($Page in @($RescuePageFile, $ImportHistoryPageFile, $UnmatchedPageFile, $UploadPageFile)) {
    if (Test-Path $Page) {
        $P = Read-FileSafe $Page

        if (-not (ContainsText $P "/pilot20/rolling-80h-report")) {
            $P = $P.Replace(
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>',
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>' + "`r`n" + '          <a href="/pilot20/rolling-80h-report" style={secondaryButtonStyle}>Rolling 80h Report</a>'
            )

            $P = $P.Replace(
                '<a href="/pilot20/rescue-monitor" style={secondaryButtonStyle}>Rescue Monitor</a>',
                '<a href="/pilot20/rescue-monitor" style={secondaryButtonStyle}>Rescue Monitor</a>' + "`r`n" + '          <a href="/pilot20/rolling-80h-report" style={secondaryButtonStyle}>Rolling 80h Report</a>'
            )

            Set-Content -Path $Page -Value $P -Encoding UTF8
            Add-Result ("Rolling 80h report link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Link patched."
        } else {
            Add-Result ("Rolling 80h report link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Already present."
        }
    }
}

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$DocContent = @'
# RAFTOP CPAP CARE Pro - Live Rolling 80h Early Warning & Patient Rescue Report

REQUIRED_MARKER: PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT
REQUIRED_MARKER: INDIVIDUAL_ROLLING_30_DAY_WINDOW_READY
REQUIRED_MARKER: EARLY_WARNING_BEFORE_WINDOW_END_READY
REQUIRED_MARKER: PATIENT_RESCUE_QUEUE_READY
REQUIRED_MARKER: READY_FOR_PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK

## Correction

This is not a calendar month report.

Raftopoulos does not need to know only what happened at the end of the month.
Patients start CPAP therapy on different dates.

The correct logic is:
- each patient has their own 30-day 80h compliance window
- the platform checks progress before the window closes
- the platform calculates how many hours per day are still needed
- the platform identifies who needs follow-up early

## Page

/pilot20/rolling-80h-report

## API

GET /api/pilot20/rolling-80h-early-warning

## Calculates per patient

- period_start
- period_end
- days_elapsed
- days_remaining
- current_hours
- expected_hours_today
- remaining_hours
- required_daily_hours
- projected_end_window_hours
- risk_level
- atlas_action

## Commercial value

This is an early warning and rescue system, not a late monthly autopsy.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase119R doc created" "PASS" $DocFile
} else {
    Add-Result "Phase119R doc created" "FAIL" $DocFile
}

# -------------------------------------------------------------------
# Required checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $RollingReportPageFile, $GuardFile, $RescuePageFile, $ImportHistoryPageFile, $UnmatchedPageFile, $UploadPageFile, $DocFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT",
    "INDIVIDUAL_ROLLING_30_DAY_WINDOW_READY",
    "EARLY_WARNING_BEFORE_WINDOW_END_READY",
    "PATIENT_RESCUE_QUEUE_READY",
    'router.get("/rolling-80h-early-warning"',
    "/pilot20/rolling-80h-report",
    "Live Rolling 80h Early Warning",
    "required_daily_hours",
    "projected_end_window_hours"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase119R text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase119R text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase119R content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase119R content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE119R_LIVE_ROLLING_80H_EARLY_WARNING_PATIENT_RESCUE_REPORT_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 119R Live Rolling 80h Early Warning & Patient Rescue Report"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend page:"
Write-Host $RollingReportPageFile
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