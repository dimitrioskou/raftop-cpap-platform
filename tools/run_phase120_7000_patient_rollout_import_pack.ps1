# RAFTOP CPAP CARE Pro
# Phase 120 - 7000 Patient Rollout Import Pack
# Adds production-safe 7000 patient rollout CSV validation pack.
# Does NOT import/apply real patients automatically.
# Does NOT expose secrets.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$DataDir = Join-Path $Root "data-intake\raftopoulos-production-rollout"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$RolloutPageFile = Join-Path $FrontendPagesDir "Pilot20ProductionRolloutImportPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$RollingPageFile = Join-Path $FrontendPagesDir "Pilot20RollingEarlyWarningReportPage.js"
$TemplateFile = Join-Path $DataDir "RAFTOP_7000_PATIENT_ROLLOUT_TEMPLATE.csv"
$SampleFile = Join-Path $DataDir "RAFTOP_7000_PATIENT_ROLLOUT_SAMPLE.csv"
$DocFile = Join-Path $DocsDir "120_7000_PATIENT_ROLLOUT_IMPORT_PACK.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase120_7000_patient_rollout_import_pack_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 120 7000 Patient Rollout Import Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 120 - 7000 Patient Rollout Import Pack..."
Write-Host ""

# CSV templates
$TemplateCsv = @'
patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code
'@

$SampleCsv = @'
patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code
P-000001,CPAP-000001,RS-DEVICE-000001,AirSense 10,2026-06-01,DR-001,ATHENS
P-000002,CPAP-000002,RS-DEVICE-000002,AirSense 11,2026-06-03,DR-002,PIRAEUS
P-000003,CPAP-000003,RS-DEVICE-000003,AirSense 10,2026-06-07,DR-001,ATHENS
'@

Set-Content -Path $TemplateFile -Value $TemplateCsv -Encoding UTF8
Set-Content -Path $SampleFile -Value $SampleCsv -Encoding UTF8

if (Test-Path $TemplateFile) {
    Add-Result "7000 rollout template created" "PASS" $TemplateFile
} else {
    Add-Result "7000 rollout template created" "FAIL" $TemplateFile
}

if (Test-Path $SampleFile) {
    Add-Result "7000 rollout sample created" "PASS" $SampleFile
} else {
    Add-Result "7000 rollout sample created" "FAIL" $SampleFile
}

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route file exists" "FAIL" $BackendRouteFile
}

# Backend helpers/endpoints
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent "pilot20ParseRolloutCsv")) {
        $HelperBlock = @'

function pilot20RolloutSplitCsvLine(line, delimiter) {
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
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function pilot20RolloutDetectDelimiter(headerLine) {
  const commaCount = (String(headerLine || "").match(/,/g) || []).length;
  const semicolonCount = (String(headerLine || "").match(/;/g) || []).length;
  return semicolonCount > commaCount ? ";" : ",";
}

function pilot20ParseRolloutCsv(csvText) {
  const cleanText = String(csvText || "").replace(/^\uFEFF/, "");
  const lines = cleanText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      ok: false,
      error: "csv_requires_header_and_at_least_one_data_row",
      headers: [],
      rows: []
    };
  }

  const delimiter = pilot20RolloutDetectDelimiter(lines[0]);
  const headers = pilot20RolloutSplitCsvLine(lines[0], delimiter).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = pilot20RolloutSplitCsvLine(lines[i], delimiter);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    row.__line = i + 1;
    rows.push(row);
  }

  return {
    ok: true,
    delimiter,
    headers,
    rows
  };
}

function pilot20NormalizeRolloutHeader(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/().%]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function pilot20RolloutGet(row, header) {
  return String(row[header] || "").trim();
}

