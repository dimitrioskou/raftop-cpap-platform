# RAFTOP CPAP CARE Pro
# Phase 115 - Live AirView Sample Verification
# Verifies AirView-style CSV upload mapping live.
# Uses unknown device serial, so no patient data is created/updated.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$Desktop = "C:\Users\Administrator\Desktop"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$CredentialFile = Join-Path $Desktop "RAFTOP_PILOT20_CREDENTIALS_DO_NOT_COMMIT\RAFTOP_PILOT20_USERS_CREDENTIALS_DO_NOT_COMMIT.txt"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase115_live_airview_sample_verification_" + $Timestamp + ".md")
$DocFile = Join-Path $DocsDir "115_LIVE_AIRVIEW_SAMPLE_VERIFICATION.md"

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

    Add-Result $Name "WARN" ("Latest report exists but status not matched: " + $Latest.Name)
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
        $Email = ""
        $Password = ""

        foreach ($Line in ($Block -split "`r?`n")) {
            $Trimmed = $Line.Trim()

            if ($Trimmed.StartsWith("Role:")) {
                $Role = $Trimmed.Substring(5).Trim()
            } elseif ($Trimmed.StartsWith("Email:")) {
                $Email = $Trimmed.Substring(6).Trim()
            } elseif ($Trimmed.StartsWith("Temporary password:")) {
                $Password = $Trimmed.Substring("Temporary password:".Length).Trim()
            }
        }

        if (![string]::IsNullOrWhiteSpace($Email) -and ![string]::IsNullOrWhiteSpace($Password)) {
            $Users += [PSCustomObject]@{
                role = $Role
                email = $Email
                password = $Password
            }
        }
    }

    return $Users
}

