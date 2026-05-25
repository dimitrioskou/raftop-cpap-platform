# RAFTOP CPAP CARE Pro
# Phase 41.12B - Login Failure Diagnostic
# Safe ASCII-only script
# Tests /api/auth/login response shapes without printing password or token.

param(
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com",
    [string]$TenantId = "raftopoulos-live",
    [string]$AdminEmail = "dimitrisgelly@gmail.com"
)

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase41_login_failure_diagnostic_" + $Timestamp + ".md")

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Normalize-Url {
    param([string]$Url)
    if ([string]::IsNullOrWhiteSpace($Url)) {
        return ""
    }
    return $Url.Trim().TrimEnd("/")
}

function Mask-ResponseBody {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return ""
    }

    $Masked = $Body

    $Masked = $Masked -replace '"token"\s*:\s*"[^"]+"', '"token":"[HIDDEN]"'
    $Masked = $Masked -replace '"accessToken"\s*:\s*"[^"]+"', '"accessToken":"[HIDDEN]"'
    $Masked = $Masked -replace '"access_token"\s*:\s*"[^"]+"', '"access_token":"[HIDDEN]"'
    $Masked = $Masked -replace '"jwt"\s*:\s*"[^"]+"', '"jwt":"[HIDDEN]"'
    $Masked = $Masked -replace '"password"\s*:\s*"[^"]+"', '"password":"[HIDDEN]"'
    $Masked = $Masked -replace '"password_hash"\s*:\s*"[^"]+"', '"password_hash":"[HIDDEN]"'

    if ($Masked.Length -gt 2000) {
        $Masked = $Masked.Substring(0, 2000) + "...[TRUNCATED]"
    }

    return $Masked
}

function Invoke-Login {
    param(
        [string]$Url,
        [hashtable]$Headers,
        [hashtable]$Body
    )

    $Result = @{
        Code = $null
        Body = ""
        Error = ""
    }

    try {
        $JsonBody = $Body | ConvertTo-Json -Depth 10
        $Response = Invoke-WebRequest -Uri $Url -Method POST -Headers $Headers -Body $JsonBody -ContentType "application/json" -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop
        $Result.Code = [int]$Response.StatusCode
        $Result.Body = $Response.Content
    } catch {
        if ($_.Exception.Response -ne $null) {
            try {
                $Result.Code = [int]$_.Exception.Response.StatusCode.value__
                try {
                    $Reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $Result.Body = $Reader.ReadToEnd()
                } catch {
                    $Result.Body = ""
                }
            } catch {
                $Result.Error = $_.Exception.Message
            }
        } else {
            $Result.Error = $_.Exception.Message
        }
    }

    return $Result
}

function Extract-TokenSignal {
    param([string]$Body)

    if ([string]::IsNullOrWhiteSpace($Body)) {
        return "NO_BODY"
    }

    try {
        $Json = $Body | ConvertFrom-Json -ErrorAction Stop
    } catch {
        return "NON_JSON_BODY"
    }

    $Candidates = @(
        $Json.token,
        $Json.accessToken,
        $Json.access_token,
        $Json.jwt,
        $Json.authToken,
        $Json.data.token,
        $Json.data.accessToken,
        $Json.data.access_token
    )

    foreach ($Candidate in $Candidates) {
        if (![string]::IsNullOrWhiteSpace($Candidate)) {
            if ([string]$Candidate -match "^\s*$") {
                continue
            }
            return "TOKEN_FOUND"
        }
    }

    return "NO_TOKEN_IN_KNOWN_FIELDS"
}

$BackendUrl = Normalize-Url $BackendUrl
$AdminPassword = $env:RAFTOP_BOOTSTRAP_ADMIN_PASSWORD

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 41.12B Login Failure Diagnostic" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "Backend:"
Write-ReportLine $BackendUrl
Write-ReportLine ""
Write-ReportLine "Tenant:"
Write-ReportLine $TenantId
Write-ReportLine ""
Write-ReportLine "Admin email:"
Write-ReportLine $AdminEmail
Write-ReportLine ""
Write-ReportLine "Password printed:"
Write-ReportLine "NO"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running Phase 41.12B login failure diagnostic..."
Write-Host ""

