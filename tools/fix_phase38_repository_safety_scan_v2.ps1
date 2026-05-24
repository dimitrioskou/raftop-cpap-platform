# RAFTOP CPAP CARE Pro
# Phase 38.3B - Repository Safety Remediation and Scanner v2
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
$ReportPath = Join-Path $ReportsDir ("phase38_repository_safety_scan_v2_fix_" + $Timestamp + ".md")
$RunnerPath = Join-Path $ToolsDir "run_phase38_repository_safety_scan.ps1"
$PrivateBackupRoot = Join-Path (Split-Path -Parent $Root) "RAFTOP_PRIVATE_ENV_BACKUP"
$PrivateBackupDir = Join-Path $PrivateBackupRoot ("env_backup_" + $Timestamp)

function Write-FixReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Write-RunnerLine {
    param([string]$Text)
    Add-Content -Path $RunnerPath -Value $Text -Encoding UTF8
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3B Repository Safety Remediation" -Encoding UTF8

Write-FixReportLine ""
Write-FixReportLine ("Generated: " + $Now)
Write-FixReportLine ""

Write-Host ""
Write-Host "Running repository safety remediation..."
Write-Host ""

# 1. Quarantine real production env files outside repo
$ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -Force -File -ErrorAction SilentlyContinue | Where-Object {
    $_.FullName -notmatch "\\node_modules\\" -and
    $_.FullName -notmatch "\\.git\\" -and
    ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")
}

if ($ProductionEnvFiles.Count -gt 0) {
    if (!(Test-Path $PrivateBackupDir)) {
        New-Item -ItemType Directory -Path $PrivateBackupDir -Force | Out-Null
    }

    foreach ($File in $ProductionEnvFiles) {
        $Relative = $File.FullName.Replace($Root + "\", "")
        $SafeName = $Relative.Replace("\", "__").Replace("/", "__")
        $Target = Join-Path $PrivateBackupDir $SafeName
        Move-Item -Path $File.FullName -Destination $Target -Force
        Write-FixReportLine ("MOVED_PRODUCTION_ENV_FILE: " + $Relative + " -> " + $Target)
        Write-Host ("MOVED - " + $Relative)
    }
} else {
    Write-FixReportLine "NO_PRODUCTION_ENV_FILES_FOUND"
    Write-Host "PASS - No real production env files found to move"
}

# 2. Harden .gitignore
$GitIgnorePath = Join-Path $Root ".gitignore"
if (!(Test-Path $GitIgnorePath)) {
    Set-Content -Path $GitIgnorePath -Value "" -Encoding UTF8
}

$GitIgnoreAdditions = @(
"",
"# RAFTOP safety rules",
".env",
".env.*",
"!.env.example",
"!.env.production.example",
"*.local",
"*.pem",
"*.key",
"*.p12",
"*.pfx",
"secrets/",
"private/",
"RAFTOP_PRIVATE_ENV_BACKUP/"
)

$ExistingGitIgnore = Get-Content -Path $GitIgnorePath -ErrorAction SilentlyContinue

foreach ($Line in $GitIgnoreAdditions) {
    if ($Line -eq "") {
        Add-Content -Path $GitIgnorePath -Value "" -Encoding UTF8
    } elseif ($ExistingGitIgnore -notcontains $Line) {
        Add-Content -Path $GitIgnorePath -Value $Line -Encoding UTF8
        Write-FixReportLine ("GITIGNORE_ADDED: " + $Line)
    }
}

Write-Host "PASS - .gitignore safety rules checked"

# 3. Replace repository safety scanner with v2
Set-Content -Path $RunnerPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v2" -Encoding UTF8

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
Write-RunnerLine '    if ($Path -match "\.example$") { return $true }'
Write-RunnerLine '    if ($Path -match "\.md$") { return $true }'
Write-RunnerLine '    if ($Path -match "\.env\.example$") { return $true }'
Write-RunnerLine '    if ($Path -match "\.env\.production\.example$") { return $true }'
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
Write-RunnerLine 'function Split-CriticalAndExampleMatches {'
Write-RunnerLine '    param([array]$Matches)'
Write-RunnerLine '    $Critical = @()'
Write-RunnerLine '    $Example = @()'
Write-RunnerLine '    foreach ($M in $Matches) {'
Write-RunnerLine '        if (Is-ExampleOrDocFile $M.Path) { $Example += $M } else { $Critical += $M }'
Write-RunnerLine '    }'
Write-RunnerLine '    return @{ Critical = $Critical; Example = $Example }'
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
Write-RunnerLine 'Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Result v2" -Encoding UTF8'
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
Write-RunnerLine 'Write-Host "Running RAFTOP repository safety scan v2..."'
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
Write-RunnerLine '    Add-ScanResult "Local env files" "WARN" ("Local .env files exist. Verify they are ignored by Git: " + $List)'
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
Write-RunnerLine '$DbSplit = Split-CriticalAndExampleMatches $DatabaseUrlMatches'
Write-RunnerLine 'if ($DbSplit.Critical.Count -gt 0) { Add-ScanResult "Hardcoded PostgreSQL URL in code/config" "FAIL" (Format-MatchSummary $DbSplit.Critical) }'
Write-RunnerLine 'elseif ($DbSplit.Example.Count -gt 0) { Add-ScanResult "PostgreSQL URL examples/docs" "WARN" (Format-MatchSummary $DbSplit.Example) }'
Write-RunnerLine 'else { Add-ScanResult "Hardcoded PostgreSQL URL" "PASS" "No hardcoded PostgreSQL URLs found." }'
Write-RunnerLine ''
Write-RunnerLine '$JwtMatches = Find-Matches $ProjectFiles "JWT_SECRET="'
Write-RunnerLine '$JwtSplit = Split-CriticalAndExampleMatches $JwtMatches'
Write-RunnerLine 'if ($JwtSplit.Critical.Count -gt 0) { Add-ScanResult "JWT_SECRET assignment in code/config" "WARN" (Format-MatchSummary $JwtSplit.Critical) }'
Write-RunnerLine 'elseif ($JwtSplit.Example.Count -gt 0) { Add-ScanResult "JWT_SECRET examples/docs" "PASS" (Format-MatchSummary $JwtSplit.Example) }'
Write-RunnerLine 'else { Add-ScanResult "JWT_SECRET assignment" "PASS" "No JWT_SECRET assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$SuperAdminMatches = Find-Matches $ProjectFiles "SUPER_ADMIN_API_KEY="'
Write-RunnerLine '$SuperSplit = Split-CriticalAndExampleMatches $SuperAdminMatches'
Write-RunnerLine 'if ($SuperSplit.Critical.Count -gt 0) { Add-ScanResult "SUPER_ADMIN_API_KEY assignment in code/config" "WARN" (Format-MatchSummary $SuperSplit.Critical) }'
Write-RunnerLine 'elseif ($SuperSplit.Example.Count -gt 0) { Add-ScanResult "SUPER_ADMIN_API_KEY examples/docs" "PASS" (Format-MatchSummary $SuperSplit.Example) }'
Write-RunnerLine 'else { Add-ScanResult "SUPER_ADMIN_API_KEY assignment" "PASS" "No SUPER_ADMIN_API_KEY assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$RestoreKeyMatches = Find-Matches $ProjectFiles "RESTORE_KEY="'
Write-RunnerLine '$RestoreSplit = Split-CriticalAndExampleMatches $RestoreKeyMatches'
Write-RunnerLine 'if ($RestoreSplit.Critical.Count -gt 0) { Add-ScanResult "RESTORE_KEY assignment in code/config" "WARN" (Format-MatchSummary $RestoreSplit.Critical) }'
Write-RunnerLine 'elseif ($RestoreSplit.Example.Count -gt 0) { Add-ScanResult "RESTORE_KEY examples/docs" "PASS" (Format-MatchSummary $RestoreSplit.Example) }'
Write-RunnerLine 'else { Add-ScanResult "RESTORE_KEY assignment" "PASS" "No RESTORE_KEY assignments found." }'
Write-RunnerLine ''
Write-RunnerLine '$PotentialApiKeyMatches = Find-Matches $ProjectFiles "sk-"'
Write-RunnerLine '$KeySplit = Split-CriticalAndExampleMatches $PotentialApiKeyMatches'
Write-RunnerLine 'if ($KeySplit.Critical.Count -gt 0) { Add-ScanResult "Potential API key pattern in code/config" "WARN" (Format-MatchSummary $KeySplit.Critical) }'
Write-RunnerLine 'elseif ($KeySplit.Example.Count -gt 0) { Add-ScanResult "Potential API key examples/docs" "PASS" (Format-MatchSummary $KeySplit.Example) }'
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
Write-RunnerLine 'Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan v2"'
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

Write-FixReportLine ""
Write-FixReportLine "Repository safety scanner v2 created."
Write-FixReportLine ("Runner: " + $RunnerPath)
Write-FixReportLine ""
Write-FixReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_V2_FIX_READY"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3B Repository Safety Fix"
Write-Host "============================================================"
Write-Host ""
Write-Host "Runner updated:"
Write-Host $RunnerPath
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "Private env backup location:"
Write-Host $PrivateBackupDir
Write-Host ""
Write-Host "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_V2_FIX_READY"
Write-Host ""