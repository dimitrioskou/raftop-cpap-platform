# RAFTOP CPAP CARE Pro
# Phase 46.1B - Stable Full Product Completion Audit v2
# Purpose: Buyer-ready product audit without scanning heavy/generated folders.
# Safe: read-only audit. Does not modify database or application files.

param(
    [switch]$RunBuild,
    [string]$FrontendUrl = "https://raftop-cpap-frontend.onrender.com",
    [string]$BackendUrl = "https://raftop-cpap-backend.onrender.com"
)

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$FrontendDir = Join-Path $Root "enterprise-frontend"
$BackendDir = Join-Path $Root "enterprise-backend"
$FrontendSrc = Join-Path $FrontendDir "src"
$BackendSrc = Join-Path $BackendDir "src"
$ToolsDir = Join-Path $Root "tools"
$DocsDir = Join-Path $Root "docs"

if (!(Test-Path $ReportsDir)) {
    New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase46_full_product_completion_audit_v2_" + $Timestamp + ".md")

$script:PassCount = 0
$script:WarnCount = 0
$script:FailCount = 0

function Write-ReportLine {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Add-Result {
    param(
        [string]$Category,
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

    Write-ReportLine ("## " + $Category + " - " + $Name)
    Write-ReportLine ""
    Write-ReportLine ("STATUS: " + $Status)
    Write-ReportLine ""
    Write-ReportLine ("DETAILS: " + $Details)
    Write-ReportLine ""

    Write-Host ($Status + " - " + $Category + " - " + $Name)
}

function Test-PathResult {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Path,
        [string]$FailMessage,
        [string]$PassMessage
    )

    if (Test-Path $Path) {
        Add-Result $Category $Name "PASS" $PassMessage
    } else {
        Add-Result $Category $Name "FAIL" $FailMessage
    }
}

function Read-FileSafe {
    param([string]$Path)

    if (Test-Path $Path) {
        try {
            return Get-Content -Path $Path -Raw -ErrorAction Stop
        } catch {
            return ""
        }
    }

    return ""
}

function ContainsAny {
    param(
        [string]$Content,
        [string[]]$Needles
    )

    foreach ($Needle in $Needles) {
        if ([string]::IsNullOrWhiteSpace($Needle)) {
            continue
        }

        if ($Content.IndexOf($Needle, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
            return $true
        }
    }

    return $false
}

function Is-AllowedTextFile {
    param([System.IO.FileInfo]$File)

    $AllowedExtensions = @(
        ".js", ".jsx", ".ts", ".tsx",
        ".json", ".ps1", ".md", ".sql",
        ".html", ".css", ".env.example"
    )

    if ($AllowedExtensions -notcontains $File.Extension) {
        return $false
    }

    $FullName = $File.FullName

    $BlockedPatterns = @(
        "\node_modules\",
        "\.git\",
        "\build\",
        "\dist\",
        "\coverage\",
        "\reports\",
        "\RAFTOP_UNTRACKED_BACKUP_",
        "\.cache\"
    )

    foreach ($Pattern in $BlockedPatterns) {
        if ($FullName -like ("*" + $Pattern + "*")) {
            return $false
        }
    }

    return $true
}

function Get-TextFiles {
    param([string[]]$BasePaths)

    $List = New-Object System.Collections.Generic.List[object]

    foreach ($BasePath in $BasePaths) {
        if (!(Test-Path $BasePath)) {
            continue
        }

        $Files = Get-ChildItem -Path $BasePath -Recurse -File -ErrorAction SilentlyContinue

        foreach ($File in $Files) {
            if (Is-AllowedTextFile $File) {
                $List.Add($File) | Out-Null
            }
        }
    }

    return $List | Sort-Object FullName -Unique
}

function Find-FilesByName {
    param(
        [string]$BasePath,
        [string[]]$Patterns
    )

    if (!(Test-Path $BasePath)) {
        return @()
    }

    $FoundFiles = New-Object System.Collections.Generic.List[object]

    foreach ($Pattern in $Patterns) {
        $Files = Get-ChildItem -Path $BasePath -Recurse -File -ErrorAction SilentlyContinue | Where-Object {
            $_.Name -like $Pattern -and (Is-AllowedTextFile $_)
        }

        foreach ($File in $Files) {
            $FoundFiles.Add($File) | Out-Null
        }
    }

    return $FoundFiles | Sort-Object FullName -Unique
}

function Find-FilesContaining {
    param(
        [object[]]$Files,
        [string[]]$Terms
    )

    $FoundFiles = New-Object System.Collections.Generic.List[object]

    foreach ($File in $Files) {
        $Content = Read-FileSafe $File.FullName

        if ([string]::IsNullOrWhiteSpace($Content)) {
            continue
        }

        foreach ($Term in $Terms) {
            if ([string]::IsNullOrWhiteSpace($Term)) {
                continue
            }

            if ($Content.IndexOf($Term, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                $FoundFiles.Add($File) | Out-Null
                break
            }
        }
    }

    return $FoundFiles | Sort-Object FullName -Unique
}

function Test-Url {
    param(
        [string]$Category,
        [string]$Name,
        [string]$Url
    )

    try {
        $Response = Invoke-WebRequest -Uri $Url -Method GET -TimeoutSec 30 -UseBasicParsing -ErrorAction Stop

        if ($Response.StatusCode -eq 200) {
            Add-Result $Category $Name "PASS" ("HTTP 200: " + $Url)
        } else {
            Add-Result $Category $Name "WARN" ("Unexpected HTTP status " + $Response.StatusCode + ": " + $Url)
        }
    } catch {
        Add-Result $Category $Name "WARN" ("URL check failed: " + $_.Exception.Message)
    }
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 46.1B Stable Full Product Completion Audit v2" -Encoding UTF8
Write-ReportLine ""
Write-ReportLine ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-ReportLine ""
Write-ReportLine "Purpose: audit remaining gaps before declaring the RAFTOP platform 100% buyer-ready."
Write-ReportLine ""

Write-Host ""
Write-Host "Running RAFTOP Phase 46.1B Stable Full Product Completion Audit v2..."
Write-Host ""

# Prepare controlled file cache
$AllTextFiles = Get-TextFiles @($FrontendSrc, $BackendSrc, $ToolsDir, $DocsDir)
$FrontendTextFiles = Get-TextFiles @($FrontendSrc)
$BackendTextFiles = Get-TextFiles @($BackendSrc, $BackendDir)
$ToolsTextFiles = Get-TextFiles @($ToolsDir)
$DocsTextFiles = Get-TextFiles @($DocsDir)

Add-Result "Audit Engine" "Controlled text file cache" "PASS" ("Indexed " + $AllTextFiles.Count + " text file(s), excluding generated/heavy folders.")

# 1. Repository structure
Test-PathResult "Repository" "Frontend directory" $FrontendDir "Missing enterprise-frontend directory." "Frontend directory found."
Test-PathResult "Repository" "Backend directory" $BackendDir "Missing enterprise-backend directory." "Backend directory found."
Test-PathResult "Repository" "Tools directory" $ToolsDir "Missing tools directory." "Tools directory found."
Test-PathResult "Repository" "Reports directory" $ReportsDir "Missing reports directory." "Reports directory found."

# 2. Package files
Test-PathResult "Build" "Frontend package.json" (Join-Path $FrontendDir "package.json") "Missing frontend package.json." "Frontend package.json found."
Test-PathResult "Build" "Backend package.json" (Join-Path $BackendDir "package.json") "Missing backend package.json." "Backend package.json found."

$FrontendPackage = Read-FileSafe (Join-Path $FrontendDir "package.json")
$BackendPackage = Read-FileSafe (Join-Path $BackendDir "package.json")

if (ContainsAny $FrontendPackage @('"build"', '"start"')) {
    Add-Result "Build" "Frontend scripts" "PASS" "Frontend package includes build/start scripts."
} else {
    Add-Result "Build" "Frontend scripts" "FAIL" "Frontend package missing expected build/start scripts."
}

if (ContainsAny $BackendPackage @('"start"', '"dev"', '"server"')) {
    Add-Result "Build" "Backend scripts" "PASS" "Backend package includes server/start/dev scripts."
} else {
    Add-Result "Build" "Backend scripts" "WARN" "Backend package may be missing standard start/dev scripts."
}

# 3. Frontend App.js and routes
$AppPath = Join-Path $FrontendSrc "App.js"
Test-PathResult "Frontend Core" "App.js" $AppPath "Missing enterprise-frontend/src/App.js." "App.js found."
$AppContent = Read-FileSafe $AppPath

$CriticalRoutes = @(
    "/login",
    "/sales/raftopoulos/executive-demo-home",
    "/sales/raftopoulos/quality-profit",
    "/sales/raftopoulos/pilot-walkthrough-scenario",
    "/sales/raftopoulos/pilot-demo"
)

foreach ($Route in $CriticalRoutes) {
    if (ContainsAny $AppContent @($Route)) {
        Add-Result "Frontend Routes" $Route "PASS" "Route appears in App.js."
    } else {
        Add-Result "Frontend Routes" $Route "FAIL" "Critical demo/sales route missing from App.js."
    }
}

$ProductRoutes = @{
    "Settings route" = @("/settings", "/tenant/settings", "/admin/settings")
    "Compliance route" = @("/compliance", "/tenant/compliance", "/cpap/compliance")
    "Reports route" = @("/reports", "/tenant/reports", "/executive-report")
    "Doctor/Clinic route" = @("/doctor", "/clinic", "/doctors", "/clinics")
    "Users/Admin route" = @("/users", "/admin/users", "/tenant/users")
    "Tasks route" = @("/tasks", "/tenant/tasks")
    "ATLAS route" = @("/atlas", "/tenant/atlas")
    "Patients route" = @("/patients", "/tenant/patients")
    "Billing route" = @("/billing", "/payments", "/subscription")
    "Devices route" = @("/devices", "/tenant/devices")
}

foreach ($Key in $ProductRoutes.Keys) {
    if (ContainsAny $AppContent $ProductRoutes[$Key]) {
        Add-Result "Frontend Product Routes" $Key "PASS" "At least one expected route reference found in App.js."
    } else {
        Add-Result "Frontend Product Routes" $Key "WARN" "No route reference found in App.js. Capability may exist but buyer navigation is not clearly wired."
    }
}

# 4. Critical frontend pages
$ExpectedPageGroups = @{
    "Login page" = @("LoginPage.js")
    "Quality Profit page" = @("RaftopoulosQualityProfitExcellencePage.js")
    "Pilot Demo Dashboard page" = @("RaftopoulosPilotDemoDashboardPage.js", "RaftopoulosPilotDemoPage.js", "PilotDemoDashboardPage.js")
    "Executive Demo Home page" = @("RaftopoulosExecutiveDemoHomePage.js")
    "Executive Demo Script page" = @("RaftopoulosExecutiveDemoScriptPage.js")
    "Pilot Walkthrough Scenario page" = @("RaftopoulosPilotWalkthroughScenarioPage.js")
}

foreach ($Key in $ExpectedPageGroups.Keys) {
    $Found = Find-FilesByName $FrontendSrc $ExpectedPageGroups[$Key]

    if ($Found.Count -gt 0) {
        Add-Result "Frontend Pages" $Key "PASS" ("Found: " + $Found[0].FullName)
    } else {
        Add-Result "Frontend Pages" $Key "WARN" "Expected page file not found by accepted names."
    }
}

# 5. Frontend capability evidence
$FrontendCapabilities = @{
    "Patient management UI" = @("Patient", "PatientsPage", "patient profile", "patients")
    "Device management UI" = @("Device", "DevicesPage", "device profile", "devices")
    "Compliance UI" = @("Compliance", "usage hours", "AHI", "leak")
    "ATLAS UI" = @("ATLAS", "Action Queue", "atlas")
    "Tasks/follow-up UI" = @("task", "follow-up", "FollowUp")
    "Reports UI" = @("report", "Monthly", "Executive Report")
    "Doctor/clinic UI" = @("doctor", "clinic", "Doctor Dashboard")
    "Billing/subscription UI" = @("subscription", "billing", "Stripe", "plan")
    "Super admin UI" = @("super admin", "SuperAdmin", "tenant provisioning")
    "Quality/Profit UI" = @("Quality & Profit", "DMAIC", "Defect Reduction")
}

foreach ($Capability in $FrontendCapabilities.Keys) {
    $Found = Find-FilesContaining $FrontendTextFiles $FrontendCapabilities[$Capability]

    if ($Found.Count -gt 0) {
        Add-Result "Frontend Capability" $Capability "PASS" ("Found " + $Found.Count + " matching file(s).")
    } else {
        Add-Result "Frontend Capability" $Capability "WARN" "No matching frontend implementation evidence found."
    }
}

# 6. Backend core and capability evidence
$ServerCandidates = Find-FilesByName $BackendSrc @("server.js", "app.js", "index.js")

if ($ServerCandidates.Count -gt 0) {
    Add-Result "Backend Core" "Server entry file" "PASS" ("Found: " + $ServerCandidates[0].FullName)
} else {
    Add-Result "Backend Core" "Server entry file" "FAIL" "No server.js/app.js/index.js found under enterprise-backend/src."
}

$BackendCapabilities = @{
    "Auth API" = @("/api/auth", "login", "jsonwebtoken", "jwt")
    "Health API" = @("/api/health", "health")
    "Tenant API" = @("x-tenant-id", "tenantId", "tenant_id")
    "Patients API" = @("/patients", "patients")
    "Devices API" = @("/devices", "devices")
    "Compliance API" = @("/compliance", "usage", "AHI", "leak")
    "ATLAS API" = @("/atlas", "atlas_tasks", "ATLAS")
    "Tasks API" = @("/tasks", "follow-up", "task")
    "Reports API" = @("/reports", "report")
    "Admin/Super Admin API" = @("super_admin", "super admin", "/api/admin")
    "Billing/Subscription API" = @("stripe", "subscription", "billing")
    "CSV Import API" = @("multer", "csv", "import")
    "Doctor/Clinic API" = @("doctor", "clinic")
}

foreach ($Capability in $BackendCapabilities.Keys) {
    $Found = Find-FilesContaining $BackendTextFiles $BackendCapabilities[$Capability]

    if ($Found.Count -gt 0) {
        Add-Result "Backend Capability" $Capability "PASS" ("Found " + $Found.Count + " matching file(s).")
    } else {
        Add-Result "Backend Capability" $Capability "WARN" "No matching backend implementation evidence found."
    }
}

# 7. Database evidence
$SqlFiles = Find-FilesByName $BackendDir @("*.sql")

if ($SqlFiles.Count -gt 0) {
    Add-Result "Database" "SQL files" "PASS" ("Found " + $SqlFiles.Count + " SQL file(s).")
} else {
    Add-Result "Database" "SQL files" "WARN" "No SQL files found. Production schema/migrations may not be documented."
}

$MigrationEvidence = Find-FilesContaining $BackendTextFiles @("CREATE TABLE", "ALTER TABLE", "migration", "migrate")

if ($MigrationEvidence.Count -gt 0) {
    Add-Result "Database" "Migration/schema evidence" "PASS" ("Found " + $MigrationEvidence.Count + " migration/schema evidence file(s).")
} else {
    Add-Result "Database" "Migration/schema evidence" "WARN" "No migration/schema evidence found."
}

# 8. Security evidence
$SecurityItems = @{
    "Helmet/CORS hardening" = @("helmet", "cors")
    "Password hashing" = @("bcrypt", "bcryptjs")
    "JWT auth" = @("jsonwebtoken", "jwt", "JWT_SECRET")
    "Protected route middleware" = @("authenticate", "requireAuth", "authorize", "ProtectedRoute")
    "Role checks" = @("role", "RoleProtectedRoute", "admin", "staff", "doctor")
    "Tenant isolation" = @("x-tenant-id", "tenantId", "tenant_id")
    "Audit log evidence" = @("audit", "AuditLog", "audit_log")
    "Environment variable usage" = @("process.env", ".env.example")
}

foreach ($Item in $SecurityItems.Keys) {
    $Found = Find-FilesContaining $AllTextFiles $SecurityItems[$Item]

    if ($Found.Count -gt 0) {
        Add-Result "Security" $Item "PASS" ("Found " + $Found.Count + " matching file(s).")
    } else {
        Add-Result "Security" $Item "WARN" "No matching security evidence found."
    }
}

# 9. Documentation evidence
$DocumentationItems = @{
    "README" = @("README")
    "Admin manual" = @("Admin Manual", "admin guide")
    "Staff/SOP manual" = @("SOP", "staff training", "user guide")
    "CSV import guide" = @("CSV Import", "import guide")
    "GDPR/DPA docs" = @("GDPR", "Data Processing", "DPA")
    "Deployment guide" = @("deployment", "Render", "production")
    "Support/incident process" = @("incident", "support", "troubleshooting")
    "Buyer delivery pack" = @("buyer delivery", "delivery pack", "handover")
}

foreach ($Item in $DocumentationItems.Keys) {
    $Found = Find-FilesContaining $AllTextFiles $DocumentationItems[$Item]

    if ($Found.Count -gt 0) {
        Add-Result "Documentation" $Item "PASS" ("Found " + $Found.Count + " matching file(s).")
    } else {
        Add-Result "Documentation" $Item "WARN" "Documentation evidence missing or weak."
    }
}

# 10. Verification scripts evidence
$VerificationItems = @{
    "Final demo readiness gate" = @("final_demo_sales_readiness_gate", "PHASE44_FINAL_DEMO")
    "Auth verification" = @("login", "auth", "TOKEN_FOUND")
    "Protected route audit" = @("protected route", "authorization audit")
    "Pilot data verification" = @("pilot_demo_data_verification", "PILOT_DEMO_DATA_VERIFIED")
    "API route verification" = @("api_route_verification", "API_ROUTES_VERIFIED")
    "Navigation verification" = @("sales_demo_navigation", "NAVIGATION_VERIFIED")
    "Import verification" = @("import", "CSV")
    "Billing verification" = @("subscription", "billing", "Stripe")
    "Doctor module verification" = @("doctor", "clinic")
    "Security verification" = @("security", "hardening", "audit")
}

foreach ($Item in $VerificationItems.Keys) {
    $Found = Find-FilesContaining $ToolsTextFiles $VerificationItems[$Item]

    if ($Found.Count -gt 0) {
        Add-Result "Verification" $Item "PASS" ("Found " + $Found.Count + " matching tool/script file(s).")
    } else {
        Add-Result "Verification" $Item "WARN" "No verification script evidence found."
    }
}

# 11. Git status
Push-Location $Root
$GitStatus = git status --porcelain 2>&1
$GitExit = $LASTEXITCODE
Pop-Location

if ($GitExit -ne 0) {
    Add-Result "Repository" "Git status" "WARN" "Could not read git status."
} elseif ([string]::IsNullOrWhiteSpace($GitStatus)) {
    Add-Result "Repository" "Git working tree" "PASS" "Working tree is clean."
} else {
    Add-Result "Repository" "Git working tree" "WARN" "There are uncommitted/untracked changes."
    Write-ReportLine "GIT_STATUS:"
    Write-ReportLine ($GitStatus | Out-String)
    Write-ReportLine ""
}

# 12. Optional build
if ($RunBuild) {
    if (Test-Path $FrontendDir) {
        Push-Location $FrontendDir
        $BuildOutput = npm run build 2>&1
        $BuildExitCode = $LASTEXITCODE
        Pop-Location

        Write-ReportLine "FRONTEND_BUILD_OUTPUT:"
        Write-ReportLine ($BuildOutput | Out-String)
        Write-ReportLine ""

        if ($BuildExitCode -eq 0) {
            Add-Result "Build" "Frontend production build" "PASS" "npm run build completed successfully."
        } else {
            Add-Result "Build" "Frontend production build" "FAIL" ("npm run build failed. Exit code: " + $BuildExitCode)
        }
    } else {
        Add-Result "Build" "Frontend production build" "FAIL" "Frontend directory missing."
    }
} else {
    Add-Result "Build" "Frontend production build" "WARN" "Build not run. Use -RunBuild for full audit."
}

# 13. Production URL checks
Test-Url "Production URLs" "Frontend root" ($FrontendUrl.TrimEnd("/") + "/")
Test-Url "Production URLs" "Login URL" ($FrontendUrl.TrimEnd("/") + "/login")
Test-Url "Production URLs" "Quality Profit URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/quality-profit")
Test-Url "Production URLs" "Pilot Demo URL" ($FrontendUrl.TrimEnd("/") + "/sales/raftopoulos/pilot-demo")
Test-Url "Production URLs" "Backend health" ($BackendUrl.TrimEnd("/") + "/api/health")

# Final interpretation
Write-ReportLine "---"
Write-ReportLine ""
Write-ReportLine "# Final Interpretation"
Write-ReportLine ""
Write-ReportLine "PASS = evidence exists."
Write-ReportLine "WARN = not necessarily broken, but needs review before claiming 100% buyer-ready."
Write-ReportLine "FAIL = must be fixed before final product completion."
Write-ReportLine ""

Write-ReportLine ("PASS_COUNT: " + $script:PassCount)
Write-ReportLine ("WARN_COUNT: " + $script:WarnCount)
Write-ReportLine ("FAIL_COUNT: " + $script:FailCount)
Write-ReportLine ""

if ($script:FailCount -gt 0) {
    $FinalStatus = "PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_READY_WITH_GAPS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE46_FULL_PRODUCT_COMPLETION_AUDIT_READY"
    $ExitCode = 0
}

Write-ReportLine ("FINAL STATUS: " + $FinalStatus)

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 46.1B Stable Full Product Completion Audit v2"
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