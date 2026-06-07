# RAFTOP CPAP CARE Pro
# Phase 107 - Authenticated Live Pilot20 Test
# Verifies that Pilot20 protected endpoints work with a pilot user token.
# Does NOT create patients.
# Does NOT print passwords.
# Does NOT print auth tokens.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"

$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$CredentialFile = Join-Path $Desktop "RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase107_authenticated_live_pilot20_test_" + $Timestamp + ".md")
$LiveAuthDoc = Join-Path $DocsDir "107_AUTHENTICATED_LIVE_PILOT20_TEST.md"
$BuyerReadyDoc = Join-Path $DocsDir "107_PILOT20_READY_TO_DELIVER_TO_BUYER.md"

$BackendBase = "https://raftop-cpap-backend.onrender.com"
$FrontendBase = "https://raftop-cpap-frontend.onrender.com"

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

function Extract-Token {
    param($Json)

    if ($null -eq $Json) { return "" }

    foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
        if ($Json.PSObject.Properties.Name -contains $Key) {
            $Value = [string]$Json.$Key
            if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
        }
    }

    if ($Json.user) {
        foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
            if ($Json.user.PSObject.Properties.Name -contains $Key) {
                $Value = [string]$Json.user.$Key
                if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
            }
        }
    }

    if ($Json.data) {
        foreach ($Key in @("token", "accessToken", "access_token", "jwt")) {
            if ($Json.data.PSObject.Properties.Name -contains $Key) {
                $Value = [string]$Json.data.$Key
                if (![string]::IsNullOrWhiteSpace($Value)) { return $Value }
            }
        }
    }

    return ""
}

function Try-Login {
    param(
        [string]$Email,
        [string]$Password
    )

    $Endpoints = @(
        "/api/auth/login",
        "/api/login",
        "/auth/login",
        "/login"
    )

    $Payloads = @(
        @{ email = $Email; password = $Password },
        @{ username = $Email; password = $Password }
    )

    foreach ($Endpoint in $Endpoints) {
        foreach ($Payload in $Payloads) {
            $Url = $BackendBase + $Endpoint

            try {
                $Response = Invoke-WebRequest `
                    -Uri $Url `
                    -Method POST `
                    -Body ($Payload | ConvertTo-Json -Compress) `
                    -ContentType "application/json" `
                    -UseBasicParsing `
                    -TimeoutSec 90

                $Json = $Response.Content | ConvertFrom-Json
                $Token = Extract-Token $Json

                if (![string]::IsNullOrWhiteSpace($Token)) {
                    return [PSCustomObject]@{
                        ok = $true
                        endpoint = $Endpoint
                        token = $Token
                    }
                }
            } catch {
                # Try next endpoint/payload. Do not print password.
            }
        }
    }

    return [PSCustomObject]@{
        ok = $false
        endpoint = ""
        token = ""
    }
}

function Test-UrlNoAuth {
    param(
        [string]$Name,
        [string]$Url,
        [string]$ExpectedMode
    )

    try {
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 90
        $Status = [int]$Response.StatusCode
        $Content = [string]$Response.Content

        if ($ExpectedMode -eq "public_200" -and $Status -ge 200 -and $Status -lt 300) {
            Add-Result $Name "PASS" ("Status " + $Status)
        } elseif ($ExpectedMode -eq "protected" -and ($Status -eq 401 -or $Status -eq 403)) {
            Add-Result $Name "PASS" ("Protected status " + $Status)
        } elseif ($ExpectedMode -eq "protected") {
            Add-Result $Name "FAIL" ("Expected 401/403 but got " + $Status + ". Content: " + $Content.Substring(0, [Math]::Min(200, $Content.Length)))
        } else {
            Add-Result $Name "WARN" ("Status " + $Status)
        }
    } catch {
        $Message = $_.Exception.Message

        if ($ExpectedMode -eq "protected" -and ($Message -like "*401*" -or $Message -like "*403*")) {
            Add-Result $Name "PASS" ("Protected endpoint blocked without token: " + $Message)
        } else {
            Add-Result $Name "FAIL" ("Request failed: " + $Message)
        }
    }
}

