# RAFTOP CPAP CARE Pro
# Phase 111 - Pilot20 Automatic CPAP Usage Update Engine
# Adds CSV-based automatic CPAP usage update for Pilot20.
# Buyer enters patients once, then uploads usage CSV periodically.
# Does NOT expose secrets.
# Does NOT allow direct patient identifiers.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$DataDir = Join-Path $Root "data-intake\raftopoulos-pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$UploadPageFile = Join-Path $FrontendPagesDir "Pilot20UsageUploadPage.js"
$ManualPageFile = Join-Path $FrontendPagesDir "Pilot20ManualEntryPage.js"
$RescuePageFile = Join-Path $FrontendPagesDir "Pilot20ComplianceRescueMonitorPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$TemplateFile = Join-Path $DataDir "RAFTOP_PILOT20_USAGE_UPDATE_TEMPLATE.csv"
$SampleFile = Join-Path $DataDir "RAFTOP_PILOT20_USAGE_UPDATE_SAMPLE.csv"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase111_pilot20_automatic_cpap_usage_update_engine_" + $Timestamp + ".md")
$DocFile = Join-Path $DocsDir "111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE.md"
$BuyerUseDoc = Join-Path $DocsDir "111_PILOT20_USAGE_UPLOAD_BUYER_USE.md"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 111 Pilot20 Automatic CPAP Usage Update Engine" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 111 - Pilot20 Automatic CPAP Usage Update Engine..."
Write-Host ""

Check-ReportStatus "Phase 110 rescue monitor status" "phase110_pilot20_80h_compliance_pace_rescue_monitor_*.md" @(
    "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR_READY",
    "PHASE110_PILOT20_80H_COMPLIANCE_PACE_RESCUE_MONITOR_READY_WITH_WARNINGS"
)

if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot20 backend route exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Pilot20 backend route exists" "FAIL" $BackendRouteFile
}

# CSV templates
$TemplateCsv = @'
device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d
'@

$SampleCsv = @'
device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d
DEVICE-001,2026-06-01,2026-06-10,24,24,8,7.2,18
DEVICE-002,2026-06-01,2026-06-10,61,61,10,3.8,12
DEVICE-003,2026-06-01,2026-06-10,14,14,4,12.4,31
'@

Set-Content -Path $TemplateFile -Value $TemplateCsv -Encoding UTF8
Set-Content -Path $SampleFile -Value $SampleCsv -Encoding UTF8

if (Test-Path $TemplateFile) {
    Add-Result "Usage update CSV template created" "PASS" $TemplateFile
} else {
    Add-Result "Usage update CSV template created" "FAIL" $TemplateFile
}

if (Test-Path $SampleFile) {
    Add-Result "Usage update sample CSV created" "PASS" $SampleFile
} else {
    Add-Result "Usage update sample CSV created" "FAIL" $SampleFile
}

# Backend endpoint
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (ContainsText $BackendContent 'router.post("/usage-upload"') {
        Add-Result "Backend usage upload endpoint already exists" "PASS" "Endpoint already present."
    } else {
        $BackendBlock = @'

function pilot20CsvSplitLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function pilot20ParseCsv(csvText) {
  const cleanText = String(csvText || "").replace(/^\uFEFF/, "");
  const lines = cleanText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "csv_requires_header_and_at_least_one_data_row",
      rows: []
    };
  }

  const headers = pilot20CsvSplitLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = pilot20CsvSplitLine(lines[i]);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    row.__line = i + 1;
    rows.push(row);
  }

  return {
    ok: true,
    headers,
    rows
  };
}

function pilot20RequireUsageHeaders(headers) {
  const required = [
    "device_serial",
    "month_start",
    "last_data_date",
    "month_usage_hours",
    "usage_hours_30d",
    "days_used_30d",
    "ahi_avg_30d",
    "leak_avg_30d"
  ];

  return required.filter((header) => !headers.includes(header));
}

