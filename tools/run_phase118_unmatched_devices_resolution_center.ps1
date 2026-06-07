# RAFTOP CPAP CARE Pro
# Phase 118 - Unmatched Devices Resolution Center
# Lists skipped AirView devices that did not match Pilot20 patient device serials.
# Does NOT modify patient data.
# Does NOT create patients.
# Does NOT expose secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPagesDir = Join-Path $Root "enterprise-frontend\src\pages"
$UnmatchedPageFile = Join-Path $FrontendPagesDir "Pilot20UnmatchedDevicesPage.js"
$GuardFile = Join-Path $Root "enterprise-frontend\src\pilot20ClientGuard.js"
$UploadPageFile = Join-Path $FrontendPagesDir "Pilot20UsageUploadPage.js"
$ImportHistoryPageFile = Join-Path $FrontendPagesDir "Pilot20ImportHistoryPage.js"
$DocFile = Join-Path $DocsDir "118_UNMATCHED_DEVICES_RESOLUTION_CENTER.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $FrontendPagesDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase118_unmatched_devices_resolution_center_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 118 Unmatched Devices Resolution Center" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 118 - Unmatched Devices Resolution Center..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route file exists" "FAIL" $BackendRouteFile
}

# Backend endpoint
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent 'router.get("/unmatched-devices"')) {
        $EndpointBlock = @'

router.get("/unmatched-devices", async (req, res) => {
  try {
    const db = getDb(req);
    await pilot20EnsureImportAuditTables(db);

    const result = await query(
      db,
      `
      select
        r.device_serial,
        count(*)::integer as occurrence_count,
        max(r.created_at) as last_seen_at,
        max(b.id)::integer as latest_batch_id,
        max(b.filename) as latest_filename,
        max(r.reason) as latest_reason,
        max(r.line_number)::integer as latest_line_number
      from public.pilot20_import_batch_rows r
      join public.pilot20_import_batches b
        on b.id = r.batch_id
      where b.tenant_slug = $1
        and r.status = 'skipped'
        and coalesce(r.device_serial, '') <> ''
        and (
          r.reason = 'device_not_found_in_pilot20'
          or r.reason ilike '%device_not_found%'
          or r.reason ilike '%not_found%'
        )
      group by r.device_serial
      order by max(r.created_at) desc, count(*) desc
      limit 200
      `,
      [PILOT_TENANT_ID]
    );

    const rows = result.rows.map((row) => ({
      ...row,
      resolution_action:
        "Check that this AirView serial number exactly matches the Device Serial entered in Patient Entry. If it is a real pilot device, correct the Patient Entry device serial or re-upload usage data after matching.",
      severity: Number(row.occurrence_count || 0) >= 2 ? "REPEATED" : "NEW"
    }));

    res.json({
      ok: true,
      tenant_id: PILOT_TENANT_ID,
      module: "pilot20_unmatched_devices_resolution_center",
      total_unmatched_devices: rows.length,
      rows
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_unmatched_devices_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $EndpointBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend unmatched devices endpoint inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend unmatched devices endpoint inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend unmatched devices endpoint inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        'router.get("/unmatched-devices"',
        "pilot20_unmatched_devices_resolution_center",
        "device_not_found_in_pilot20",
        "resolution_action",
        "total_unmatched_devices"
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

# Frontend page
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

export default function Pilot20UnmatchedDevicesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const json = await apiFetch("/api/pilot20/unmatched-devices");
      setRows(json.rows || []);
      setTotal(json.total_unmatched_devices || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="pilot20-page" style={pageStyle}>
      <header style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>RAFTOP CPAP CARE Pro</p>
          <h1 style={titleStyle}>Unmatched Devices Resolution Center</h1>
          <p style={subtitleStyle}>
            See AirView serial numbers that did not match any Pilot20 patient device serial. Use this page to correct mismatches before the next upload.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/pilot20/manual-entry" style={secondaryButtonStyle}>Patient Entry</a>
          <a href="/pilot20/usage-upload" style={secondaryButtonStyle}>Upload CSV</a>
          <a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>
          <a href="/pilot20/rescue-monitor" style={primaryLinkStyle}>Rescue Monitor</a>
          <button type="button" onClick={loadData} style={secondaryButtonStyle}>Refresh</button>
        </div>
      </header>

      {error && <div style={errorStyle}>{error}</div>}
      {loading && <div style={infoStyle}>Loading unmatched devices...</div>}

      <section style={headlineStyle}>
        <div style={labelStyle}>Unmatched device serials</div>
        <div style={{ fontSize: 34, fontWeight: 900, color: total > 0 ? "#991b1b" : "#166534" }}>
          {total}
        </div>
        <p style={{ color: "#475569", marginBottom: 0 }}>
          Target after a clean AirView upload: 0 unmatched devices.
        </p>
      </section>

      <section style={panelStyle}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>Resolution queue</h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Device Serial", "Severity", "Times Seen", "Last Seen", "Batch", "File", "Reason", "Resolution Action"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan="8" style={tdStyle}>No unmatched AirView devices found.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.device_serial}>
                    <td style={tdStyle}><strong>{row.device_serial}</strong></td>
                    <td style={tdStyle}>
                      <span style={row.severity === "REPEATED" ? dangerBadgeStyle : warnBadgeStyle}>
                        {row.severity}
                      </span>
                    </td>
                    <td style={tdStyle}>{row.occurrence_count}</td>
                    <td style={tdStyle}>{formatDate(row.last_seen_at)}</td>
                    <td style={tdStyle}>{row.latest_batch_id || "-"}</td>
                    <td style={tdStyle}>{row.latest_filename || "-"}</td>
                    <td style={tdStyle}>{row.latest_reason || "-"}</td>
                    <td style={tdStyle}>{row.resolution_action}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: 20 }}>
        <h2 style={{ marginTop: 0, color: "#0f172a" }}>How to resolve</h2>
        <ol style={{ color: "#334155", lineHeight: 1.7 }}>
          <li>Copy the unmatched AirView serial number.</li>
          <li>Open Patient Entry.</li>
          <li>Find the corresponding pilot patient.</li>
          <li>Make sure Device Serial exactly matches the AirView Serial Number.</li>
          <li>Re-upload the AirView CSV.</li>
          <li>Return here. The unmatched device should disappear.</li>
        </ol>
      </section>
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

const labelStyle = {
  color: "#64748b",
  fontSize: 12,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: 0.4
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

const warnBadgeStyle = {
  background: "#fef3c7",
  color: "#92400e",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12
};

const dangerBadgeStyle = {
  background: "#fee2e2",
  color: "#991b1b",
  padding: "6px 10px",
  borderRadius: 999,
  fontWeight: 900,
  fontSize: 12
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

Set-Content -Path $UnmatchedPageFile -Value $PageContent -Encoding UTF8

if (Test-Path $UnmatchedPageFile) {
    Add-Result "Frontend unmatched devices page created" "PASS" $UnmatchedPageFile
} else {
    Add-Result "Frontend unmatched devices page created" "FAIL" $UnmatchedPageFile
}

# Route integration
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "No App.js/App.jsx found."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp

    $AppContent = Read-FileSafe $FrontendApp

    if (-not (ContainsText $AppContent "Pilot20UnmatchedDevicesPage")) {
        $ImportLine = 'import Pilot20UnmatchedDevicesPage from "./pages/Pilot20UnmatchedDevicesPage";'
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
            Add-Result "Frontend unmatched devices import inserted" "PASS" $ImportLine
        } else {
            $AppContent = $ImportLine + "`r`n" + $AppContent
            Add-Result "Frontend unmatched devices import inserted" "WARN" "Inserted at top."
        }
    } else {
        Add-Result "Frontend unmatched devices import inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $AppContent '/pilot20/unmatched-devices')) {
        if (ContainsText $AppContent "</Routes>") {
            $RouteLine = '        <Route path="/pilot20/unmatched-devices" element={<Pilot20UnmatchedDevicesPage />} />'
            $AppContent = $AppContent.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
            Add-Result "Frontend unmatched devices route inserted" "PASS" "Inserted before </Routes>."
        } elseif (ContainsText $AppContent "</Switch>") {
            $RouteLine = '        <Route path="/pilot20/unmatched-devices" component={Pilot20UnmatchedDevicesPage} />'
            $AppContent = $AppContent.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
            Add-Result "Frontend unmatched devices route inserted" "PASS" "Inserted before </Switch>."
        } else {
            Add-Result "Frontend unmatched devices route inserted" "FAIL" "No Routes/Switch anchor found."
        }
    } else {
        Add-Result "Frontend unmatched devices route inserted" "PASS" "Already present."
    }

    Set-Content -Path $FrontendApp -Value $AppContent -Encoding UTF8
}

# Guard
if (Test-Path $GuardFile) {
    $GuardContent = Read-FileSafe $GuardFile

    if (-not (ContainsText $GuardContent "PILOT20_UNMATCHED_DEVICES_PATH")) {
        $GuardContent = $GuardContent.Replace(
            'const PILOT20_IMPORT_HISTORY_PATH = "/pilot20/import-history";',
            'const PILOT20_IMPORT_HISTORY_PATH = "/pilot20/import-history";' + "`r`n" + 'const PILOT20_UNMATCHED_DEVICES_PATH = "/pilot20/unmatched-devices";'
        )
    }

    $GuardContent = [regex]::Replace(
        $GuardContent,
        'function isAllowedPilot20Path\(pathname\)\s*\{[\s\S]*?\}',
        'function isAllowedPilot20Path(pathname) {
  return pathname === PILOT20_PATH || pathname === PILOT20_RESCUE_PATH || pathname === PILOT20_UPLOAD_PATH || pathname === PILOT20_IMPORT_HISTORY_PATH || pathname === PILOT20_UNMATCHED_DEVICES_PATH || pathname.startsWith(LOGIN_PATH);
}'
    )

    $GuardContent = $GuardContent.Replace(
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH) {',
        'if (currentPath === PILOT20_PATH || currentPath === PILOT20_RESCUE_PATH || currentPath === PILOT20_UPLOAD_PATH || currentPath === PILOT20_IMPORT_HISTORY_PATH || currentPath === PILOT20_UNMATCHED_DEVICES_PATH) {'
    )

    Set-Content -Path $GuardFile -Value $GuardContent -Encoding UTF8

    if (ContainsText $GuardContent "/pilot20/unmatched-devices") {
        Add-Result "Pilot20 guard allows unmatched devices page" "PASS" "Allowed path added."
    } else {
        Add-Result "Pilot20 guard allows unmatched devices page" "FAIL" "Allowed path missing."
    }
} else {
    Add-Result "Pilot20 guard exists" "WARN" "Guard file not found."
}

# Add links
foreach ($Page in @($UploadPageFile, $ImportHistoryPageFile)) {
    if (Test-Path $Page) {
        $P = Read-FileSafe $Page

        if (-not (ContainsText $P "/pilot20/unmatched-devices")) {
            $P = $P.Replace(
                '<a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>',
                '<a href="/pilot20/import-history" style={secondaryButtonStyle}>Import History</a>' + "`r`n" + '          <a href="/pilot20/unmatched-devices" style={secondaryButtonStyle}>Unmatched Devices</a>'
            )

            Set-Content -Path $Page -Value $P -Encoding UTF8
            Add-Result ("Unmatched devices link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Link patched."
        } else {
            Add-Result ("Unmatched devices link inserted in " + (Split-Path $Page -Leaf)) "PASS" "Already present."
        }
    }
}

# Docs
$DocContent = @'
# RAFTOP CPAP CARE Pro - Unmatched Devices Resolution Center

REQUIRED_MARKER: PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER
REQUIRED_MARKER: UNMATCHED_DEVICE_SERIALS_READY
REQUIRED_MARKER: SKIPPED_DEVICE_DIAGNOSTICS_READY
REQUIRED_MARKER: DEVICE_SERIAL_RESOLUTION_WORKFLOW_READY
REQUIRED_MARKER: READY_FOR_PHASE119_MONTHLY_80H_COMMERCIAL_VALUE_REPORT

## Purpose

When an AirView export contains serial numbers that do not match Pilot20 Patient Entry device serials, the rows are skipped.

This phase adds a Resolution Center that shows:
- unmatched device serial
- occurrence count
- latest batch
- latest file
- latest reason
- recommended action

## Page

/pilot20/unmatched-devices

## API

GET /api/pilot20/unmatched-devices

## Production value

Raftopoulos can quickly diagnose skipped uploads and fix serial mismatches.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase118 doc created" "PASS" $DocFile
} else {
    Add-Result "Phase118 doc created" "FAIL" $DocFile
}

$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $UnmatchedPageFile, $GuardFile, $UploadPageFile, $ImportHistoryPageFile, $DocFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER",
    "UNMATCHED_DEVICE_SERIALS_READY",
    "SKIPPED_DEVICE_DIAGNOSTICS_READY",
    "DEVICE_SERIAL_RESOLUTION_WORKFLOW_READY",
    'router.get("/unmatched-devices"',
    "/pilot20/unmatched-devices",
    "Unmatched Devices Resolution Center"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase118 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase118 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase118 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase118 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 118 Unmatched Devices Resolution Center"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Frontend page:"
Write-Host $UnmatchedPageFile
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