# RAFTOP CPAP CARE Pro
# Phase 38.4 - Repository Warning Review and Git Tracking Guard
# Safe ASCII-only script
# Does not print secret values. It prints only file paths and line numbers.

$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase38_repository_warning_review_" + $Timestamp + ".md")
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-ReviewResult {
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

function Get-RelativePath {
    param([string]$FullPath)
    return $FullPath.Replace($Root + "\", "")
}

function Get-ProjectFiles {
    $Dirs = @("enterprise-backend", "enterprise-frontend")
    $Files = @()

    foreach ($Dir in $Dirs) {
        $FullDir = Join-Path $Root $Dir

        if (Test-Path $FullDir) {
            $Files += Get-ChildItem -Path $FullDir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
                $_.FullName -notmatch "\\node_modules\\" -and
                $_.FullName -notmatch "\\build\\" -and
                $_.FullName -notmatch "\\dist\\" -and
                $_.FullName -notmatch "\\coverage\\" -and
                $_.Extension -in @(".js", ".jsx", ".ts", ".tsx", ".json", ".env", ".example", ".md", ".html")
            }
        }
    }

    return $Files
}

function Find-Matches {
    param(
        [array]$Files,
        [string]$Pattern
    )

    $Matches = @()

    foreach ($File in $Files) {
        try {
            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue
            if ($Result) {
                $Matches += $Result
            }
        } catch {
        }
    }

    return $Matches
}

function Format-MatchLocations {
    param([array]$Matches)

    if ($Matches.Count -eq 0) {
        return "No matches."
    }

    $Max = [Math]::Min($Matches.Count, 15)
    $Items = @()

    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = Get-RelativePath $Matches[$i].Path
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }

    if ($Matches.Count -gt 15) {
        $Items += ("... plus " + ($Matches.Count - 15) + " more")
    }

    return ($Items -join "; ")
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

function Test-GitRepo {
    $GitDir = Join-Path $Root ".git"
    return (Test-Path $GitDir)
}

function Test-GitIgnored {
    param([string]$RelativePath)

    Push-Location $Root
    try {
        git check-ignore -q -- $RelativePath
        if ($LASTEXITCODE -eq 0) {
            Pop-Location
            return $true
        }
    } catch {
    }

    Pop-Location
    return $false
}

function Test-GitTracked {
    param([string]$RelativePath)

    Push-Location $Root
    try {
        git ls-files --error-unmatch $RelativePath 1>$null 2>$null
        if ($LASTEXITCODE -eq 0) {
            Pop-Location
            return $true
        }
    } catch {
    }

    Pop-Location
    return $false
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.4 Repository Warning Review" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This review checks whether repository safety scan warnings are controlled before deployment."
Write-ReportLine "No secret values are printed."
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP repository warning review..."
Write-Host ""

$GitAvailable = Test-GitAvailable
$GitRepo = Test-GitRepo

if ($GitAvailable) {
    Add-ReviewResult "Git available" "PASS" "Git command is available."
} else {
    Add-ReviewResult "Git available" "WARN" "Git command is not available. Tracking checks cannot be fully verified."
}

if ($GitRepo) {
    Add-ReviewResult "Git repository detected" "PASS" ".git directory exists."
} else {
    Add-ReviewResult "Git repository detected" "WARN" "No .git directory found. This may be a local copy not initialized as Git repo."
}

$EnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    $_.Name -eq ".env"
}

if ($EnvFiles.Count -eq 0) {
    Add-ReviewResult "Local .env file presence" "PASS" "No local .env files found."
} else {
    $EnvList = (($EnvFiles | ForEach-Object { Get-RelativePath $_.FullName }) -join "; ")
    Add-ReviewResult "Local .env file presence" "WARN" ("Local .env files exist: " + $EnvList)

    if ($GitAvailable -and $GitRepo) {
        foreach ($EnvFile in $EnvFiles) {
            $Relative = Get-RelativePath $EnvFile.FullName
            $IsIgnored = Test-GitIgnored $Relative
            $IsTracked = Test-GitTracked $Relative

            if ($IsTracked) {
                Add-ReviewResult ("Git tracking check for " + $Relative) "FAIL" "This .env file is tracked by Git. Remove it from Git tracking immediately."
            } elseif ($IsIgnored) {
                Add-ReviewResult ("Git ignore check for " + $Relative) "PASS" "This .env file is ignored by Git."
            } else {
                Add-ReviewResult ("Git ignore check for " + $Relative) "FAIL" "This .env file is not ignored by Git."
            }
        }
    } else {
        Add-ReviewResult "Git ignore verification for .env files" "WARN" "Skipped because Git is unavailable or .git directory is missing."
    }
}

$ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")
}

