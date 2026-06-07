# RAFTOP CPAP CARE Pro
# Phase 114 - AirView Export Mapper for Pilot20
# Adds AirView-style CSV header mapping to Pilot20 automatic usage upload.
# Buyer can export from AirView and upload without manually renaming every column.
# Does NOT create patients.
# Does NOT expose secrets.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$DataDir = Join-Path $Root "data-intake\raftopoulos-pilot-20"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$UploadPageFile = Join-Path $Root "enterprise-frontend\src\pages\Pilot20UsageUploadPage.js"
$AirViewTemplateFile = Join-Path $DataDir "RAFTOP_PILOT20_AIRVIEW_EXPORT_MAPPING_SAMPLE.csv"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DataDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase114_airview_export_mapper_for_pilot20_" + $Timestamp + ".md")
$DocFile = Join-Path $DocsDir "114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20.md"
$BuyerUseDoc = Join-Path $DocsDir "114_AIRVIEW_EXPORT_BUYER_USE.md"

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
        Add-Result $Name "WARN" ("No report found for pattern: " + $Pattern)
        return
    }

    $Content = Read-FileSafe $Latest.FullName

    foreach ($Status in $AcceptedStatuses) {
        if (ContainsText $Content ("FINAL STATUS: " + $Status)) {
            Add-Result $Name "PASS" ("Latest acceptable report: " + $Latest.Name + " / " + $Status)
            return
        }
    }

    Add-Result $Name "WARN" ("Latest report exists but status not matched: " + $Latest.Name)
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 114 AirView Export Mapper for Pilot20" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 114 - AirView Export Mapper for Pilot20..."
Write-Host ""

Check-ReportStatus "Phase112 live usage upload verification status" "phase112_live_usage_upload_verification_*.md" @(
    "PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION_READY",
    "PHASE112_LIVE_USAGE_UPLOAD_VERIFICATION_READY_WITH_WARNINGS"
)

if (Test-Path $BackendRouteFile) {
    Add-Result "Pilot20 backend route exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Pilot20 backend route exists" "FAIL" $BackendRouteFile
}

$AirViewSample = @'
Serial Number,Start Date,Last Data Date,Usage Hours,Days Used,AHI,95th Percentile Leak
AIRVIEW-DEVICE-001,2026-06-01,2026-06-10,24,8,7.2,18
AIRVIEW-DEVICE-002,2026-06-01,2026-06-10,61,10,3.8,12
AIRVIEW-DEVICE-003,2026-06-01,2026-06-10,14,4,12.4,31
'@

Set-Content -Path $AirViewTemplateFile -Value $AirViewSample -Encoding UTF8

if (Test-Path $AirViewTemplateFile) {
    Add-Result "AirView mapping sample CSV created" "PASS" $AirViewTemplateFile
} else {
    Add-Result "AirView mapping sample CSV created" "FAIL" $AirViewTemplateFile
}

if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (ContainsText $BackendContent "pilot20NormalizeAirViewUsageCsv") {
        Add-Result "AirView mapper already present" "PASS" "pilot20NormalizeAirViewUsageCsv found."
    } else {
        $MapperBlock = @'

function pilot20NormalizeHeaderName(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/().%]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function pilot20FirstOfMonth(dateText) {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

function pilot20FindHeader(headers, aliases) {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: pilot20NormalizeHeaderName(header)
  }));

  const normalizedAliases = aliases.map(pilot20NormalizeHeaderName);

  const match = normalizedHeaders.find((item) => normalizedAliases.includes(item.normalized));
  return match ? match.original : "";
}

