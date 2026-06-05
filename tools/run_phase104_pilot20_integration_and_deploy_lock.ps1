# RAFTOP CPAP CARE Pro
# Phase 104 - Pilot 20 Integration & Deploy Lock
# Integrates Pilot 20 backend route and frontend route.
# Does NOT expose secrets.
# Does NOT import data.
# Does NOT give infrastructure access to buyer.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$BackupDir = Join-Path $Root ("backups\phase104_pilot20_integration_" + (Get-Date -Format "yyyy-MM-dd_HH-mm-ss"))

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$FrontendPageFile = Join-Path $Root "enterprise-frontend\src\pages\Pilot20ManualEntryPage.js"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase104_pilot20_integration_and_deploy_lock_" + $Timestamp + ".md")
$IntegrationDoc = Join-Path $DocsDir "104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK.md"
$BuyerAccessDoc = Join-Path $DocsDir "104_PILOT20_BUYER_ACCESS_READY.md"

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
        try { return Get-Content -Path $Path -Raw -Encoding UTF8 -ErrorAction Stop } catch { return "" }
    }
    return ""
}

function ContainsText {
    param([string]$Content, [string]$Needle)
    if ([string]::IsNullOrWhiteSpace($Content)) { return $false }
    return $Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
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
        Add-Result $Name "FAIL" ("No report found for pattern: " + $Pattern)
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

function Find-BackendEntryFile {
    $Candidates = @(
        "enterprise-backend\server.js",
        "enterprise-backend\app.js",
        "enterprise-backend\index.js",
        "enterprise-backend\src\server.js",
        "enterprise-backend\src\app.js",
        "enterprise-backend\src\index.js"
    )

    foreach ($Rel in $Candidates) {
        $Path = Join-Path $Root $Rel
        if (Test-Path $Path) {
            $Content = Read-FileSafe $Path
            if ((ContainsText $Content "express") -and ((ContainsText $Content "app.use") -or (ContainsText $Content "app.listen"))) {
                return $Path
            }
        }
    }

    return ""
}

function Find-FrontendAppFile {
    $Candidates = @(
        "enterprise-frontend\src\App.js",
        "enterprise-frontend\src\App.jsx",
        "enterprise-frontend\src\app.js",
        "enterprise-frontend\src\app.jsx"
    )

    foreach ($Rel in $Candidates) {
        $Path = Join-Path $Root $Rel
        if (Test-Path $Path) {
            return $Path
        }
    }

    return ""
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 104 Pilot 20 Integration and Deploy Lock" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 104 - Pilot 20 Integration & Deploy Lock..."
Write-Host ""

Check-ReportStatus "Phase 103 pilot 20 manual entry module status" "phase103_pilot20_manual_entry_module_*.md" @(
    "PHASE103_PILOT20_MANUAL_ENTRY_MODULE_READY",
    "PHASE103_PILOT20_MANUAL_ENTRY_MODULE_READY_WITH_WARNINGS"
)

if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot 20 backend route file exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Pilot 20 backend route file exists" "FAIL" $BackendRouteFile
}

if (Test-Path $FrontendPageFile) {
    Add-Result "Pilot 20 frontend page file exists" "PASS" $FrontendPageFile
} else {
    Add-Result "Pilot 20 frontend page file exists" "FAIL" $FrontendPageFile
}

$BackendEntry = Find-BackendEntryFile
$FrontendApp = Find-FrontendAppFile

if ([string]::IsNullOrWhiteSpace($BackendEntry)) {
    Add-Result "Backend entry file detected" "FAIL" "Could not find backend server/app/index file."
} else {
    Add-Result "Backend entry file detected" "PASS" $BackendEntry
    Copy-Item $BackendEntry (Join-Path $BackupDir (Split-Path $BackendEntry -Leaf)) -Force
}

if ([string]::IsNullOrWhiteSpace($FrontendApp)) {
    Add-Result "Frontend App file detected" "FAIL" "Could not find enterprise-frontend src App file."
} else {
    Add-Result "Frontend App file detected" "PASS" $FrontendApp
    Copy-Item $FrontendApp (Join-Path $BackupDir (Split-Path $FrontendApp -Leaf)) -Force
}

# Backend integration
if (-not [string]::IsNullOrWhiteSpace($BackendEntry)) {
    $Content = Read-FileSafe $BackendEntry

    if ((ContainsText $Content "/api/pilot20") -and (ContainsText $Content "pilot20ManualEntryRoutes")) {
        Add-Result "Backend pilot20 route already mounted" "PASS" "Existing /api/pilot20 mount found."
    } else {
        $RequirePath = "./routes/pilot20ManualEntryRoutes"
        if ($BackendEntry -like "*\enterprise-backend\src\*") {
            $RequirePath = "../routes/pilot20ManualEntryRoutes"
        }

        $RequireLine = 'const pilot20ManualEntryRoutes = require("' + $RequirePath + '");'
        $MountLine = 'app.use("/api/pilot20", pilot20ManualEntryRoutes);'

        if (-not (ContainsText $Content "pilot20ManualEntryRoutes")) {
            $Lines = $Content -split "`r?`n"
            $InsertIndex = -1

            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -match "^\s*(const|let|var)\s+.*require\(" -or $Lines[$i] -match "^\s*require\(") {
                    $InsertIndex = $i
                }
            }

            if ($InsertIndex -ge 0) {
                $Before = $Lines[0..$InsertIndex]
                $After = $Lines[($InsertIndex + 1)..($Lines.Count - 1)]
                $Lines = @($Before + $RequireLine + $After)
                $Content = $Lines -join "`r`n"
                Add-Result "Backend pilot20 require inserted" "PASS" $RequireLine
            } else {
                $Content = $RequireLine + "`r`n" + $Content
                Add-Result "Backend pilot20 require inserted" "WARN" "Inserted at file top because require block was not detected."
            }
        } else {
            Add-Result "Backend pilot20 require inserted" "PASS" "Require already present."
        }

        if (-not (ContainsText $Content 'app.use("/api/pilot20"')) {
            $Lines = $Content -split "`r?`n"
            $InsertIndex = -1

            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if (
                    $Lines[$i] -match "app\.use\(express\.json" -or
                    $Lines[$i] -match "app\.use\(cors" -or
                    $Lines[$i] -match "app\.use\(.+router" -or
                    $Lines[$i] -match "app\.use\(.+routes"
                ) {
                    $InsertIndex = $i
                }
            }

            if ($InsertIndex -lt 0) {
                for ($i = 0; $i -lt $Lines.Count; $i++) {
                    if ($Lines[$i] -match "express\(\)") {
                        $InsertIndex = $i
                    }
                }
            }

            if ($InsertIndex -ge 0) {
                $Before = $Lines[0..$InsertIndex]
                $After = $Lines[($InsertIndex + 1)..($Lines.Count - 1)]
                $Lines = @($Before + $MountLine + $After)
                $Content = $Lines -join "`r`n"
                Add-Result "Backend /api/pilot20 mount inserted" "PASS" $MountLine
            } else {
                Add-Result "Backend /api/pilot20 mount inserted" "FAIL" "Could not find safe insertion point for app.use."
            }
        } else {
            Add-Result "Backend /api/pilot20 mount inserted" "PASS" "Mount already present."
        }

        Set-Content -Path $BackendEntry -Value $Content -Encoding UTF8
    }

    $UpdatedBackend = Read-FileSafe $BackendEntry
    if ((ContainsText $UpdatedBackend "/api/pilot20") -and (ContainsText $UpdatedBackend "pilot20ManualEntryRoutes")) {
        Add-Result "Backend integration verified in file" "PASS" "pilot20 route is mounted."
    } else {
        Add-Result "Backend integration verified in file" "FAIL" "pilot20 route mount missing."
    }
}

