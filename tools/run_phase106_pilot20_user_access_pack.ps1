# RAFTOP CPAP CARE Pro
# Phase 106 - Pilot20 User Access Pack & Route Protection
# Creates Pilot20 users, credentials outside repo, and protects pilot20 API routes.
# Does NOT expose secrets.
# Does NOT commit credentials.
# Does NOT create patient data.

param(
    [string]$PilotAdminEmail = "raftopoulos.pilot.admin@raftopoulos.local",
    [string]$PilotAdminName = "Raftopoulos Pilot Admin",

    [string]$PilotOperationsEmail = "raftopoulos.pilot.operations@raftopoulos.local",
    [string]$PilotOperationsName = "Raftopoulos Pilot Operations",

    [string]$PilotViewerEmail = "raftopoulos.pilot.viewer@raftopoulos.local",
    [string]$PilotViewerName = "Raftopoulos Pilot Viewer"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"

$CredentialOutDir = Join-Path $Desktop "RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT"
$CredentialFile = Join-Path $CredentialOutDir "RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"
$ApplySqlFile = Join-Path $CredentialOutDir "phase106_pilot20_users_apply_DO_NOT_COMMIT.sql"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $CredentialOutDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase106_pilot20_user_access_pack_" + $Timestamp + ".md")
$AccessDoc = Join-Path $DocsDir "106_PILOT20_USER_ACCESS_PACK.md"
$BuyerMessageDoc = Join-Path $DocsDir "106_PILOT20_BUYER_DELIVERY_MESSAGE.md"
$SecurityDoc = Join-Path $DocsDir "106_PILOT20_SECURITY_LOCK.md"

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

function SqlEscape {
    param([string]$Value)
    if ($null -eq $Value) { return "" }
    return $Value.Replace("'", "''")
}

function New-TempPassword {
    $Bytes = New-Object byte[] 18
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($Bytes)
    $Base = [Convert]::ToBase64String($Bytes)
    $Safe = $Base.Replace("+","A").Replace("/","B").Replace("=","C")
    return ("Pilot!" + $Safe.Substring(0,18) + "9")
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
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName
    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "FAIL" ("Latest report exists but status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 106 Pilot20 User Access Pack" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 106 - Pilot20 User Access Pack & Route Protection..."
Write-Host ""

Check-ReportStatus "Phase 105 live pilot20 verification status" "phase105_live_pilot20_verification_*.md" @(
    "PHASE105_LIVE_PILOT20_VERIFICATION_READY",
    "PHASE105_LIVE_PILOT20_VERIFICATION_READY_WITH_WARNINGS"
)

# Patch route protection
if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot20 backend route file exists" "PASS" $BackendRouteFile

    $RouteContent = Read-FileSafe $BackendRouteFile

    if (ContainsText $RouteContent "requirePilot20Access") {
        Add-Result "Pilot20 route protection already present" "PASS" "requirePilot20Access found."
    } else {
        $ProtectionBlock = @'
function getJwtVerifier() {
  try {
    return require("jsonwebtoken");
  } catch (error) {
    return null;
  }
}

function getJwtSecretFromEnv() {
  const primaryKey = ["JWT", "SECRET"].join("_");
  return process.env[primaryKey] || process.env.JWT_SIGNING_SECRET || "";
}

function getTokenFromRequest(req) {
  const header = req.headers.authorization || req.headers.Authorization || "";
  if (!header || !header.startsWith("Bearer ")) return "";
  return header.slice("Bearer ".length).trim();
}

function getDecodedTenant(decoded) {
  return (
    decoded?.tenant_id ||
    decoded?.tenant_slug ||
    decoded?.tenant ||
    decoded?.tenantId ||
    decoded?.user?.tenant_id ||
    decoded?.user?.tenant_slug ||
    ""
  );
}

function getDecodedRole(decoded) {
  return (
    decoded?.role ||
    decoded?.user_role ||
    decoded?.user?.role ||
    ""
  );
}

function requirePilot20Access(req, res, next) {
  if (req.path === "/health") return next();

  const jwt = getJwtVerifier();
  const secret = getJwtSecretFromEnv();

  if (!jwt || !secret) {
    return res.status(500).json({
      ok: false,
      error: "pilot20_auth_not_configured"
    });
  }

  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "pilot20_auth_required"
    });
  }

  try {
    const decoded = jwt.verify(token, secret);
    const tenant = getDecodedTenant(decoded);
    const role = getDecodedRole(decoded);

    const isPilotTenant = tenant === PILOT_TENANT_ID;
    const isAdmin = ["super_admin", "platform_admin", "admin"].includes(role);

    if (!isPilotTenant && !isAdmin) {
      return res.status(403).json({
        ok: false,
        error: "pilot20_forbidden"
      });
    }

    req.pilot20User = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({
      ok: false,
      error: "pilot20_invalid_token"
    });
  }
}

router.use(requirePilot20Access);

'@

        $Anchor = 'router.get("/health", async (req, res) => {'
        if (ContainsText $RouteContent $Anchor) {
            $RouteContent = $RouteContent.Replace($Anchor, $ProtectionBlock + $Anchor)
            Set-Content -Path $BackendRouteFile -Value $RouteContent -Encoding UTF8
            Add-Result "Pilot20 route protection inserted" "PASS" "Inserted before health route."
        } else {
            Add-Result "Pilot20 route protection inserted" "FAIL" "Could not find health route anchor."
        }
    }

    $UpdatedRoute = Read-FileSafe $BackendRouteFile
    if ((ContainsText $UpdatedRoute "requirePilot20Access") -and (ContainsText $UpdatedRoute "router.use(requirePilot20Access)")) {
        Add-Result "Pilot20 route protection verified" "PASS" "Protection middleware present."
    } else {
        Add-Result "Pilot20 route protection verified" "FAIL" "Protection middleware missing."
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $NodeCommand) {
        Add-Result "node command available" "WARN" "node not found; skipping syntax check."
    } else {
        $NodeOut = & node -c $BackendRouteFile 2>&1
        $NodeExit = $LASTEXITCODE
        if ($NodeExit -eq 0) {
            Add-Result "Pilot20 backend route syntax check" "PASS" "node -c passed."
        } else {
            Add-Result "Pilot20 backend route syntax check" "FAIL" ($NodeOut | Out-String)
        }
    }
} else {
    Add-Result "Pilot20 backend route file exists" "FAIL" $BackendRouteFile
}