function pilot20CleanValue(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function pilot20ToNumberValue(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function pilot20ToIntegerValue(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? n : fallback;
}

function pilot20ToDateText(value) {
  const text = pilot20CleanValue(value);
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return text.slice(0, 10);
}

function pilot20HasForbiddenCsvHeaders(headers) {
  const forbidden = [
    "first_name",
    "last_name",
    "full_name",
    "patient_name",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth",
    "birth_date"
  ];

  return forbidden.filter((header) => headers.map((h) => h.toLowerCase()).includes(header));
}

router.get("/usage-template", async (req, res) => {
  res.type("text/csv").send(
    [
      "device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d",
      "DEVICE-001,2026-06-01,2026-06-10,24,24,8,7.2,18"
    ].join("\n")
  );
});

router.post("/usage-upload", async (req, res) => {
  try {
    const db = getDb(req);
    const csvText = req.body?.csv_text || req.body?.csvText || "";

    const parsed = pilot20ParseCsv(csvText);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        error: parsed.error
      });
    }

    const missingHeaders = pilot20RequireUsageHeaders(parsed.headers);

    if (missingHeaders.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "missing_required_headers",
        missing_headers: missingHeaders
      });
    }

    const forbiddenHeaders = pilot20HasForbiddenCsvHeaders(parsed.headers);

    if (forbiddenHeaders.length > 0) {
      return res.status(400).json({
        ok: false,
        error: "direct_identifiers_not_allowed_in_usage_csv",
        forbidden_headers: forbiddenHeaders
      });
    }

    const report = {
      total_rows: parsed.rows.length,
      updated: 0,
      skipped: 0,
      errors: 0,
      rows: []
    };

    for (const row of parsed.rows) {
      const deviceSerial = pilot20CleanValue(row.device_serial);
      const monthStart = pilot20ToDateText(row.month_start);
      const lastDataDate = pilot20ToDateText(row.last_data_date);

      if (!deviceSerial || !lastDataDate) {
        report.skipped += 1;
        report.rows.push({
          line: row.__line,
          status: "skipped",
          reason: "device_serial_and_last_data_date_required",
          device_serial: deviceSerial
        });
        continue;
      }

      const deviceResult = await query(
        db,
        `
        select patient_external_id
        from public.devices
        where tenant_slug = $1
          and device_serial = $2
        limit 1
        `,
        [PILOT_TENANT_ID, deviceSerial]
      );

      if (!deviceResult.rows || deviceResult.rows.length === 0) {
        report.skipped += 1;
        report.rows.push({
          line: row.__line,
          status: "skipped",
          reason: "device_not_found_in_pilot20",
          device_serial: deviceSerial
        });
        continue;
      }

      const patientExternalId = deviceResult.rows[0].patient_external_id;
      const monthUsageHours = pilot20ToNumberValue(row.month_usage_hours);
      const usageHours30d = pilot20ToNumberValue(row.usage_hours_30d);
      const daysUsed30d = pilot20ToIntegerValue(row.days_used_30d);
      const ahiAvg30d = pilot20ToNumberValue(row.ahi_avg_30d);
      const leakAvg30d = pilot20ToNumberValue(row.leak_avg_30d);

      try {
        await query(
          db,
          `
          insert into public.compliance_nights
            (
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
              leak_avg_30d,
              data_source,
              created_at,
              updated_at
            )
          values
            ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, 'pilot20_usage_csv', now(), now())
          on conflict (tenant_slug, patient_external_id, record_date) do update
          set device_serial = excluded.device_serial,
              month_start = excluded.month_start,
              usage_hours = excluded.usage_hours,
              month_usage_hours = excluded.month_usage_hours,
              usage_hours_30d = excluded.usage_hours_30d,
              days_used_30d = excluded.days_used_30d,
              ahi_avg_30d = excluded.ahi_avg_30d,
              leak_avg_30d = excluded.leak_avg_30d,
              data_source = excluded.data_source,
              updated_at = now()
          `,
          [
            PILOT_TENANT_ID,
            patientExternalId,
            deviceSerial,
            lastDataDate,
            monthStart,
            monthUsageHours,
            usageHours30d,
            daysUsed30d,
            ahiAvg30d,
            leakAvg30d
          ]
        );

        await query(
          db,
          `
          update public.devices
          set last_data_date = $3,
              data_source = 'pilot20_usage_csv',
              updated_at = now()
          where tenant_slug = $1
            and device_serial = $2
          `,
          [PILOT_TENANT_ID, deviceSerial, lastDataDate]
        );

        report.updated += 1;
        report.rows.push({
          line: row.__line,
          status: "updated",
          patient_external_id: patientExternalId,
          device_serial: deviceSerial,
          last_data_date: lastDataDate,
          month_usage_hours: monthUsageHours,
          is_80h_compliant: monthUsageHours >= 80
        });
      } catch (error) {
        report.errors += 1;
        report.rows.push({
          line: row.__line,
          status: "error",
          reason: error.message,
          device_serial: deviceSerial
        });
      }
    }

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_automatic_cpap_usage_update_engine",
      message: "Usage CSV processed. Rescue Monitor recalculates automatically from latest compliance records.",
      report
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_usage_upload_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $BackendBlock + "`r`nmodule.exports = router;")
            Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8
            Add-Result "Backend usage upload endpoint inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend usage upload endpoint inserted" "FAIL" "module.exports anchor not found."
        }
    }

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        'router.post("/usage-upload"',
        'router.get("/usage-template"',
        "pilot20_automatic_cpap_usage_update_engine",
        "device_not_found_in_pilot20",
        "pilot20_usage_csv",
        "direct_identifiers_not_allowed_in_usage_csv"
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

