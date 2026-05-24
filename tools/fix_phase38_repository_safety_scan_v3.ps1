# RAFTOP CPAP CARE Pro
# Phase 38.3C - Repository Safety Scanner v3
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
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$ReportPath = Join-Path $ReportsDir ("phase38_repository_safety_scan_v3_fix_" + $Timestamp + ".md")
$RunnerPath = Join-Path $ToolsDir "run_phase38_repository_safety_scan.ps1"

function Write-FixReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Write-RunnerLine {
    param([string]$Text)
    Add-Content -Path $RunnerPath -Value $Text -Encoding UTF8
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3C Repository Safety Scanner v3 Fix" -Encoding UTF8
Write-FixReportLine ""
Write-FixReportLine ("Generated: " + $Now)
Write-FixReportLine ""

# Ensure .gitignore protects local/private env files
$GitIgnorePath = Join-Path $Root ".gitignore"
if (!(Test-Path $GitIgnorePath)) {
    Set-Content -Path $GitIgnorePath -Value "" -Encoding UTF8
}

$GitIgnoreRules = @(
".env",
".env.*",
"!.env.example",
"!.env.production.example",
"*.pem",
"*.key",
"*.p12",
"*.pfx",
"secrets/",
"private/"
)

$ExistingGitIgnore = Get-Content -Path $GitIgnorePath -ErrorAction SilentlyContinue

foreach ($Rule in $GitIgnoreRules) {
    if ($ExistingGitIgnore -notcontains $Rule) {
        Add-Content -Path $GitIgnorePath -Value $Rule -Encoding UTF8
        Write-FixReportLine ("GITIGNORE_ADDED: " + $Rule)
    }
}

# Replace scanner with v3
Set-Content -Path $RunnerPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v3" -Encoding UTF8

Write-RunnerLine '$ErrorActionPreference = "Continue"'
Write-RunnerLine ''
Write-RunnerLine '$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)'
Write-RunnerLine '$ReportsDir = Join-Path $Root "reports"'
Write-RunnerLine 'if (!(Test-Path $ReportsDir)) { New-Item -ItemType Directory -Path $ReportsDir | Out-Null }'
Write-RunnerLine ''
Write-RunnerLine '$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"'
Write-RunnerLine '$ReportPath = Join-Path $ReportsDir ("phase38_repository_safety_scan_result_" + $Timestamp + ".md")'
Write-RunnerLine '$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"'
Write-RunnerLine ''
Write-RunnerLine '$script:PassCount = 0'
Write-RunnerLine '$script:WarnCount = 0'
Write-RunnerLine '$script:FailCount = 0'
Write-RunnerLine ''
Write-RunnerLine 'function Write-ScanReportLine {'
Write-RunnerLine '    param([string]$Text)'
Write-RunnerLine '    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Add-ScanResult {'
Write-RunnerLine '    param([string]$Name, [string]$Status, [string]$Details)'
Write-RunnerLine '    if ($Status -eq "PASS") { $script:PassCount++ }'
Write-RunnerLine '    elseif ($Status -eq "WARN") { $script:WarnCount++ }'
Write-RunnerLine '    else { $script:FailCount++ }'
Write-RunnerLine '    Write-ScanReportLine ("CHECK: " + $Name)'
Write-RunnerLine '    Write-ScanReportLine ("STATUS: " + $Status)'
Write-RunnerLine '    Write-ScanReportLine ("DETAILS: " + $Details)'
Write-RunnerLine '    Write-ScanReportLine ""'
Write-RunnerLine '    Write-Host ($Status + " - " + $Name)'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Get-ProjectFiles {'
Write-RunnerLine '    $Dirs = @("enterprise-backend", "enterprise-frontend")'
Write-RunnerLine '    $Files = @()'
Write-RunnerLine '    foreach ($Dir in $Dirs) {'
Write-RunnerLine '        $FullDir = Join-Path $Root $Dir'
Write-RunnerLine '        if (Test-Path $FullDir) {'
Write-RunnerLine '            $Files += Get-ChildItem -Path $FullDir -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '                $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\build\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\dist\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\coverage\\" -and'
Write-RunnerLine '                $_.Extension -in @(".js", ".jsx", ".ts", ".tsx", ".json", ".env", ".example", ".md", ".html")'
Write-RunnerLine '            }'
Write-RunnerLine '        }'
Write-RunnerLine '    }'
Write-RunnerLine '    return $Files'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Is-ExampleOrDocFile {'
Write-RunnerLine '    param([string]$Path)'
Write-RunnerLine '    $Name = Split-Path $Path -Leaf'
Write-RunnerLine '    if ($Path -match "\.md$") { return $true }'
Write-RunnerLine '    if ($Name -match "\.example$") { return $true }'
Write-RunnerLine '    if ($Name -eq ".env.example") { return $true }'
Write-RunnerLine '    if ($Name -eq ".env.production.example") { return $true }'
Write-RunnerLine '    return $false'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Is-LocalEnvFile {'
Write-RunnerLine '    param([string]$Path)'
Write-RunnerLine '    $Name = Split-Path $Path -Leaf'
Write-RunnerLine '    if ($Name -eq ".env") { return $true }'
Write-RunnerLine '    return $false'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Is-CodeOrConfigFile {'
Write-RunnerLine '    param([string]$Path)'
Write-RunnerLine '    $Ext = [System.IO.Path]::GetExtension($Path)'
Write-RunnerLine '    if ($Ext -in @(".js", ".jsx", ".ts", ".tsx", ".json", ".html")) { return $true }'
Write-RunnerLine '    return $false'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Find-Matches {'
Write-RunnerLine '    param([array]$Files, [string]$Pattern)'
Write-RunnerLine '    $Matches = @()'
Write-RunnerLine '    foreach ($File in $Files) {'
Write-RunnerLine '        try {'
Write-RunnerLine '            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue'
Write-RunnerLine '            if ($Result) { $Matches += $Result }'
Write-RunnerLine '        } catch { }'
Write-RunnerLine '    }'
Write-RunnerLine '    return $Matches'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Format-MatchSummary {'
Write-RunnerLine '    param([array]$Matches)'
Write-RunnerLine '    if ($Matches.Count -eq 0) { return "No matches." }'
Write-RunnerLine '    $Max = [Math]::Min($Matches.Count, 10)'
Write-RunnerLine '    $Items = @()'
Write-RunnerLine '    for ($i = 0; $i -lt $Max; $i++) {'
Write-RunnerLine '        $Relative = $Matches[$i].Path.Replace($Root + "\", "")'
Write-RunnerLine '        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)'
Write-RunnerLine '    }'
Write-RunnerLine '    if ($Matches.Count -gt 10) { $Items += ("... plus " + ($Matches.Count - 10) + " more") }'
Write-RunnerLine '    return ($Items -join "; ")'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Split-PostgresMatches {'
Write-RunnerLine '    param([array]$Matches)'
Write-RunnerLine '    $Critical = @()'
Write-RunnerLine '    $LocalEnv = @()'
Write-RunnerLine '    $Example = @()'
Write-RunnerLine '    $Other = @()'
Write-RunnerLine '    foreach ($M in $Matches) {'
Write-RunnerLine '        if (Is-ExampleOrDocFile $M.Path) { $Example += $M }'
Write-RunnerLine '        elseif (Is-LocalEnvFile $M.Path) { $LocalEnv += $M }'
Write-RunnerLine '        elseif (Is-CodeOrConfigFile $M.Path) { $Critical += $M }'
Write-RunnerLine '        else { $Other += $M }'
Write-RunnerLine '    }'
Write-RunnerLine '    return @{ Critical = $Critical; LocalEnv = $LocalEnv; Example = $Example; Other = $Other }'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Result v3" -Encoding UTF8'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine 'Write-ScanReportLine ("Generated: " + $Now)'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine 'Write-ScanReportLine "PURPOSE"'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine 'Write-ScanReportLine "This scan checks for dangerous production deployment issues before GitHub push and Render deployment."'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine 'Write-ScanReportLine "------------------------------------------------------------"'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine ''
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'Write-Host "Running RAFTOP repository safety scan v3..."'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine ''
Write-RunnerLine '$ProjectFiles = Get-ProjectFiles'
Write-RunnerLine 'if ($ProjectFiles.Count -gt 0) { Add-ScanResult "Project files loaded" "PASS" ("Scannable files: " + $ProjectFiles.Count) }'
Write-RunnerLine 'else { Add-ScanResult "Project files loaded" "FAIL" "No scannable project files found." }'
Write-RunnerLine ''
Write-RunnerLine '$ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '    $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '    $_.FullName -notmatch "\\.git\\" -and'
Write-RunnerLine '    ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")'
Write-RunnerLine '}'
Write-RunnerLine 'if ($ProductionEnvFiles.Count -gt 0) {'
Write-RunnerLine '    $List = (($ProductionEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")'
Write-RunnerLine '    Add-ScanResult "Real production env files" "FAIL" ("Disallowed production env files found: " + $List)'
Write-RunnerLine '} else { Add-ScanResult "Real production env files" "PASS" "No real production env files found." }'
Write-RunnerLine ''
Write-RunnerLine '$LocalEnvFiles = Get-ChildItem -Path $Root -Recurse -File -Force -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '    $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '    $_.FullName -notmatch "\\.git\\" -and'
Write-RunnerLine '    $_.Name -eq ".env"'
Write-RunnerLine '}'
Write-RunnerLine 'if ($LocalEnvFiles.Count -gt 0) {'
Write-RunnerLine '    $List = (($LocalEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")'
Write-RunnerLine '    Add-ScanResult "Local env files" "WARN" ("Local .env files exist. They must remain ignored by Git: " + $List)'
Write-RunnerLine '} else { Add-ScanResult "Local env files" "PASS" "No local .env files found." }'
Write-RunnerLine ''
Write-RunnerLine '$LocalhostMatches = Find-Matches $ProjectFiles "localhost"'
Write-RunnerLine 'if ($LocalhostMatches.Count -gt 0) { Add-ScanResult "Localhost references" "WARN" (Format-MatchSummary $LocalhostMatches) }'
Write-RunnerLine 'else { Add-ScanResult "Localhost references" "PASS" "No localhost references found." }'
Write-RunnerLine ''
Write-RunnerLine '$LoopbackMatches = Find-Matches $ProjectFiles "127.0.0.1"'
Write-RunnerLine 'if ($LoopbackMatches.Count -gt 0) { Add-ScanResult "127.0.0.1 references" "WARN" (Format-MatchSummary $LoopbackMatches) }'
Write-RunnerLine 'else { Add-ScanResult "127.0.0.1 references" "PASS" "No 127.0.0.1 references found." }'
Write-RunnerLine ''
Write-RunnerLine '$DatabaseUrlMatches = Find-Matches $ProjectFiles "postgresql://"'
Write-RunnerLine '$DbSplit = Split-PostgresMatches $DatabaseUrlMatches'
Write-RunnerLine 'if ($DbSplit.Critical.Count -gt 0) { Add-ScanResult "Hardcoded PostgreSQL URL in code/config" "FAIL" (Format-MatchSummary $DbSplit.Critical) }'
Write-RunnerLine 'elseif ($DbSplit.LocalEnv.Count -gt 0) { Add-ScanResult "PostgreSQL URL in local env" "WARN" (Format-MatchSummary $DbSplit.LocalEnv) }'
Write-RunnerLine 'elseif ($DbSplit.Example.Count -gt 0) { Add-ScanResult "PostgreSQL URL examples/docs" "PASS" (Format-MatchSummary $DbSplit.Example) }'
Write-RunnerLine 'elseif ($DbSplit.Other.Count -gt 0) { Add-ScanResult "PostgreSQL URL in other files" "WARN" (Format-MatchSummary $DbSplit.Other) }'
Write-RunnerLine 'else { Add-ScanResult "Hardcoded PostgreSQL URL" "PASS" "No hardcoded PostgreSQL URLs found." }'
Write-RunnerLine ''
Write-RunnerLine '$JwtMatches = Find-Matches $ProjectFiles "JWT_SECRET="'
Write-RunnerLine 'if ($JwtMatches.Count -gt 0) { Add-ScanResult "JWT_SECRET assignment review" "WARN" (Format-MatchSummary $JwtMatches) }'
Write-RunnerLine 'else { Add-ScanResult "JWT_SECRET assignment" "PASS" "No JWT_SECRET assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$SuperAdminMatches = Find-Matches $ProjectFiles "SUPER_ADMIN_API_KEY="'
Write-RunnerLine 'if ($SuperAdminMatches.Count -gt 0) { Add-ScanResult "SUPER_ADMIN_API_KEY assignment review" "WARN" (Format-MatchSummary $SuperAdminMatches) }'
Write-RunnerLine 'else { Add-ScanResult "SUPER_ADMIN_API_KEY assignment" "PASS" "No SUPER_ADMIN_API_KEY assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$RestoreKeyMatches = Find-Matches $ProjectFiles "RESTORE_KEY="'
Write-RunnerLine 'if ($RestoreKeyMatches.Count -gt 0) { Add-ScanResult "RESTORE_KEY assignment review" "WARN" (Format-MatchSummary $RestoreKeyMatches) }'
Write-RunnerLine 'else { Add-ScanResult "RESTORE_KEY assignment" "PASS" "No RESTORE_KEY assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$PotentialApiKeyMatches = Find-Matches $ProjectFiles "sk-"'
Write-RunnerLine 'if ($PotentialApiKeyMatches.Count -gt 0) { Add-ScanResult "Potential API key pattern review" "WARN" (Format-MatchSummary $PotentialApiKeyMatches) }'
Write-RunnerLine 'else { Add-ScanResult "Potential API key pattern" "PASS" "No sk- pattern found." }'
Write-RunnerLine ''
Write-RunnerLine 'Write-ScanReportLine "------------------------------------------------------------"'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine 'Write-ScanReportLine ("PASS_COUNT: " + $script:PassCount)'
Write-RunnerLine 'Write-ScanReportLine ("WARN_COUNT: " + $script:WarnCount)'
Write-RunnerLine 'Write-ScanReportLine ("FAIL_COUNT: " + $script:FailCount)'
Write-RunnerLine 'Write-ScanReportLine ""'
Write-RunnerLine ''
Write-RunnerLine 'if ($script:FailCount -gt 0) {'
Write-RunnerLine '    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_FAILED"'
Write-RunnerLine '    $ExitCode = 1'
Write-RunnerLine '} elseif ($script:WarnCount -gt 0) {'
Write-RunnerLine '    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_READY_WITH_WARNINGS"'
Write-RunnerLine '    $ExitCode = 0'
Write-RunnerLine '} else {'
Write-RunnerLine '    $FinalStatus = "PHASE38_REPOSITORY_SAFETY_SCAN_READY"'
Write-RunnerLine '    $ExitCode = 0'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'Write-ScanReportLine ("FINAL STATUS: " + $FinalStatus)'
Write-RunnerLine ''
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'Write-Host "============================================================"'
Write-RunnerLine 'Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v3"'
Write-RunnerLine 'Write-Host "============================================================"'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'Write-Host "Report created:"'
Write-RunnerLine 'Write-Host $ReportPath'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'Write-Host ("PASS_COUNT: " + $script:PassCount)'
Write-RunnerLine 'Write-Host ("WARN_COUNT: " + $script:WarnCount)'
Write-RunnerLine 'Write-Host ("FAIL_COUNT: " + $script:FailCount)'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'Write-Host ("FINAL STATUS: " + $FinalStatus)'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine 'exit $ExitCode'

Write-FixReportLine "Scanner v3 created."
Write-FixReportLine ("Runner: " + $RunnerPath)
Write-FixReportLine ""
Write-FixReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_V3_FIX_READY"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3C Repository Safety Scanner v3"
Write-Host "============================================================"
Write-Host ""
Write-Host "Runner updated:"
Write-Host $RunnerPath
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_V3_FIX_READY"
Write-Host ""