if ([string]::IsNullOrWhiteSpace($AdminPassword)) {
    Write-Host "FAIL - Admin password env missing"
    Write-ReportLine "CHECK: Admin password env"
    Write-ReportLine "STATUS: FAIL"
    Write-ReportLine "DETAILS: RAFTOP_BOOTSTRAP_ADMIN_PASSWORD is missing."
    Write-ReportLine ""
    Write-ReportLine "FINAL STATUS: PHASE41_LOGIN_FAILURE_DIAGNOSTIC_FAILED"
    Write-Host "FINAL STATUS: PHASE41_LOGIN_FAILURE_DIAGNOSTIC_FAILED"
    exit 1
}

$LoginUrl = $BackendUrl + "/api/auth/login"

$Headers = @{
    "x-tenant-id" = $TenantId
}

$Attempts = @(
    @{
        Name = "tenantId payload plus x-tenant-id"
        Headers = $Headers
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenantId = $TenantId
        }
    },
    @{
        Name = "tenant_id payload plus x-tenant-id"
        Headers = $Headers
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenant_id = $TenantId
        }
    },
    @{
        Name = "x-tenant-id only"
        Headers = $Headers
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
        }
    },
    @{
        Name = "no tenant header tenantId payload"
        Headers = @{}
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenantId = $TenantId
        }
    },
    @{
        Name = "no tenant header tenant_id payload"
        Headers = @{}
        Body = @{
            email = $AdminEmail
            password = $AdminPassword
            tenant_id = $TenantId
        }
    }
)

$AnyToken = $false
$Any200 = $false

foreach ($Attempt in $Attempts) {
    $Result = Invoke-Login $LoginUrl $Attempt.Headers $Attempt.Body
    $TokenSignal = Extract-TokenSignal $Result.Body
    $MaskedBody = Mask-ResponseBody $Result.Body

    if ($Result.Code -eq 200) {
        $Any200 = $true
    }

    if ($TokenSignal -eq "TOKEN_FOUND") {
        $AnyToken = $true
    }

    Write-Host ("ATTEMPT - " + $Attempt.Name + " => HTTP " + $Result.Code + " / " + $TokenSignal)

    Write-ReportLine ("ATTEMPT: " + $Attempt.Name)
    Write-ReportLine ("HTTP_STATUS: " + $Result.Code)
    Write-ReportLine ("TOKEN_SIGNAL: " + $TokenSignal)

    if (![string]::IsNullOrWhiteSpace($Result.Error)) {
        Write-ReportLine ("ERROR: " + $Result.Error)
    }

    Write-ReportLine "SANITIZED_RESPONSE_BODY:"
    Write-ReportLine $MaskedBody
    Write-ReportLine ""
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "INTERPRETATION"
Write-ReportLine ""

if ($AnyToken) {
    Write-ReportLine "At least one login attempt returned a token. The E2E token extraction or payload mapping should be adjusted."
    $FinalStatus = "PHASE41_LOGIN_FAILURE_DIAGNOSTIC_TOKEN_FOUND"
    $ExitCode = 0
} elseif ($Any200) {
    Write-ReportLine "Login returned HTTP 200 but no token in known fields. Backend auth response shape must be mapped or fixed."
    $FinalStatus = "PHASE41_LOGIN_FAILURE_DIAGNOSTIC_200_NO_TOKEN"
    $ExitCode = 0
} else {
    Write-ReportLine "Login did not return HTTP 200. Backend auth logic, password hash, tenant lookup, or route implementation must be fixed."
    $FinalStatus = "PHASE41_LOGIN_FAILURE_DIAGNOSTIC_AUTH_FAILED"
    $ExitCode = 1
}

Write-ReportLine ""
Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)

exit $ExitCode