# RAFTOP CPAP CARE Pro
# Phase 38.3 - Repository Secrets and Localhost Safety Scan Script Generator
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
$ReportPath = Join-Path $ReportsDir ("phase38_repository_safety_scan_script_" + $Timestamp + ".md")
$RunnerPath = Join-Path $ToolsDir "run_phase38_repository_safety_scan.ps1"
$Now = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Write-RunnerLine {
    param([string]$Text)
    Add-Content -Path $RunnerPath -Value $Text -Encoding UTF8
}

Set-Content -Path $RunnerPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan" -Encoding UTF8

Write-RunnerLine '$ErrorActionPreference = "Continue"'
Write-RunnerLine ''
Write-RunnerLine '$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)'
Write-RunnerLine '$ReportsDir = Join-Path $Root "reports"'
Write-RunnerLine 'if (!(Test-Path $ReportsDir)) {'
Write-RunnerLine '    New-Item -ItemType Directory -Path $ReportsDir | Out-Null'
Write-RunnerLine '}'
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
Write-RunnerLine '    param('
Write-RunnerLine '        [string]$Name,'
Write-RunnerLine '        [string]$Status,'
Write-RunnerLine '        [string]$Details'
Write-RunnerLine '    )'
Write-RunnerLine ''
Write-RunnerLine '    if ($Status -eq "PASS") {'
Write-RunnerLine '        $script:PassCount++'
Write-RunnerLine '    } elseif ($Status -eq "WARN") {'
Write-RunnerLine '        $script:WarnCount++'
Write-RunnerLine '    } else {'
Write-RunnerLine '        $script:FailCount++'
Write-RunnerLine '    }'
Write-RunnerLine ''
Write-RunnerLine '    Write-ScanReportLine ("CHECK: " + $Name)'
Write-RunnerLine '    Write-ScanReportLine ("STATUS: " + $Status)'
Write-RunnerLine '    Write-ScanReportLine ("DETAILS: " + $Details)'
Write-RunnerLine '    Write-ScanReportLine ""'
Write-RunnerLine ''
Write-RunnerLine '    Write-Host ($Status + " - " + $Name)'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Get-ProjectFiles {'
Write-RunnerLine '    $Dirs = @("enterprise-backend", "enterprise-frontend")'
Write-RunnerLine '    $Files = @()'
Write-RunnerLine ''
Write-RunnerLine '    foreach ($Dir in $Dirs) {'
Write-RunnerLine '        $FullDir = Join-Path $Root $Dir'
Write-RunnerLine '        if (Test-Path $FullDir) {'
Write-RunnerLine '            $Files += Get-ChildItem -Path $FullDir -Recurse -File -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '                $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\build\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\dist\\" -and'
Write-RunnerLine '                $_.FullName -notmatch "\\coverage\\" -and'
Write-RunnerLine '                $_.Extension -in @(".js", ".jsx", ".ts", ".tsx", ".json", ".env", ".example", ".md", ".html")'
Write-RunnerLine '            }'
Write-RunnerLine '        }'
Write-RunnerLine '    }'
Write-RunnerLine ''
Write-RunnerLine '    return $Files'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Find-Matches {'
Write-RunnerLine '    param('
Write-RunnerLine '        [array]$Files,'
Write-RunnerLine '        [string]$Pattern'
Write-RunnerLine '    )'
Write-RunnerLine ''
Write-RunnerLine '    $Matches = @()'
Write-RunnerLine '    foreach ($File in $Files) {'
Write-RunnerLine '        try {'
Write-RunnerLine '            $Result = Select-String -Path $File.FullName -Pattern $Pattern -SimpleMatch -ErrorAction SilentlyContinue'
Write-RunnerLine '            if ($Result) {'
Write-RunnerLine '                $Matches += $Result'
Write-RunnerLine '            }'
Write-RunnerLine '        } catch {'
Write-RunnerLine '        }'
Write-RunnerLine '    }'
Write-RunnerLine '    return $Matches'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'function Format-MatchSummary {'
Write-RunnerLine '    param([array]$Matches)'
Write-RunnerLine '    if ($Matches.Count -eq 0) { return "No matches." }'
Write-RunnerLine ''
Write-RunnerLine '    $Max = [Math]::Min($Matches.Count, 10)'
Write-RunnerLine '    $Items = @()'
Write-RunnerLine '    for ($i = 0; $i -lt $Max; $i++) {'
Write-RunnerLine '        $Relative = $Matches[$i].Path.Replace($Root + "\", "")'
Write-RunnerLine '        $Items += ($Relative + ": line " + $Matches[$i].LineNumber)'
Write-RunnerLine '    }'
Write-RunnerLine ''
Write-RunnerLine '    if ($Matches.Count -gt 10) {'
Write-RunnerLine '        $Items += ("... plus " + ($Matches.Count - 10) + " more")'
Write-RunnerLine '    }'
Write-RunnerLine ''
Write-RunnerLine '    return ($Items -join "; ")'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Result" -Encoding UTF8'
Write-RunnerLine ''
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
Write-RunnerLine 'Write-Host "Running RAFTOP repository safety scan..."'
Write-RunnerLine 'Write-Host ""'
Write-RunnerLine ''
Write-RunnerLine '$ProjectFiles = Get-ProjectFiles'
Write-RunnerLine ''
Write-RunnerLine 'if ($ProjectFiles.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Project files loaded" "PASS" ("Scannable files: " + $ProjectFiles.Count)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Project files loaded" "FAIL" "No scannable project files found."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$ProductionEnvFiles = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '    $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '    $_.FullName -notmatch "\\.git\\" -and'
Write-RunnerLine '    ($_.Name -eq ".env.production" -or $_.Name -eq ".env.prod" -or $_.Name -eq ".env.live")'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'if ($ProductionEnvFiles.Count -gt 0) {'
Write-RunnerLine '    $List = (($ProductionEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")'
Write-RunnerLine '    Add-ScanResult "Real production env files" "FAIL" ("Disallowed production env files found: " + $List)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Real production env files" "PASS" "No .env.production/.env.prod/.env.live files found."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$LocalEnvFiles = Get-ChildItem -Path $Root -Recurse -File -ErrorAction SilentlyContinue | Where-Object {'
Write-RunnerLine '    $_.FullName -notmatch "\\node_modules\\" -and'
Write-RunnerLine '    $_.FullName -notmatch "\\.git\\" -and'
Write-RunnerLine '    $_.Name -eq ".env"'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine 'if ($LocalEnvFiles.Count -gt 0) {'
Write-RunnerLine '    $List = (($LocalEnvFiles | ForEach-Object { $_.FullName.Replace($Root + "\", "") }) -join "; ")'
Write-RunnerLine '    Add-ScanResult "Local env files" "WARN" ("Local .env files exist. Do not commit them: " + $List)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Local env files" "PASS" "No local .env files found."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$LocalhostMatches = Find-Matches $ProjectFiles "localhost"'
Write-RunnerLine 'if ($LocalhostMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Localhost references" "WARN" (Format-MatchSummary $LocalhostMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Localhost references" "PASS" "No localhost references found in scanned project files."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$LoopbackMatches = Find-Matches $ProjectFiles "127.0.0.1"'
Write-RunnerLine 'if ($LoopbackMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "127.0.0.1 references" "WARN" (Format-MatchSummary $LoopbackMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "127.0.0.1 references" "PASS" "No 127.0.0.1 references found in scanned project files."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$DatabaseUrlMatches = Find-Matches $ProjectFiles "postgresql://"'
Write-RunnerLine 'if ($DatabaseUrlMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Hardcoded PostgreSQL URL" "FAIL" (Format-MatchSummary $DatabaseUrlMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Hardcoded PostgreSQL URL" "PASS" "No hardcoded PostgreSQL connection strings found."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$JwtMatches = Find-Matches $ProjectFiles "JWT_SECRET="'
Write-RunnerLine 'if ($JwtMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Hardcoded JWT_SECRET assignment" "WARN" (Format-MatchSummary $JwtMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Hardcoded JWT_SECRET assignment" "PASS" "No JWT_SECRET= assignments found in scanned files."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$SuperAdminMatches = Find-Matches $ProjectFiles "SUPER_ADMIN_API_KEY="'
Write-RunnerLine 'if ($SuperAdminMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Hardcoded SUPER_ADMIN_API_KEY assignment" "WARN" (Format-MatchSummary $SuperAdminMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Hardcoded SUPER_ADMIN_API_KEY assignment" "PASS" "No SUPER_ADMIN_API_KEY= assignments found in scanned files."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$RestoreKeyMatches = Find-Matches $ProjectFiles "RESTORE_KEY="'
Write-RunnerLine 'if ($RestoreKeyMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Hardcoded RESTORE_KEY assignment" "WARN" (Format-MatchSummary $RestoreKeyMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Hardcoded RESTORE_KEY assignment" "PASS" "No RESTORE_KEY= assignments found in scanned files."'
Write-RunnerLine '}'
Write-RunnerLine ''
Write-RunnerLine '$OpenAiKeyMatches = Find-Matches $ProjectFiles "sk-"'
Write-RunnerLine 'if ($OpenAiKeyMatches.Count -gt 0) {'
Write-RunnerLine '    Add-ScanResult "Potential API key pattern" "WARN" (Format-MatchSummary $OpenAiKeyMatches)'
Write-RunnerLine '} else {'
Write-RunnerLine '    Add-ScanResult "Potential API key pattern" "PASS" "No sk- pattern found in scanned files."'
Write-RunnerLine '}'
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
Write-RunnerLine 'Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan"'
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Script" -Encoding UTF8

Write-ReportLine ""
Write-ReportLine ("Generated: " + $Now)
Write-ReportLine ""
Write-ReportLine "FINAL STATUS"
Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_SCRIPT_READY"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "PURPOSE"
Write-ReportLine ""
Write-ReportLine "This phase creates a repository safety scan script for RAFTOP CPAP CARE Pro."
Write-ReportLine ""
Write-ReportLine "Generated runner:"
Write-ReportLine $RunnerPath
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "WHAT THE SCAN CHECKS"
Write-ReportLine ""
Write-ReportLine "- disallowed production env files"
Write-ReportLine "- local .env files"
Write-ReportLine "- localhost references"
Write-ReportLine "- 127.0.0.1 references"
Write-ReportLine "- hardcoded PostgreSQL URLs"
Write-ReportLine "- hardcoded JWT secret assignments"
Write-ReportLine "- hardcoded super admin key assignments"
Write-ReportLine "- hardcoded restore key assignments"
Write-ReportLine "- potential API key pattern"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "HOW TO RUN"
Write-ReportLine ""
Write-ReportLine ".\tools\run_phase38_repository_safety_scan.ps1"
Write-ReportLine ""
Write-ReportLine "Expected clean result:"
Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_READY"
Write-ReportLine ""
Write-ReportLine "Acceptable with review:"
Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_READY_WITH_WARNINGS"
Write-ReportLine ""
Write-ReportLine "Not acceptable:"
Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_FAILED"
Write-ReportLine ""
Write-ReportLine "------------------------------------------------------------"
Write-ReportLine ""
Write-ReportLine "FINAL VERDICT"
Write-ReportLine ""
Write-ReportLine "The repository safety scan script has been created."
Write-ReportLine ""
Write-ReportLine "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_SCRIPT_READY"

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Script"
Write-Host "============================================================"
Write-Host ""
Write-Host "Runner script created:"
Write-Host $RunnerPath
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host "FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_SCRIPT_READY"
Write-Host ""