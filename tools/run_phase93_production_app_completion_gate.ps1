# RAFTOP CPAP CARE Pro
# Phase 93 - Production App Completion Gate
# Checks if the actual app is ready for production activation.
# This is not a buyer/sales package gate. This is technical delivery gate.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"

$FrontendDir = Join-Path $Root "enterprise-frontend"
$BackendDir = Join-Path $Root "enterprise-backend"
$ToolsDir = Join-Path $Root "tools"
$DocsDir = Join-Path $Root "docs\production-activation"

$FrontendPackage = Join-Path $FrontendDir "package.json"
$BackendPackage = Join-Path $BackendDir "package.json"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase93_production_app_completion_gate_" + $Timestamp + ".md")
$CompletionDoc = Join-Path $DocsDir "93_PRODUCTION_APP_COMPLETION_STATUS.md"

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

function Test-PathExists {
    param([string]$Name, [string]$Path)

    if (Test-Path $Path) {
        Add-Result $Name "PASS" ("Found: " + $Path)
    } else {
        Add-Result $Name "FAIL" ("Missing: " + $Path)
    }
}

function Search-CodeMarker {
    param(
        [string]$Name,
        [string]$Directory,
        [string]$Pattern,
        [string[]]$Extensions
    )

    if (!(Test-Path $Directory)) {
        Add-Result $Name "FAIL" ("Directory missing: " + $Directory)
        return
    }

    $Files = Get-ChildItem -Path $Directory -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $Extensions -contains $_.Extension.ToLower() }

    $Matches = @()

    foreach ($File in $Files) {
        $Content = Read-FileSafe $File.FullName
        if (ContainsText $Content $Pattern) {
            $Matches += $File.FullName
        }
    }

    if ($Matches.Count -gt 0) {
        Add-Result $Name "PASS" ("Found in: " + (($Matches | Select-Object -First 5) -join "; "))
    } else {
        Add-Result $Name "FAIL" ("Pattern not found: " + $Pattern)
    }
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

    Add-Result $Name "FAIL" ("Latest report exists but final status is not acceptable: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 93 Production App Completion Gate" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: verify actual production app readiness before giving the app to buyer." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 93 - Production App Completion Gate..."
Write-Host ""

# Previous final sale gates
Check-ReportStatus "Phase 90 final master sale lock status" "phase90_final_master_sale_ready_lock_*.md" @(
    "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY",
    "PHASE90_FINAL_MASTER_SALE_READY_LOCK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 91 negotiation pack status" "phase91_buyer_send_meeting_negotiation_control_pack_*.md" @(
    "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY",
    "PHASE91_BUYER_SEND_MEETING_NEGOTIATION_CONTROL_PACK_READY_WITH_WARNINGS"
)

Check-ReportStatus "Phase 92 release tag gate status" "phase92_final_sale_ready_release_tag_gate_*.md" @(
    "PHASE92_FINAL_SALE_READY_RELEASE_TAG_GATE_READY",
    "PHASE92_FINAL_SALE_READY_RELEASE_TAG_GATE_READY_WITH_WARNINGS"
)

# Project structure
Test-PathExists "Frontend folder exists" $FrontendDir
Test-PathExists "Backend folder exists" $BackendDir
Test-PathExists "Frontend package.json exists" $FrontendPackage
Test-PathExists "Backend package.json exists" $BackendPackage

# Core frontend markers
Search-CodeMarker "Frontend has buyer route/view" $FrontendDir "raftopoulos-buyer-view" @(".js", ".jsx", ".ts", ".tsx", ".html")
Search-CodeMarker "Frontend has login route/page" $FrontendDir "login" @(".js", ".jsx", ".ts", ".tsx", ".html")
Search-CodeMarker "Frontend has patient module" $FrontendDir "Patient" @(".js", ".jsx", ".ts", ".tsx")
Search-CodeMarker "Frontend has ATLAS module" $FrontendDir "ATLAS" @(".js", ".jsx", ".ts", ".tsx")
Search-CodeMarker "Frontend has compliance module" $FrontendDir "Compliance" @(".js", ".jsx", ".ts", ".tsx")
Search-CodeMarker "Frontend has doctor/clinic concept" $FrontendDir "Doctor" @(".js", ".jsx", ".ts", ".tsx")
Search-CodeMarker "Frontend has reports/dashboard concept" $FrontendDir "Reports" @(".js", ".jsx", ".ts", ".tsx")

# Core backend markers
Search-CodeMarker "Backend has health endpoint" $BackendDir "health" @(".js", ".ts", ".json")
Search-CodeMarker "Backend has auth/login logic" $BackendDir "login" @(".js", ".ts")
Search-CodeMarker "Backend has tenant logic" $BackendDir "tenant" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has patient logic" $BackendDir "patient" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has device logic" $BackendDir "device" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has task/follow-up logic" $BackendDir "task" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has ATLAS logic" $BackendDir "ATLAS" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has compliance logic" $BackendDir "compliance" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has CSV/import logic" $BackendDir "csv" @(".js", ".ts", ".sql")
Search-CodeMarker "Backend has report logic" $BackendDir "report" @(".js", ".ts", ".sql")

# ENV templates / security
Search-CodeMarker "Backend has DATABASE_URL usage" $BackendDir "DATABASE_URL" @(".js", ".ts", ".env", ".example", ".md")
Search-CodeMarker "Backend has JWT secret usage" $BackendDir "JWT" @(".js", ".ts", ".env", ".example", ".md")
Search-CodeMarker "Backend has CORS config" $BackendDir "cors" @(".js", ".ts")
Search-CodeMarker "Backend has security middleware or helmet" $BackendDir "helmet" @(".js", ".ts", ".json")

# Production external health URL
$BackendHealthUrl = $env:RAFTOP_PRODUCTION_BACKEND_HEALTH_URL
$FrontendUrl = "https://raftop-cpap-frontend.onrender.com/raftopoulos-buyer-view/"

if ([string]::IsNullOrWhiteSpace($BackendHealthUrl)) {
    Add-Result "Production backend health URL env set" "WARN" "RAFTOP_PRODUCTION_BACKEND_HEALTH_URL is not set."
} else {
    try {
        $HealthResponse = Invoke-WebRequest -Uri $BackendHealthUrl -UseBasicParsing -TimeoutSec 30

        if ($HealthResponse.StatusCode -ge 200 -and $HealthResponse.StatusCode -lt 300) {
            Add-Result "Production backend health reachable" "PASS" ("Status: " + $HealthResponse.StatusCode)
        } else {
            Add-Result "Production backend health reachable" "FAIL" ("Status: " + $HealthResponse.StatusCode)
        }
    } catch {
        Add-Result "Production backend health reachable" "FAIL" ("Could not reach backend health: " + $_.Exception.Message)
    }
}

try {
    $FrontendResponse = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 30

    if ($FrontendResponse.StatusCode -ge 200 -and $FrontendResponse.StatusCode -lt 300) {
        Add-Result "Buyer frontend URL reachable" "PASS" ("Status: " + $FrontendResponse.StatusCode)
    } else {
        Add-Result "Buyer frontend URL reachable" "FAIL" ("Status: " + $FrontendResponse.StatusCode)
    }

    if (ContainsText $FrontendResponse.Content "RAFTOP CPAP CARE Pro") {
        Add-Result "Buyer frontend content marker" "PASS" "RAFTOP marker found."
    } else {
        Add-Result "Buyer frontend content marker" "FAIL" "RAFTOP marker missing."
    }
} catch {
    Add-Result "Buyer frontend URL reachable" "FAIL" ("Could not reach buyer URL: " + $_.Exception.Message)
}

# Git status
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean" "WARN" "Working tree has generated files or pending changes."
}

$CompletionContent = @'
# RAFTOP CPAP CARE Pro - Production App Completion Status

REQUIRED_MARKER: PHASE93_PRODUCTION_APP_COMPLETION_STATUS
REQUIRED_MARKER: REAL_APP_DELIVERY_MODE
REQUIRED_MARKER: PRODUCTION_ACTIVATION_NEXT
REQUIRED_MARKER: NO_REAL_PATIENT_IMPORT_BEFORE_DPA

## Meaning

This status marks the switch from buyer/sales package to actual production application delivery.

## What must be completed before giving operational access

1. Backend health verified.
2. Production DB/schema verified.
3. Raftopoulos tenant created.
4. Tenant admin user created.
5. Operations users created.
6. Viewer user created.
7. Credentials delivered separately.
8. CSV validator run on real approved CSV.
9. 100-row controlled import.
10. 500-row controlled import.
11. 2000-row controlled import.
12. 7000-row controlled import.
13. Final production smoke test.
14. Buyer production handover signoff.

## Hard stop

No real patient import before commercial agreement, GDPR/DPA, CSV validation, and stage signoff.
'@

Set-Content -Path $CompletionDoc -Value $CompletionContent -Encoding UTF8

if (Test-Path $CompletionDoc) {
    Add-Result "Completion status doc created" "PASS" $CompletionDoc
} else {
    Add-Result "Completion status doc created" "FAIL" $CompletionDoc
}

foreach ($Marker in @(
    "PHASE93_PRODUCTION_APP_COMPLETION_STATUS",
    "REAL_APP_DELIVERY_MODE",
    "PRODUCTION_ACTIVATION_NEXT",
    "NO_REAL_PATIENT_IMPORT_BEFORE_DPA"
)) {
    $Content = Read-FileSafe $CompletionDoc
    if (ContainsText $Content $Marker) {
        Add-Result ("Completion marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Completion marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE93_PRODUCTION_APP_COMPLETION_GATE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE93_PRODUCTION_APP_COMPLETION_GATE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE93_PRODUCTION_APP_COMPLETION_GATE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 93 Production App Completion Gate"
Write-Host "============================================================"
Write-Host ""
Write-Host "Completion doc:"
Write-Host $CompletionDoc
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