# RAFTOP CPAP CARE Pro
# Phase 116 - Production Import History & Audit Foundation
# Adds import history + audit foundation for Pilot20/AirView usage uploads.
# Does NOT expose secrets.
# Does NOT create patients.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$ImportHistoryPageFile = Join-Path $FrontendPagesDir "Pilot20ImportHistoryPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$UsageUploadPageFile = Join-Path $FrontendPagesDir "Pilot20UsageUploadPage.js"
$RescuePageFile = Join-Path $FrontendPagesDir "Pilot20ComplianceRescueMonitorPage.js"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase116_production_import_history_audit_foundation_" + $Timestamp + ".md")
$DocFile = Join-Path $DocsDir "116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION.md"

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 116 Production Import History & Audit Foundation" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 116 - Production Import History & Audit Foundation..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot20 backend route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Pilot20 backend route file exists" "FAIL" $BackendRouteFile
}

# -------------------------------------------------------------------
# Backend audit helper + audit endpoints
# -------------------------------------------------------------------
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent "pilot20EnsureImportAuditTables")) {
        $AuditHelperBlock = @'

async function pilot20EnsureImportAuditTables(db) {
  await query(
    db,
    `
    create table if not exists public.pilot20_import_batches (
      id serial primary key,
      tenant_slug text not null,
      upload_source text not null default 'airview_csv',
      filename text,
      total_rows integer not null default 0,
      updated_count integer not null default 0,
      skipped_count integer not null default 0,
      error_count integer not null default 0,
      created_by_email text,
      created_by_role text,
      created_at timestamp with time zone not null default now()
    )
    `,
    []
  );

  await query(
    db,
    `
    create table if not exists public.pilot20_import_batch_rows (
      id serial primary key,
      batch_id integer not null references public.pilot20_import_batches(id) on delete cascade,
      line_number integer,
      status text not null,
      device_serial text,
      patient_external_id text,
      reason text,
      last_data_date text,
      month_usage_hours numeric,
      is_80h_compliant boolean,
      created_at timestamp with time zone not null default now()
    )
    `,
    []
  );
}

function pilot20GetActor(req) {
  const user = req.user || req.auth || req.account || {};
  return {
    email: user.email || user.user_email || user.username || "pilot20_user",
    role: user.role || user.user_role || "pilot20"
  };
}

async function pilot20WriteImportAudit(db, req, report) {
  try {
    await pilot20EnsureImportAuditTables(db);

    const actor = pilot20GetActor(req);

    const batchResult = await query(
      db,
      `
      insert into public.pilot20_import_batches
        (
          tenant_slug,
          upload_source,
          filename,
          total_rows,
          updated_count,
          skipped_count,
          error_count,
          created_by_email,
          created_by_role
        )
      values
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      returning id
      `,
      [
        PILOT_TENANT_ID,
        req.body?.upload_source || "airview_csv",
        req.body?.filename || req.body?.file_name || "uploaded_usage_csv",
        report.total_rows || 0,
        report.updated || 0,
        report.skipped || 0,
        report.errors || 0,
        actor.email,
        actor.role
      ]
    );

    const batchId = batchResult.rows[0].id;

    for (const row of report.rows || []) {
      await query(
        db,
        `
        insert into public.pilot20_import_batch_rows
          (
            batch_id,
            line_number,
            status,
            device_serial,
            patient_external_id,
            reason,
            last_data_date,
            month_usage_hours,
            is_80h_compliant
          )
        values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          batchId,
          row.line || null,
          row.status || "unknown",
          row.device_serial || null,
          row.patient_external_id || null,
          row.reason || null,
          row.last_data_date || null,
          row.month_usage_hours ?? null,
          row.is_80h_compliant ?? null
        ]
      );
    }

    return batchId;
  } catch (error) {
    report.audit_warning = error.message;
    return null;
  }
}

'@

        $Anchor = 'router.post("/usage-upload"'

        if (ContainsText $BackendContent $Anchor) {
            $Index = $BackendContent.IndexOf($Anchor)
            $BackendContent = $BackendContent.Insert($Index, $AuditHelperBlock + "`r`n")
            Add-Result "Backend audit helper inserted" "PASS" "Inserted before usage-upload endpoint."
        } else {
            Add-Result "Backend audit helper inserted" "FAIL" "usage-upload anchor not found."
        }
    } else {
        Add-Result "Backend audit helper inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent "pilot20WriteImportAudit(db, req, report)")) {
        $UsageIndex = $BackendContent.IndexOf('router.post("/usage-upload"')
        $ResIndex = -1

        if ($UsageIndex -ge 0) {
            $ResIndex = $BackendContent.IndexOf("    res.json({", $UsageIndex)
        }

        if ($ResIndex -ge 0) {
            $AuditWriteBlock = @'

    const importBatchId = await pilot20WriteImportAudit(db, req, report);
    report.import_batch_id = importBatchId;

'@
            $BackendContent = $BackendContent.Insert($ResIndex, $AuditWriteBlock)
            Add-Result "Usage upload writes import audit" "PASS" "Inserted before usage-upload response."
        } else {
            Add-Result "Usage upload writes import audit" "FAIL" "Could not find usage-upload res.json anchor."
        }
    } else {
        Add-Result "Usage upload writes import audit" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent 'router.get("/import-history"')) {
        $HistoryEndpoints = @'

router.get("/import-history", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const result = await query(
      db,
      `
      select
        id,
        tenant_slug,
        upload_source,
        filename,
        total_rows,
        updated_count,
        skipped_count,
        error_count,
        created_by_email,
        created_by_role,
        created_at
      from public.pilot20_import_batches
      where tenant_slug = $1
      order by created_at desc, id desc
      limit 50
      `,
      [PILOT_TENANT_ID]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_import_history",
      rows: result.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_import_history_failed",
      message: error.message
    });
  }
});

router.get("/import-history/:batchId", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const batchId = Number(req.params.batchId);

    if (!Number.isFinite(batchId)) {
      return res.status(400).json({
        ok: false,
        error: "invalid_batch_id"
      });
    }

    const batchResult = await query(
      db,
      `
      select *
      from public.pilot20_import_batches
      where tenant_slug = $1
        and id = $2
      limit 1
      `,
      [PILOT_TENANT_ID, batchId]
    );

    if (!batchResult.rows || batchResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        error: "import_batch_not_found"
      });
    }

    const rowsResult = await query(
      db,
      `
      select
        id,
        batch_id,
        line_number,
        status,
        device_serial,
        patient_external_id,
        reason,
        last_data_date,
        month_usage_hours,
        is_80h_compliant,
        created_at
      from public.pilot20_import_batch_rows
      where batch_id = $1
      order by line_number asc, id asc
      `,
      [batchId]
    );

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_import_history_details",
      batch: batchResult.rows[0],
      rows: rowsResult.rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_import_history_details_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $HistoryEndpoints + "`r`nmodule.exports = router;")
            Add-Result "Backend import history endpoints inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend import history endpoints inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend import history endpoints inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20_import_batches",
        "pilot20_import_batch_rows",
        "pilot20WriteImportAudit",
        'router.get("/import-history"',
        'router.get("/import-history/:batchId"',
        "pilot20_import_history"
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
# Frontend Import History Page
# -------------------------------------------------------------------
$ImportHistoryContent = @'
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

export default function Pilot20ImportHistoryPage() {
  const [batches, setBatches] = useState([]);
  const [selected, setSelected] = useState(null);
  const [details, setDetails] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadHistory() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/import-history");
      setBatches(json.rows || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadDetails(batchId) {
    setError("");

    try {
      const json = await apiFetch(`/api/pilot20/import-history/${batchId}`);
      setSelected(json.batch);
      setDetails(json.rows || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>AirView Import History & Audit</h1>
          <p style={subtitleStyle}>
            Production audit trail for AirView / CPAP usage uploads. See what was uploaded, what updated, what was skipped and what failed.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <button type="button" onClick={loadHistory} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading import history...</div>}

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Recent uploads</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["ID", "Created", "Source", "File", "Rows", "Updated", "Skipped", "Errors", "User", "Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="10" style={tdStyle}>No imports recorded yet.</td>
                </tr>
              ) : (
                batches.map((batch) => (
                  <tr key={batch.id}>
                    <td style={tdStyle}>{batch.id}</td>
                    <td style={tdStyle}>{formatDate(batch.created_at)}</td>
                    <td style={tdStyle}>{batch.upload_source}</td>
                    <td style={tdStyle}>{batch.filename || "-"}</td>
                    <td style={tdStyle}>{batch.total_rows}</td>
                    <td style={{ ...tdStyle, color: "#166534", fontWeight: 900 }}>{batch.updated_count}</td>
                    <td style={{ ...tdStyle, color: "#92400e", fontWeight: 900 }}>{batch.skipped_count}</td>
                    <td style={{ ...tdStyle, color: "#991b1b", fontWeight: 900 }}>{batch.error_count}</td>
                    <td style={tdStyle}>{batch.created_by_email || "-"}</td>
                    <td style={tdStyle}>
                      <button type="button" onClick={() => loadDetails(batch.id)} style={smallButtonStyle}>
                        View rows
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selected && (
        <section style={{ ...panelStyle, marginTop: 20 }}>
          <h2 style={{ marginTop: 0, color: "#0f172a" }}>
            Import details #{selected.id}
          </h2>

          <div style={cardsGridStyle}>
            <MetricCard label="Total rows" value={selected.total_rows} />
            <MetricCard label="Updated" value={selected.updated_count} />
            <MetricCard label="Skipped" value={selected.skipped_count} />
            <MetricCard label="Errors" value={selected.error_count} />
          </div>

          <div style={{ overflowX: "auto", marginTop: 18 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Line", "Status", "Device Serial", "Patient", "Reason", "Last Data", "Hours", "80h"].map((h) => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {details.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={tdStyle}>No row details found.</td>
                  </tr>
                ) : (
                  details.map((row) => (
                    <tr key={row.id}>
                      <td style={tdStyle}>{row.line_number ?? "-"}</td>
                      <td style={tdStyle}><strong>{row.status}</strong></td>
                      <td style={tdStyle}>{row.device_serial || "-"}</td>
                      <td style={tdStyle}>{row.patient_external_id || "-"}</td>
                      <td style={tdStyle}>{row.reason || "-"}</td>
                      <td style={tdStyle}>{row.last_data_date || "-"}</td>
                      <td style={tdStyle}>{row.month_usage_hours ?? "-"}</td>
                      <td style={tdStyle}>{row.is_80h_compliant === true ? "YES" : row.is_80h_compliant === false ? "NO" : "-"}</td>
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
      <div style={metricStyle}>{value ?? 0}</div>
    </div>
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

const smallButtonStyle = {
  background: "#0f172a",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  padding: "8px 12px",
  fontWeight: 900,
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

Set-Content -Path $ImportHistoryPageFile -Value $ImportHistoryContent -Encoding UTF8

if (Test-Path $ImportHistoryPageFile) {
    Add-Result "Frontend import history page created" "PASS" $ImportHistoryPageFile
} else {
    Add-Result "Frontend import history page created" "FAIL" $ImportHistoryPageFile
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

    if (-not (ContainsText $AppContent "Pilot20ImportHistoryPage")) {
        $ImportLine = 'import Pilot20ImportHistoryPage from "./pages/Pilot20ImportHistoryPage";'
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
            Add-Result "Frontend import history import inserted" "PASS" $ImportLine
        } else {
            $AppContent = $ImportLine + "`r`n" + $AppContent
            Add-Result "Frontend import history import inserted" "WARN" "Inserted at top."
        }
    } else {
        Add-Result "Frontend import history import inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/import-history')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/import-history" element={<Pilot20ImportHistoryPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend import history route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/import-history" component={Pilot20ImportHistoryPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend import history route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend import history route inserted" "FAIL" "No Routes/Switch anchor found."
        }
    } else {
        Add-Result "Frontend import history route inserted" "PASS" "Already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# -------------------------------------------------------------------
# Guard allow import history
# -------------------------------------------------------------------
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_IMPORT_HISTORY_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_UPLOAD_PATH = "/pilot20/usage-upload";',
            'const PILOT20_UPLOAD_PATH = "/pilot20/usage-upload";' + "`r`n" + 'const PILOT20_IMPORT_HISTORY_PATH = "/pilot20/import-history";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/import-history") {
        Add-Result "Pilot20 guard allows import history" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows import history" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard file exists" "WARN" "Guard file not found."
}

# -------------------------------------------------------------------
# Add navigation links to existing pilot pages
# -------------------------------------------------------------------
foreach ($Page in @($UsageUploadPageFile, $RescuePageFile)) {
    if (Test-Path $Page) {
        $PageContent = Read-FileSafe $Page

        if (-not (ContainsText $PageContent "/pilot20/import-history")) {
            $PageContent = $PageContent.Replace(
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>',
                '<a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>' + "`r`n" + '          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>'
            )

            $PageContent = $PageContent.Replace(
                '<a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload Usage CSV</a>',
                '<a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload Usage CSV</a>' + "`r`n" + '          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>'
            )

            Set-Content -Path $Page -Value $PageContent -Encoding UTF8
            Add-Result ("Import history link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Link patched."
        } else {
            Add-Result ("Import history link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Already present."
        }
    }
}

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$DocContent = @'
# RAFTOP CPAP CARE Pro - Production Import History & Audit Foundation

REQUIRED_MARKER: PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION
REQUIRED_MARKER: IMPORT_HISTORY_READY
REQUIRED_MARKER: IMPORT_AUDIT_TABLES_READY
REQUIRED_MARKER: USAGE_UPLOAD_AUDIT_TRAIL_READY
REQUIRED_MARKER: READY_FOR_PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK

## Purpose

Production systems need an audit trail for every AirView / CPAP usage upload.

This phase adds:
- import batch history
- per-row import details
- updated/skipped/error counts
- created by user
- created timestamp
- frontend Import History page

## Buyer value

Raftopoulos can see:
- what was uploaded
- when it was uploaded
- who uploaded it
- how many rows updated patients
- which devices were skipped
- which rows failed

## Page

/pilot20/import-history

## API

GET /api/pilot20/import-history
GET /api/pilot20/import-history/:batchId

## Production reason

Without import history, production support is blind.
With import history, skipped devices and failed mappings can be diagnosed quickly.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase116 doc created" "PASS" $DocFile
} else {
    Add-Result "Phase116 doc created" "FAIL" $DocFile
}

# -------------------------------------------------------------------
# Required markers
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $ImportHistoryPageFile, $GuardFile, $UsageUploadPageFile, $RescuePageFile, $DocFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION",
    "IMPORT_HISTORY_READY",
    "IMPORT_AUDIT_TABLES_READY",
    "USAGE_UPLOAD_AUDIT_TRAIL_READY",
    "pilot20_import_batches",
    "pilot20_import_batch_rows",
    "/pilot20/import-history",
    "pilot20WriteImportAudit",
    "Import History"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase116 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase116 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase116 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase116 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE116_PRODUCTION_IMPORT_HISTORY_AUDIT_FOUNDATION_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 116 Production Import History & Audit Foundation"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend page:"
Write-Host $ImportHistoryPageFile
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