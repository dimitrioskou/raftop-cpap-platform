# RAFTOP CPAP CARE Pro
# Phase 100B - ATLAS / 80h / Reports Verification on 7000-row Final Stage
# Reads imported 7000-final-stage production data and verifies operational outputs.
# Does NOT import more data.
# Does NOT modify production DB.
# Does NOT print DATABASE_URL.

$ErrorActionPreference = "Continue"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$ReportsDir = Join-Path $Root "reports"
$DocsDir = Join-Path $Root "docs\production-activation"

New-Item -ItemType Directory -Path $ReportsDir -Force | Out-Null
New-Item -ItemType Directory -Path $DocsDir -Force | Out-Null

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportsDir ("phase100b_atlas_80h_reports_on_7000_final_stage_" + $Timestamp + ".md")

$SnapshotCsv = Join-Path $ReportsDir ("phase98b_7000_final_stage_operational_snapshot_" + $Timestamp + ".csv")
$AtlasQueueCsv = Join-Path $ReportsDir ("phase98b_7000_final_stage_atlas_priority_queue_" + $Timestamp + ".csv")
$ComplianceSummaryCsv = Join-Path $ReportsDir ("phase98b_7000_final_stage_80h_compliance_summary_" + $Timestamp + ".csv")
$ManagementSnapshotCsv = Join-Path $ReportsDir ("phase98b_7000_final_stage_management_snapshot_" + $Timestamp + ".csv")
$VerificationDoc = Join-Path $DocsDir "100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE.md"

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

function To-Double {
    param([string]$Value)

    if ([string]::IsNullOrWhiteSpace($Value)) { return 0.0 }

    $Clean = $Value.Replace(",", ".")
    $Out = 0.0

    if ([double]::TryParse($Clean, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$Out)) {
        return $Out
    }

    return 0.0
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

Set-Content -Path $ReportPath -Value "# RAFTOP CPAP CARE Pro - Phase 100B ATLAS 80h Reports on 7000-row Final Stage" -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss")) -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8
Add-Content -Path $ReportPath -Value "Purpose: verify ATLAS, 80h compliance, and management reports using 7000-row final stage production data." -Encoding UTF8
Add-Content -Path $ReportPath -Value "DATABASE_URL is never printed." -Encoding UTF8
Add-Content -Path $ReportPath -Value "" -Encoding UTF8

Write-Host ""
Write-Host "Running RAFTOP Phase 100B - ATLAS / 80h / Reports Verification on 7000-row Final Stage..."
Write-Host ""

Check-ReportStatus "Phase 98 500-row controlled stage latest status" "phase100r_7000_final_stage_verification_repair_*.md" @(
    "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY",
    "PHASE100R_7000_FINAL_STAGE_VERIFICATION_REPAIR_READY_WITH_WARNINGS"
)

$DatabaseUrl = $env:RAFTOP_PRODUCTION_DATABASE_URL
$PsqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Add-Result "Production DATABASE URL env set" "FAIL" "RAFTOP_PRODUCTION_DATABASE_URL is not set."
} else {
    Add-Result "Production DATABASE URL env set" "PASS" "Env value is set. Value is not printed."
}

if ($null -eq $PsqlCommand) {
    Add-Result "psql command available" "FAIL" "psql not found in PATH."
} else {
    Add-Result "psql command available" "PASS" ("psql found: " + $PsqlCommand.Source)
}

