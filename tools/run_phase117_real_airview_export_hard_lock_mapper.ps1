# RAFTOP CPAP CARE Pro
# Phase 117 - Real AirView Export Hard-Lock Mapper
# Creates locked AirView header mapping from a real anonymized AirView CSV.
# Does NOT expose secrets.
# Does NOT create patients.
# Requires a real anonymized AirView export CSV for full READY status.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\pilot-20"
$SampleDir = Join-Path $Root "data-intake\raftopoulos-pilot-20\real-airview-samples"
$ConfigDir = Join-Path $Root "enterprise-backend\config"

$BackendRouteFile = Join-Path $Root "enterprise-backend\routes\pilot20ManualEntryRoutes.js"
$LockedMapFile = Join-Path $ConfigDir "pilot20AirViewHeaderMap.locked.json"
$DocFile = Join-Path $DocsDir "117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER.md"
$BuyerRequestDoc = Join-Path $DocsDir "117_REQUEST_REAL_AIRVIEW_EXPORT_FROM_RAFTOPoulos.md"

New-Item -ItemType Directory -Force -Path $ReportsDir | Out-Null
New-Item -ItemType Directory -Force -Path $DocsDir | Out-Null
New-Item -ItemType Directory -Force -Path $SampleDir | Out-Null
New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase117_real_airview_export_hard_lock_mapper_" + $Timestamp + ".md")

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

function Normalize-Header {
    param([string]$Header)

    return ($Header.Trim().ToLower() -replace '[\s_\-\/().%]+', '' -replace '[^a-z0-9]', '')
}

function Split-Csv-Line {
    param(
        [string]$Line,
        [string]$Delimiter
    )

    $values = New-Object System.Collections.Generic.List[string]
    $current = ""
    $inQuotes = $false

    for ($i = 0; $i -lt $Line.Length; $i++) {
        $char = $Line[$i]
        $next = if ($i + 1 -lt $Line.Length) { $Line[$i + 1] } else { [char]0 }

        if ($char -eq '"' -and $inQuotes -and $next -eq '"') {
            $current += '"'
            $i++
        } elseif ($char -eq '"') {
            $inQuotes = -not $inQuotes
        } elseif ($char -eq $Delimiter -and -not $inQuotes) {
            $values.Add($current.Trim())
            $current = ""
        } else {
            $current += $char
        }
    }

    $values.Add($current.Trim())
    return $values.ToArray()
}

function Detect-Delimiter {
    param([string]$HeaderLine)

    $commaCount = ($HeaderLine.ToCharArray() | Where-Object { $_ -eq ',' }).Count
    $semicolonCount = ($HeaderLine.ToCharArray() | Where-Object { $_ -eq ';' }).Count

    if ($semicolonCount -gt $commaCount) { return ';' }
    return ','
}

function Find-Header {
    param(
        [string[]]$Headers,
        [string[]]$Aliases
    )

    $normalizedAliases = @($Aliases | ForEach-Object { Normalize-Header $_ })

    foreach ($Header in $Headers) {
        $normalized = Normalize-Header $Header
        if ($normalizedAliases -contains $normalized) {
            return $Header
        }
    }

    return ""
}

function Find-LatestAirViewCsv {
    $Files = Get-ChildItem -Path $SampleDir -File -ErrorAction SilentlyContinue |
      Where-Object { $_.Extension -in @(".csv", ".txt") } |
      Sort-Object LastWriteTime -Descending

    if ($Files.Count -gt 0) { return $Files[0] }
    return $null
}

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 117 Real AirView Export Hard-Lock Mapper" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 117 - Real AirView Export Hard-Lock Mapper..."
Write-Host ""

if (Test-Path $BackendRouteFile) {
    Add-Result "Backend Pilot20 route exists" "PASS" $BackendRouteFile
} else {
    Add-Result "Backend Pilot20 route exists" "FAIL" $BackendRouteFile
}

$LatestCsv = Find-LatestAirViewCsv

$CanonicalAliases = @{
    device_serial = @(
        "device_serial",
        "device serial",
        "serial number",
        "serial no",
        "serial",
        "device number",
        "device id",
        "s/n",
        "sn"
    )
    month_start = @(
        "month_start",
        "month start",
        "start date",
        "period start",
        "compliance start",
        "report start",
        "from date",
        "date from"
    )
    last_data_date = @(
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
    )
    month_usage_hours = @(
        "month_usage_hours",
        "month usage hours",
        "usage hours",
        "used hours",
        "total usage hours",
        "total hours",
        "hours used",
        "usage hrs",
        "therapy hours",
        "total therapy hours",
        "compliance usage"
    )
    usage_hours_30d = @(
        "usage_hours_30d",
        "usage hours 30d",
        "30 day usage hours",
        "30d usage hours",
        "usage hours",
        "used hours",
        "total usage hours",
        "therapy hours",
        "compliance usage"
    )
    days_used_30d = @(
        "days_used_30d",
        "days used 30d",
        "days used",
        "used days",
        "usage days",
        "days with usage",
        "days > 4h",
        "compliant days"
    )
    ahi_avg_30d = @(
        "ahi_avg_30d",
        "ahi avg 30d",
        "ahi",
        "average ahi",
        "ahi average",
        "apnea hypopnea index"
    )
    leak_avg_30d = @(
        "leak_avg_30d",
        "leak avg 30d",
        "leak",
        "leak average",
        "95th percentile leak",
        "95 percentile leak",
        "95% leak",
        "mask leak",
        "leak 95",
        "95th leak"
    )
}