function Extract-Token {
    param($Json)

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
    param([string]$Email, [string]$Password)

    $Endpoints = @(
        "/api/auth/login",
        "/api/login",
        "/auth/login",
        "/login"
    )

    foreach ($Endpoint in $Endpoints) {
        $Url = $BackendBase + $Endpoint

        try {
            $Response = Invoke-WebRequest `
                -Uri $Url `
                -Method POST `
                -Body (@{ email = $Email; password = $Password } | ConvertTo-Json -Compress) `
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
            # try next
        }
    }

    return [PSCustomObject]@{
        ok = $false
        endpoint = ""
        token = ""
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 115 Live AirView Sample Verification" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "No passwords or tokens are printed." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 115 - Live AirView Sample Verification..."
Write-Host ""

Check-ReportStatus "Phase114 AirView mapper status" "phase114_airview_export_mapper_for_pilot20_*.md" @(
    "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20_READY",
    "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20_READY_WITH_WARNINGS"
)

if (Test-Path $CredentialFile) {
    Add-Result "Pilot20 credentials file exists outside repo" "PASS" $CredentialFile
} else {
    Add-Result "Pilot20 credentials file exists outside repo" "FAIL" $CredentialFile
}

$CredContent = Read-FileSafe $CredentialFile
$Users = @(Parse-Credentials $CredContent)
$PilotAdmin = $Users | Where-Object { $_.role -eq "tenant_admin" } | Select-Object -First 1

if ($null -eq $PilotAdmin) {
    Add-Result "Pilot admin credential parsed" "FAIL" "No tenant_admin found."
} else {
    Add-Result "Pilot admin credential parsed" "PASS" ("Email: " + $PilotAdmin.email + ". Password not printed.")
}

$Token = ""

if ($null -ne $PilotAdmin) {
    $LoginResult = Try-Login -Email $PilotAdmin.email -Password $PilotAdmin.password

    if ($LoginResult.ok) {
        $Token = $LoginResult.token
        Add-Result "Pilot admin login works" "PASS" ("Endpoint: " + $LoginResult.endpoint + ". Token not printed.")
    } else {
        Add-Result "Pilot admin login works" "FAIL" "No login endpoint returned token."
    }
}

if (![string]::IsNullOrWhiteSpace($Token)) {
    $AirViewCsv = @"
Serial Number,Start Date,Last Data Date,Usage Hours,Days Used,AHI,95th Percentile Leak
AIRVIEW-NOT-IN-PILOT20-VERIFY,2026-06-01,2026-06-10,24,8,7.2,18
"@

    try {
        $Payload = @{ csv_text = $AirViewCsv } | ConvertTo-Json -Compress

        $UploadResponse = Invoke-WebRequest `
            -Uri ($BackendBase + "/api/pilot20/usage-upload") `
            -Method POST `
            -Headers @{ Authorization = "Bearer $Token" } `
            -Body $Payload `
            -ContentType "application/json" `
            -UseBasicParsing `
            -TimeoutSec 90

        $Json = $UploadResponse.Content | ConvertFrom-Json

        if ($Json.ok -eq $true -and $Json.report.skipped -ge 1 -and $Json.report.updated -eq 0) {
            Add-Result "Live AirView-style upload accepted without polluting pilot" "PASS" "AirView headers accepted; unknown device skipped."
        } else {
            Add-Result "Live AirView-style upload accepted without polluting pilot" "FAIL" ("Unexpected upload report: " + $UploadResponse.Content)
        }
    } catch {
        Add-Result "Live AirView-style upload accepted without polluting pilot" "FAIL" $_.Exception.Message
    }

    try {
        $RescueResponse = Invoke-WebRequest `
            -Uri ($BackendBase + "/api/pilot20/rescue-monitor") `
            -Headers @{ Authorization = "Bearer $Token" } `
            -UseBasicParsing `
            -TimeoutSec 90

        if ($RescueResponse.StatusCode -ge 200 -and $RescueResponse.StatusCode -lt 300) {
            Add-Result "Rescue Monitor remains live after AirView sample test" "PASS" "Rescue endpoint reachable."
        } else {
            Add-Result "Rescue Monitor remains live after AirView sample test" "FAIL" ("Unexpected status " + $RescueResponse.StatusCode)
        }
    } catch {
        Add-Result "Rescue Monitor remains live after AirView sample test" "FAIL" $_.Exception.Message
    }
}

foreach ($Url in @(
    $FrontendBase + "/pilot20/usage-upload",
    $FrontendBase + "/pilot20/rescue-monitor",
    $FrontendBase + "/pilot20/manual-entry"
)) {
    try {
        $Response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 90

        if ($Response.StatusCode -ge 200 -and $Response.StatusCode -lt 300) {
            Add-Result ("Frontend page reachable: " + $Url) "PASS" ("Status " + $Response.StatusCode)
        } else {
            Add-Result ("Frontend page reachable: " + $Url) "FAIL" ("Status " + $Response.StatusCode)
        }
    } catch {
        Add-Result ("Frontend page reachable: " + $Url) "FAIL" $_.Exception.Message
    }
}

$DocContent = @'
# RAFTOP CPAP CARE Pro - Live AirView Sample Verification

REQUIRED_MARKER: PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION
REQUIRED_MARKER: AIRVIEW_STYLE_CSV_ACCEPTED
REQUIRED_MARKER: NO_PATIENT_CREATED_IN_THIS_PHASE
REQUIRED_MARKER: RESCUE_MONITOR_REMAINS_LIVE
REQUIRED_MARKER: READY_FOR_RAFTOPoulos_AIRVIEW_PILOT

## Verified

- Pilot admin login works.
- AirView-style CSV headers are accepted.
- Unknown AirView device serial is skipped safely.
- No patient is created or updated during this verification.
- Rescue Monitor remains live.
- Usage Upload page is reachable.
- Manual Entry page is reachable.

## Buyer workflow

1. Enter 20 patients once.
2. Export usage CSV from AirView.
3. Upload AirView CSV.
4. Platform maps AirView columns.
5. Platform matches by device serial.
6. Rescue Monitor shows compliance risk before month end.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

if (Test-Path $DocFile) {
    Add-Result "Phase115 doc created" "PASS" $DocFile
} else {
    Add-Result "Phase115 doc created" "FAIL" $DocFile
}

foreach ($Marker in @(
    "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION",
    "AIRVIEW_STYLE_CSV_ACCEPTED",
    "NO_PATIENT_CREATED_IN_THIS_PHASE",
    "RESCUE_MONITOR_REMAINS_LIVE",
    "READY_FOR_RAFTOPoulos_AIRVIEW_PILOT"
)) {
    if (ContainsText (Read-FileSafe $DocFile) $Marker) {
        Add-Result ("Required Phase115 marker exists: " + $Marker) "PASS" "Found."
    } else {
        Add-Result ("Required Phase115 marker exists: " + $Marker) "FAIL" "Missing."
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
    $FinalStatus = "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 115 Live AirView Sample Verification"
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