# Frontend integration
if (-not [string]::IsNullOrWhiteSpace($FrontendApp)) {
    $Content = Read-FileSafe $FrontendApp

    if ((ContainsText $Content "Pilot20ManualEntryPage") -and (ContainsText $Content "/pilot20/manual-entry")) {
        Add-Result "Frontend pilot20 route already present" "PASS" "Route exists."
    } else {
        $ImportLine = 'import Pilot20ManualEntryPage from "./pages/Pilot20ManualEntryPage";'

        if (-not (ContainsText $Content "Pilot20ManualEntryPage")) {
            $Lines = $Content -split "`r?`n"
            $InsertIndex = -1

            for ($i = 0; $i -lt $Lines.Count; $i++) {
                if ($Lines[$i] -match "^\s*import\s+") {
                    $InsertIndex = $i
                }
            }

            if ($InsertIndex -ge 0) {
                $Before = $Lines[0..$InsertIndex]
                $After = $Lines[($InsertIndex + 1)..($Lines.Count - 1)]
                $Lines = @($Before + $ImportLine + $After)
                $Content = $Lines -join "`r`n"
                Add-Result "Frontend Pilot20 page import inserted" "PASS" $ImportLine
            } else {
                $Content = $ImportLine + "`r`n" + $Content
                Add-Result "Frontend Pilot20 page import inserted" "WARN" "Inserted at top because import block not detected."
            }
        } else {
            Add-Result "Frontend Pilot20 page import inserted" "PASS" "Import already present."
        }

        if (-not (ContainsText $Content '/pilot20/manual-entry')) {
            if (ContainsText $Content "</Routes>") {
                $RouteLine = '        <Route path="/pilot20/manual-entry" element={<Pilot20ManualEntryPage />} />'
                $Content = $Content.Replace("</Routes>", $RouteLine + "`r`n      </Routes>")
                Add-Result "Frontend /pilot20/manual-entry route inserted" "PASS" "Inserted before </Routes>."
            } elseif (ContainsText $Content "</Switch>") {
                $RouteLine = '        <Route path="/pilot20/manual-entry" component={Pilot20ManualEntryPage} />'
                $Content = $Content.Replace("</Switch>", $RouteLine + "`r`n      </Switch>")
                Add-Result "Frontend /pilot20/manual-entry route inserted" "PASS" "Inserted before </Switch>."
            } else {
                Add-Result "Frontend /pilot20/manual-entry route inserted" "FAIL" "Could not find </Routes> or </Switch>."
            }
        } else {
            Add-Result "Frontend /pilot20/manual-entry route inserted" "PASS" "Route already present."
        }

        Set-Content -Path $FrontendApp -Value $Content -Encoding UTF8
    }

    $UpdatedFrontend = Read-FileSafe $FrontendApp
    if ((ContainsText $UpdatedFrontend "Pilot20ManualEntryPage") -and (ContainsText $UpdatedFrontend "/pilot20/manual-entry")) {
        Add-Result "Frontend integration verified in file" "PASS" "Pilot20 page route exists."
    } else {
        Add-Result "Frontend integration verified in file" "FAIL" "Pilot20 frontend route missing."
    }
}

