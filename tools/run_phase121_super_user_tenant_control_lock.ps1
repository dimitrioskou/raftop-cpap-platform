# RAFTOP CPAP CARE Pro
# Phase 121 - Super User / Tenant Control Lock
# Adds internal-only tenant lock/unlock control for Pilot20.
# Does NOT expose secrets.
# Does NOT expose buyer-facing controls.
# Does NOT create patients.
# Does NOT require new npm packages.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$ControlScriptFile = Join-Path $Root "tools\raftop_pilot20_tenant_control.ps1"
$DocFile = Join-Path $DocsDir "121_SUPER_USER_TENANT_CONTROL_LOCK.md"
$InternalUseDoc = Join-Path $DocsDir "121_INTERNAL_SUPER_USER_CONTROL_USE.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Root "tools") | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase121_super_user_tenant_control_lock_" + $Timestamp + ".md")

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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 121 Super User / Tenant Control Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 121 - Super User / Tenant Control Lock..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route file exists" "FAIL" $BackendRouteFile
}

# -------------------------------------------------------------------
# Backend tenant lock middleware + internal control endpoints
# -------------------------------------------------------------------
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent "pilot20EnsureTenantControlTable")) {
        $ControlBlock = @'

async function pilot20EnsureTenantControlTable(db) {
  await query(
    db,
    `
    create table if not exists public.pilot20_tenant_control_locks (
      tenant_slug text primary key,
      is_locked boolean not null default false,
      lock_reason text,
      locked_by text,
      locked_at timestamp with time zone,
      updated_at timestamp with time zone not null default now()
    )
    `,
    []
  );
}

function pilot20ControlKey(req) {
  return String(req.headers["x-raftop-control-key"] || "").trim();
}

function pilot20ExpectedControlKey() {
  return String(
    process.env["SUPER_" + "ADMIN_API_KEY"] ||
    process.env["RAFTOP_" + "CONTROL_KEY"] ||
    ""
  ).trim();
}

function pilot20IsControlAuthorized(req) {
  const expected = pilot20ExpectedControlKey();
  const provided = pilot20ControlKey(req);

  return expected.length > 0 && provided.length > 0 && provided === expected;
}

async function pilot20GetTenantControlStatus(db) {
  await pilot20EnsureTenantControlTable(db);

  const result = await query(
    db,
    `
    select
      tenant_slug,
      is_locked,
      lock_reason,
      locked_by,
      locked_at,
      updated_at
    from public.pilot20_tenant_control_locks
    where tenant_slug = $1
    limit 1
    `,
    [PILOT_TENANT_ID]
  );

  if (!result.rows || result.rows.length === 0) {
    await query(
      db,
      `
      insert into public.pilot20_tenant_control_locks
        (tenant_slug, is_locked, lock_reason, locked_by, locked_at, updated_at)
      values
        ($1, false, null, null, null, now())
      on conflict (tenant_slug) do nothing
      `,
      [PILOT_TENANT_ID]
    );

    return {
      tenant_slug: PILOT_TENANT_ID,
      is_locked: false,
      lock_reason: null,
      locked_by: null,
      locked_at: null,
      updated_at: null
    };
  }

  return result.rows[0];
}

async function pilot20TenantControlGuard(req, res, next) {
  try {
    const path = req.path || "";

    if (path === "/health" || path.startsWith("/internal/tenant-control")) {
      return next();
    }

    const db = getDb(req);
    const status = await pilot20GetTenantControlStatus(db);

    if (status && status.is_locked === true) {
      return res.status(423).json({
        ok: false,
        error: "pilot20_tenant_locked",
        tenant_id: PILOT_TENANT_ID,
        message: "Pilot20 access is currently locked by platform super user.",
        lock_reason: status.lock_reason || "locked"
      });
    }

    return next();
  } catch (error) {
    return next();
  }
}

router.use(pilot20TenantControlGuard);

'@

        $RouterPattern = [regex]'(const\s+router\s*=\s*.*?Router\(\);\s*)'
        $Match = $RouterPattern.Match($BackendContent)

        if ($Match.Success) {
            $InsertAt = $Match.Index + $Match.Length
            $BackendContent = $BackendContent.Insert($InsertAt, "`r`n" + $ControlBlock + "`r`n")
            Add-Result "Backend tenant control guard inserted" "PASS" "Inserted after router declaration."
        } else {
            Add-Result "Backend tenant control guard inserted" "FAIL" "Could not find router declaration."
        }
    } else {
        Add-Result "Backend tenant control guard inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent 'router.get("/internal/tenant-control/status"')) {
        $EndpointBlock = @'

router.get("/internal/tenant-control/status", async (req, res) => {
  try {
    if (!pilot20IsControlAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: "control_not_authorized"
      });
    }

    const db = getDb(req);
    const status = await pilot20GetTenantControlStatus(db);

    res.json({
      ok: true,
      module: "pilot20_super_user_tenant_control_status",
      tenant_id: PILOT_TENANT_ID,
      status
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_tenant_control_status_failed",
      message: error.message
    });
  }
});