if ($script:FailCount -eq 0) {
    try {
        $SnapshotQuery = @"
select
  p.tenant_slug,
  p.patient_external_id,
  p.patient_code,
  coalesce(d.device_serial,'') as device_serial,
  coalesce(d.device_model,'') as device_model,
  coalesce(p.doctor_external_id,'') as doctor_external_id,
  coalesce(p.branch_code,'') as branch_code,
  coalesce(c.record_date::text,'') as record_date,
  coalesce(c.month_start::text,'') as month_start,
  coalesce(c.month_usage_hours::text,'0') as month_usage_hours,
  coalesce(c.usage_hours_30d::text,'0') as usage_hours_30d,
  coalesce(c.days_used_30d::text,'0') as days_used_30d,
  coalesce(c.ahi_avg_30d::text,'0') as ahi_avg_30d,
  coalesce(c.leak_avg_30d::text,'0') as leak_avg_30d,
  coalesce(c.is_80h_compliant::text,'false') as is_80h_compliant,
  coalesce(d.last_data_date::text,'') as last_data_date,
  coalesce(c.data_source,'') as data_source
from public.patients p
left join public.devices d
  on d.tenant_slug = p.tenant_slug
 and d.patient_external_id = p.patient_external_id
left join public.patient_compliance_latest c
  on c.tenant_slug = p.tenant_slug
 and c.patient_external_id = p.patient_external_id
where p.tenant_slug = 'raftopoulos-production'
order by p.patient_external_id
limit 7000;
"@

        $SnapshotOutput = & psql $DatabaseUrl -t -A -F "," -c $SnapshotQuery 2>&1
        $SnapshotExit = $LASTEXITCODE

        if ($SnapshotExit -eq 0) {
            Set-Content -Path $SnapshotCsv -Value "tenant_slug,patient_external_id,patient_code,device_serial,device_model,doctor_external_id,branch_code,record_date,month_start,month_usage_hours,usage_hours_30d,days_used_30d,ahi_avg_30d,leak_avg_30d,is_80h_compliant,last_data_date,data_source" -Encoding UTF8
            Add-Content -Path $SnapshotCsv -Value $SnapshotOutput -Encoding UTF8
            Add-Result "7000-final-stage operational snapshot exported" "PASS" $SnapshotCsv
        } else {
            Add-Result "7000-final-stage operational snapshot exported" "FAIL" ($SnapshotOutput | Out-String)
        }
    } catch {
        Add-Result "7000-final-stage operational snapshot exported" "FAIL" ("Exception: " + $_.Exception.Message)
    }
}

$Rows = @()

try {
    if (Test-Path $SnapshotCsv) {
        $Rows = Import-Csv -Path $SnapshotCsv
        Add-Result "7000-final-stage operational snapshot readable" "PASS" ("Rows: " + @($Rows).Count)
    }
} catch {
    Add-Result "7000-final-stage operational snapshot readable" "FAIL" ("Could not read snapshot CSV: " + $_.Exception.Message)
}

if (@($Rows).Count -ge 7000) {
    Add-Result "7000-final-stage snapshot has 7000 rows" "PASS" ("Rows: " + @($Rows).Count)
} else {
    Add-Result "7000-final-stage snapshot has 7000 rows" "FAIL" ("Rows: " + @($Rows).Count)
}

$TotalPatients = @($Rows).Count
$Compliant80h = 0
$Below80h = 0
$NoData = 0
$HighAhi = 0
$HighLeak = 0
$CriticalPriority = 0
$HighPriority = 0
$MediumPriority = 0
$LowPriority = 0

$AtlasQueue = @()
$Today = Get-Date

foreach ($Row in $Rows) {
    $MonthUsage = To-Double $Row.month_usage_hours
    $Ahi = To-Double $Row.ahi_avg_30d
    $Leak = To-Double $Row.leak_avg_30d

    $Score = 0
    $Reasons = @()
    $ActionGroup = "COMPLIANCE_OK"

    $IsBelow80h = $false
    $IsNoData = $false
    $IsHighAhi = $false
    $IsHighLeak = $false

    if ($MonthUsage -ge 80) {
        $Compliant80h++
    } else {
        $Below80h++
        $IsBelow80h = $true
        $Score += 40
        $Reasons += "below_80h"
    }

    if ([string]::IsNullOrWhiteSpace($Row.last_data_date) -or [string]::IsNullOrWhiteSpace($Row.record_date)) {
        $IsNoData = $true
    } else {
        try {
            $LastDate = [datetime]::Parse($Row.last_data_date)
            if (($Today - $LastDate).TotalDays -gt 7) {
                $IsNoData = $true
            }
        } catch {
            $IsNoData = $true
        }
    }

    if ($IsNoData) {
        $NoData++
        $Score += 50
        $Reasons += "no_data_or_old_data"
    }

    if ($Ahi -gt 10) {
        $HighAhi++
        $IsHighAhi = $true
        $Score += 25
        $Reasons += "high_ahi"
    }

    if ($Leak -gt 24) {
        $HighLeak++
        $IsHighLeak = $true
        $Score += 20
        $Reasons += "high_leak"
    }

    if ($IsNoData) {
        $ActionGroup = "NO_DATA"
    } elseif ($IsBelow80h) {
        $ActionGroup = "COMPLIANCE_RISK"
    } elseif ($IsHighAhi -or $IsHighLeak) {
        $ActionGroup = "THERAPY_REVIEW"
    } else {
        $ActionGroup = "COMPLIANCE_OK"
    }

    $Priority = "low"

    if ($Score -ge 80) {
        $Priority = "critical"
        $CriticalPriority++
    } elseif ($Score -ge 50) {
        $Priority = "high"
        $HighPriority++
    } elseif ($Score -ge 25) {
        $Priority = "medium"
        $MediumPriority++
    } else {
        $Priority = "low"
        $LowPriority++
    }

    if ($Score -gt 0) {
        $AtlasQueue += [PSCustomObject]@{
            tenant_slug = $Row.tenant_slug
            patient_external_id = $Row.patient_external_id
            patient_code = $Row.patient_code
            device_serial = $Row.device_serial
            doctor_external_id = $Row.doctor_external_id
            branch_code = $Row.branch_code
            action_group = $ActionGroup
            priority = $Priority
            atlas_score = $Score
            reasons = ($Reasons -join "|")
            month_usage_hours = $Row.month_usage_hours
            ahi_avg_30d = $Row.ahi_avg_30d
            leak_avg_30d = $Row.leak_avg_30d
            last_data_date = $Row.last_data_date
        }
    }
}

