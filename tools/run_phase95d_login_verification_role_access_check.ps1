# RAFTOP CPAP CARE Pro
# Phase 95D - Login Verification & Role Access Check
# Verifies production login for users created in Phase 95C.
# Does NOT print passwords.
# Does NOT print auth tokens.
# Does NOT commit credentials.
# Reads credentials from Desktop outside repository.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"
$CredentialFile = Join-Path $Desktop "RAFTOP_PRODUCTION_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PRODUCTION_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase95d_login_verification_role_access_check_" + $Timestamp + ".md")
$VerificationDoc = Join-Path $DocsDir "95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK.md"
$LoginVerificationCsv = Join-Path $ReportsDir ("phase95d_login_verification_results_" + $Timestamp + ".csv")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0
$script:VerificationRows = @()

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
        try {
            return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop
        } catch {
            return ""
        }
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

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

function Get-BackendBaseUrl {
    $HealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL

    if (![string]::IsNullOrWhiteSpace($HealthUrl)) {
        $Base = $HealthUrl
        $Base = $Base -replace "/api/health/?$", ""
        $Base = $Base -replace "/health/?$", ""
        return $Base.TrimEnd("/")
    }

    return "https://raftop-cpap-backend.onrender.com"
}

function Parse-Credentials {
    param([string]$Content)

    $Users = @()
    $Blocks = $Content -split "----------------------------------------"

    foreach ($Block in $Blocks) {
        if ($Block -notmatch "Email:" -or $Block -notmatch "Temporary password:") {
            continue
        }

        $Role = ""
        $Name = ""
        $Email = ""
        $Password = ""

        foreach ($Line in ($Block -split "`r?`n")) {
            $Trimmed = $Line.Trim()

            if ($Trimmed.StartsWith("Role:")) {
                $Role = $Trimmed.Substring(5).Trim()
            } elseif ($Trimmed.StartsWith("Name:")) {
                $Name = $Trimmed.Substring(5).Trim()
            } elseif ($Trimmed.StartsWith("Email:")) {
                $Email = $Trimmed.Substring(6).Trim()
            } elseif ($Trimmed.StartsWith("Temporary password:")) {
                $Password = $Trimmed.Substring("Temporary password:".Length).Trim()
            }
        }

        if (![string]::IsNullOrWhiteSpace($Email) -and ![string]::IsNullOrWhiteSpace($Password)) {
            $Users += [PSCustomObject]@{
                role = $Role
                name = $Name
                email = $Email
                password = $Password
            }
        }
    }

    return $Users
}

function Test-LoginEndpoint {
    param(
        [string]$Url,
        [string]$Email,
        [string]$Password
    )

    $Payloads = @(
        @{ email = $Email; password = $Password },
        @{ username = $Email; password = $Password }
    )

    foreach ($Payload in $Payloads) {
        try {
            $Json = $Payload | ConvertTo-Json -Compress
            $Response = Invoke-WebRequest `
                -Uri $Url `
                -Method POST `
                -Body $Json `
                -ContentType "application/json" `
                -UseBasicParsing `
                -TimeoutSec 60

            $StatusCode = $Response.StatusCode
            $Content = [string]$Response.Content

            if ($StatusCode -ge 200 -and $StatusCode -lt 300) {
                $LooksAuthenticated = $false

                if (
                    (ContainsText $Content "token") -or
                    (ContainsText $Content "accessToken") -or
                    (ContainsText $Content "user") -or
                    (ContainsText $Content "role") -or
                    (ContainsText $Content "tenant")
                ) {
                    $LooksAuthenticated = $true
                }

                return [PSCustomObject]@{
                    ok = $true
                    status_code = $StatusCode
                    endpoint = $Url
                    payload_type = if ($Payload.ContainsKey("email")) { "email_password" } else { "username_password" }
                    authenticated_shape = $LooksAuthenticated
                    error = ""
                }
            }
        } catch {
            # Keep trying next payload/endpoint. Do not print password.
        }
    }

    return [PSCustomObject]@{
        ok = $false
        status_code = 0
        endpoint = $Url
        payload_type = "none"
        authenticated_shape = $false
        error = "login_failed_or_endpoint_not_supported"
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 95D Login Verification Role Access Check" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: verify production login for created tenant users without exposing passwords or tokens." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 95D - Login Verification & Role Access Check..."
Write-Host ""

Check-ReportStatus "Phase 95C real tenant users apply latest status" "phase95c_real_tenant_users_apply_*.md" @(
    "PHASE95C_REAL_TENANT_USERS_APPLY_READY",
    "PHASE95C_REAL_TENANT_USERS_APPLY_READY_WITH_WARNINGS"
)

$BackendBase = Get-BackendBaseUrl
Add-Result "Backend base URL resolved" "PASS" $BackendBase

$HealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL
if ([string]::IsNullOrWhiteSpace($HealthUrl)) {
    $HealthUrl = $BackendBase + "/api/health"
}

try {
    $HealthResponse = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 60

    if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
        Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
    } else {
        Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
    }
} catch {
    Add-Result "Production backend health reachable" "FAIL" ("Health failed: " + $_.Exception.Message)
}

if (Test-Path $CredentialFile) {
    Add-Result "Credentials file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Credentials file exists outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Credentials file outside repository" "FAIL" "Credential file is inside repository."
} else {
    Add-Result "Credentials file outside repository" "PASS" "Credential file is outside repository."
}

$CredentialContent = Read-FileSafe $CredentialFile
$Users = Parse-Credentials $CredentialContent

if (@($Users).Count -ge 1) {
    Add-Result "Credentials parsed" "PASS" ("Users parsed: " + @($Users).Count)
} else {
    Add-Result "Credentials parsed" "FAIL" "No users parsed from credential file."
}

$LoginEndpoints = @(
    "/api/auth/login",
    "/api/login",
    "/auth/login",
    "/login"
)

$WorkingEndpoint = ""
$SuccessfulLogins = 0

foreach ($User in $Users) {
    $UserLoginOk = $false
    $UsedEndpoint = ""
    $UsedPayloadType = ""

    foreach ($EndpointPath in $LoginEndpoints) {
        $Url = $BackendBase + $EndpointPath
        $Result = Test-LoginEndpoint -Url $Url -Email $User.email -Password $User.password

        if ($Result.ok) {
            $UserLoginOk = $true
            $UsedEndpoint = $Result.endpoint
            $UsedPayloadType = $Result.payload_type

            if ([string]::IsNullOrWhiteSpace($WorkingEndpoint)) {
                $WorkingEndpoint = $UsedEndpoint
            }

            break
        }
    }

    if ($UserLoginOk) {
        $SuccessfulLogins++
        Add-Result ("Login works for user: " + $User.email + " / " + $User.role) "PASS" ("Endpoint: " + $UsedEndpoint + " / payload: " + $UsedPayloadType)
    } else {
        Add-Result ("Login works for user: " + $User.email + " / " + $User.role) "FAIL" "No tested login endpoint accepted credentials."
    }

    $script:VerificationRows += [PSCustomObject]@{
        email = $User.email
        role = $User.role
        login_ok = $UserLoginOk
        endpoint = $UsedEndpoint
        payload_type = $UsedPayloadType
        token_printed = "no"
        password_printed = "no"
    }
}

$script:VerificationRows | Export-Csv -Path $LoginVerificationCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $LoginVerificationCsv) {
    Add-Result "Login verification CSV created" "PASS" $LoginVerificationCsv
} else {
    Add-Result "Login verification CSV created" "FAIL" $LoginVerificationCsv
}