function pilot20NormalizeAirViewUsageCsv(parsed) {
  const originalHeaders = parsed.headers || [];

  const aliasMap = {
    device_serial: [
      "device_serial",
      "device serial",
      "serial number",
      "serial no",
      "serial",
      "device number",
      "device id",
      "s/n",
      "sn"
    ],
    month_start: [
      "month_start",
      "month start",
      "start date",
      "period start",
      "compliance start",
      "report start",
      "from date",
      "date from"
    ],
    last_data_date: [
      "last_data_date",
      "last data date",
      "last data",
      "end date",
      "period end",
      "compliance end",
      "report end",
      "to date",
      "date to",
      "therapy date",
      "data date"
    ],
    month_usage_hours: [
      "month_usage_hours",
      "month usage hours",
      "usage hours",
      "used hours",
      "total usage hours",
      "total hours",
      "hours used",
      "usage hrs",
      "therapy hours",
      "total therapy hours"
    ],
    usage_hours_30d: [
      "usage_hours_30d",
      "usage hours 30d",
      "30 day usage hours",
      "30d usage hours",
      "usage hours",
      "used hours",
      "total usage hours",
      "therapy hours"
    ],
    days_used_30d: [
      "days_used_30d",
      "days used 30d",
      "days used",
      "used days",
      "usage days",
      "days with usage"
    ],
    ahi_avg_30d: [
      "ahi_avg_30d",
      "ahi avg 30d",
      "ahi",
      "average ahi",
      "ahi average",
      "apnea hypopnea index"
    ],
    leak_avg_30d: [
      "leak_avg_30d",
      "leak avg 30d",
      "leak",
      "leak average",
      "95th percentile leak",
      "95 percentile leak",
      "95% leak",
      "mask leak",
      "leak 95"
    ]
  };

  const resolved = {};
  Object.keys(aliasMap).forEach((canonical) => {
    resolved[canonical] = pilot20FindHeader(originalHeaders, aliasMap[canonical]);
  });

  const minimalMissing = [];
  if (!resolved.device_serial) minimalMissing.push("device_serial");
  if (!resolved.last_data_date) minimalMissing.push("last_data_date");
  if (!resolved.month_usage_hours) minimalMissing.push("month_usage_hours");

  const rows = parsed.rows.map((sourceRow) => {
    const get = (canonical) => {
      const header = resolved[canonical];
      if (!header) return "";
      return sourceRow[header] || "";
    };

    const lastDataDate = pilot20ToDateText(get("last_data_date"));
    const monthStart =
      pilot20ToDateText(get("month_start")) ||
      pilot20FirstOfMonth(lastDataDate);

    const monthUsageHours = get("month_usage_hours");
    const usageHours30d = get("usage_hours_30d") || monthUsageHours;

    return {
      __line: sourceRow.__line,
      device_serial: pilot20CleanValue(get("device_serial")),
      month_start: monthStart,
      last_data_date: lastDataDate,
      month_usage_hours: monthUsageHours,
      usage_hours_30d: usageHours30d,
      days_used_30d: get("days_used_30d") || "0",
      ahi_avg_30d: get("ahi_avg_30d") || "0",
      leak_avg_30d: get("leak_avg_30d") || "0"
    };
  });

  return {
    originalHeaders,
    resolvedHeaders: resolved,
    headers: [
      "device_serial",
      "month_start",
      "last_data_date",
      "month_usage_hours",
      "usage_hours_30d",
      "days_used_30d",
      "ahi_avg_30d",
      "leak_avg_30d"
    ],
    missingHeaders: minimalMissing,
    rows
  };
}

'@

        $Anchor = 'router.post("/usage-upload", async (req, res) => {'

        if (ContainsText $BackendContent $Anchor) {
            $BackendContent = $BackendContent.Replace($Anchor, $MapperBlock + "`r`n" + $Anchor)
            Add-Result "AirView mapper functions inserted" "PASS" "Inserted before usage-upload endpoint."
        } else {
            Add-Result "AirView mapper functions inserted" "FAIL" "usage-upload anchor not found."
        }

        $Old1 = 'const missingHeaders = pilot20RequireUsageHeaders(parsed.headers);'
        $New1 = @'
    const airViewMapping = pilot20NormalizeAirViewUsageCsv(parsed);
    parsed.headers = airViewMapping.headers;
    parsed.rows = airViewMapping.rows;

    const missingHeaders = airViewMapping.missingHeaders;