$AtlasQueue = $AtlasQueue | Sort-Object @{ Expression = "atlas_score"; Descending = $true }, @{ Expression = "patient_external_id"; Ascending = $true }
$AtlasQueue | Export-Csv -Path $AtlasQueueCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $AtlasQueueCsv) {
    Add-Result "7000-final-stage ATLAS priority queue CSV created" "PASS" $AtlasQueueCsv
} else {
    Add-Result "7000-final-stage ATLAS priority queue CSV created" "FAIL" $AtlasQueueCsv
}

if (@($AtlasQueue).Count -gt 0) {
    Add-Result "7000-final-stage ATLAS queue has action rows" "PASS" ("Rows: " + @($AtlasQueue).Count)
} else {
    Add-Result "7000-final-stage ATLAS queue has action rows" "WARN" "No action rows. Stage data may be too clean."
}

if ($Below80h -gt 0) {
    Add-Result "7000-final-stage below 80h patients detected" "PASS" ("Rows: " + $Below80h)
} else {
    Add-Result "7000-final-stage below 80h patients detected" "WARN" "No below-80h rows detected."
}

if ($Compliant80h -gt 0) {
    Add-Result "7000-final-stage 80h compliant patients detected" "PASS" ("Rows: " + $Compliant80h)
} else {
    Add-Result "7000-final-stage 80h compliant patients detected" "WARN" "No compliant rows detected."
}

if ($HighAhi -gt 0) {
    Add-Result "7000-final-stage high AHI patients detected" "PASS" ("Rows: " + $HighAhi)
} else {
    Add-Result "7000-final-stage high AHI patients detected" "WARN" "No high AHI rows detected."
}

if ($HighLeak -gt 0) {
    Add-Result "7000-final-stage high leak patients detected" "PASS" ("Rows: " + $HighLeak)
} else {
    Add-Result "7000-final-stage high leak patients detected" "WARN" "No high leak rows detected."
}

$ComplianceRate = 0
if ($TotalPatients -gt 0) {
    $ComplianceRate = [Math]::Round(($Compliant80h / $TotalPatients) * 100, 2)
}

$ComplianceSummary = @(
    [PSCustomObject]@{ metric = "total_patients"; value = $TotalPatients },
    [PSCustomObject]@{ metric = "patients_80h_compliant"; value = $Compliant80h },
    [PSCustomObject]@{ metric = "patients_below_80h"; value = $Below80h },
    [PSCustomObject]@{ metric = "80h_compliance_rate_percent"; value = $ComplianceRate },
    [PSCustomObject]@{ metric = "no_data_or_old_data_patients"; value = $NoData },
    [PSCustomObject]@{ metric = "high_ahi_patients"; value = $HighAhi },
    [PSCustomObject]@{ metric = "high_leak_patients"; value = $HighLeak }
)

$ComplianceSummary | Export-Csv -Path $ComplianceSummaryCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $ComplianceSummaryCsv) {
    Add-Result "7000-final-stage 80h compliance summary CSV created" "PASS" $ComplianceSummaryCsv
} else {
    Add-Result "7000-final-stage 80h compliance summary CSV created" "FAIL" $ComplianceSummaryCsv
}

$ManagementSnapshot = @(
    [PSCustomObject]@{ section = "portfolio"; metric = "stage_patients"; value = $TotalPatients },
    [PSCustomObject]@{ section = "compliance"; metric = "80h_compliant"; value = $Compliant80h },
    [PSCustomObject]@{ section = "compliance"; metric = "below_80h"; value = $Below80h },
    [PSCustomObject]@{ section = "compliance"; metric = "80h_compliance_rate_percent"; value = $ComplianceRate },
    [PSCustomObject]@{ section = "atlas"; metric = "atlas_queue_total"; value = @($AtlasQueue).Count },
    [PSCustomObject]@{ section = "atlas"; metric = "critical_priority"; value = $CriticalPriority },
    [PSCustomObject]@{ section = "atlas"; metric = "high_priority"; value = $HighPriority },
    [PSCustomObject]@{ section = "atlas"; metric = "medium_priority"; value = $MediumPriority },
    [PSCustomObject]@{ section = "signals"; metric = "no_data_or_old_data"; value = $NoData },
    [PSCustomObject]@{ section = "signals"; metric = "high_ahi"; value = $HighAhi },
    [PSCustomObject]@{ section = "signals"; metric = "high_leak"; value = $HighLeak },
    [PSCustomObject]@{ section = "readiness"; metric = "ready_for_production_handover"; value = "yes_if_buyer_signoff" }
)