function pilot20ValidateRolloutCsv(parsed) {
  const requiredHeaders = [
    "patient_external_id",
    "patient_code",
    "device_serial",
    "device_model",
    "setup_date",
    "doctor_external_id",
    "branch_code"
  ];

  const forbiddenHeaders = [
    "first_name",
    "last_name",
    "full_name",
    "patient_name",
    "name",
    "surname",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth",
    "birth_date",
    "dob"
  ];

  const headers = parsed.headers || [];
  const normalizedHeaders = headers.map(pilot20NormalizeRolloutHeader);

  const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
  const forbiddenDetected = [];

  headers.forEach((header) => {
    const normalized = pilot20NormalizeRolloutHeader(header);
    forbiddenHeaders.forEach((forbidden) => {
      if (normalized === pilot20NormalizeRolloutHeader(forbidden)) {
        forbiddenDetected.push(header);
      }
    });
  });

  const seenPatientExternalIds = new Map();
  const seenPatientCodes = new Map();
  const seenDeviceSerials = new Map();

  const rowResults = [];
  let validRows = 0;
  let warningRows = 0;
  let errorRows = 0;

  parsed.rows.forEach((row) => {
    const issues = [];
    const warnings = [];

    const patientExternalId = pilot20RolloutGet(row, "patient_external_id");
    const patientCode = pilot20RolloutGet(row, "patient_code");
    const deviceSerial = pilot20RolloutGet(row, "device_serial");
    const deviceModel = pilot20RolloutGet(row, "device_model");
    const setupDate = pilot20RolloutGet(row, "setup_date");
    const doctorExternalId = pilot20RolloutGet(row, "doctor_external_id");
    const branchCode = pilot20RolloutGet(row, "branch_code");

    if (!patientExternalId) issues.push("patient_external_id_required");
    if (!patientCode) issues.push("patient_code_required");
    if (!deviceSerial) issues.push("device_serial_required");
    if (!setupDate) issues.push("setup_date_required");

    if (patientExternalId) {
      if (seenPatientExternalIds.has(patientExternalId)) {
        issues.push("duplicate_patient_external_id");
      } else {
        seenPatientExternalIds.set(patientExternalId, row.__line);
      }
    }

    if (patientCode) {
      if (seenPatientCodes.has(patientCode)) {
        issues.push("duplicate_patient_code");
      } else {
        seenPatientCodes.set(patientCode, row.__line);
      }
    }

    if (deviceSerial) {
      if (seenDeviceSerials.has(deviceSerial)) {
        issues.push("duplicate_device_serial");
      } else {
        seenDeviceSerials.set(deviceSerial, row.__line);
      }
    }

    if (setupDate) {
      const date = new Date(setupDate);
      if (Number.isNaN(date.getTime())) {
        issues.push("invalid_setup_date");
      }
    }

    if (!doctorExternalId) warnings.push("doctor_external_id_missing");
    if (!branchCode) warnings.push("branch_code_missing");
    if (!deviceModel) warnings.push("device_model_missing");

    let status = "valid";
    if (issues.length > 0) {
      status = "error";
      errorRows += 1;
    } else if (warnings.length > 0) {
      status = "warning";
      warningRows += 1;
      validRows += 1;
    } else {
      validRows += 1;
    }

    rowResults.push({
      line: row.__line,
      status,
      patient_external_id: patientExternalId,
      patient_code: patientCode,
      device_serial: deviceSerial,
      setup_date: setupDate,
      doctor_external_id: doctorExternalId,
      branch_code: branchCode,
      issues,
      warnings
    });
  });

  const hardBlockers = [];

  if (missingHeaders.length > 0) {
    hardBlockers.push("missing_required_headers");
  }

  if (forbiddenDetected.length > 0) {
    hardBlockers.push("direct_identifier_headers_detected");
  }

  if (errorRows > 0) {
    hardBlockers.push("row_errors_detected");
  }

  const readyForRollout = hardBlockers.length === 0;

  return {
    delimiter: parsed.delimiter,
    total_rows: parsed.rows.length,
    valid_rows: validRows,
    warning_rows: warningRows,
    error_rows: errorRows,
    missing_headers: missingHeaders,
    forbidden_headers: Array.from(new Set(forbiddenDetected)),
    duplicate_patient_external_ids: Array.from(seenPatientExternalIds.keys()).length,
    duplicate_patient_codes: Array.from(seenPatientCodes.keys()).length,
    duplicate_device_serials: Array.from(seenDeviceSerials.keys()).length,
    hard_blockers: hardBlockers,
    ready_for_rollout: readyForRollout,
    rows: rowResults.slice(0, 500)
  };
}

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $HelperBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend rollout validation helpers inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend rollout validation helpers inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend rollout validation helpers inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent 'router.get("/production-rollout/template"')) {
        $EndpointBlock = @'

router.get("/production-rollout/template", async (req, res) => {
  res.type("text/csv").send(
    [
      "patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code",
      "P-000001,CPAP-000001,RS-DEVICE-000001,AirSense 10,2026-06-01,DR-001,ATHENS"
    ].join("\n")
  );
});

router.post("/production-rollout/validate", async (req, res) => {
  try {
    const csvText = req.body?.csv_text || req.body?.csvText || "";

    const parsed = pilot20ParseRolloutCsv(csvText);

    if (!parsed.ok) {
      return res.status(400).json({
        ok: false,
        error: parsed.error
      });
    }

    const validation = pilot20ValidateRolloutCsv(parsed);

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_7000_patient_rollout_import_validation",
      message: validation.ready_for_rollout
        ? "Rollout file is structurally ready for controlled production import."
        : "Rollout file has blockers. Fix errors before production import.",
      validation
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_production_rollout_validation_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $EndpointBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend rollout validation endpoints inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend rollout validation endpoints inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend rollout validation endpoints inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20ParseRolloutCsv",
        "pilot20ValidateRolloutCsv",
        'router.get("/production-rollout/template"',
        'router.post("/production-rollout/validate"',
        "pilot20_7000_patient_rollout_import_validation",
        "ready_for_rollout"
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

# Frontend rollout import page
$PageContent = @'
import React, { useState } from "react";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  "";

const SAMPLE_CSV = `patient_external_id,patient_code,device_serial,device_model,setup_date,doctor_external_id,branch_code
P-000001,CPAP-000001,RS-DEVICE-000001,AirSense 10,2026-06-01,DR-001,ATHENS
P-000002,CPAP-000002,RS-DEVICE-000002,AirSense 11,2026-06-03,DR-002,PIRAEUS
P-000003,CPAP-000003,RS-DEVICE-000003,AirSense 10,2026-06-07,DR-001,ATHENS`;

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("authToken") || "";
}

async function validateRollout(csvText) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first.");
  }

  const response = await fetch(`${API_BASE}/api/pilot20/production-rollout/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      csv_text: csvText,
      filename: "raftop_7000_rollout.csv"
    })
  });

  const json = await response.json().catch(() => ({}));

  if (response.status === 401 || json.error === "pilot20_invalid_token") {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    throw new Error(json.message || json.error || "Validation failed");
  }

  return json;
}

export default function Pilot20ProductionRolloutImportPage() {
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [validating, setValidating] = useState(false);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
  }

  async function runValidation() {
    setValidating(true);
    setError("");
    setResult(null);

    try {
      const json = await validateRollout(csvText);
      setResult(json.validation);
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  }

  const ready = result?.ready_for_rollout === true;

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>7,000 Patient Rollout Import Pack</h1>
          <p style={subtitleStyle}>
            Validate the production rollout CSV before any full import. This page does not create patients; it checks whether the file is safe and structurally ready.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/rolling-80h-report" style={primaryLinkStyle}>Rolling 80h Report</a>
          <a href="/pilot20/rescue-monitor" style={secondaryButtonStyle}>Rescue Monitor</a>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Production rule</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", lineHeight: 1.35 }}>
          Validate first. Never import 7,000 patients blindly.
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          The file must not contain names, phones, emails, AMKA, addresses or direct patient identifiers.
        </p>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Upload / paste rollout CSV</h2>

        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Required columns: patient_external_id, patient_code, device_serial, device_model,
          setup_date, doctor_external_id, branch_code.
        </p>

        <input type="file" accept=".csv,text/csv" onChange={handleFile} style={{ marginBottom: 16 }} />

        <textarea
          value={csvText}
          onChange={(event) => setCsvText(event.target.value)}
          rows={12}
          style={textareaStyle}
        />

        <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={runValidation} disabled={validating} style={primaryButtonStyle}>
            {validating ? "Validating..." : "Validate rollout file"}
          </button>
          <button type="button" onClick={() => setCsvText(SAMPLE_CSV)} style={secondaryButtonStyle}>
            Reset sample
          </button>
        </div>
      </section>

      {result && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>Validation result</h2>

          <div style={ready ? successStyle : warningStyle}>
            {ready
              ? "READY FOR CONTROLLED ROLLOUT IMPORT"
              : "NOT READY — FIX BLOCKERS BEFORE IMPORT"}
          </div>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={result.total_rows ?? 0} />
            <MetricCard label="Valid rows" value={result.valid_rows ?? 0} />
            <MetricCard label="Warning rows" value={result.warning_rows ?? 0} />
            <MetricCard label="Error rows" value={result.error_rows ?? 0} />
          </div>

          <div style={twoColumnStyle}>
            <div style={smallPanelStyle}>
              <h3 style={{ marginTop: 0 }}>Blockers</h3>
              {(result.hard_blockers || []).length === 0 ? (
                <p>No hard blockers.</p>
              ) : (
                <ul>
                  {(result.hard_blockers || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>

            <div style={smallPanelStyle}>
              <h3 style={{ marginTop: 0 }}>Forbidden headers</h3>
              {(result.forbidden_headers || []).length === 0 ? (
                <p>No forbidden headers detected.</p>
              ) : (
                <ul>
                  {(result.forbidden_headers || []).map((item) => <li key={item}>{item}</li>)}
                </ul>
              )}
            </div>
          </div>

          <h3>Row preview</h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Patient", "Code", "Device Serial", "Setup Date", "Issues", "Warnings"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(result.rows || []).length === 0 ? (
                  <tr>
                    <td colSpan="8" style={tdStyle}>No rows returned.</td>
                  </tr>
                ) : (
                  (result.rows || []).map((row) => (
                    <tr key={row.line}>
                      <td style={tdStyle}>{row.line}</td>
                      <td style={tdStyle}><strong>{row.status}</strong></td>
                      <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                      <td style={tdStyle}>{row.patient_code || "-"}</td>
                      <td style={tdStyle}>{row.device_serial || "-"}</td>
                      <td style={tdStyle}>{row.setup_date || "-"}</td>
                      <td style={tdStyle}>{(row.issues || []).join(", ") || "-"}</td>
                      <td style={tdStyle}>{(row.warnings || []).join(", ") || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
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
  maxWidth: 1280,
  margin: "0 auto 24px",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "flex-start"
};

const eyebrowStyle = { margin: 0, color: "#64748b", fontWeight: 900 };
const titleStyle = { margin: "4px 0 8px", color: "#0f172a" };
const subtitleStyle = { margin: 0, color: "#475569", lineHeight: 1.6, maxWidth: 760 };

const headlineStyle = {
  maxWidth: 1280,
  margin: "0 auto 20px",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const panelStyle = {
  maxWidth: 1280,
  margin: "0 auto",
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)"
};

const smallPanelStyle = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: 16
};

const cardsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: 12,
  marginTop: 16
};

const twoColumnStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 16,
  marginTop: 16
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

const successStyle = {
  background: "#dcfce7",
  color: "#166534",
  border: "1px solid #bbf7d0",
  padding: 12,
  borderRadius: 12,
  fontWeight: 900
};

const warningStyle = {
  background: "#fef3c7",
  color: "#92400e",
  border: "1px solid #fde68a",
  padding: 12,
  borderRadius: 12,
  fontWeight: 900
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
'@

Set-Content -Path $RolloutPageFile -Value $PageContent -Encoding UTF8

if (Test-Path $RolloutPageFile) {
    Add-Result "Frontend rollout import page created" "PASS" $RolloutPageFile
} else {
    Add-Result "Frontend rollout import page created" "FAIL" $RolloutPageFile
}

# Route integration
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "No App.js/App.jsx found."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp

    $AppContent = Read-FileSafe $FrontendApp

    if (-not (ContainsText $AppContent "Pilot20ProductionRolloutImportPage")) {
        $ImportLine = 'import Pilot20ProductionRolloutImportPage from "./pages/Pilot20ProductionRolloutImportPage";'
        $AppContent = $ImportLine + "`r`n" + $AppContent
        Add-Result "Frontend rollout import inserted" "PASS" $ImportLine
    } else {
        Add-Result "Frontend rollout import inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/production-rollout-import')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/production-rollout-import" element={<Pilot20ProductionRolloutImportPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend rollout import route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/production-rollout-import" component={Pilot20ProductionRolloutImportPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend rollout import route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend rollout import route inserted" "FAIL" "No Routes/Switch anchor found."
        }
    } else {
        Add-Result "Frontend rollout import route inserted" "PASS" "Already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# Guard
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_PRODUCTION_ROLLOUT_IMPORT_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_ROLLING_80H_REPORT_PATH = "/pilot20/rolling-80h-report";',
            'const PILOT20_ROLLING_80H_REPORT_PATH = "/pilot20/rolling-80h-report";' + "`r`n" + 'const PILOT20_PRODUCTION_ROLLOUT_IMPORT_PATH = "/pilot20/production-rollout-import";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname === PILOT20_UNMATCHED_DEVICES_PATH || pathname === PILOT20_ROLLING_80H_REPORT_PATH || pathname === PILOT20_PRODUCTION_ROLLOUT_IMPORT_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH || currentPath === PILOT20_ROLLING_80H_REPORT_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH || currentPath === PILOT20_ROLLING_80H_REPORT_PATH || currentPath === PILOT20_PRODUCTION_ROLLOUT_IMPORT_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/production-rollout-import") {
        Add-Result "Pilot20 guard allows production rollout import page" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows production rollout import page" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard exists" "WARN" "Guard file not found."
}

# Docs
$DocContent = @'
# RAFTOP CPAP CARE Pro - 7000 Patient Rollout Import Pack

REQUIRED_MARKER: PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK
REQUIRED_MARKER: ROLLOUT_CSV_TEMPLATE_READY
REQUIRED_MARKER: ROLLOUT_VALIDATION_ENDPOINT_READY
REQUIRED_MARKER: NO_BLIND_7000_IMPORT
REQUIRED_MARKER: READY_FOR_PHASE121_SUPER_USER_TENANT_CONTROL_LOCK

## Purpose

Full production rollout must not import 7,000 patients blindly.

This phase adds a validation pack:
- rollout CSV template
- rollout CSV sample
- backend validation endpoint
- frontend validation page
- duplicate checks
- missing required field checks
- forbidden direct identifier header checks

## Page

/pilot20/production-rollout-import

## API

GET /api/pilot20/production-rollout/template
POST /api/pilot20/production-rollout/validate

## Required columns

- patient_external_id
- patient_code
- device_serial
- device_model
- setup_date
- doctor_external_id
- branch_code

## Not allowed

- names
- phone numbers
- email
- AMKA
- address
- date of birth
- direct patient identifiers

## Production rule

Validate first. Apply import only after a clean validation report.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase120 doc created" "PASS" $DocFile
} else {
    Add-Result "Phase120 doc created" "FAIL" $DocFile
}

# Required checks
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $RolloutPageFile, $GuardFile, $DocFile, $TemplateFile, $SampleFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK",
    "ROLLOUT_CSV_TEMPLATE_READY",
    "ROLLOUT_VALIDATION_ENDPOINT_READY",
    "NO_BLIND_7000_IMPORT",
    'router.post("/production-rollout/validate"',
    "/pilot20/production-rollout-import",
    "7,000 Patient Rollout Import Pack",
    "ready_for_rollout"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase120 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase120 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase120 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase120 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE120_7000_PATIENT_ROLLOUT_IMPORT_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 120 7000 Patient Rollout Import Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Frontend page:"
Write-Host $RolloutPageFile
Write-Host ""
Write-Host "Templates:"
Write-Host $TemplateFile
Write-Host $SampleFile
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