'@

        if (ContainsText $BackendContent $Old1) {
            $BackendContent = $BackendContent.Replace($Old1, $New1)
            Add-Result "Usage upload now normalizes AirView headers" "PASS" "missing header block patched."
        } else {
            Add-Result "Usage upload now normalizes AirView headers" "WARN" "Could not find exact missing header block."
        }

        $Old2 = 'const forbiddenHeaders = pilot20HasForbiddenCsvHeaders(parsed.headers);'
        $New2 = 'const forbiddenHeaders = pilot20HasForbiddenCsvHeaders(airViewMapping.originalHeaders || parsed.headers);'

        if (ContainsText $BackendContent $Old2) {
            $BackendContent = $BackendContent.Replace($Old2, $New2)
            Add-Result "Forbidden header scan uses original AirView headers" "PASS" "Forbidden scan patched."
        } else {
            Add-Result "Forbidden header scan uses original AirView headers" "WARN" "Could not find exact forbidden header block."
        }

        $Old3 = 'module: "pilot20_automatic_cpap_usage_update_engine",'
        $New3 = 'module: "pilot20_automatic_cpap_usage_update_engine_airview_mapper",'

        if (ContainsText $BackendContent $Old3) {
            $BackendContent = $BackendContent.Replace($Old3, $New3)
            Add-Result "Usage upload module name updated" "PASS" "Module name patched."
        } else {
            Add-Result "Usage upload module name updated" "WARN" "Module marker not found."
        }

        Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8
    }

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20NormalizeAirViewUsageCsv",
        "pilot20NormalizeHeaderName",
        "resolvedHeaders",
        "serial number",
        "95th percentile leak",
        "pilot20_automatic_cpap_usage_update_engine_airview_mapper"
    )) {
        if (ContainsText $UpdatedBackend $Required) {
            Add-Result ("Backend AirView mapper text exists: " + $Required) "PASS" "Found."
        } else {
            Add-Result ("Backend AirView mapper text exists: " + $Required) "FAIL" "Missing."
        }
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $NodeCommand) {
        Add-Result "node command available" "WARN" "node not found; skipping node syntax check."
    } else {
        $NodeOut = & node -c $BackendRouteFile 2>&1
        $NodeExit = $LASTEXITCODE

        if ($NodeExit -eq 0) {
            Add-Result "Backend route syntax check" "PASS" "node -c passed."
        } else {
            Add-Result "Backend route syntax check" "FAIL" ($NodeOut | Out-String)
        }
    }
}

# Frontend text update
if (Test-Path $UploadPageFile) {
    $UploadContent = Read-FileSafe $UploadPageFile

    $UploadContent = $UploadContent.Replace(
        "Automatic CPAP Usage Update",
        "AirView / CPAP Usage Update"
    )

    $UploadContent = $UploadContent.Replace(
        "Required columns: device_serial, month_start, last_data_date, month_usage_hours,",
        "Accepted formats: standard Pilot20 CSV or AirView-style export. Required matching key: device serial. Standard columns: device_serial, month_start, last_data_date, month_usage_hours,"
    )

    $UploadContent = $UploadContent.Replace(
        "The platform updates usage automatically by device serial.",
        "The platform maps AirView-style columns automatically and updates usage by device serial."
    )

    if (-not (ContainsText $UploadContent "AirView")) {
        Add-Result "Frontend upload page AirView text added" "WARN" "AirView text was not detected after patch."
    } else {
        Add-Result "Frontend upload page AirView text added" "PASS" "AirView text present."
    }

    Set-Content -Path $UploadPageFile -Value $UploadContent -Encoding UTF8
} else {
    Add-Result "Frontend usage upload page exists" "WARN" "Upload page not found."
}

