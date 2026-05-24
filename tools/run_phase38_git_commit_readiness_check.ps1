# RAFTOP CPAP CARE Pro
# Phase 38.5 - Git Commit Readiness Check
# Safe ASCII-only script
# Does not print secret values.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase38_git_commit_readiness_check_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Details
    )

    if ($Status -eq "PASS") {
        $script:PassCount++
    } elseif ($Status -eq "WARN") {
        $script:WarnCount++
    } else {
        $script:FailCount++
    }

    Write-ReportLine ("CHECK: " + $Name)
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Name)
}

function Run-Git {
    param([string[]]$Args)

    Push-Location $Root

    try {
        $Output = & git @Args 2>&1
        $Code = $LASTEXITCODE
    } catch {
        $Output = $_.Exception.Message
        $Code = 1
    }

    Pop-Location

    return @{
        Code = $Code
        Output = $Output
    }
}

function Test-GitAvailable {
    try {
        $null = git --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
    } catch {
    }

    return $false
}

function Get-RelativePath {
    param([string]$FullPath)
    return $FullPath.Replace($Root + "\", "")
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.5 Git Commit Readiness Check" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This check verifies whether the repository is safe and ready for a controlled Git commit before production deployment."
Write-ReportLine "No secret values are printed."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Git commit readiness check..."
Write-Host ""

$GitAvailable = Test-GitAvailable

if ($GitAvailable) {
    Add-Result "Git available" "PASS" "Git command is available."
} else {
    Add-Result "Git available" "FAIL" "Git command is not available."
}

$GitDir = Join-Path $Root ".git"

if (Test-Path $GitDir) {
    Add-Result "Git repository detected" "PASS" ".git directory exists."
} else {
    Add-Result "Git repository detected" "FAIL" "No .git directory found."
}

if ($GitAvailable -and (Test-Path $GitDir)) {
    $BranchResult = Run-Git @("branch", "--show-current")
    $Branch = ($BranchResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($Branch)) {
        Add-Result "Current branch" "WARN" "Could not determine current branch."
    } else {
        Add-Result "Current branch" "PASS" ("Current branch: " + $Branch)
    }

    $RemoteResult = Run-Git @("remote", "-v")
    $RemoteText = ($RemoteResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($RemoteText)) {
        Add-Result "Git remote" "WARN" "No Git remote configured."
    } else {
        Add-Result "Git remote" "PASS" "Git remote is configured."
        Write-ReportLine "REMOTE_OUTPUT:"
        Write-ReportLine $RemoteText
        Write-ReportLine ""
    }

    $StatusResult = Run-Git @("status", "--short")
    $StatusText = ($StatusResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($StatusText)) {
        Add-Result "Working tree status" "PASS" "Working tree is clean."
    } else {
        Add-Result "Working tree status" "WARN" "There are uncommitted changes. Review before commit."
        Write-ReportLine "GIT_STATUS_SHORT:"
        Write-ReportLine $StatusText
        Write-ReportLine ""
    }

    $TrackedEnvResult = Run-Git @("ls-files")
    $TrackedFiles = @($TrackedEnvResult.Output)

    $TrackedEnvFiles = $TrackedFiles | Where-Object {
        $_ -eq ".env" -or
        $_ -like "*.env" -or
        $_ -like "*/.env" -or
        $_ -like "*.env.production" -or
        $_ -like "*/.env.production" -or
        $_ -like "*.env.prod" -or
        $_ -like "*/.env.prod" -or
        $_ -like "*.env.live" -or
        $_ -like "*/.env.live"
    }

    $AllowedEnvExamples = $TrackedFiles | Where-Object {
        $_ -like "*.env.example" -or
        $_ -like "*.env.production.example" -or
        $_ -like "*/.env.example" -or
        $_ -like "*/.env.production.example"
    }

    if ($TrackedEnvFiles.Count -gt 0) {
        $BadList = ($TrackedEnvFiles -join "; ")
        Add-Result "Tracked env secrets" "FAIL" ("Tracked env-like files found: " + $BadList)
    } else {
        Add-Result "Tracked env secrets" "PASS" "No tracked real env files found."
    }

    if ($AllowedEnvExamples.Count -gt 0) {
        Add-Result "Tracked env examples" "PASS" ("Env example files are allowed: " + ($AllowedEnvExamples -join "; "))
    } else {
        Add-Result "Tracked env examples" "WARN" "No env example files tracked. This is not fatal, but templates are useful."
    }

    $SubmoduleResult = Run-Git @("submodule", "status")
    $SubmoduleText = ($SubmoduleResult.Output | Out-String).Trim()

    if ([string]::IsNullOrWhiteSpace($SubmoduleText)) {
        Add-Result "Git submodules" "PASS" "No submodules reported."
    } else {
        Add-Result "Git submodules" "WARN" "Submodules detected. Verify they do not contain secrets."
        Write-ReportLine "SUBMODULE_STATUS:"
        Write-ReportLine $SubmoduleText
        Write-ReportLine ""
    }

    $GitIgnorePath = Join-Path $Root ".gitignore"

    if (Test-Path $GitIgnorePath) {
        $GitIgnoreContent = Get-Content -Path $GitIgnorePath -ErrorAction SilentlyContinue

        $RequiredRules = @(".env", ".env.*", "!.env.example", "!.env.production.example")
        $MissingRules = @()

        foreach ($Rule in $RequiredRules) {
            if ($GitIgnoreContent -notcontains $Rule) {
                $MissingRules += $Rule
            }
        }

        if ($MissingRules.Count -gt 0) {
            Add-Result "Gitignore env protection" "FAIL" ("Missing .gitignore rules: " + ($MissingRules -join "; "))
        } else {
            Add-Result "Gitignore env protection" "PASS" "Required env protection rules exist."
        }
    } else {
        Add-Result "Gitignore env protection" "FAIL" ".gitignore file is missing."
    }
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE38_GIT_COMMIT_READINESS_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE38_GIT_COMMIT_READINESS_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE38_GIT_COMMIT_READINESS_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.5 Git Commit Readiness Check"
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