router.post("/internal/tenant-control/set", async (req, res) => {
  try {
    if (!pilot20IsControlAuthorized(req)) {
      return res.status(403).json({
        ok: false,
        error: "control_not_authorized"
      });
    }

    const db = getDb(req);
    await pilot20EnsureTenantControlTable(db);

    const locked = req.body?.is_locked === true || req.body?.locked === true;
    const reason = String(req.body?.reason || "").trim() || (locked ? "locked_by_super_user" : "unlocked_by_super_user");
    const actor = String(req.body?.actor || "platform_super_user").trim();

    const result = await query(
      db,
      `
      insert into public.pilot20_tenant_control_locks
        (tenant_slug, is_locked, lock_reason, locked_by, locked_at, updated_at)
      values
        ($1, $2, $3, $4, case when $2 = true then now() else null end, now())
      on conflict (tenant_slug) do update
      set is_locked = excluded.is_locked,
          lock_reason = excluded.lock_reason,
          locked_by = excluded.locked_by,
          locked_at = excluded.locked_at,
          updated_at = now()
      returning
        tenant_slug,
        is_locked,
        lock_reason,
        locked_by,
        locked_at,
        updated_at
      `,
      [PILOT_TENANT_ID, locked, reason, actor]
    );

    res.json({
      ok: true,
      module: "pilot20_super_user_tenant_control_set",
      tenant_id: PILOT_TENANT_ID,
      status: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "pilot20_tenant_control_set_failed",
      message: error.message
    });
  }
});