if ($ProductionEnvFiles.Count -gt 0) {
    $List = (($ProductionEnvFiles | ForEach-Object { Get-RelativePath $_.FullName }) -join "; ")
    Add-ReviewResult "Production env files" "FAIL" ("Production env files still exist inside repo: " + $List)
} else {
    Add-ReviewResult "Production env files" "PASS" "No .env.production/.env.prod/.env.live files found inside repo."
}

$ProjectFiles = Get-ProjectFiles

if ($ProjectFiles.Count -gt 0) {
    Add-ReviewResult "Project file scan scope" "PASS" ("Scannable files: " + $ProjectFiles.Count)
} else {
    Add-ReviewResult "Project file scan scope" "FAIL" "No scannable project files found."
}

$LocalhostMatches = Find-Matches $ProjectFiles "localhost"
if ($LocalhostMatches.Count -gt 0) {
    Add-ReviewResult "Localhost warning review" "WARN" (Format-MatchLocations $LocalhostMatches)
} else {
    Add-ReviewResult "Localhost warning review" "PASS" "No localhost references found."
}

$LoopbackMatches = Find-Matches $ProjectFiles "127.0.0.1"
if ($LoopbackMatches.Count -gt 0) {
    Add-ReviewResult "127.0.0.1 warning review" "WARN" (Format-MatchLocations $LoopbackMatches)
} else {
    Add-ReviewResult "127.0.0.1 warning review" "PASS" "No 127.0.0.1 references found."
}

$PostgresMatches = Find-Matches $ProjectFiles "postgresql://"
if ($PostgresMatches.Count -gt 0) {
    Add-ReviewResult "PostgreSQL URL warning review" "WARN" (Format-MatchLocations $PostgresMatches)
} else {
    Add-ReviewResult "PostgreSQL URL warning review" "PASS" "No PostgreSQL URL pattern found."
}

$JwtMatches = Find-Matches $ProjectFiles "JWT_SECRET="
if ($JwtMatches.Count -gt 0) {
    Add-ReviewResult "JWT_SECRET warning review" "WARN" (Format-MatchLocations $JwtMatches)
} else {
    Add-ReviewResult "JWT_SECRET warning review" "PASS" "No JWT_SECRET= pattern found."
}

$SuperAdminMatches = Find-Matches $ProjectFiles "SUPER_ADMIN_API_KEY="
if ($SuperAdminMatches.Count -gt 0) {
    Add-ReviewResult "SUPER_ADMIN_API_KEY warning review" "WARN" (Format-MatchLocations $SuperAdminMatches)
} else {
    Add-ReviewResult "SUPER_ADMIN_API_KEY warning review" "PASS" "No SUPER_ADMIN_API_KEY= pattern found."
}

$PotentialKeyMatches = Find-Matches $ProjectFiles "sk-"
if ($PotentialKeyMatches.Count -gt 0) {
    Add-ReviewResult "Potential API key warning review" "WARN" (Format-MatchLocations $PotentialKeyMatches)
} else {
    Add-ReviewResult "Potential API key warning review" "PASS" "No sk- pattern found."
}

Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE38_REPOSITORY_WARNING_REVIEW_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE38_REPOSITORY_WARNING_REVIEW_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE38_REPOSITORY_WARNING_REVIEW_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.4 Repository Warning Review"
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