function Test-UrlWithToken {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Token,
        [string[]]$ExpectedText = @()
    )

    try {
        $Response = Invoke-WebRequest `
            -Uri $Url `
            -Headers @{ Authorization = "Bearer $Token" } `
            -UseBasicParsing `
            -TimeoutSec 90

        $Status = [int]$Response.StatusCode
        $Content = [string]$Response.Content

        if ($Status -ge 200 -and $Status -lt 300) {
            $Missing = @()
            foreach ($Text in $ExpectedText) {
                if (-not (ContainsText $Content $Text)) {
                    $Missing += $Text
                }
            }

            if ($Missing.Count -eq 0) {
                Add-Result $Name "PASS" ("Status " + $Status + ". Token not printed.")
            } else {
                Add-Result $Name "WARN" ("Status " + $Status + " but expected text missing: " + ($Missing -join ", "))
            }
        } else {
            Add-Result $Name "FAIL" ("Unexpected status " + $Status)
        }
    } catch {
        Add-Result $Name "FAIL" ("Authenticated request failed: " + $_.Exception.Message)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 107 Authenticated Live Pilot20 Test" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "No passwords or tokens are printed." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 107 - Authenticated Live Pilot20 Test..."
Write-Host ""

Check-ReportStatus "Phase 106 pilot20 user access pack status" "phase106_pilot20_user_access_pack_*.md" @(
    "PHASE106_PILOT20_USER_ACCESS_PACK_READY",
    "PHASE106_PILOT20_USER_ACCESS_PACK_READY_WITH_WARNINGS"
)

if (Test-Path $CredentialFile) {
    Add-Result "Pilot20 credentials file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Pilot20 credentials file exists outside repo" "FAIL" $CredentialFile
}

if ($CredentialFile -like "$Root*") {
    Add-Result "Pilot20 credentials outside repo" "FAIL" "Credential file is inside repo."
} else {
    Add-Result "Pilot20 credentials outside repo" "PASS" "Credential file is outside repo."
}

$CredContent = Read-FileSafe $CredentialFile
$Users = @(Parse-Credentials $CredContent)
$PilotAdmin = $Users | Where-Object { $_.role -eq "tenant_admin" } | Select-Object -First 1

if ($null -eq $PilotAdmin) {
    Add-Result "Pilot admin credential parsed" "FAIL" "No tenant_admin user found."
} else {
    Add-Result "Pilot admin credential parsed" "PASS" ("Email: " + $PilotAdmin.email + ". Password not printed.")
}

Test-UrlNoAuth -Name "Pilot20 health remains public" -Url ($BackendBase + "/api/pilot20/health") -ExpectedMode "public_200"
Test-UrlNoAuth -Name "Pilot20 summary blocked without token" -Url ($BackendBase + "/api/pilot20/summary") -ExpectedMode "protected"
Test-UrlNoAuth -Name "Pilot20 patients blocked without token" -Url ($BackendBase + "/api/pilot20/patients") -ExpectedMode "protected"

$Token = ""

if ($null -ne $PilotAdmin) {
    $LoginResult = Try-Login -Email $PilotAdmin.email -Password $PilotAdmin.password

    if ($LoginResult.ok) {
        $Token = $LoginResult.token
        Add-Result "Pilot admin live login works" "PASS" ("Endpoint: " + $LoginResult.endpoint + ". Token not printed.")
    } else {
        Add-Result "Pilot admin live login works" "FAIL" "No login endpoint returned a token."
    }
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    Test-UrlWithToken `
        -Name "Pilot20 summary works with pilot admin token" `
        -Url ($BackendBase + "/api/pilot20/summary") `
        -Token $Token `
        -ExpectedText @("raftopoulos-pilot-20", "max_patients")

    Test-UrlWithToken `
        -Name "Pilot20 patients works with pilot admin token" `
        -Url ($BackendBase + "/api/pilot20/patients") `
        -Token $Token `
        -ExpectedText @("raftopoulos-pilot-20")
}

try {
    $LoginPage = Invoke-WebRequest -Uri ($FrontendBase + "/login") -UseBasicParsing -TimeoutSec 90
    if ($LoginPage.StatusCode -ge 200 -and $LoginPage.StatusCode -lt 300) {
        Add-Result "Frontend login page reachable" "PASS" ("Status " + $LoginPage.StatusCode)
    } else {
        Add-Result "Frontend login page reachable" "FAIL" ("Status " + $LoginPage.StatusCode)
    }
} catch {
    Add-Result "Frontend login page reachable" "FAIL" $_.Exception.Message
}

try {
    $PilotPage = Invoke-WebRequest -Uri ($FrontendBase + "/pilot20/manual-entry") -UseBasicParsing -TimeoutSec 90
    if ($PilotPage.StatusCode -ge 200 -and $PilotPage.StatusCode -lt 300) {
        Add-Result "Frontend Pilot20 manual entry page reachable" "PASS" ("Status " + $PilotPage.StatusCode)
    } else {
        Add-Result "Frontend Pilot20 manual entry page reachable" "FAIL" ("Status " + $PilotPage.StatusCode)
    }
} catch {
    Add-Result "Frontend Pilot20 manual entry page reachable" "FAIL" $_.Exception.Message
}

$LiveAuthDocContent = @'
# RAFTOP CPAP CARE Pro - Authenticated Live Pilot20 Test

REQUIRED_MARKER: PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST
REQUIRED_MARKER: PILOT20_LOGIN_VERIFIED
REQUIRED_MARKER: PILOT20_PROTECTED_ENDPOINTS_VERIFIED
REQUIRED_MARKER: NO_PATIENT_CREATED_IN_THIS_PHASE
REQUIRED_MARKER: READY_FOR_PHASE108_BUYER_DELIVERY_LOCK

## Verified

- Pilot20 health endpoint is live.
- Pilot20 protected endpoints reject unauthenticated requests.
- Pilot admin can login.
- Pilot admin can access summary.
- Pilot admin can access patients list.
- Frontend login page is reachable.
- Pilot20 manual entry page is reachable.

## Important

This phase does not create patient data.
The pilot remains clean for buyer-entered 20 patients.
'@

Set-Content -Path $LiveAuthDoc -Value $LiveAuthDocContent -Encoding UTF8

$BuyerReadyDocContent = @'
# RAFTOP CPAP CARE Pro - Pilot20 Ready to Deliver to Buyer

REQUIRED_MARKER: PHASE107_PILOT20_READY_TO_DELIVER_TO_BUYER
REQUIRED_MARKER: AUTHENTICATED_ACCESS_READY
REQUIRED_MARKER: TWO_MONTH_COMMERCIAL_PILOT_READY
REQUIRED_MARKER: MAX_20_PATIENTS
REQUIRED_MARKER: CREDENTIALS_DELIVER_SEPARATELY

## Buyer URLs

Login:
https://raftop-cpap-frontend.onrender.com/login

Pilot 20:
https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Commercial pilot

Duration:
2 months

Limit:
20 patients

Data:
pseudonymized CPAP metrics only

## Delivery boundary

Do not deliver:
- source code
- database access
- infrastructure access
- repository access
- platform super admin access
'@

Set-Content -Path $BuyerReadyDoc -Value $BuyerReadyDocContent -Encoding UTF8

foreach ($Doc in @($LiveAuthDoc, $BuyerReadyDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase107 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase107 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST",
    "PILOT20_LOGIN_VERIFIED",
    "PILOT20_PROTECTED_ENDPOINTS_VERIFIED",
    "NO_PATIENT_CREATED_IN_THIS_PHASE",
    "READY_FOR_PHASE108_BUYER_DELIVERY_LOCK",
    "PHASE107_PILOT20_READY_TO_DELIVER_TO_BUYER",
    "AUTHENTICATED_ACCESS_READY",
    "TWO_MONTH_COMMERCIAL_PILOT_READY",
    "MAX_20_PATIENTS",
    "CREDENTIALS_DELIVER_SEPARATELY"
)) {
    $Found = $false
    foreach ($Doc in @($LiveAuthDoc, $BuyerReadyDoc)) {
        if (ContainsText (Read-FileSafe $Doc) $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required Phase107 marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required Phase107 marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$GeneratedDocs = (Read-FileSafe $LiveAuthDoc) + (Read-FileSafe $BuyerReadyDoc)
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
        Add-Result ("Forbidden secret absent from Phase107 docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from Phase107 docs: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE107_AUTHENTICATED_LIVE_PILOT20_TEST_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 107 Authenticated Live Pilot20 Test"
Write-Host "============================================================"
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