# Credentials + SQL
$PilotAdminPassword = New-TempPassword
$PilotOperationsPassword = New-TempPassword
$PilotViewerPassword = New-TempPassword

$Users = @(
    [PSCustomObject]@{ email = $PilotAdminEmail; name = $PilotAdminName; role = "tenant_admin"; password = $PilotAdminPassword },
    [PSCustomObject]@{ email = $PilotOperationsEmail; name = $PilotOperationsName; role = "operations_user"; password = $PilotOperationsPassword },
    [PSCustomObject]@{ email = $PilotViewerEmail; name = $PilotViewerName; role = "viewer"; password = $PilotViewerPassword }
)

$CredentialLines = @()
$CredentialLines += "RAFTOP CPAP CARE Pro - Pilot 20 Credentials"
$CredentialLines += ""
$CredentialLines += "DO NOT COMMIT THIS FILE."
$CredentialLines += "DELIVER SEPARATELY."
$CredentialLines += ""
$CredentialLines += "Login URL:"
$CredentialLines += "https://raftop-cpap-frontend.onrender.com/login"
$CredentialLines += ""
$CredentialLines += "Pilot 20 URL:"
$CredentialLines += "https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry"
$CredentialLines += ""

foreach ($User in $Users) {
    $CredentialLines += "----------------------------------------"
    $CredentialLines += ("Role: " + $User.role)
    $CredentialLines += ("Name: " + $User.name)
    $CredentialLines += ("Email: " + $User.email)
    $CredentialLines += ("Temporary password: " + $User.password)
    $CredentialLines += ""
}

Set-Content -Path $CredentialFile -Value $CredentialLines -Encoding UTF8

if (Test-Path $CredentialFile) {
    Add-Result "Pilot20 credentials file created outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Pilot20 credentials file created outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Pilot20 credentials outside repository" "FAIL" "Credential file is inside repo."
} else {
    Add-Result "Pilot20 credentials outside repository" "PASS" "Credential file is outside repo."
}