$ForbiddenHeaderAliases = @(
    "first_name",
    "last_name",
    "full_name",
    "patient_name",
    "name",
    "surname",
    "phone",
    "mobile",
    "email",
    "amka",
    "address",
    "date_of_birth",
    "birth_date",
    "dob",
    "patient email",
    "patient phone"
)

$LockedMap = [ordered]@{
    phase = "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER"
    generated_at = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    sample_file = $null
    delimiter = $null
    source_headers = @()
    forbidden_headers_detected = @()
    canonical_to_source_header = [ordered]@{}
    locked_aliases = [ordered]@{}
    missing_required_fields = @()
    status = "NO_REAL_AIRVIEW_SAMPLE_FOUND"
}

if ($null -eq $LatestCsv) {
    Add-Result "Real anonymized AirView CSV sample found" "WARN" ("No CSV found in: " + $SampleDir)

    $LockedMap.status = "WAITING_FOR_REAL_AIRVIEW_EXPORT"
    $LockedMap.sample_file = "PLACE_REAL_ANONYMIZED_AIRVIEW_CSV_IN_" + $SampleDir
} else {
    Add-Result "Real anonymized AirView CSV sample found" "PASS" $LatestCsv.FullName

    $Raw = Read-FileSafe $LatestCsv.FullName
    $Lines = $Raw -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }

    if ($Lines.Count -lt 2) {
        Add-Result "Real AirView CSV has header and data rows" "FAIL" "CSV must contain header and at least one data row."
    } else {
        Add-Result "Real AirView CSV has header and data rows" "PASS" ("Rows including header: " + $Lines.Count)

        $Delimiter = Detect-Delimiter $Lines[0]
        $Headers = @(Split-Csv-Line -Line $Lines[0] -Delimiter $Delimiter)

        $LockedMap.sample_file = $LatestCsv.Name
        $LockedMap.delimiter = $Delimiter
        $LockedMap.source_headers = $Headers

        Add-Result "AirView CSV delimiter detected" "PASS" $Delimiter
        Add-Result "AirView CSV headers detected" "PASS" ($Headers -join " | ")

        $ForbiddenDetected = @()

        foreach ($Header in $Headers) {
            $normalizedHeader = Normalize-Header $Header
            foreach ($Forbidden in $ForbiddenHeaderAliases) {
                if ($normalizedHeader -eq (Normalize-Header $Forbidden)) {
                    $ForbiddenDetected += $Header
                }
            }
        }

        $ForbiddenDetected = @($ForbiddenDetected | Select-Object -Unique)
        $LockedMap.forbidden_headers_detected = $ForbiddenDetected

        if ($ForbiddenDetected.Count -gt 0) {
            Add-Result "No direct identifier headers in real AirView export" "FAIL" ("Forbidden headers detected: " + ($ForbiddenDetected -join ", "))
        } else {
            Add-Result "No direct identifier headers in real AirView export" "PASS" "No forbidden direct identifier headers detected."
        }

        $Required = @("device_serial", "last_data_date", "month_usage_hours")
        $Missing = @()

        foreach ($Canonical in $CanonicalAliases.Keys) {
            $SourceHeader = Find-Header -Headers $Headers -Aliases $CanonicalAliases[$Canonical]

            if ([string]::IsNullOrWhiteSpace($SourceHeader)) {
                $LockedMap.canonical_to_source_header[$Canonical] = $null
                if ($Required -contains $Canonical) {
                    $Missing += $Canonical
                }
            } else {
                $LockedMap.canonical_to_source_header[$Canonical] = $SourceHeader
                $LockedMap.locked_aliases[$Canonical] = @($SourceHeader)

                Add-Result ("Mapped AirView header: " + $Canonical) "PASS" $SourceHeader
            }
        }

        $LockedMap.missing_required_fields = $Missing

        if ($Missing.Count -gt 0) {
            Add-Result "Required AirView fields mapped" "FAIL" ("Missing required fields: " + ($Missing -join ", "))
            $LockedMap.status = "REAL_AIRVIEW_MAPPING_INCOMPLETE"
        } else {
            Add-Result "Required AirView fields mapped" "PASS" "device_serial, last_data_date, month_usage_hours mapped."
            $LockedMap.status = "REAL_AIRVIEW_MAPPING_LOCKED"
        }
    }
}

