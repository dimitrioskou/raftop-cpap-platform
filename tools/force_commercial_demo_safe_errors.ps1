$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$AppPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.js"
$BackupPath = Join-Path $ProjectRoot "enterprise-frontend\src\App.backup.before-force-demo-safe-errors-regex.js"

if (!(Test-Path $AppPath)) {
    throw "App.js not found: $AppPath"
}

Copy-Item $AppPath $BackupPath -Force

$content = Get-Content $AppPath -Raw

# 1. Hide request error panel during commercial demo mode.
# This converts: {error && ( ... )} into {error && !isCommercialDemoMode() && ( ... )}
if ($content -notmatch 'error\s*&&\s*!\s*isCommercialDemoMode\(\)\s*&&') {
    $content = [regex]::Replace(
        $content,
        '\{\s*error\s*&&\s*\(',
        '{error && !isCommercialDemoMode() && (',
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )
}

# 2. Make the DataPage catch block demo-safe for missing endpoints.
# Find the catch block that sets payload null and setError.
if ($content -notmatch 'Controlled demo fallback: endpoint is not active in this backend environment\.') {
    $content = [regex]::Replace(
        $content,
        '\}\s*catch\s*\(err\)\s*\{\s*setPayload\(null\);\s*setError\(err\.message\s*\|\|\s*''Request failed\.''\);\s*\}\s*finally\s*\{\s*setLoading\(false\);\s*\}',
@'
} catch (err) {
      const message = err.message || 'Request failed.';

      if (
        isCommercialDemoMode() &&
        (
          message.includes('Route not found') ||
          message.includes('Cannot GET') ||
          message.includes('HTTP 404')
        )
      ) {
        setPayload({
          summary: {
            total: 0,
            open: 0,
            warnings: 0,
            failed: 0,
            criticalFailed: 0
          },
          items: [],
          rows: [],
          signals: [],
          tasks: [],
          patients: [],
          devices: [],
          nextBestActions: [],
          blockers: [],
          queue: [],
          cases: [],
          demoSafeFallback: true,
          message: 'Controlled demo fallback: endpoint is not active in this backend environment.'
        });
        setError('');
      } else {
        setPayload(null);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
'@,
        [System.Text.RegularExpressions.RegexOptions]::Singleline
    )
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($AppPath, $content, $utf8NoBom)

Write-Host ""
Write-Host "Commercial demo safe errors forced with regex." -ForegroundColor Green
Write-Host "Updated: $AppPath" -ForegroundColor Green
Write-Host "Backup:  $BackupPath" -ForegroundColor Yellow
Write-Host ""