# RAFTOP CPAP CARE Pro
# Phase 110 - Pilot20 80h Compliance Pace & Rescue Monitor
# Adds buyer-facing compliance pace/rescue monitor for Pilot20.
# Does NOT create patients.
# Does NOT modify patient data.
# Does NOT expose secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$RescuePageFile = Join-Path $FrontendPagesDir "Pilot20ComplianceRescueMonitorPage.js"
$ManualPageFile = Join-Path $FrontendPagesDir "Pilot20ManualEntryPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase110_pilot20_80h_compliance_pace_rescue_monitor_" + $Timestamp + ".md")
$DocFile = Join-Path $DocsDir "110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR.md"
$BuyerUseDoc = Join-Path $DocsDir "110_PILOT20_RESCUE_MONITOR_BUYER_USE.md"

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

function Get-LatestReport {
    param([string]$Pattern)
    $Files = Get-ChildItem -Path $ReportsDir -File -ErrorAction SilentlyContinue | Where-Object {
        $_.Name -like $Pattern
    } | Sort-Object LastWriteTime -Descending
    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

function Check-ReportStatus {
    param([string]$Name, [string]$Pattern, [string[]]$AcceptedStatuses)

    $Latest = Get-LatestReport $Pattern

    if ($null -eq $Latest) {
        Add-Result $Name "WARN" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "WARN" ("Latest report exists but final status not matched: " + $Latest.Name)
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 110 Pilot20 80h Compliance Pace Rescue Monitor" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 110 - Pilot20 80h Compliance Pace & Rescue Monitor..."
Write-Host ""

Check-ReportStatus "Phase 107 authenticated live pilot20 status" "phase107_authenticated_live_pilot20_test_*.md" @(
    "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY",
    "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY_WITH_WARNINGS"
)

if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot20 backend route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Pilot20 backend route file exists" "FAIL" $BackendRouteFile
}

# Backend rescue-monitor endpoint
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (ContainsText $BackendContent 'router.get("/rescue-monitor"') {
        Add-Result "Backend rescue monitor endpoint already exists" "PASS" "Endpoint already present."
    } else {
        $BackendBlock = @'

function pilot20ParseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function pilot20Number(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function pilot20DaysInMonth(date) {
  const d = pilot20ParseDate(date) || new Date();
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function pilot20DayOfMonth(date) {
  const d = pilot20ParseDate(date) || new Date();
  return d.getDate();
}

function pilot20Round(value, digits = 1) {
  const factor = Math.pow(10, digits);
  return Math.round((Number(value) || 0) * factor) / factor;
}

function pilot20BuildRescueRow(row) {
  const targetHours = 80;

  const currentHours = pilot20Number(row.month_usage_hours || row.usage_hours_30d || row.usage_hours);
  const monthStart = row.month_start || row.record_date || row.last_data_date || new Date().toISOString().slice(0, 10);
  const lastDataDate = row.record_date || row.last_data_date || new Date().toISOString().slice(0, 10);

  const totalDays = pilot20DaysInMonth(monthStart);
  const elapsedDays = Math.max(1, Math.min(totalDays, pilot20DayOfMonth(lastDataDate)));
  const daysLeft = Math.max(0, totalDays - elapsedDays);

  const expectedByToday = (targetHours / totalDays) * elapsedDays;
  const remainingHours = Math.max(0, targetHours - currentHours);
  const requiredDailyHours = daysLeft > 0 ? remainingHours / daysLeft : remainingHours;
  const projectedEndMonthHours = elapsedDays > 0 ? (currentHours / elapsedDays) * totalDays : 0;

  const ahi = pilot20Number(row.ahi_avg_30d);
  const leak = pilot20Number(row.leak_avg_30d);

  let risk_level = "SAFE";
  let action = "No action required";
  let score = 0;

  if (currentHours >= targetHours) {
    risk_level = "SAFE";
    action = "Already reached 80h";
    score = 0;
  } else if (projectedEndMonthHours >= targetHours && currentHours >= expectedByToday * 0.9) {
    risk_level = "ON_TRACK";
    action = "Monitor only";
    score = 20;
  } else if (requiredDailyHours <= 3) {
    risk_level = "WATCH";
    action = "Check within 48 hours";
    score = 40;
  } else if (requiredDailyHours <= 6) {
    risk_level = "RESCUE";
    action = "Call today";
    score = 70;
  } else {
    risk_level = "CRITICAL";
    action = "Urgent rescue call";
    score = 90;
  }

  if (ahi > 10) {
    score += 10;
    if (risk_level === "SAFE" || risk_level === "ON_TRACK") {
      action = "Therapy review: high AHI";
    }
  }

  if (leak > 24) {
    score += 10;
    if (risk_level === "SAFE" || risk_level === "ON_TRACK") {
      action = "Mask/leak review";
    }
  }

  const riskOrder = {
    CRITICAL: 5,
    RESCUE: 4,
    WATCH: 3,
    ON_TRACK: 2,
    SAFE: 1
  };

  return {
    tenant_id: PILOT_TENANT_ID,
    patient_external_id: row.patient_external_id,
    patient_code: row.patient_code,
    device_serial: row.device_serial,
    device_model: row.device_model,
    doctor_external_id: row.doctor_external_id,
    branch_code: row.branch_code,
    month_start: monthStart,
    last_data_date: lastDataDate,
    total_days_in_month: totalDays,
    elapsed_days: elapsedDays,
    days_left: daysLeft,
    current_hours: pilot20Round(currentHours),
    target_hours: targetHours,
    expected_by_today: pilot20Round(expectedByToday),
    remaining_hours: pilot20Round(remainingHours),
    required_daily_hours: pilot20Round(requiredDailyHours),
    projected_end_month_hours: pilot20Round(projectedEndMonthHours),
    ahi_avg_30d: pilot20Round(ahi),
    leak_avg_30d: pilot20Round(leak),
    days_used_30d: row.days_used_30d || 0,
    risk_level,
    risk_order: riskOrder[risk_level] || 0,
    atlas_action: action,
    atlas_score: Math.min(100, score),
    is_80h_compliant: currentHours >= targetHours
  };
}

router.get("/rescue-monitor", async (req, res) => {
  try {
    const db = getDb(req);

    const result = await query(
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

    const rows = result.rows.map(pilot20BuildRescueRow).sort((a, b) => {
      if (b.risk_order !== a.risk_order) return b.risk_order - a.risk_order;
      return b.required_daily_hours - a.required_daily_hours;
    });

    const summary = {
      total_patients: rows.length,
      already_80h: rows.filter((r) => r.risk_level === "SAFE").length,
      on_track: rows.filter((r) => r.risk_level === "ON_TRACK").length,
      watch: rows.filter((r) => r.risk_level === "WATCH").length,
      rescue: rows.filter((r) => r.risk_level === "RESCUE").length,
      critical: rows.filter((r) => r.risk_level === "CRITICAL").length,
      below_80h: rows.filter((r) => !r.is_80h_compliant).length
    };

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      target_hours: 80,
      module: "pilot20_80h_compliance_pace_rescue_monitor",
      summary,
      rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_rescue_monitor_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $BackendBlock + "`r`nmodule.exports = router;")
            Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8
            Add-Result "Backend rescue monitor endpoint inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend rescue monitor endpoint inserted" "FAIL" "module.exports anchor not found."
        }
    }

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        'router.get("/rescue-monitor"',
        "required_daily_hours",
        "projected_end_month_hours",
        "risk_level",
        "CRITICAL",
        "RESCUE",
        "WATCH",
        "ON_TRACK",
        "SAFE"
    )) {
        if (ContainsText $UpdatedBackend $Required) {
            Add-Result ("Backend required text exists: " + $Required) "PASS" "Found."
        } else {
            Add-Result ("Backend required text exists: " + $Required) "FAIL" "Missing."
        }
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $NodeCommand) {
        Add-Result "node command available" "WARN" "node not found; skipping node syntax check."
    } else {
        $NodeOut = & node -c $BackendRouteFile 2>&1
        $NodeExit = $LASTEXITCODE

        if ($NodeExit -eq 0) {
            Add-Result "Backend pilot20 route syntax check" "PASS" "node -c passed."
        } else {
            Add-Result "Backend pilot20 route syntax check" "FAIL" ($NodeOut | Out-String)
        }
    }
}

# Frontend rescue monitor page
$RescuePageContent = @'
import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const RISK_BADGE_STYLE = {
  SAFE: { background: "#dcfce7", color: "#166534" },
  ON_TRACK: { background: "#dbeafe", color: "#1d4ed8" },
  WATCH: { background: "#fef3c7", color: "#92400e" },
  RESCUE: { background: "#ffedd5", color: "#c2410c" },
  CRITICAL: { background: "#fee2e2", color: "#991b1b" }
};

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

function round(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return Math.round(n * 10) / 10;
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

export default function Pilot20ComplianceRescueMonitorPage() {
  const [data, setData] = useState({ summary: {}, rows: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/rescue-monitor");
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

  const rows = data.rows || [];
  const summary = data.summary || {};

  const commercialHeadline = useMemo(() => {
    if ((summary.critical || 0) > 0) {
      return "Critical patients need immediate rescue action.";
    }
    if ((summary.rescue || 0) > 0) {
      return "Some patients are still recoverable if contacted now.";
    }
    if ((summary.watch || 0) > 0) {
      return "Some patients need monitoring before month end.";
    }
    return "Pilot patients are currently under control.";
  }, [summary]);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>80h Compliance Pace & Rescue Monitor</h1>
          <p style={subtitleStyle}>
            See which CPAP patients are safe, on track, at risk, or need urgent intervention before the month ends.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <button onClick={loadData} style={primaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading rescue monitor...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Commercial signal</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
          {commercialHeadline}
        </div>
      </section>

      <section style={cardsGridStyle}>
        <MetricCard label="Total patients" value={summary.total_patients ?? 0} />
        <MetricCard label="Already 80h" value={summary.already_80h ?? 0} />
        <MetricCard label="On track" value={summary.on_track ?? 0} />
        <MetricCard label="Watch" value={summary.watch ?? 0} />
        <MetricCard label="Rescue" value={summary.rescue ?? 0} />
        <MetricCard label="Critical" value={summary.critical ?? 0} />
        <MetricCard label="Below 80h" value={summary.below_80h ?? 0} />
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Priority rescue queue</h2>
        <p style={{ color: "#64748b", marginTop: -6 }}>
          Sorted from highest compliance risk to lowest. Use this list to decide who must be contacted first.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {[
                  "Patient",
                  "Used",
                  "Expected",
                  "Remaining",
                  "Days Left",
                  "Needed / Day",
                  "Projected",
                  "Risk",
                  "Action"
                ].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="9" style={tdStyle}>
                    No pilot patients entered yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.patient_external_id}>
                    <td style={tdStyle}>
                      <strong>{row.patient_code}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>{row.device_serial || "-"}</div>
                    </td>
                    <td style={tdStyle}>{round(row.current_hours)}h</td>
                    <td style={tdStyle}>{round(row.expected_by_today)}h</td>
                    <td style={tdStyle}>{round(row.remaining_hours)}h</td>
                    <td style={tdStyle}>{row.days_left}</td>
                    <td style={tdStyle}>
                      <strong>{round(row.required_daily_hours)}h/day</strong>
                    </td>
                    <td style={tdStyle}>{round(row.projected_end_month_hours)}h</td>
                    <td style={tdStyle}>
                      <RiskBadge risk={row.risk_level} />
                    </td>
                    <td style={tdStyle}>
                      <strong>{row.atlas_action}</strong>
                      <div style={{ color: "#64748b", fontSize: 12 }}>
                        AHI {round(row.ahi_avg_30d)} / Leak {round(row.leak_avg_30d)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How Raftopoulos should use this</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Enter or update CPAP usage data for the same 20 pilot patients every few days.</li>
          <li>Open this rescue monitor before month end.</li>
          <li>Call CRITICAL and RESCUE patients first.</li>
          <li>Use required daily hours to tell each patient exactly what is needed to reach 80h.</li>
          <li>At the end of the pilot, use the queue as proof of operational value.</li>
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
  const style = RISK_BADGE_STYLE[risk] || RISK_BADGE_STYLE.WATCH;

  return (
    <span style={{ ...style, padding: "6px 10px", borderRadius: 999, fontWeight: 900, fontSize: 12 }}>
      {risk}
    </span>
  );
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
  maxWidth: 720
};

const cardsGridStyle = {
  maxWidth: 1180,
  margin: "0 auto 24px",
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: 12
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
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

const primaryButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  cursor: "pointer"
};

const secondaryButtonStyle = {
  background: "#fff",
  color: "#0f172a",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: "12px 18px",
  fontWeight: 900,
  textDecoration: "none"
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

Set-Content -Path $RescuePageFile -Value $RescuePageContent -Encoding UTF8

if (Test-Path $RescuePageFile) {
    Add-Result "Frontend rescue monitor page created" "PASS" $RescuePageFile
} else {
    Add-Result "Frontend rescue monitor page created" "FAIL" $RescuePageFile
}

# Frontend route integration
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "No App.js/App.jsx found."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp

    $AppContent = Read-FileSafe $FrontendApp

    if (-not (ContainsText $AppContent "Pilot20ComplianceRescueMonitorPage")) {
        $ImportLine = 'import Pilot20ComplianceRescueMonitorPage from "./pages/Pilot20ComplianceRescueMonitorPage";'
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
            Add-Result "Frontend rescue page import inserted" "PASS" $ImportLine
        } else {
            $AppContent = $ImportLine + "`r`n" + $AppContent
            Add-Result "Frontend rescue page import inserted" "WARN" "Inserted at top."
        }
    } else {
        Add-Result "Frontend rescue page import inserted" "PASS" "Import already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/rescue-monitor')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/rescue-monitor" element={<Pilot20ComplianceRescueMonitorPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend rescue monitor route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/rescue-monitor" component={Pilot20ComplianceRescueMonitorPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend rescue monitor route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend rescue monitor route inserted" "FAIL" "Could not find </Routes> or </Switch>."
        }
    } else {
        Add-Result "Frontend rescue monitor route inserted" "PASS" "Route already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# Update manual entry page link
if (Test-Path $ManualPageFile) {
    $ManualContent = Read-FileSafe $ManualPageFile

    if (-not (ContainsText $ManualContent "/pilot20/rescue-monitor")) {
        $ManualContent = $ManualContent.Replace(
            '<a href="/login" style={{ fontWeight: 800 }}>Go to login</a>',
            '<a href="/login" style={{ fontWeight: 800 }}>Go to login</a>'
        )

        if (ContainsText $ManualContent "</header>") {
            $LinkBlock = @'
        <div style={{ marginTop: 16 }}>
          <a href="/pilot20/rescue-monitor" style={{ background: "#0f172a", color: "#fff", borderRadius: 12, padding: "12px 18px", fontWeight: 900, textDecoration: "none", display: "inline-block" }}>
            Open 80h Rescue Monitor
          </a>
        </div>
'@
            $ManualContent = $ManualContent.Replace("</header>", $LinkBlock + "`r`n      </header>")
            Set-Content -Path $ManualPageFile -Value $ManualContent -Encoding UTF8
            Add-Result "Manual entry page rescue link inserted" "PASS" "Link added."
        } else {
            Add-Result "Manual entry page rescue link inserted" "WARN" "Header anchor not found."
        }
    } else {
        Add-Result "Manual entry page rescue link inserted" "PASS" "Link already present."
    }
} else {
    Add-Result "Manual entry page exists for rescue link" "WARN" "Manual page not found."
}

# Update guard allowed paths
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (ContainsText $GuardContent "/pilot20/rescue-monitor") {
        Add-Result "Pilot20 guard already allows rescue monitor" "PASS" "Path already present."
    } else {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_PATH = "/pilot20/manual-entry";',
            'const PILOT20_PATH = "/pilot20/manual-entry";' + "`r`n" + 'const PILOT20_RESCUE_PATH = "/pilot20/rescue-monitor";'
        )

        $OldFunction = @'
function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname.startsWith(LOGIN_PATH);
}
'@

        $NewFunction = @'
function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname.startsWith(LOGIN_PATH);
}
'@

        if (ContainsText $GuardContent $OldFunction) {
            $GuardContent = $GuardContent.Replace($OldFunction, $NewFunction)
            Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8
            Add-Result "Pilot20 guard rescue monitor path added" "PASS" "Allowed path updated."
        } else {
            Add-Result "Pilot20 guard rescue monitor path added" "WARN" "Exact function block not found; manual check may be needed."
            Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8
        }
    }
} else {
    Add-Result "Pilot20 guard file exists" "WARN" "Guard file not found."
}

# Docs
$DocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 80h Compliance Pace & Rescue Monitor

REQUIRED_MARKER: PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR
REQUIRED_MARKER: COMPLIANCE_PACE_MONITOR
REQUIRED_MARKER: REQUIRED_DAILY_HOURS_TO_80H
REQUIRED_MARKER: PROJECTED_END_MONTH_USAGE
REQUIRED_MARKER: RESCUE_QUEUE
REQUIRED_MARKER: READY_FOR_PHASE111_LIVE_RESCUE_MONITOR_VERIFICATION

## Purpose

This module shows whether each Pilot20 CPAP patient is on pace to reach the 80-hour monthly compliance threshold before the month ends.

## Buyer value

Raftopoulos can see before month-end:
- who already reached 80h
- who is on track
- who needs monitoring
- who needs rescue call
- who is critical
- how many hours remain
- required daily usage until month end
- projected end-month usage

## Risk levels

SAFE:
Already reached 80h.

ON_TRACK:
Projected to reach 80h.

WATCH:
Behind pace but easily recoverable.

RESCUE:
At real risk. Call today.

CRITICAL:
Very high risk of missing 80h unless urgent intervention happens.

## Page

/pilot20/rescue-monitor

## API

/api/pilot20/rescue-monitor
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

$BuyerUseContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Rescue Monitor Buyer Use

REQUIRED_MARKER: PHASE110_BUYER_USE_RESCUE_MONITOR
REQUIRED_MARKER: CALL_RESCUE_PATIENTS_FIRST
REQUIRED_MARKER: UPDATE_USAGE_EVERY_FEW_DAYS
REQUIRED_MARKER: COMMERCIAL_VALUE_PROOF

## How buyer uses it

1. Enter 20 pilot patients.
2. Update usage metrics every few days.
3. Open /pilot20/rescue-monitor.
4. Call CRITICAL first.
5. Call RESCUE second.
6. Watch patients marked WATCH.
7. Use required daily hours to tell the patient exactly what must be done before month end.

## Commercial proof

At the end of the pilot, this monitor shows how the platform prevents loss of compliance before the patient is lost.
'@

Set-Content -Path $BuyerUseDoc -Value $BuyerUseContent -Encoding UTF8

foreach ($Path in @($DocFile, $BuyerUseDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Phase110 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase110 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# Required text checks
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $RescuePageFile, $DocFile, $BuyerUseDoc)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR",
    "COMPLIANCE_PACE_MONITOR",
    "REQUIRED_DAILY_HOURS_TO_80H",
    "PROJECTED_END_MONTH_USAGE",
    "RESCUE_QUEUE",
    "router.get(""/rescue-monitor""",
    "required_daily_hours",
    "projected_end_month_hours",
    "/pilot20/rescue-monitor",
    "CRITICAL",
    "RESCUE",
    "WATCH",
    "ON_TRACK",
    "SAFE"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase110 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase110 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase110 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase110 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 110 Pilot20 80h Compliance Pace & Rescue Monitor"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend rescue page:"
Write-Host $RescuePageFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
Write-Host $BuyerUseDoc
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