$LockedJson = $LockedMap | ConvertTo-Json -Depth 10
Set-Content -Path $LockedMapFile -Value $LockedJson -Encoding UTF8

if (Test-Path $LockedMapFile) {
    Add-Result "Locked AirView header map JSON created" "PASS" $LockedMapFile
} else {
    Add-Result "Locked AirView header map JSON created" "FAIL" $LockedMapFile
}

# -------------------------------------------------------------------
# Backend patch: locked alias loader
# -------------------------------------------------------------------
if (Test-Path $BackendRouteFile) {
    $BackendContent = Read-FileSafe $BackendRouteFile

    if (-not (ContainsText $BackendContent "pilot20LoadLockedAirViewAliases")) {
        $LoaderBlock = @'

function pilot20LoadLockedAirViewAliases() {
  try {
    const fs = require("fs");
    const path = require("path");
    const configPath = path.join(__dirname, "..", "config", "pilot20AirViewHeaderMap.locked.json");

    if (!fs.existsSync(configPath)) {
      return {};
    }

    const raw = fs.readFileSync(configPath, "utf8");
    const parsed = JSON.parse(raw);

    return parsed.locked_aliases || {};
  } catch (error) {
    return {};
  }
}

function pilot20MergeAirViewAliasMap(baseAliasMap, lockedAliases) {
  const merged = { ...baseAliasMap };

  Object.keys(lockedAliases || {}).forEach((canonical) => {
    const values = Array.isArray(lockedAliases[canonical])
      ? lockedAliases[canonical]
      : [lockedAliases[canonical]];

    merged[canonical] = Array.from(new Set([
      ...(merged[canonical] || []),
      ...values.filter(Boolean)
    ]));
  });

  return merged;
}

'@

        $Anchor = "function pilot20NormalizeAirViewUsageCsv(parsed) {"

        if (ContainsText $BackendContent $Anchor) {
            $BackendContent = $BackendContent.Replace($Anchor, $LoaderBlock + "`r`n" + $Anchor)
            Add-Result "Backend locked AirView alias loader inserted" "PASS" "Inserted before normalize function."
        } else {
            Add-Result "Backend locked AirView alias loader inserted" "FAIL" "Normalize function anchor not found."
        }
    } else {
        Add-Result "Backend locked AirView alias loader inserted" "PASS" "Already present."
    }

    if (-not (ContainsText $BackendContent "const effectiveAliasMap = pilot20MergeAirViewAliasMap")) {
        $OldBlock = @'
  const resolved = {};
  Object.keys(aliasMap).forEach((canonical) => {
    resolved[canonical] = pilot20FindHeader(originalHeaders, aliasMap[canonical]);
  });
'@

        $NewBlock = @'
  const lockedAliases = pilot20LoadLockedAirViewAliases();
  const effectiveAliasMap = pilot20MergeAirViewAliasMap(aliasMap, lockedAliases);

  const resolved = {};
  Object.keys(effectiveAliasMap).forEach((canonical) => {
    resolved[canonical] = pilot20FindHeader(originalHeaders, effectiveAliasMap[canonical]);
  });
'@

        if (ContainsText $BackendContent $OldBlock) {
            $BackendContent = $BackendContent.Replace($OldBlock, $NewBlock)
            Add-Result "Backend AirView mapper uses locked aliases" "PASS" "Alias map patched."
        } else {
            Add-Result "Backend AirView mapper uses locked aliases" "WARN" "Exact alias block not found; manual review may be needed."
        }
    } else {
        Add-Result "Backend AirView mapper uses locked aliases" "PASS" "Already present."
    }

    Set-Content -Path $BackendRouteFile -Value $BackendContent -Encoding UTF8

    $UpdatedBackend = Read-FileSafe $BackendRouteFile

    foreach ($Required in @(
        "pilot20LoadLockedAirViewAliases",
        "pilot20MergeAirViewAliasMap",
        "pilot20AirViewHeaderMap.locked.json",
        "effectiveAliasMap"
    )) {
        if (ContainsText $UpdatedBackend $Required) {
            Add-Result ("Backend locked mapper text exists: " + $Required) "PASS" "Found."
        } else {
            Add-Result ("Backend locked mapper text exists: " + $Required) "FAIL" "Missing."
        }
    }

    $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
    if ($null -eq $NodeCommand) {
        Add-Result "node command available" "WARN" "node not found; skipping syntax check."
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

# -------------------------------------------------------------------
# Docs
# -------------------------------------------------------------------
$BuyerRequestContent = @'
# Request Real AirView Export from Raftopoulos

REQUIRED_MARKER: PHASE117_REQUEST_REAL_AIRVIEW_EXPORT_FROM_RAFTOPoulos
REQUIRED_MARKER: ANONYMIZED_AIRVIEW_EXPORT_REQUIRED
REQUIRED_MARKER: NO_DIRECT_PATIENT_IDENTIFIERS
REQUIRED_MARKER: DEVICE_SERIAL_REQUIRED

Please provide one anonymized AirView CSV export with 2-3 devices.

Allowed:
- device serial / serial number
- usage hours
- days used
- AHI
- leak
- date range
- last data date

Not allowed:
- patient name
- phone
- email
- AMKA
- address
- date of birth
- direct patient identifiers

Purpose:
The file will be used only to hard-lock the AirView export mapping.
'@

Set-Content -Path $BuyerRequestDoc -Value $BuyerRequestContent -Encoding UTF8

$DocContent = @"
# RAFTOP CPAP CARE Pro - Real AirView Export Hard-Lock Mapper

REQUIRED_MARKER: PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER
REQUIRED_MARKER: REAL_AIRVIEW_HEADER_LOCK
REQUIRED_MARKER: LOCKED_AIRVIEW_ALIAS_CONFIG
REQUIRED_MARKER: READY_FOR_PHASE118_UNMATCHED_DEVICES_RESOLUTION_CENTER

## Purpose

This phase creates a production hard-lock mapping layer for the real AirView export format used by Raftopoulos.

## Sample folder

$SampleDir

## Locked config

$LockedMapFile

## Current lock status

$($LockedMap.status)

## Why this matters

The application already supports AirView-style exports.
This phase hard-locks the exact real export headers so the buyer does not need to manually rename columns.

## Production rule

The device serial in AirView must match the device serial entered in Patient Entry.

## Next phase

Phase 118 - Unmatched Devices Resolution Center.
"@

Set-Content -Path $DocFile -Value $DocContent -Encoding UTF8

foreach ($Doc in @($DocFile, $BuyerRequestDoc)) {
    if (Test-Path $Doc) {
        Add-Result ("Phase117 doc created: " + (Split-Path $Doc -Leaf)) "PASS" $Doc
    } else {
        Add-Result ("Phase117 doc created: " + (Split-Path $Doc -Leaf)) "FAIL" $Doc
    }
}

$AllGenerated = ""
foreach ($Path in @($BackendRouteFile, $LockedMapFile, $DocFile, $BuyerRequestDoc)) {
    $AllGenerated += Read-FileSafe $Path
}

foreach ($Required in @(
    "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER",
    "REAL_AIRVIEW_HEADER_LOCK",
    "LOCKED_AIRVIEW_ALIAS_CONFIG",
    "pilot20AirViewHeaderMap.locked.json",
    "pilot20LoadLockedAirViewAliases"
)) {
    if (ContainsText $AllGenerated $Required) {
        Add-Result ("Required Phase117 text exists: " + $Required) "PASS" "Found."
    } else {
        Add-Result ("Required Phase117 text exists: " + $Required) "FAIL" "Missing."
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
        Add-Result ("Forbidden Phase117 content absent: " + $Forbidden) "FAIL" "Forbidden text found."
    } else {
        Add-Result ("Forbidden Phase117 content absent: " + $Forbidden) "PASS" "Absent."
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
    $FinalStatus = "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_FAILED"
    $ExitCode = 1
} elseif ($LockedMap.status -ne "REAL_AIRVIEW_MAPPING_LOCKED") {
    $FinalStatus = "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY_WAITING_FOR_REAL_EXPORT"
    $ExitCode = 0
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE117_REAL_AIRVIEW_EXPORT_HARD_LOCK_MAPPER_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 117 Real AirView Export Hard-Lock Mapper"
Write-Host "============================================================"
Write-Host ""
Write-Host "Sample folder:"
Write-Host $SampleDir
Write-Host ""
Write-Host "Locked map:"
Write-Host $LockedMapFile
Write-Host ""
Write-Host "Docs:"
Write-Host $DocFile
Write-Host $BuyerRequestDoc
Write-Host ""
Write-Host "Report created:"
Write-Host $ReportPath
Write-Host ""
Write-Host ("LOCK STATUS: " + $LockedMap.status)
Write-Host ("PASS_COUNT: " + $script:PassCount)
Write-Host ("WARN_COUNT: " + $script:WarnCount)
Write-Host ("FAIL_COUNT: " + $script:FailCount)
Write-Host ""
Write-Host ("FINAL STATUS: " + $FinalStatus)
Write-Host ""

exit $ExitCode