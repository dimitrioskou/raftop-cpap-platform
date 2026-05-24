# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v3
$ErrorActionPreference = "Continue"

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ReportsDir = Join-Path $Root "reports"
if (!(Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir | Out-Null }

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase38_repository_safety_scan_result_" + $Timestamp + ".md")
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ScanReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-ScanResult {
    param([string]$Name, [string]$Status, [string]$Details)
    if ($Status -eq "PASS") { $script:PassCount++ }
    elseif ($Status -eq "WARN") { $script:WarnCount++ }
    else { $script:FailCount++ }
    Write-ScanReportLine ("CHECK: " + $Name)
    Write-ScanReportLine ("STATUS: " + $Status)
    Write-ScanReportLine ("DETAILS: " + $Details)
    Write-ScanReportLine ""
    Write-Host ($Status + " - " + $Name)
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

function Is-ExampleOrDocFile {
    param([string]$Path)
    $Name = Split-Path $Path -Leaf
    if ($Path -match "\.md$") { return $true }
    if ($Name -match "\.example$") { return $true }
    if ($Name -eq ".env.example") { return $true }
    if ($Name -eq ".env.production.example") { return $true }
    return $false
}

function Is-LocalEnvFile {
    param([string]$Path)
    $Name = Split-Path $Path -Leaf
    if ($Name -eq ".env") { return $true }
    return $false
}

function Is-CodeOrConfigFile {
    param([string]$Path)
    $Ext = [System.IO.Path]::GetExtension($Path)
    if ($Ext -in @(".js", ".jsx", ".ts", ".tsx", ".json", ".html")) { return $true }
    return $false
}

function Find-Matches {
    param([array]$Files, [string]$Pattern)
    $Matches = @()
    foreach ($File in $Files) {
        try {
            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue
            if ($Result) { $Matches += $Result }
        } catch { }
    }
    return $Matches
}

function Format-MatchSummary {
    param([array]$Matches)
    if ($Matches.Count -eq 0) { return "No matches." }
    $Max = [Math]::Min($Matches.Count, 10)
    $Items = @()
    for ($i = 0; $i -lt $Max; $i++) {
        $Relative = $Matches[$i].Path.Replace($Root + "\", "")
        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)
    }
    if ($Matches.Count -gt 10) { $Items += ("... plus " + ($Matches.Count - 10) + " more") }
    return ($Items -join "; ")
}

function Split-PostgresMatches {
    param([array]$Matches)
    $Critical = @()
    $LocalEnv = @()
    $Example = @()
    $Other = @()
    foreach ($M in $Matches) {
        if (Is-ExampleOrDocFile $M.Path) { $Example += $M }
        elseif (Is-LocalEnvFile $M.Path) { $LocalEnv += $M }
        elseif (Is-CodeOrConfigFile $M.Path) { $Critical += $M }
        else { $Other += $M }
    }
    return @{ Critical = $Critical; LocalEnv = $LocalEnv; Example = $Example; Other = $Other }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Result v3" -Encoding UTF8
Write-ScanReportLine ""
Write-ScanReportLine ("Generated: " + $Now)
Write-ScanReportLine ""
Write-ScanReportLine "PURPOSE"
Write-ScanReportLine ""
Write-ScanReportLine "This scan checks for dangerous production deployment issues before GitHub push and Render deployment."
Write-ScanReportLine ""
Write-ScanReportLine "------------------------------------------------------------"
Write-ScanReportLine ""

Write-Host ""
Write-Host "Running RAFTOP repository safety scan v3..."
Write-Host ""

$ProjectFiles = Get-ProjectFiles
if ($ProjectFiles.Count -gt 0) { Add-ScanResult "Project files loaded" "PASS" ("Scannable files: " + $ProjectFiles.Count) }
else { Add-ScanResult "Project files loaded" "FAIL" "No scannable project files found." }

$ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")
}
if ($ProductionEnvFiles.Count -gt 0) {
    $List = (($ProductionEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")
    Add-ScanResult "Real production env files" "FAIL" ("Disallowed production env files found: " + $List)
} else { Add-ScanResult "Real production env files" "PASS" "No real production env files found." }

$LocalEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    $_.Name -eq ".env"
}
if ($LocalEnvFiles.Count -gt 0) {
    $List = (($LocalEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")
    Add-ScanResult "Local env files" "WARN" ("Local .env files exist. They must remain ignored by Git: " + $List)
} else { Add-ScanResult "Local env files" "PASS" "No local .env files found." }

$LocalhostMatches = Find-Matches $ProjectFiles "localhost"
if ($LocalhostMatches.Count -gt 0) { Add-ScanResult "Localhost references" "WARN" (Format-MatchSummary $LocalhostMatches) }
else { Add-ScanResult "Localhost references" "PASS" "No localhost references found." }

$LoopbackMatches = Find-Matches $ProjectFiles "127.0.0.1"
if ($LoopbackMatches.Count -gt 0) { Add-ScanResult "127.0.0.1 references" "WARN" (Format-MatchSummary $LoopbackMatches) }
else { Add-ScanResult "127.0.0.1 references" "PASS" "No 127.0.0.1 references found." }

$DatabaseUrlMatches = Find-Matches $ProjectFiles "postgresql://"
$DbSplit = Split-PostgresMatches $DatabaseUrlMatches
if ($DbSplit.Critical.Count -gt 0) { Add-ScanResult "Hardcoded PostgreSQL URL in code/config" "FAIL" (Format-MatchSummary $DbSplit.Critical) }
elseif ($DbSplit.LocalEnv.Count -gt 0) { Add-ScanResult "PostgreSQL URL in local env" "WARN" (Format-MatchSummary $DbSplit.LocalEnv) }
elseif ($DbSplit.Example.Count -gt 0) { Add-ScanResult "PostgreSQL URL examples/docs" "PASS" (Format-MatchSummary $DbSplit.Example) }
elseif ($DbSplit.Other.Count -gt 0) { Add-ScanResult "PostgreSQL URL in other files" "WARN" (Format-MatchSummary $DbSplit.Other) }
else { Add-ScanResult "Hardcoded PostgreSQL URL" "PASS" "No hardcoded PostgreSQL URLs found." }

$JwtMatches = Find-Matches $ProjectFiles "JWT_SECRET="
if ($JwtMatches.Count -gt 0) { Add-ScanResult "JWT_SECRET assignment review" "WARN" (Format-MatchSummary $JwtMatches) }
else { Add-ScanResult "JWT_SECRET assignment" "PASS" "No JWT_SECRET assignments found." }

$SuperAdminMatches = Find-Matches $ProjectFiles "SUPER_ADMIN_API_KEY="
if ($SuperAdminMatches.Count -gt 0) { Add-ScanResult "SUPER_ADMIN_API_KEY assignment review" "WARN" (Format-MatchSummary $SuperAdminMatches) }
else { Add-ScanResult "SUPER_ADMIN_API_KEY assignment" "PASS" "No SUPER_ADMIN_API_KEY assignments found." }

$RestoreKeyMatches = Find-Matches $ProjectFiles "RESTORE_KEY="
if ($RestoreKeyMatches.Count -gt 0) { Add-ScanResult "RESTORE_KEY assignment review" "WARN" (Format-MatchSummary $RestoreKeyMatches) }
else { Add-ScanResult "RESTORE_KEY assignment" "PASS" "No RESTORE_KEY assignments found." }

$PotentialApiKeyMatches = Find-Matches $ProjectFiles "sk-"
if ($PotentialApiKeyMatches.Count -gt 0) { Add-ScanResult "Potential API key pattern review" "WARN" (Format-MatchSummary $PotentialApiKeyMatches) }
else { Add-ScanResult "Potential API key pattern" "PASS" "No sk- pattern found." }

Write-ScanReportLine "------------------------------------------------------------"
Write-ScanReportLine ""
Write-ScanReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ScanReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ScanReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ScanReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_READY"
    $ExitCode = 0
}

Write-ScanReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v3"
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