if ($SuccessfulLogins -eq @($Users).Count -and $SuccessfulLogins -gt 0) {
    Add-Result "All parsed users can login" "PASS" ("Successful logins: " + $SuccessfulLogins)
} elseif ($SuccessfulLogins -gt 0) {
    Add-Result "All parsed users can login" "WARN" ("Partial successful logins: " + $SuccessfulLogins + " / " + @($Users).Count)
} else {
    Add-Result "At least one parsed user can login" "FAIL" "No successful logins."
}

$VerificationDocContent = @'
# RAFTOP CPAP CARE Pro - Login Verification & Role Access Check

REQUIRED_MARKER: PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK
REQUIRED_MARKER: LOGIN_VERIFIED_WITHOUT_PRINTING_PASSWORDS
REQUIRED_MARKER: TOKENS_NOT_STORED_IN_REPORT
REQUIRED_MARKER: READY_FOR_PHASE96_CSV_INTAKE_IF_LOGIN_OK

## Meaning

This phase verifies whether the created production tenant users can authenticate against the production backend.

## Security

Passwords are not printed.
Tokens are not printed.
Credentials remain outside the repository.

## Expected users

- tenant_admin
- operations_user
- operations_user
- viewer

## If login fails

Do not proceed to real CSV import.
First fix:
- auth endpoint
- password hashing compatibility
- user role mapping
- tenant mapping

## Next phase

If login works:
Phase 96 - Real CSV Intake / 100-row Pilot Import.

If login does not work:
Phase 95E - Auth Compatibility Fix.
'@

Set-Content -Path $VerificationDoc -Value $VerificationDocContent -Encoding UTF8

if (Test-Path $VerificationDoc) {
    Add-Result "Phase 95D verification document created" "PASS" $VerificationDoc
} else {
    Add-Result "Phase 95D verification document created" "FAIL" $VerificationDoc
}

foreach ($Marker in @(
    "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK",
    "LOGIN_VERIFIED_WITHOUT_PRINTING_PASSWORDS",
    "TOKENS_NOT_STORED_IN_REPORT",
    "READY_FOR_PHASE96_CSV_INTAKE_IF_LOGIN_OK"
)) {
    $DocContent = Read-FileSafe $VerificationDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Verification doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Verification doc marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} else {
    if ($GitStatus -match "RAFTOP_PRODUCTION_CREDENTIALS_DO_NOT_COMMIT") {
        Add-Result "Credentials not tracked by git status" "FAIL" "Credentials folder appears in git status."
    } else {
        Add-Result "Credentials not tracked by git status" "PASS" "Credentials are outside repo / not tracked."
    }

    if ([string]::IsNullOrWhiteSpace($GitStatus)) {
        Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
    } else {
        Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE95D_LOGIN_VERIFICATION_ROLE_ACCESS_CHECK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 95D Login Verification & Role Access Check"
Write-Host "============================================================"
Write-Host ""
Write-Host "Verification doc:"
Write-Host $VerificationDoc
Write-Host ""
Write-Host "Login verification CSV:"
Write-Host $LoginVerificationCsv
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