$SqlLines = @()
$SqlLines += "-- RAFTOP CPAP CARE Pro - Phase 106 Pilot20 users apply"
$SqlLines += "-- DO NOT COMMIT THIS FILE."
$SqlLines += "BEGIN;"
$SqlLines += "CREATE EXTENSION IF NOT EXISTS pgcrypto;"
$SqlLines += ""
$SqlLines += "INSERT INTO public.tenants (slug, name, status, plan_name, notes)"
$SqlLines += "VALUES ('raftopoulos-pilot-20', 'Raftopoulos Pilot 20', 'active', 'pilot', 'Two-month controlled pilot for 20 pseudonymized CPAP patients.')"
$SqlLines += "ON CONFLICT (slug) DO UPDATE"
$SqlLines += "SET name = EXCLUDED.name, status = EXCLUDED.status, plan_name = EXCLUDED.plan_name, notes = EXCLUDED.notes, updated_at = now();"
$SqlLines += ""

foreach ($User in $Users) {
    $Email = SqlEscape $User.email
    $Name = SqlEscape $User.name
    $Role = SqlEscape $User.role
    $Password = SqlEscape $User.password

    $SqlLines += "UPDATE public.users"
    $SqlLines += "SET tenant_id = 'raftopoulos-pilot-20',"
    $SqlLines += "    name = '$Name',"
    $SqlLines += "    role = '$Role',"
    $SqlLines += "    status = 'active',"
    $SqlLines += "    password_hash = crypt('$Password', gen_salt('bf')),"
    $SqlLines += "    updated_at = now()"
    $SqlLines += "WHERE email = '$Email';"
    $SqlLines += ""
    $SqlLines += "INSERT INTO public.users (tenant_id, email, password_hash, name, role, status, created_at, updated_at)"
    $SqlLines += "SELECT 'raftopoulos-pilot-20', '$Email', crypt('$Password', gen_salt('bf')), '$Name', '$Role', 'active', now(), now()"
    $SqlLines += "WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = '$Email');"
    $SqlLines += ""
}

$SqlLines += "COMMIT;"
Set-Content -Path $ApplySqlFile -Value $SqlLines -Encoding UTF8

if (Test-Path $ApplySqlFile) {
    Add-Result "Pilot20 user apply SQL created outside repo" "PASS" $ApplySqlFile
} else {
    Add-Result "Pilot20 user apply SQL created outside repo" "FAIL" $ApplySqlFile
}

if ($ApplySqlFile -like "$Root*") {
    Add-Result "Pilot20 user apply SQL outside repository" "FAIL" "Apply SQL is inside repo."
} else {
    Add-Result "Pilot20 user apply SQL outside repository" "PASS" "Apply SQL is outside repo."
}

$DatabaseUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Add-Result "Production database URL env set" "FAIL" "RAFTOP_PRODUCTION_DATABASE_URL is not set."
} else {
    Add-Result "Production database URL env set" "PASS" "Env value is set. Value is not printed."
}

if ($null -eq $PsqlCommand) {
    Add-Result "psql command available" "FAIL" "psql not found."
} else {
    Add-Result "psql command available" "PASS" "psql found."
}

if ($script:FailCount -eq 0) {
    $ApplyOut = & psql $DatabaseUrl -v ON_ERROR_STOP=1 -f $ApplySqlFile 2>&1
    $ApplyExit = $LASTEXITCODE

    if ($ApplyExit -eq 0) {
        Add-Result "Pilot20 tenant/users applied to production DB" "PASS" "psql exit code 0."
    } else {
        Add-Result "Pilot20 tenant/users applied to production DB" "FAIL" ("psql exit code " + $ApplyExit + " / " + ($ApplyOut | Out-String))
    }
} else {
    Add-Result "Pilot20 tenant/users applied to production DB" "FAIL" "Skipped because pre-apply gate has FAIL."
}

# Docs
$AccessDocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 User Access Pack

REQUIRED_MARKER: PHASE106_PILOT20_USER_ACCESS_PACK
REQUIRED_MARKER: PILOT20_USERS_CREATED
REQUIRED_MARKER: CREDENTIALS_CREATED_OUTSIDE_REPO
REQUIRED_MARKER: TWO_MONTH_PILOT_ACCESS
REQUIRED_MARKER: READY_FOR_PHASE107_AUTHENTICATED_LIVE_TEST

## Access URLs

Login:
https://raftop-cpap-frontend.onrender.com/login

Pilot 20:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Users

- Pilot Admin
- Pilot Operations
- Pilot Viewer

## Scope

- 2 months
- maximum 20 patients
- pseudonymized CPAP data only
- no infrastructure access
- no source code access
'@