$DocContent = @'
# RAFTOP CPAP CARE Pro - AirView Export Mapper for Pilot20

REQUIRED_MARKER: PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20
REQUIRED_MARKER: AIRVIEW_EXPORT_MAPPING
REQUIRED_MARKER: DEVICE_SERIAL_MATCHING
REQUIRED_MARKER: AIRVIEW_COLUMNS_ACCEPTED
REQUIRED_MARKER: READY_FOR_PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION

## Purpose

Pilot20 usage upload now accepts both:
- standard Pilot20 usage CSV
- AirView-style export CSV

## Matching key

device serial

## Common AirView-style column aliases

- Serial Number -> device_serial
- Device Serial -> device_serial
- Start Date -> month_start
- Last Data Date -> last_data_date
- End Date -> last_data_date
- Usage Hours -> month_usage_hours
- Used Hours -> month_usage_hours
- Days Used -> days_used_30d
- AHI -> ahi_avg_30d
- 95th Percentile Leak -> leak_avg_30d
- Mask Leak -> leak_avg_30d

## Buyer value

Raftopoulos exports usage data from AirView, uploads the CSV, and the platform updates compliance and Rescue Monitor automatically.

## Boundary

No direct patient identifiers are needed.
'@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

$BuyerUseContent = @'
# RAFTOP CPAP CARE Pro - AirView Export Buyer Use

REQUIRED_MARKER: PHASE114_AIRVIEW_EXPORT_BUYER_USE
REQUIRED_MARKER: EXPORT_FROM_AIRVIEW
REQUIRED_MARKER: UPLOAD_AIRVIEW_CSV
REQUIRED_MARKER: AUTOMATIC_MAPPING_TO_RESCUE_MONITOR

## Buyer workflow

1. Enter 20 pilot patients once.
2. Export usage CSV from AirView.
3. Upload the AirView CSV in /pilot20/usage-upload.
4. The platform maps AirView columns automatically.
5. The platform matches patients by device serial.
6. Open /pilot20/rescue-monitor.
7. See who is safe, on track, watch, rescue, or critical before month end.

## Important

The device serial in AirView must match the device serial entered in Patient Entry.
'@

Set-Content -Path $BuyerUseDoc -Value $BuyerUseContent -Encoding UTF8

foreach ($Doc in @($DocFile, $BuyerUseDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase114 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase114 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $UploadPageFile, $DocFile, $BuyerUseDoc, $AirViewTemplateFile)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20",
    "AIRVIEW_EXPORT_MAPPING",
    "DEVICE_SERIAL_MATCHING",
    "AIRVIEW_COLUMNS_ACCEPTED",
    "READY_FOR_PHASE115_LIVE_AIRVIEW_SAMPLE_VERIFICATION",
    "pilot20NormalizeAirViewUsageCsv",
    "Serial Number",
    "Usage Hours",
    "95th Percentile Leak"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase114 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase114 text exists: " + $Required) "FAIL" "Missing."
    }
}

foreach ($Forbidden in @(
    "DATABASE_URL=",
    "JWT_SECRET",
    "SUPER_ADMIN_API_KEY",
    "RESTORE_KEY",
    "postgresql://",
    "sk-",
    "Ξ",
    "Ο€",
    "Οƒ",
    "Ο„"
)) {
    if (ContainsText $AllGenerated $Forbidden) {
        Add-Result ("Forbidden Phase114 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase114 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE114_AIRVIEW_EXPORT_MAPPER_FOR_PILOT20_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 114 AirView Export Mapper for Pilot20"
Write-Host "============================================================"
Write-Host ""
Write-Host "Backend route:"
Write-Host $BackendRouteFile
Write-Host ""
Write-Host "AirView sample:"
Write-Host $AirViewTemplateFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
Write-Host $BuyerUseDoc
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