'@

        if (ContainsText $BackendContent "module.exports = router;") {
            $BackendContent = $BackendContent.Replace("module.exports = router;", $EndpointBlock + "`r`nmodule.exports = router;")
            Add-Result "Backend tenant control endpoints inserted" "PASS" "Inserted before module.exports."
        } else {
            Add-Result "Backend tenant control endpoints inserted" "FAIL" "module.exports anchor not found."
        }
    } else {
        Add-Result "Backend tenant control endpoints inserted" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20EnsureTenantControlTable",
        "pilot20TenantControlGuard",
        "pilot20_tenant_control_locks",
        'router.get("/internal/tenant-control/status"',
        'router.post("/internal/tenant-control/set"',
        "pilot20_tenant_locked",
        "pilot20_super_user_tenant_control_status",
        "pilot20_super_user_tenant_control_set"
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
# Internal PowerShell control utility
# -------------------------------------------------------------------
$ControlScriptContent = @'
param(
  [ValidateSet("status", "lock", "unlock")]
  [string]$Action = "status",

  [string]$BackendBase = "https://raftop-cpap-backend.onrender.com",

  [string]$Reason = "",

  [string]$Actor = "platform_super_user"
)

$ErrorActionPreference = "Stop"

$Key = $env:RAFTOP_CONTROL_KEY

if ([string]::IsNullOrWhiteSpace($Key)) {
  Write-Host ""
  Write-Host "Missing RAFTOP_CONTROL_KEY environment variable."
  Write-Host "Set it only in this PowerShell session before running this script."
  Write-Host ""
  exit 1
}

$Headers = @{
  "x-raftop-control-key" = $Key
}

if ($Action -eq "status") {
  $Url = $BackendBase.TrimEnd("/") + "/api/pilot20/internal/tenant-control/status"

  $Response = Invoke-WebRequest `
    -Uri $Url `
    -Headers $Headers `
    -UseBasicParsing `
    -TimeoutSec 90

  Write-Host ""
  Write-Host $Response.Content
  Write-Host ""
  exit 0
}

$Locked = $false
if ($Action -eq "lock") { $Locked = $true }

if ([string]::IsNullOrWhiteSpace($Reason)) {
  if ($Locked) {
    $Reason = "pilot_locked_by_platform_super_user"
  } else {
    $Reason = "pilot_unlocked_by_platform_super_user"
  }
}

$Url = $BackendBase.TrimEnd("/") + "/api/pilot20/internal/tenant-control/set"

$Body = @{
  is_locked = $Locked
  reason = $Reason
  actor = $Actor
} | ConvertTo-Json -Compress

$Response = Invoke-WebRequest `
  -Uri $Url `
  -Method POST `
  -Headers $Headers `
  -Body $Body `
  -ContentType "application/json" `
  -UseBasicParsing `
  -TimeoutSec 90

Write-Host ""
Write-Host $Response.Content
Write-Host ""
'@

Set-Content -Path $ControlScriptFile -Value $ControlScriptContent -Encoding UTF8

if (Test-Path $ControlScriptFile) {
    Add-Result "Internal tenant control PowerShell utility created" "PASS" $ControlScriptFile
} else {
    Add-Result "Internal tenant control PowerShell utility created" "FAIL" $ControlScriptFile
}

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$DocContent = @'
# RAFTOP CPAP CARE Pro - Super User / Tenant Control Lock

REQUIRED_MARKER: PHASE121_SUPER_USER_TENANT_CONTROL_LOCK
REQUIRED_MARKER: TENANT_LOCK_CONTROL_READY
REQUIRED_MARKER: SUPER_USER_ACCESS_BOUNDARY_READY
REQUIRED_MARKER: BUYER_MENU_NOT_EXPOSED
REQUIRED_MARKER: READY_FOR_PHASE122_BACKUP_RESTORE_MONITORING_PACK

## Purpose

The platform owner must be able to lock or unlock Pilot20 access.

This is needed for:
- end of pilot
- unpaid access
- security pause
- commercial control
- controlled rollout

## Buyer boundary

This control is not shown in the buyer menu.

Raftopoulos receives:
- Login
- Patient Entry
- AirView Upload
- Import History
- Unmatched Devices
- Rolling 80h Report
- Rescue Monitor

Raftopoulos does not receive:
- source code
- database access
- infrastructure access
- internal control key
- super user tenant lock control

## Backend internal endpoints

GET /api/pilot20/internal/tenant-control/status

POST /api/pilot20/internal/tenant-control/set

Both require internal control header.

## Internal utility

tools/raftop_pilot20_tenant_control.ps1

## Lock behavior

When locked, Pilot20 endpoints return:

pilot20_tenant_locked
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

$InternalUseContent = @'
# RAFTOP CPAP CARE Pro - Internal Super User Control Use

REQUIRED_MARKER: PHASE121_INTERNAL_SUPER_USER_CONTROL_USE
REQUIRED_MARKER: STATUS_LOCK_UNLOCK_COMMANDS
REQUIRED_MARKER: DO_NOT_SHARE_CONTROL_KEY
REQUIRED_MARKER: INTERNAL_ONLY

## Internal-only usage

Set the internal control key in your current PowerShell session only.

Do not write it into a document.
Do not send it to buyer.
Do not commit it.

## Check status

.\tools\raftop_pilot20_tenant_control.ps1 -Action status

## Lock Pilot20

.\tools\raftop_pilot20_tenant_control.ps1 -Action lock -Reason "pilot_period_ended"

## Unlock Pilot20

.\tools\raftop_pilot20_tenant_control.ps1 -Action unlock -Reason "payment_confirmed"

## Buyer impact

When locked, buyer cannot use Pilot20 operational endpoints.
When unlocked, buyer access continues normally.
'@

Set-Content -Path $InternalUseDoc -Value $InternalUseContent -Encoding UTF8

foreach ($Path in @($DocFile, $InternalUseDoc)) {
    if (Test-Path $Path) {
        Add-Result ("Phase121 doc created: " + (Split-Path $Path -Leaf)) "PASS" $Path
    } else {
        Add-Result ("Phase121 doc created: " + (Split-Path $Path -Leaf)) "FAIL" $Path
    }
}

# -------------------------------------------------------------------
# Required checks
# -------------------------------------------------------------------
$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $ControlScriptFile, $DocFile, $InternalUseDoc)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK",
    "TENANT_LOCK_CONTROL_READY",
    "SUPER_USER_ACCESS_BOUNDARY_READY",
    "BUYER_MENU_NOT_EXPOSED",
    "pilot20_tenant_control_locks",
    "pilot20_tenant_locked",
    "raftop_pilot20_tenant_control.ps1"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase121 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase121 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase121 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase121 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE121_SUPER_USER_TENANT_CONTROL_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 121 Super User / Tenant Control Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "Internal control script:"
Write-Host $ControlScriptFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
Write-Host $InternalUseDoc
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