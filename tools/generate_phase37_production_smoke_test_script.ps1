# RAFTOP CPAP CARE Pro
# Phase 37.6 - Production Smoke Test Script Generator
# Safe ASCII-only script

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $Root "tools"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

if (!(Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase37_production_smoke_test_script_" + $Timestamp + ".md")
$SmokeScriptPath = Join-Path $ToolsDir "run_phase37_production_smoke_test.ps1"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function WReport {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function WScript {
    param([string]$Text)
    Add-Content -Path $SmokeScriptPath -Value $Text -Encoding UTF8
}

Set-Content -Path $SmokeScriptPath -Value "# RAFTOP CPAP CARE Pro - Production Smoke Test" -Encoding UTF8

WScript 'param('
WScript '    [string]$BackendUrl = $env:RAFTOP_PRODUCTION_BACKEND_URL,'
WScript '    [string]$TenantId = "raftopoulos-live",'
WScript '    [switch]$AllowLocalhost'
WScript ')'
WScript ''
WScript '$ErrorActionPreference = "Continue"'
WScript ''
WScript '$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)'
WScript '$ReportsDir = Join-Path $Root "reports"'
WScript 'if (!(Test-Path $ReportsDir)) {'
WScript '    New-Item -ItemType Directory -Path $ReportsDir | Out-Null'
WScript '}'
WScript ''
WScript '$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"'
WScript '$ReportPath = Join-Path $ReportsDir ("phase37_production_smoke_test_result_" + $Timestamp + ".md")'
WScript '$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"'
WScript ''
WScript 'function R {'
WScript '    param([string]$Text)'
WScript '    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8'
WScript '}'
WScript ''
WScript 'function Normalize-Url {'
WScript '    param([string]$Url)'
WScript '    if ([string]::IsNullOrWhiteSpace($Url)) { return "" }'
WScript '    return $Url.Trim().TrimEnd("/")'
WScript '}'
WScript ''
WScript 'function Finish-SmokeTest {'
WScript '    param('
WScript '        [string]$Status,'
WScript '        [int]$ExitCode'
WScript '    )'
WScript '    R ""'
WScript '    R ("FINAL STATUS: " + $Status)'
WScript '    Write-Host ""'
WScript '    Write-Host "============================================================"'
WScript '    Write-Host "RAFTOP CPAP CARE Pro - Production Smoke Test"'
WScript '    Write-Host "============================================================"'
WScript '    Write-Host ""'
WScript '    Write-Host "Report created:"'
WScript '    Write-Host $ReportPath'
WScript '    Write-Host ""'
WScript '    Write-Host ("FINAL STATUS: " + $Status)'
WScript '    Write-Host ""'
WScript '    exit $ExitCode'
WScript '}'
WScript ''
WScript '$BackendUrl = Normalize-Url $BackendUrl'
WScript ''
WScript 'Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 37.6 Production Smoke Test Result" -Encoding UTF8'
WScript 'R ""'
WScript 'R ("Generated: " + $Now)'
WScript 'R ""'
WScript 'R ("BackendUrl: " + $BackendUrl)'
WScript 'R ("TenantId: " + $TenantId)'
WScript 'R ""'
WScript 'R "------------------------------------------------------------"'
WScript 'R ""'
WScript ''
WScript 'if ([string]::IsNullOrWhiteSpace($BackendUrl)) {'
WScript '    R "Backend URL was not provided."'
WScript '    R ""'
WScript '    R "Run example:"'
WScript '    R ".\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live"'
WScript '    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_NEEDS_BACKEND_URL" 2'
WScript '}'
WScript ''
WScript '$IsLocalhost = (($BackendUrl -match "localhost") -or ($BackendUrl -match "127.0.0.1"))'
WScript 'if ($IsLocalhost -and -not $AllowLocalhost) {'
WScript '    R "Localhost backend URL blocked for production smoke test."'
WScript '    R "Use -AllowLocalhost only for local preflight testing."'
WScript '    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_BLOCKED_LOCALHOST_URL" 2'
WScript '}'
WScript ''
WScript '$script:PassCount = 0'
WScript '$script:WarnCount = 0'
WScript '$script:FailCount = 0'
WScript ''
WScript 'function Test-SmokeEndpoint {'
WScript '    param('
WScript '        [string]$Name,'
WScript '        [string]$Path,'
WScript '        [string]$Method,'
WScript '        [string]$Mode'
WScript '    )'
WScript ''
WScript '    $Url = $BackendUrl + $Path'
WScript '    $Code = $null'
WScript '    $ErrorText = ""'
WScript ''
WScript '    $Headers = @{ "x-tenant-id" = $TenantId }'
WScript ''
WScript '    try {'
WScript '        if ($Method -eq "POST") {'
WScript '            $Response = Invoke-WebRequest -Uri $Url -Method POST -Headers $Headers -ContentType "application/json" -Body "{}" -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop'
WScript '        } else {'
WScript '            $Response = Invoke-WebRequest -Uri $Url -Method GET -Headers $Headers -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop'
WScript '        }'
WScript '        $Code = [int]$Response.StatusCode'
WScript '    } catch {'
WScript '        if ($_.Exception.Response -ne $null) {'
WScript '            try {'
WScript '                $Code = [int]$_.Exception.Response.StatusCode.value__'
WScript '            } catch {'
WScript '                $ErrorText = $_.Exception.Message'
WScript '            }'
WScript '        } else {'
WScript '            $ErrorText = $_.Exception.Message'
WScript '        }'
WScript '    }'
WScript ''
WScript '    $Result = "FAIL"'
WScript '    $Reason = ""'
WScript ''
WScript '    if ($Mode -eq "Health") {'
WScript '        if ($Code -eq 200) {'
WScript '            $Result = "PASS"'
WScript '            $Reason = "Health endpoint returned 200."'
WScript '        } else {'
WScript '            $Reason = "Health endpoint did not return 200."'
WScript '        }'
WScript '    } elseif ($Mode -eq "RouteExists") {'
WScript '        if ($Code -in @(200, 400, 401, 403, 405)) {'
WScript '            $Result = "PASS"'
WScript '            $Reason = "Route exists and returned an acceptable status."'
WScript '        } else {'
WScript '            $Reason = "Route may be missing or broken."'
WScript '        }'
WScript '    } elseif ($Mode -eq "Protected") {'
WScript '        if ($Code -in @(200, 401, 403)) {'
WScript '            $Result = "PASS"'
WScript '            $Reason = "Protected route exists and returned acceptable protected response."'
WScript '        } else {'
WScript '            $Reason = "Protected route returned unacceptable status."'
WScript '        }'
WScript '    } elseif ($Mode -eq "Optional") {'
WScript '        if ($Code -in @(200, 401, 403)) {'
WScript '            $Result = "PASS"'
WScript '            $Reason = "Optional route exists."'
WScript '        } elseif ($Code -eq 404) {'
WScript '            $Result = "WARN"'
WScript '            $Reason = "Optional route not found."'
WScript '        } else {'
WScript '            $Result = "WARN"'
WScript '            $Reason = "Optional route returned warning status."'
WScript '        }'
WScript '    }'
WScript ''
WScript '    if ($Code -eq $null) {'
WScript '        $Reason = "No HTTP status. " + $ErrorText'
WScript '    }'
WScript ''
WScript '    if ($Result -eq "PASS") { $script:PassCount++ }'
WScript '    elseif ($Result -eq "WARN") { $script:WarnCount++ }'
WScript '    else { $script:FailCount++ }'
WScript ''
WScript '    R ("CHECK: " + $Name)'
WScript '    R ("URL: " + $Url)'
WScript '    R ("STATUS_CODE: " + $Code)'
WScript '    R ("RESULT: " + $Result)'
WScript '    R ("REASON: " + $Reason)'
WScript '    R ""'
WScript ''
WScript '    Write-Host ($Result + " - " + $Name + " - " + $Code)'
WScript '}'
WScript ''
WScript 'Write-Host ""'
WScript 'Write-Host "Running RAFTOP production smoke test..."'
WScript 'Write-Host ("BackendUrl: " + $BackendUrl)'
WScript 'Write-Host ("TenantId: " + $TenantId)'
WScript 'Write-Host ""'
WScript ''
WScript 'Test-SmokeEndpoint "Backend health" "/api/health" "GET" "Health"'
WScript 'Test-SmokeEndpoint "Auth login route" "/api/auth/login" "POST" "RouteExists"'
WScript 'Test-SmokeEndpoint "Tenant subscription route" "/api/tenant/subscription/status" "GET" "Protected"'
WScript 'Test-SmokeEndpoint "Tenant patients route" "/api/tenant/patients" "GET" "Protected"'
WScript 'Test-SmokeEndpoint "Tenant devices route" "/api/tenant/devices" "GET" "Protected"'
WScript 'Test-SmokeEndpoint "ATLAS summary route" "/api/tenant/atlas/summary" "GET" "Protected"'
WScript 'Test-SmokeEndpoint "Optional security command center route" "/api/tenant/security/command-center" "GET" "Optional"'
WScript ''
WScript 'R "------------------------------------------------------------"'
WScript 'R ""'
WScript 'R ("PASS_COUNT: " + $script:PassCount)'
WScript 'R ("WARN_COUNT: " + $script:WarnCount)'
WScript 'R ("FAIL_COUNT: " + $script:FailCount)'
WScript 'R ""'
WScript ''
WScript 'if ($script:FailCount -gt 0) {'
WScript '    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_FAILED" 1'
WScript '} elseif ($script:WarnCount -gt 0) {'
WScript '    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_READY_WITH_WARNINGS" 0'
WScript '} else {'
WScript '    Finish-SmokeTest "PHASE37_PRODUCTION_SMOKE_TEST_PASSED" 0'
WScript '}'

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 37.6 Production Smoke Test Script" -Encoding UTF8

WReport ""
WReport ("Generated: " + $Now)
WReport ""
WReport "FINAL STATUS"
WReport ""
WReport "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_SCRIPT_READY"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "PURPOSE"
WReport ""
WReport "This phase creates the production smoke test script for RAFTOP CPAP CARE Pro."
WReport ""
WReport "Generated smoke test script:"
WReport $SmokeScriptPath
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "WHAT THE SMOKE TEST CHECKS"
WReport ""
WReport "- backend health endpoint"
WReport "- auth login route availability"
WReport "- tenant subscription route availability"
WReport "- patients route availability"
WReport "- devices route availability"
WReport "- ATLAS summary route availability"
WReport "- optional security command center route availability"
WReport "- protected route behavior"
WReport "- localhost blocking for production tests"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "HOW TO RUN AFTER PRODUCTION BACKEND EXISTS"
WReport ""
WReport ".\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live"
WReport ""
WReport "For local preflight only:"
WReport ""
WReport ".\tools\run_phase37_production_smoke_test.ps1 -BackendUrl http://localhost:5001 -TenantId demo-tenant -AllowLocalhost"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "IMPORTANT"
WReport ""
WReport "A 401 or 403 response is acceptable for protected routes."
WReport "A 404 response is not acceptable for required production routes."
WReport "A 500 response is not acceptable."
WReport "The health endpoint must return 200."
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "FINAL VERDICT"
WReport ""
WReport "The production smoke test script has been created."
WReport ""
WReport "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_SCRIPT_READY"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 37.6 Production Smoke Test Script"
Write-Host "============================================================"
Write-Host ""
Write-Host "Smoke test script created:"
Write-Host $SmokeScriptPath
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "FINAL STATUS: PHASE37_PRODUCTION_SMOKE_TEST_SCRIPT_READY"
Write-Host ""