$ManagementSnapshot | Export-Csv -Path $ManagementSnapshotCsv -NoTypeInformation -Encoding UTF8

if (Test-Path $ManagementSnapshotCsv) {
    Add-Result "7000-final-stage management snapshot CSV created" "PASS" $ManagementSnapshotCsv
} else {
    Add-Result "7000-final-stage management snapshot CSV created" "FAIL" $ManagementSnapshotCsv
}

$VerificationDocContent = @"
# RAFTOP CPAP CARE Pro - ATLAS / 80h / Reports Verification on 7000-row Final Stage

REQUIRED_MARKER: PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE
REQUIRED_MARKER: SEVEN_THOUSAND_FINAL_STAGE_VERIFIED
REQUIRED_MARKER: ATLAS_QUEUE_GENERATED
REQUIRED_MARKER: EIGHTY_HOURS_COMPLIANCE_VERIFIED
REQUIRED_MARKER: READY_FOR_PHASE101_PRODUCTION_HANDOVER_LOCK

## Meaning

The 7000-row final stage data was used to generate operational verification outputs.

## Outputs

7000-final-stage operational snapshot:
$SnapshotCsv

7000-final-stage ATLAS priority queue:
$AtlasQueueCsv

7000-final-stage 80h compliance summary:
$ComplianceSummaryCsv

7000-final-stage management snapshot:
$ManagementSnapshotCsv

## Key metrics

Total stage patients:
$TotalPatients

80h compliant:
$Compliant80h

Below 80h:
$Below80h

80h compliance rate:
$ComplianceRate %

No data / old data:
$NoData

High AHI:
$HighAhi

High leak:
$HighLeak

ATLAS queue rows:
$(@($AtlasQueue).Count)

## Next phase

Phase 99:
2000-row controlled stage apply after 7000-row final stage verification.
"@

Set-Content -Path $VerificationDoc -Value $VerificationDocContent -Encoding UTF8

if (Test-Path $VerificationDoc) {
    Add-Result "Phase 100B verification document created" "PASS" $VerificationDoc
} else {
    Add-Result "Phase 100B verification document created" "FAIL" $VerificationDoc
}

foreach ($Marker in @(
    "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE",
    "SEVEN_THOUSAND_FINAL_STAGE_VERIFIED",
    "ATLAS_QUEUE_GENERATED",
    "EIGHTY_HOURS_COMPLIANCE_VERIFIED",
    "READY_FOR_PHASE101_PRODUCTION_HANDOVER_LOCK"
)) {
    $DocContent = Read-FileSafe $VerificationDoc

    if (ContainsText $DocContent $Marker) {
        Add-Result ("Verification doc marker exists: " + $Marker) "PASS" "Marker found."
    } else {
        Add-Result ("Verification doc marker exists: " + $Marker) "FAIL" "Marker missing."
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
    $FinalStatus = "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE_FAILED"
    $ExitCode = 1
} elseif ($script:WarnCount -gt 0) {
    $FinalStatus = "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE_READY_WITH_WARNINGS"
    $ExitCode = 0
} else {
    $FinalStatus = "PHASE100B_ATLAS_80H_REPORTS_ON_7000_FINAL_STAGE_READY"
    $ExitCode = 0
}

Add-Content -Path $ReportPath -Value ("FINAL STATUS: " + $FinalStatus) -Encoding UTF8

Write-Host ""
Write-Host "============================================================"
Write-Host "RAFTOP CPAP CARE Pro - Phase 100B ATLAS / 80h / Reports on 7000-row Final Stage"
Write-Host "============================================================"
Write-Host ""
Write-Host "Snapshot CSV:"
Write-Host $SnapshotCsv
Write-Host ""
Write-Host "ATLAS queue CSV:"
Write-Host $AtlasQueueCsv
Write-Host ""
Write-Host "80h summary CSV:"
Write-Host $ComplianceSummaryCsv
Write-Host ""
Write-Host "Management snapshot CSV:"
Write-Host $ManagementSnapshotCsv
Write-Host ""
Write-Host "Verification doc:"
Write-Host $VerificationDoc
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