Set-Content -Path $AccessDoc -Value $AccessDocContent -Encoding UTF8

$BuyerMessageContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Buyer Delivery Message

REQUIRED_MARKER: PHASE106_BUYER_DELIVERY_MESSAGE
REQUIRED_MARKER: SEND_CREDENTIALS_SEPARATELY
REQUIRED_MARKER: PILOT20_COMMERCIAL_TRIAL

Message to send:

Η πλατφόρμα RAFTOP CPAP CARE Pro είναι έτοιμη για controlled pilot 2 μηνών.

Σας δίνω πρόσβαση σε ξεχωριστό Pilot 20 περιβάλλον, όπου μπορείτε να καταχωρήσετε έως 20 ψευδωνυμοποιημένους CPAP ασθενείς και να δείτε στην πράξη:

- 80 Hours Compliance
- ATLAS priority queue
- ασθενείς κάτω από το όριο των 80 ωρών
- υψηλό AHI
- υψηλό leak
- management εικόνα του CPAP portfolio

Login:
https://raftop-cpap-frontend.onrender.com/login

Pilot 20:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

Τα στοιχεία πρόσβασης θα σταλούν ξεχωριστά.

Για το pilot δεν χρειάζονται ονόματα, στοιχεία επικοινωνίας, αριθμοί ταυτοποίησης ή άμεσα αναγνωριστικά ασθενών. Χρησιμοποιούμε μόνο patient code, device serial και CPAP usage metrics.
'@

Set-Content -Path $BuyerMessageDoc -Value $BuyerMessageContent -Encoding UTF8

$SecurityDocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Security Lock

REQUIRED_MARKER: PHASE106_PILOT20_SECURITY_LOCK
REQUIRED_MARKER: PILOT20_ROUTE_PROTECTED
REQUIRED_MARKER: PILOT20_TENANT_ONLY
REQUIRED_MARKER: NO_CREDENTIALS_IN_REPO

## Security

Pilot20 API routes require authenticated access.

Health endpoint may remain public for monitoring.

Pilot users belong to:
raftopoulos-pilot-20

Credentials are stored outside the repository.

## Boundary

Buyer receives application access only.

Not delivered:
- source code
- repository access
- infrastructure access
- database access
- platform super admin access
'@

Set-Content -Path $SecurityDoc -Value $SecurityDocContent -Encoding UTF8

foreach ($Doc in @($AccessDoc, $BuyerMessageDoc, $SecurityDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase106 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase106 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE106_PILOT20_USER_ACCESS_PACK",
    "PILOT20_USERS_CREATED",
    "CREDENTIALS_CREATED_OUTSIDE_REPO",
    "TWO_MONTH_PILOT_ACCESS",
    "READY_FOR_PHASE107_AUTHENTICATED_LIVE_TEST",
    "PHASE106_BUYER_DELIVERY_MESSAGE",
    "SEND_CREDENTIALS_SEPARATELY",
    "PILOT20_COMMERCIAL_TRIAL",
    "PHASE106_PILOT20_SECURITY_LOCK",
    "PILOT20_ROUTE_PROTECTED",
    "PILOT20_TENANT_ONLY",
    "NO_CREDENTIALS_IN_REPO"
)) {
    $Found = $false
    foreach ($Doc in @($AccessDoc, $BuyerMessageDoc, $SecurityDoc)) {
        if (ContainsText (Read-FileSafe $Doc) $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required Phase106 marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required Phase106 marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$GeneratedDocs = (Read-FileSafe $AccessDoc) + (Read-FileSafe $BuyerMessageDoc) + (Read-FileSafe $SecurityDoc)
foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)) {
    if (ContainsText $GeneratedDocs $Forbidden) {
        Add-Result ("Forbidden secret absent from Phase106 docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from Phase106 docs: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE106_PILOT20_USER_ACCESS_PACK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE106_PILOT20_USER_ACCESS_PACK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE106_PILOT20_USER_ACCESS_PACK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 106 Pilot20 User Access Pack"
Write-Host "============================================================"
Write-Host ""
Write-Host "Credentials file outside repo:"
Write-Host $CredentialFile
Write-Host ""
Write-Host "Docs:"
Write-Host $AccessDoc
Write-Host $BuyerMessageDoc
Write-Host $SecurityDoc
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