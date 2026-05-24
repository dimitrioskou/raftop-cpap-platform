# RAFTOP CPAP CARE Pro
# Phase 38.2 - Production Preflight Verification Script Generator
# Safe ASCII-only script

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ToolsDir = Join-Path $Root "tools"
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ToolsDir)) {
    New-Item -ItemType Directory -Path $ToolsDir | Out-Null
}

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase38_production_preflight_verification_script_" + $Timestamp + ".md")
$VerifierPath = Join-Path $ToolsDir "run_phase38_production_preflight_verification.ps1"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function WReport {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function WScript {
    param([string]$Text)
    Add-Content -Path $VerifierPath -Value $Text -Encoding UTF8
}

Set-Content -Path $VerifierPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification" -Encoding UTF8

WScript '$ErrorActionPreference = "Continue"'
WScript ''
WScript '$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)'
WScript '$ReportsDir = Join-Path $Root "reports"'
WScript 'if (!(Test-Path $ReportsDir)) {'
WScript '    New-Item -ItemType Directory -Path $ReportsDir | Out-Null'
WScript '}'
WScript ''
WScript '$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"'
WScript '$ReportPath = Join-Path $ReportsDir ("phase38_production_preflight_verification_result_" + $Timestamp + ".md")'
WScript '$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"'
WScript ''
WScript '$script:PassCount = 0'
WScript '$script:WarnCount = 0'
WScript '$script:FailCount = 0'
WScript ''
WScript 'function R {'
WScript '    param([string]$Text)'
WScript '    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8'
WScript '}'
WScript ''
WScript 'function Add-CheckResult {'
WScript '    param('
WScript '        [string]$Name,'
WScript '        [string]$Status,'
WScript '        [string]$Details'
WScript '    )'
WScript ''
WScript '    if ($Status -eq "PASS") { $script:PassCount++ }'
WScript '    elseif ($Status -eq "WARN") { $script:WarnCount++ }'
WScript '    else { $script:FailCount++ }'
WScript ''
WScript '    R ("CHECK: " + $Name)'
WScript '    R ("STATUS: " + $Status)'
WScript '    R ("DETAILS: " + $Details)'
WScript '    R ""'
WScript ''
WScript '    Write-Host ($Status + " - " + $Name)'
WScript '}'
WScript ''
WScript 'function Test-RequiredFile {'
WScript '    param('
WScript '        [string]$RelativePath,'
WScript '        [string]$Name'
WScript '    )'
WScript '    $FullPath = Join-Path $Root $RelativePath'
WScript '    if (Test-Path $FullPath) {'
WScript '        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)'
WScript '    } else {'
WScript '        Add-CheckResult $Name "FAIL" ("Missing required file: " + $RelativePath)'
WScript '    }'
WScript '}'
WScript ''
WScript 'function Test-OptionalFile {'
WScript '    param('
WScript '        [string]$RelativePath,'
WScript '        [string]$Name'
WScript '    )'
WScript '    $FullPath = Join-Path $Root $RelativePath'
WScript '    if (Test-Path $FullPath) {'
WScript '        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)'
WScript '    } else {'
WScript '        Add-CheckResult $Name "WARN" ("Optional file missing: " + $RelativePath)'
WScript '    }'
WScript '}'
WScript ''
WScript 'function Test-RequiredDirectory {'
WScript '    param('
WScript '        [string]$RelativePath,'
WScript '        [string]$Name'
WScript '    )'
WScript '    $FullPath = Join-Path $Root $RelativePath'
WScript '    if (Test-Path $FullPath) {'
WScript '        Add-CheckResult $Name "PASS" ("Found: " + $RelativePath)'
WScript '    } else {'
WScript '        Add-CheckResult $Name "FAIL" ("Missing required directory: " + $RelativePath)'
WScript '    }'
WScript '}'
WScript ''
WScript 'Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification Result" -Encoding UTF8'
WScript 'R ""'
WScript 'R ("Generated: " + $Now)'
WScript 'R ""'
WScript 'R "PURPOSE"'
WScript 'R ""'
WScript 'R "This local preflight verifies that the project contains the required files before production deployment execution begins."'
WScript 'R ""'
WScript 'R "------------------------------------------------------------"'
WScript 'R ""'
WScript ''
WScript 'Write-Host ""'
WScript 'Write-Host "Running RAFTOP production preflight verification..."'
WScript 'Write-Host ""'
WScript ''
WScript 'Test-RequiredDirectory "enterprise-backend" "Backend directory"'
WScript 'Test-RequiredDirectory "enterprise-frontend" "Frontend directory"'
WScript 'Test-RequiredDirectory "tools" "Tools directory"'
WScript 'Test-RequiredDirectory "reports" "Reports directory"'
WScript ''
WScript 'Test-RequiredFile "enterprise-backend\package.json" "Backend package.json"'
WScript 'Test-RequiredFile "enterprise-backend\src\server.js" "Backend server entry"'
WScript 'Test-OptionalFile "enterprise-backend\.env.production.example" "Backend production env example"'
WScript ''
WScript 'Test-RequiredFile "enterprise-frontend\package.json" "Frontend package.json"'
WScript 'Test-OptionalFile "enterprise-frontend\.env.production.example" "Frontend production env example"'
WScript ''
WScript 'Test-RequiredFile "tools\generate_phase36_production_readiness_summary.ps1" "Phase 36.5 production readiness summary generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_production_deployment_master_checklist.ps1" "Phase 37.1 deployment master checklist generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_render_backend_deployment_guide.ps1" "Phase 37.2 backend deployment guide generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_production_postgresql_setup_guide.ps1" "Phase 37.3 production PostgreSQL guide generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_frontend_deployment_guide.ps1" "Phase 37.4 frontend deployment guide generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_production_environment_checklist.ps1" "Phase 37.5 production environment checklist generator"'
WScript 'Test-RequiredFile "tools\generate_phase37_production_smoke_test_script.ps1" "Phase 37.6 smoke test generator"'
WScript 'Test-RequiredFile "tools\run_phase37_production_smoke_test.ps1" "Phase 37.6 smoke test runner"'
WScript 'Test-RequiredFile "tools\generate_phase37_go_live_checklist.ps1" "Phase 37.7 go-live checklist generator"'
WScript 'Test-RequiredFile "tools\generate_phase38_production_deployment_execution_pack.ps1" "Phase 38.1 deployment execution pack generator"'
WScript ''
WScript 'R "------------------------------------------------------------"'
WScript 'R ""'
WScript 'R ("PASS_COUNT: " + $script:PassCount)'
WScript 'R ("WARN_COUNT: " + $script:WarnCount)'
WScript 'R ("FAIL_COUNT: " + $script:FailCount)'
WScript 'R ""'
WScript ''
WScript 'if ($script:FailCount -gt 0) {'
WScript '    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_FAILED"'
WScript '    $ExitCode = 1'
WScript '} elseif ($script:WarnCount -gt 0) {'
WScript '    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_READY_WITH_WARNINGS"'
WScript '    $ExitCode = 0'
WScript '} else {'
WScript '    $FinalStatus = "PHASE38_PRODUCTION_PREFLIGHT_READY"'
WScript '    $ExitCode = 0'
WScript '}'
WScript ''
WScript 'R ("FINAL STATUS: " + $FinalStatus)'
WScript ''
WScript 'Write-Host ""'
WScript 'Write-Host "============================================================"'
WScript 'Write-Host "RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification"'
WScript 'Write-Host "============================================================"'
WScript 'Write-Host ""'
WScript 'Write-Host "Report created:"'
WScript 'Write-Host $ReportPath'
WScript 'Write-Host ""'
WScript 'Write-Host ("PASS_COUNT: " + $script:PassCount)'
WScript 'Write-Host ("WARN_COUNT: " + $script:WarnCount)'
WScript 'Write-Host ("FAIL_COUNT: " + $script:FailCount)'
WScript 'Write-Host ""'
WScript 'Write-Host ("FINAL STATUS: " + $FinalStatus)'
WScript 'Write-Host ""'
WScript 'exit $ExitCode'

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification Script" -Encoding UTF8

WReport ""
WReport ("Generated: " + $Now)
WReport ""
WReport "FINAL STATUS"
WReport ""
WReport "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_VERIFICATION_SCRIPT_READY"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "PURPOSE"
WReport ""
WReport "This phase creates a local production preflight verification script."
WReport ""
WReport "Generated verifier:"
WReport $VerifierPath
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "WHAT THE VERIFIER CHECKS"
WReport ""
WReport "- backend directory"
WReport "- frontend directory"
WReport "- tools directory"
WReport "- reports directory"
WReport "- backend package.json"
WReport "- backend server entry"
WReport "- backend production env example"
WReport "- frontend package.json"
WReport "- frontend production env example"
WReport "- Phase 36.5 production readiness summary generator"
WReport "- Phase 37 deployment guides and scripts"
WReport "- Phase 38 deployment execution pack generator"
WReport "- smoke test runner presence"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "HOW TO RUN"
WReport ""
WReport ".\tools\run_phase38_production_preflight_verification.ps1"
WReport ""
WReport "Expected result if all required files exist:"
WReport ""
WReport "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_READY"
WReport ""
WReport "Acceptable result if only optional files are missing:"
WReport ""
WReport "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_READY_WITH_WARNINGS"
WReport ""
WReport "Not acceptable:"
WReport ""
WReport "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_FAILED"
WReport ""
WReport "------------------------------------------------------------"
WReport ""
WReport "FINAL VERDICT"
WReport ""
WReport "The production preflight verification script has been created."
WReport ""
WReport "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_VERIFICATION_SCRIPT_READY"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.2 Production Preflight Verification Script"
Write-Host "============================================================"
Write-Host ""
Write-Host "Verifier script created:"
Write-Host $VerifierPath
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "FINAL STATUS: PHASE38_PRODUCTION_PREFLIGHT_VERIFICATION_SCRIPT_READY"
Write-Host ""