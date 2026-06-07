param(
  [string]$DbEnvName = "RAFTOP_PRODUCTION_DATABASE_URL",
  [string]$BackupRoot = "C:\Users\Administrator\Desktop\RAFTOP_BACKUPS_DO_NOT_COMMIT",
  [string]$Label = "production"
)

$ErrorActionPreference = "Stop"

New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null

$DbUrl = [Environment]::GetEnvironmentVariable($DbEnvName, "Process")

if ([string]::IsNullOrWhiteSpace($DbUrl)) {
  Write-Host ""
  Write-Host "Missing database URL environment variable in current PowerShell session:"
  Write-Host $DbEnvName
  Write-Host ""
  Write-Host "Set it temporarily only in this PowerShell session before running backup."
  Write-Host "Do not save it inside the repository."
  Write-Host ""
  exit 1
}

$PgDump = Get-Command pg_dump -ErrorAction SilentlyContinue

if ($null -eq $PgDump) {
  Write-Host ""
  Write-Host "pg_dump not found. Install PostgreSQL tools or add pg_dump to PATH."
  Write-Host ""
  exit 1
}

$Timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupFile = Join-Path $BackupRoot ("raftop_" + $Label + "_backup_" + $Timestamp + ".dump")
$ManifestFile = Join-Path $BackupRoot ("raftop_" + $Label + "_backup_" + $Timestamp + "_manifest.txt")

Write-Host ""
Write-Host "Creating production backup..."
Write-Host "Backup file:"
Write-Host $BackupFile
Write-Host ""
Write-Host "Database URL is loaded from environment and will not be printed."
Write-Host ""

& pg_dump `
  --dbname="$DbUrl" `
  --format=custom `
  --no-owner `
  --no-privileges `
  --file="$BackupFile"

if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Backup failed."
  Write-Host ""
  exit 1
}

$SizeBytes = (Get-Item $BackupFile).Length

@"
RAFTOP CPAP CARE Pro Backup Manifest
Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Label: $Label
Backup file: $BackupFile
Size bytes: $SizeBytes
Database source: environment variable $DbEnvName
Secrets printed: no
Restore policy: restore only after written approval and dry-run validation
"@ | Set-Content -Path $ManifestFile -Encoding UTF8

Write-Host ""
Write-Host "Backup completed."
Write-Host "Backup file:"
Write-Host $BackupFile
Write-Host ""
Write-Host "Manifest:"
Write-Host $ManifestFile
Write-Host ""

exit 0
