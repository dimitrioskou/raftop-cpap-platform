# RAFTOP CPAP CARE Pro
# Frontend Missing Import Audit & Bulk Repair
# Scans enterprise-frontend/src for missing relative imports and creates safe React fallback modules.
# Purpose: stop Render production build failures caused by missing page/component files.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$FrontendSrc = Join-Path $Root "enterprise-frontend\src"
$ReportDir = Join-Path $Root "reports"

if (!(Test-Path $FrontendSrc)) {
    throw "Frontend src directory not found: $FrontendSrc"
}

if (!(Test-Path $ReportDir)) {
    New-Item -ItemType Directory -Path $ReportDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$ReportPath = Join-Path $ReportDir ("frontend_missing_import_audit_" + $Timestamp + ".md")

function Write-Report {
    param([string]$Text)
    Add-Content -Path $ReportPath -Value $Text -Encoding UTF8
}

function Is-CodeFile {
    param([string]$Path)

    return $Path -match "\.(js|jsx|ts|tsx)$"
}

function Is-SkippedImport {
    param([string]$ImportPath)

    $p = $ImportPath.ToLower()

    if ($p -match "\.(css|scss|sass|less|png|jpg|jpeg|gif|svg|webp|ico|json|pdf|txt|md)$") {
        return $true
    }

    if ($p.StartsWith("@/")) {
        return $true
    }

    if (!($p.StartsWith("./") -or $p.StartsWith("../"))) {
        return $true
    }

    return $false
}

function Resolve-ImportCandidates {
    param(
        [string]$FromFile,
        [string]$ImportPath
    )

    $BaseDir = Split-Path -Parent $FromFile
    $Raw = Join-Path $BaseDir ($ImportPath.Replace("/", "\"))

    $Candidates = @(
        $Raw,
        "$Raw.js",
        "$Raw.jsx",
        "$Raw.ts",
        "$Raw.tsx",
        (Join-Path $Raw "index.js"),
        (Join-Path $Raw "index.jsx"),
        (Join-Path $Raw "index.ts"),
        (Join-Path $Raw "index.tsx")
    )

    return $Candidates
}

function Import-Exists {
    param(
        [string]$FromFile,
        [string]$ImportPath
    )

    $Candidates = Resolve-ImportCandidates -FromFile $FromFile -ImportPath $ImportPath

    foreach ($Candidate in $Candidates) {
        if (Test-Path $Candidate) {
            return $true
        }
    }

    return $false
}

function Get-TargetPath {
    param(
        [string]$FromFile,
        [string]$ImportPath
    )

    $BaseDir = Split-Path -Parent $FromFile
    $Raw = Join-Path $BaseDir ($ImportPath.Replace("/", "\"))

    $Ext = [System.IO.Path]::GetExtension($Raw)

    if ([string]::IsNullOrWhiteSpace($Ext)) {
        return "$Raw.js"
    }

    return $Raw
}

function To-PascalName {
    param([string]$Name)

    $Clean = $Name -replace "[^a-zA-Z0-9]", " "
    $Parts = $Clean.Split(" ", [System.StringSplitOptions]::RemoveEmptyEntries)

    if ($Parts.Count -eq 0) {
        return "FallbackComponent"
    }

    $Out = ""

    foreach ($Part in $Parts) {
        if ($Part.Length -eq 1) {
            $Out += $Part.ToUpper()
        } else {
            $Out += $Part.Substring(0,1).ToUpper() + $Part.Substring(1)
        }
    }

    if ($Out -match "^[0-9]") {
        $Out = "Fallback" + $Out
    }

    return $Out
}

function Get-NamedImports {
    param([string]$ImportStatement)

    $Names = @()

    if ($ImportStatement -match "\{([^}]+)\}") {
        $Inside = $Matches[1]
        $Parts = $Inside.Split(",")

        foreach ($Part in $Parts) {
            $Clean = $Part.Trim()

            if ($Clean -match "\s+as\s+") {
                $Clean = ($Clean -split "\s+as\s+")[0].Trim()
            }

            $Clean = $Clean -replace "[^a-zA-Z0-9_$]", ""

            if ($Clean -match "^[a-zA-Z_$][a-zA-Z0-9_$]*$") {
                $Names += $Clean
            }
        }
    }

    return $Names | Select-Object -Unique
}

function New-FallbackModule {
    param(
        [string]$TargetPath,
        [string]$ImportPath,
        [array]$NamedExports
    )

    $Dir = Split-Path -Parent $TargetPath

    if (!(Test-Path $Dir)) {
        New-Item -ItemType Directory -Path $Dir -Force | Out-Null
    }

    $BaseName = [System.IO.Path]::GetFileNameWithoutExtension($TargetPath)
    $ComponentName = To-PascalName -Name $BaseName

    $NamedExportText = ""

    foreach ($Name in $NamedExports) {
        if ($Name -eq "default") {
            continue
        }

        if ($Name -eq $ComponentName) {
            continue
        }

        $NamedExportText += @"

export function $Name(props) {
  return <${ComponentName} {...props} fallbackExportName="$Name" />;
}
"@
    }

    $RelativeForDisplay = $TargetPath.Replace($Root + "\", "")

    $Content = @"
// Auto-generated fallback module.
// RAFTOP CPAP CARE Pro
// Missing import repaired for: $ImportPath
// File: $RelativeForDisplay
//
// This is a build-stabilization fallback.
// Replace with a real implementation when this route/component becomes product-critical.

import React from "react";

function boxTitleFromName(value) {
  return String(value || "Fallback Module")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ");
}

export default function $ComponentName(props) {
  const title = boxTitleFromName("$ComponentName");
  const exportName = props && props.fallbackExportName ? props.fallbackExportName : "default";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>RAFTOP CPAP CARE Pro</div>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.text}>
          This screen is available as a safe fallback module so the production
          frontend can build and deploy. The full implementation is pending.
        </p>

        <div style={styles.metaGrid}>
          <div style={styles.metaBox}>
            <div style={styles.metaLabel}>Import</div>
            <div style={styles.metaValue}>$ImportPath</div>
          </div>

          <div style={styles.metaBox}>
            <div style={styles.metaLabel}>Export</div>
            <div style={styles.metaValue}>{exportName}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
$NamedExportText

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "34px",
    fontFamily: "Inter, Arial, sans-serif",
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,0.20), transparent 34%), linear-gradient(135deg, #07111f 0%, #0f172a 58%, #0f766e 140%)",
    color: "#ffffff"
  },
  card: {
    maxWidth: "860px",
    margin: "8vh auto",
    background: "rgba(255,255,255,0.96)",
    color: "#0f172a",
    borderRadius: "28px",
    padding: "32px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.25)"
  },
  kicker: {
    color: "#0f766e",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.15em"
  },
  title: {
    margin: "10px 0 12px",
    fontSize: "34px",
    lineHeight: 1.06,
    letterSpacing: "-0.04em",
    fontWeight: 950
  },
  text: {
    margin: 0,
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.6,
    fontWeight: 750
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
    marginTop: "22px"
  },
  metaBox: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "18px",
    padding: "14px"
  },
  metaLabel: {
    color: "#64748b",
    fontSize: "11px",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.1em"
  },
  metaValue: {
    marginTop: "6px",
    color: "#0f766e",
    fontSize: "13px",
    fontWeight: 900,
    wordBreak: "break-word"
  }
};
"@

    Set-Content -Path $TargetPath -Value $Content -Encoding UTF8
}

Set-Content -Path $ReportPath -Value "# RAFTOP Frontend Missing Import Audit" -Encoding UTF8
Write-Report ""
Write-Report ("Generated: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
Write-Report ""

$Files = Get-ChildItem -Path $FrontendSrc -Recurse -File | Where-Object {
    Is-CodeFile $_.FullName
}

$MissingMap = @{}

foreach ($File in $Files) {
    $Content = Get-Content -Path $File.FullName -Raw -ErrorAction SilentlyContinue

    if ([string]::IsNullOrWhiteSpace($Content)) {
        continue
    }

    $ImportRegex = "(?ms)import\s+([^;]*?)\s+from\s+['""]([^'""]+)['""]"
    $SideEffectRegex = "(?m)import\s+['""]([^'""]+)['""]"
    $DynamicRegex = "import\(\s*['""]([^'""]+)['""]\s*\)"

    foreach ($Match in [regex]::Matches($Content, $ImportRegex)) {
        $ImportClause = $Match.Groups[1].Value
        $ImportPath = $Match.Groups[2].Value

        if (Is-SkippedImport $ImportPath) {
            continue
        }

        if (!(Import-Exists -FromFile $File.FullName -ImportPath $ImportPath)) {
            $TargetPath = Get-TargetPath -FromFile $File.FullName -ImportPath $ImportPath
            $Key = $TargetPath.ToLower()

            if (!$MissingMap.ContainsKey($Key)) {
                $MissingMap[$Key] = @{
                    TargetPath = $TargetPath
                    ImportPath = $ImportPath
                    FromFiles = @()
                    NamedExports = @()
                }
            }

            $MissingMap[$Key].FromFiles += $File.FullName.Replace($Root + "\", "")
            $MissingMap[$Key].NamedExports += Get-NamedImports $ImportClause
        }
    }

    foreach ($Match in [regex]::Matches($Content, $SideEffectRegex)) {
        $ImportPath = $Match.Groups[1].Value

        if (Is-SkippedImport $ImportPath) {
            continue
        }

        if (!(Import-Exists -FromFile $File.FullName -ImportPath $ImportPath)) {
            $TargetPath = Get-TargetPath -FromFile $File.FullName -ImportPath $ImportPath
            $Key = $TargetPath.ToLower()

            if (!$MissingMap.ContainsKey($Key)) {
                $MissingMap[$Key] = @{
                    TargetPath = $TargetPath
                    ImportPath = $ImportPath
                    FromFiles = @()
                    NamedExports = @()
                }
            }

            $MissingMap[$Key].FromFiles += $File.FullName.Replace($Root + "\", "")
        }
    }

    foreach ($Match in [regex]::Matches($Content, $DynamicRegex)) {
        $ImportPath = $Match.Groups[1].Value

        if (Is-SkippedImport $ImportPath) {
            continue
        }

        if (!(Import-Exists -FromFile $File.FullName -ImportPath $ImportPath)) {
            $TargetPath = Get-TargetPath -FromFile $File.FullName -ImportPath $ImportPath
            $Key = $TargetPath.ToLower()

            if (!$MissingMap.ContainsKey($Key)) {
                $MissingMap[$Key] = @{
                    TargetPath = $TargetPath
                    ImportPath = $ImportPath
                    FromFiles = @()
                    NamedExports = @()
                }
            }

            $MissingMap[$Key].FromFiles += $File.FullName.Replace($Root + "\", "")
        }
    }
}

if ($MissingMap.Count -eq 0) {
    Write-Host "NO_MISSING_FRONTEND_IMPORTS_FOUND"
    Write-Report "NO_MISSING_FRONTEND_IMPORTS_FOUND"
    exit 0
}

Write-Host "MISSING_FRONTEND_IMPORTS_FOUND: $($MissingMap.Count)"
Write-Report "MISSING_FRONTEND_IMPORTS_FOUND: $($MissingMap.Count)"
Write-Report ""

foreach ($Item in $MissingMap.Values) {
    $NamedExports = @($Item.NamedExports | Select-Object -Unique)
    New-FallbackModule -TargetPath $Item.TargetPath -ImportPath $Item.ImportPath -NamedExports $NamedExports

    $RelativeTarget = $Item.TargetPath.Replace($Root + "\", "")

    Write-Host "CREATED_FALLBACK: $RelativeTarget"
    Write-Report ("CREATED_FALLBACK: " + $RelativeTarget)
    Write-Report ("IMPORT_PATH: " + $Item.ImportPath)
    Write-Report ("FROM: " + (($Item.FromFiles | Select-Object -Unique) -join ", "))

    if ($NamedExports.Count -gt 0) {
        Write-Report ("NAMED_EXPORTS: " + ($NamedExports -join ", "))
    }

    Write-Report ""
}

Write-Host ""
Write-Host "Report:"
Write-Host $ReportPath
Write-Host ""
Write-Host "DONE"