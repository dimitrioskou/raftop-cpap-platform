$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"

$Checks = @(
    @{
        Name = "Pre Demo Check"
        Path = Join-Path $ProjectRoot "tools\raftop_pre_demo_check.ps1"
    },
    @{
        Name = "Phase 25 Operational Intelligence"
        Path = Join-Path $ProjectRoot "tools\verify_phase25_operational_intelligence.ps1"
    },
    @{
        Name = "Phase 26 Frontend Live Binding"
        Path = Join-Path $ProjectRoot "tools\verify_phase26_frontend_live_binding.ps1"
    },
    @{
        Name = "Phase 27 Executive Metrics"
        Path = Join-Path $ProjectRoot "tools\verify_phase27_executive_metrics.ps1"
    }
)

$Failures = 0
$Warnings = 0
$Results = @()

function Write-Section($Title) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor DarkGray
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "RAFTOP CPAP CARE Pro - Final Commercial Demo Gate" -ForegroundColor White
Write-Host "Project: $ProjectRoot" -ForegroundColor Gray
Write-Host ""

foreach ($check in $Checks) {
    Write-Section $check.Name

    if (-not (Test-Path $check.Path)) {
        Write-Host "[FAIL] Script not found: $($check.Path)" -ForegroundColor Red
        $Failures += 1

        $Results += [PSCustomObject]@{
            Check = $check.Name
            Status = "FAILED"
            Detail = "Script not found"
        }

        continue
    }

    try {
        & $check.Path
        $exitCode = $LASTEXITCODE

        if ($exitCode -eq 0) {
            Write-Host "[OK] $($check.Name) completed" -ForegroundColor Green

            $Results += [PSCustomObject]@{
                Check = $check.Name
                Status = "READY"
                Detail = "Exit code 0"
            }
        }
        else {
            Write-Host "[FAIL] $($check.Name) exit code: $exitCode" -ForegroundColor Red
            $Failures += 1

            $Results += [PSCustomObject]@{
                Check = $check.Name
                Status = "FAILED"
                Detail = "Exit code $exitCode"
            }
        }
    }
    catch {
        Write-Host "[FAIL] $($check.Name) crashed: $($_.Exception.Message)" -ForegroundColor Red
        $Failures += 1

        $Results += [PSCustomObject]@{
            Check = $check.Name
            Status = "FAILED"
            Detail = $_.Exception.Message
        }
    }
}

Write-Section "Final Gate Summary"

$Results | Format-Table -AutoSize

Write-Host ""
Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failures: $Failures" -ForegroundColor $(if ($Failures -eq 0) { "Green" } else { "Red" })

if ($Failures -eq 0) {
    Write-Host ""
    Write-Host "FINAL STATUS: COMMERCIAL_DEMO_READY" -ForegroundColor Green
    Write-Host "The local RAFTOP CPAP CARE Pro environment is ready for controlled executive demo." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "FINAL STATUS: COMMERCIAL_DEMO_BLOCKED" -ForegroundColor Red
Write-Host "Fix failed checks before presenting." -ForegroundColor Red
exit 1