# Syntax / build light checks
$NodeCommand = Get-Command node -ErrorAction SilentlyContinue
if ($null -eq $NodeCommand) {
    Add-Result "node command available" "WARN" "node not found; skipping syntax check."
} else {
    if (Test-Path $BackendRouteFile) {
        $NodeOut = & node -c $BackendRouteFile 2>&1
        $NodeExit = $LASTEXITCODE

        if ($NodeExit -eq 0) {
            Add-Result "Backend pilot20 route syntax check" "PASS" "node -c passed."
        } else {
            Add-Result "Backend pilot20 route syntax check" "FAIL" ($NodeOut | Out-String)
        }
    }
}

$IntegrationDocContent = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Integration and Deploy Lock

REQUIRED_MARKER: PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK
REQUIRED_MARKER: BACKEND_API_PILOT20_MOUNTED
REQUIRED_MARKER: FRONTEND_PILOT20_ROUTE_ADDED
REQUIRED_MARKER: PILOT20_READY_FOR_DEPLOY
REQUIRED_MARKER: READY_FOR_PHASE105_LIVE_PILOT20_VERIFICATION

## Backend

The pilot manual entry API must be mounted at:

/api/pilot20

Expected endpoints:

- GET /api/pilot20/health
- GET /api/pilot20/summary
- GET /api/pilot20/patients
- POST /api/pilot20/patients

