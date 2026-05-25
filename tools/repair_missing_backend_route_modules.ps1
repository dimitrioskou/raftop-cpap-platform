# RAFTOP CPAP CARE Pro
# Repair missing backend route modules required by enterprise-backend/src/server.js
# Creates safe fallback Express routers for missing route files.
# Does not modify database. Does not expose data.

$ErrorActionPreference = "Stop"

$Root = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$BackendDir = Join-Path $Root "enterprise-backend"
$ServerPath = Join-Path $BackendDir "src\server.js"

if (!(Test-Path $ServerPath)) {
    throw "server.js not found: $ServerPath"
}

$Server = Get-Content $ServerPath -Raw

$Regex = "require\(['""](\.\/[^'""]+)['""]\)"
$Matches = [regex]::Matches($Server, $Regex)

$Missing = @()

foreach ($Match in $Matches) {
    $RequirePath = $Match.Groups[1].Value

    $BasePath = Join-Path (Join-Path $BackendDir "src") $RequirePath.Replace("/", "\")
    $Candidates = @(
        $BasePath,
        "$BasePath.js",
        "$BasePath.json",
        (Join-Path $BasePath "index.js")
    )

    $Exists = $false
    foreach ($Candidate in $Candidates) {
        if (Test-Path $Candidate) {
            $Exists = $true
            break
        }
    }

    if (!$Exists) {
        $Missing += $RequirePath
    }
}

if ($Missing.Count -eq 0) {
    Write-Host "ALL_SERVER_REQUIRES_EXIST_LOCALLY"
    exit 0
}

Write-Host "MISSING_REQUIRE_MODULES:"
$Missing | ForEach-Object { Write-Host $_ }

foreach ($RequirePath in $Missing) {
    $TargetPath = Join-Path (Join-Path $BackendDir "src") ($RequirePath.Replace("/", "\") + ".js")
    $TargetDir = Split-Path -Parent $TargetPath

    if (!(Test-Path $TargetDir)) {
        New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    }

    $RouteName = $RequirePath.Replace("./", "").Replace("/", "_")

    $Content = @"
// Auto-generated safe fallback route for missing module: $RequirePath
// RAFTOP CPAP CARE Pro
// Purpose: prevent backend startup crash when an optional route module is missing.
// Security: returns 501 and does not expose data.

const express = require('express');

const router = express.Router();

function response(req, res) {
  res.status(501).json({
    ok: false,
    fallback: true,
    route: '$RequirePath',
    service: '$RouteName',
    message: 'This route module is present as a safe fallback. Full implementation is pending.',
    method: req.method,
    path: req.originalUrl,
    time: new Date().toISOString(),
    requestId: req.requestId || null
  });
}

router.get('/', response);
router.post('/', response);
router.put('/', response);
router.patch('/', response);
router.delete('/', response);

router.get('*', response);
router.post('*', response);
router.put('*', response);
router.patch('*', response);
router.delete('*', response);

module.exports = router;
"@

    Set-Content -Path $TargetPath -Value $Content -Encoding UTF8
    Write-Host "CREATED_SAFE_FALLBACK: $TargetPath"
}

Write-Host ""
Write-Host "DONE"
Write-Host "Created $($Missing.Count) safe fallback route module(s)."