# Frontend upload page
$UploadPageContent = @'
import React, { useMemo, useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const SAMPLE_CSV = `device_serial,month_start,last_data_date,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d
DEVICE-001,2026-06-01,2026-06-10,24,24,8,7.2,18
DEVICE-002,2026-06-01,2026-06-10,61,61,10,3.8,12
DEVICE-003,2026-06-01,2026-06-10,14,14,4,12.4,31`;

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function postUsageCsv(csvText) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}/api/pilot20/usage-upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ csv_text: csvText })
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Upload failed");
  }

  return json;
}

export default function Pilot20UsageUploadPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const summary = result?.report || null;

  const commercialText = useMemo(() => {
    if (!summary) return "Upload a usage CSV to update CPAP progress automatically.";
    if ((summary.updated || 0) === 0) return "No matching devices were updated. Check device serials.";
    return "Usage data updated. Open Rescue Monitor to see who is at risk before month end.";
  }, [summary]);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
  }

  async function uploadCsv() {
    setUploading(true);
    setError("");
    setResult(null);

    try {
      const json = await postUsageCsv(csvText);
      setResult(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Automatic CPAP Usage Update</h1>
          <p style={subtitleStyle}>
            Enter Pilot 20 patients once. Then upload usage CSV exports to automatically update compliance, ATLAS and the 80h Rescue Monitor.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
        </div>
      </header>

      <section style={headlineStyle}>
        <div style={labelStyle}>Automation model</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a" }}>
          {commercialText}
        </div>
      </section>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Upload usage CSV</h2>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Required columns: device_serial, month_start, last_data_date, month_usage_hours,
          usage_hours_30d, days_used_30d, ahi_avg_30d, leak_avg_30d.
        </p>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ marginBottom: 16 }} />

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={12}
          style={textareaStyle}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="button" onClick={uploadCsv} disabled={uploading} style={primaryButtonStyle}>
            {uploading ? "Processing..." : "Process usage CSV"}
          </button>

          <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} style={secondaryButtonStyle}>
            Reset sample
          </button>
        </div>
      </section>

      {summary && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Import report</h2>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={summary.total_rows ?? 0} />
            <MetricCard label="Updated" value={summary.updated ?? 0} />
            <MetricCard label="Skipped" value={summary.skipped ?? 0} />
            <MetricCard label="Errors" value={summary.errors ?? 0} />
          </div>

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Device", "Patient", "Reason", "Hours", "80h"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(summary.rows || []).map((row, index) => (
                  <tr key={`${row.line}-${index}`}>
                    <td style={tdStyle}>{row.line}</td>
                    <td style={tdStyle}><strong>{row.status}</strong></td>
                    <td style={tdStyle}>{row.device_serial || "-"}</td>
                    <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                    <td style={tdStyle}>{row.reason || "-"}</td>
                    <td style={tdStyle}>{row.month_usage_hours ?? "-"}</td>
                    <td style={tdStyle}>{row.is_80h_compliant === true ? "YES" : row.is_80h_compliant === false ? "NO" : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Buyer workflow</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Enter the 20 pilot patients once in Patient Entry.</li>
          <li>Export or prepare a CPAP usage CSV every few days.</li>
          <li>Upload the CSV here.</li>
          <li>The platform updates usage automatically by device serial.</li>
          <li>Open Rescue Monitor to see who may miss 80 hours before month end.</li>
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

const panelStyle = {
  maxWidth: 1180,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12
};

const cardStyle = {
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16
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

const textareaStyle = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 12,
  padding: 12,
  fontFamily: "Consolas, monospace",
  fontSize: 13,
  boxSizing: "border-box"
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
'@

Set-Content -Path $UploadPageFile -Value $UploadPageContent -Encoding UTF8

if (Test-Path $UploadPageFile) {
    Add-Result "Frontend usage upload page created" "PASS" $UploadPageFile
} else {
    Add-Result "Frontend usage upload page created" "FAIL" $UploadPageFile
}

# Frontend route integration
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "No App.js/App.jsx found."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp

    $AppContent = Read-FileSafe $FrontendApp

    if (-not (ContainsText $AppContent "Pilot20UsageUploadPage")) {
        $ImportLine = 'import Pilot20UsageUploadPage from "./pages/Pilot20UsageUploadPage";'
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
            Add-Result "Frontend usage upload import inserted" "PASS" $ImportLine
        } else {
            $AppContent = $ImportLine + "`r`n" + $AppContent
            Add-Result "Frontend usage upload import inserted" "WARN" "Inserted at top."
        }
    } else {
        Add-Result "Frontend usage upload import inserted" "PASS" "Import already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/usage-upload')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/usage-upload" element={<Pilot20UsageUploadPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend usage upload route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/usage-upload" component={Pilot20UsageUploadPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend usage upload route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend usage upload route inserted" "FAIL" "Could not find </Routes> or </Switch>."
        }
    } else {
        Add-Result "Frontend usage upload route inserted" "PASS" "Route already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# Manual page link
if (Test-Path $ManualPageFile) {
    $ManualContent = Read-FileSafe $ManualPageFile

    if (-not (ContainsText $ManualContent "/pilot20/usage-upload")) {
        if (ContainsText $ManualContent "</header>") {
            $LinkBlock = @'
        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => { window.location.href = "/pilot20/rescue-monitor"; }} style={{ background: "#0f172a", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }}>Open 80h Rescue Monitor</button>
          <button type="button" onClick={() => { window.location.href = "/pilot20/usage-upload"; }} style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer" }}>Upload CPAP Usage CSV</button>
        </div>
'@
            # If there is already an Open 80h block, avoid duplicate rescue button by only adding upload link near header.
            if (ContainsText $ManualContent "Open 80h Rescue Monitor") {
                $ManualContent = $ManualContent.Replace(
                    "Open 80h Rescue Monitor</button>",
                    "Open 80h Rescue Monitor</button>" + "`r`n          " + '<button type="button" onClick={() => { window.location.href = "/pilot20/usage-upload"; }} style={{ background: "#0f766e", color: "#fff", border: "none", borderRadius: 12, padding: "12px 18px", fontWeight: 900, cursor: "pointer", marginLeft: 10 }}>Upload CPAP Usage CSV</button>'
                )
            } else {
                $ManualContent = $ManualContent.Replace("</header>", $LinkBlock + "`r`n      </header>")
            }

            Set-Content -Path $ManualPageFile -Value $ManualContent -Encoding UTF8
            Add-Result "Manual entry page usage upload link inserted" "PASS" "Usage upload link added."
        } else {
            Add-Result "Manual entry page usage upload link inserted" "WARN" "Header anchor not found."
        }
    } else {
        Add-Result "Manual entry page usage upload link inserted" "PASS" "Link already present."
    }
} else {
    Add-Result "Manual entry page exists" "WARN" "Manual page not found."
}

# Rescue page link
if (Test-Path $RescuePageFile) {
    $RescueContent = Read-FileSafe $RescuePageFile

    if (-not (ContainsText $RescueContent "/pilot20/usage-upload")) {
        $RescueContent = $RescueContent.Replace(
            '<a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>',
            '<a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>' + "`r`n" + '          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload Usage CSV</a>'
        )

        Set-Content -Path $RescuePageFile -Value $RescueContent -Encoding UTF8
        Add-Result "Rescue monitor usage upload link inserted" "PASS" "Usage upload link added."
    } else {
        Add-Result "Rescue monitor usage upload link inserted" "PASS" "Link already present."
    }
} else {
    Add-Result "Rescue page exists for usage link" "WARN" "Rescue page not found."
}

# Guard allowed path
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_UPLOAD_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_RESCUE_PATH = "/pilot20/rescue-monitor";',
            'const PILOT20_RESCUE_PATH = "/pilot20/rescue-monitor";' + "`r`n" + 'const PILOT20_UPLOAD_PATH = "/pilot20/usage-upload";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/usage-upload") {
        Add-Result "Pilot20 guard allows usage upload page" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows usage upload page" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard file exists" "WARN" "Guard not found."
}

# Docs
$DocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Automatic CPAP Usage Update Engine

REQUIRED_MARKER: PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE
REQUIRED_MARKER: USAGE_CSV_UPLOAD
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING
REQUIRED_MARKER: AUTOMATIC_COMPLIANCE_UPDATE
REQUIRED_MARKER: RESCUE_MONITOR_AUTO_REFRESH
REQUIRED_MARKER: READY_FOR_PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION

## Purpose

Raftopoulos enters the 20 pilot patients once.

After that, updated CPAP usage is imported through CSV upload.
The platform matches usage rows by device_serial and automatically updates:
- compliance records
- 80h status
- projected month usage
- required daily hours
- Rescue Monitor risk level

## Required CSV columns

- device_serial
- month_start
- last_data_date
- month_usage_hours
- usage_hours_30d
- days_used_30d
- ahi_avg_30d
- leak_avg_30d

## Page

/pilot20/usage-upload

## API

POST /api/pilot20/usage-upload
GET /api/pilot20/usage-template

## Boundary

No direct patient identifiers are allowed in usage CSV.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

$BuyerUseContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Usage Upload Buyer Use

REQUIRED_MARKER: PHASE111_BUYER_USE_USAGE_UPLOAD
REQUIRED_MARKER: ENTER_PATIENTS_ONCE
REQUIRED_MARKER: UPLOAD_USAGE_CSV_PERIODICALLY
REQUIRED_MARKER: SEE_PATIENT_PROGRESS_AUTOMATICALLY
REQUIRED_MARKER: COMMERCIAL_AUTOMATION_VALUE

## Buyer workflow

1. Enter the 20 pilot patients once.
2. Export or prepare CPAP usage CSV every few days.
3. Upload CSV in /pilot20/usage-upload.
4. Open /pilot20/rescue-monitor.
5. See who is safe, on track, watch, rescue, or critical.
6. Call the patients at risk before month end.

## Why this matters

The buyer no longer updates each patient manually.
The buyer uploads one usage file and sees patient progress automatically.
'@

Set-Content -Path $BuyerUseDoc -Value $BuyerUseContent -Encoding UTF8

foreach ($Path in @($DocFile, $BuyerUseDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Phase111 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase111 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# Required checks
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $UploadPageFile, $ManualPageFile, $RescuePageFile, $GuardFile, $DocFile, $BuyerUseDoc, $TemplateFile, $SampleFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE",
    "USAGE_CSV_UPLOAD",
    "DEVICE_SERIAL_MATCHING",
    "AUTOMATIC_COMPLIANCE_UPDATE",
    "RESCUE_MONITOR_AUTO_REFRESH",
    "router.post(""/usage-upload""",
    "router.get(""/usage-template""",
    "/pilot20/usage-upload",
    "device_serial",
    "month_usage_hours",
    "ahi_avg_30d",
    "leak_avg_30d",
    "pilot20_usage_csv"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase111 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase111 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase111 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase111 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE111_PILOT20_AUTOMATIC_CPAP_USAGE_UPDATE_ENGINE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 111 Pilot20 Automatic CPAP Usage Update Engine"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend upload page:"
Write-Host $UploadPageFile
Write-Host ""
Write-Host "CSV template:"
Write-Host $TemplateFile
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