## Frontend

The pilot manual entry page must be available at:

/pilot20/manual-entry

## Buyer use

Raftopoulos receives tenant-level pilot access only.

## Deployment

After commit and push, Render should redeploy backend/frontend from GitHub.

## Next phase

Phase 105:
Live Pilot 20 verification.
'@

Set-Content -Path $IntegrationDoc -Value $IntegrationDocContent -Encoding UTF8

$BuyerAccessContent = @'
# RAFTOP CPAP CARE Pro - Pilot 20 Buyer Access Ready

REQUIRED_MARKER: PHASE104_PILOT20_BUYER_ACCESS_READY
REQUIRED_MARKER: TWO_MONTH_PILOT_READY
REQUIRED_MARKER: BUYER_CAN_ENTER_MAX_20_PATIENTS
REQUIRED_MARKER: NO_SOURCE_CODE_DELIVERY
REQUIRED_MARKER: CREDENTIALS_SEPARATE

## Pilot URL

https://raftop-cpap-frontend.onrender.com/pilot20/manual-entry

## Login URL

https://raftop-cpap-frontend.onrender.com/login

## Pilot scope

- 20 patients maximum
- 2 months
- pseudonymized CPAP data only
- buyer enters data manually
- ATLAS and 80h results are shown

## Not delivered

- source code
- database access
- Render access
- GitHub access
- super admin access
- secrets
'@

Set-Content -Path $BuyerAccessDoc -Value $BuyerAccessContent -Encoding UTF8

foreach ($Doc in @($IntegrationDoc, $BuyerAccessDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase 104 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase 104 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

foreach ($Marker in @(
    "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK",
    "BACKEND_API_PILOT20_MOUNTED",
    "FRONTEND_PILOT20_ROUTE_ADDED",
    "PILOT20_READY_FOR_DEPLOY",
    "READY_FOR_PHASE105_LIVE_PILOT20_VERIFICATION",
    "PHASE104_PILOT20_BUYER_ACCESS_READY",
    "TWO_MONTH_PILOT_READY",
    "BUYER_CAN_ENTER_MAX_20_PATIENTS",
    "NO_SOURCE_CODE_DELIVERY",
    "CREDENTIALS_SEPARATE"
)) {
    $Found = $false

    foreach ($Doc in @($IntegrationDoc, $BuyerAccessDoc)) {
        $DocContent = Read-FileSafe $Doc
        if (ContainsText $DocContent $Marker) {
            $Found = $true
            break
        }
    }

    if ($Found) {
        Add-Result ("Required doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Required doc marker exists: " + $Marker) "FAIL" "Marker missing."
    }
}

$AllGenerated = (Read-FileSafe $IntegrationDoc) + (Read-FileSafe $BuyerAccessDoc)
foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "Bearer ",
    "sk-"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden secret absent from docs: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden secret absent from docs: " + $Forbidden) "PASS" "Absent."
    }
}

Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Git status readable" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Git working tree clean before commit" "PASS" "Working tree clean."
} else {
    Add-Result "Git working tree clean before commit" "WARN" "Working tree has generated files to commit."
}

Add-Content -Path $ReportPath -Value "------------------------------------------------------------" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("PASS_COUNT: " + $script:PassCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("WARN_COUNT: " + $script:WarnCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value ("FAIL_COUNT: " + $script:FailCount) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE104_PILOT20_INTEGRATION_AND_DEPLOY_LOCK_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 104 Pilot 20 Integration & Deploy Lock"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend entry:"
Write-Host $BackendEntry
Write-Host ""
Write-Host "Frontend App:"
Write-Host $FrontendApp
Write-Host ""
Write-Host "Docs:"
Write-Host $IntegrationDoc
Write-Host $BuyerAccessDoc
Write-Host ""
Write-Host "Backup folder:"
Write-Host $BackupDir
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