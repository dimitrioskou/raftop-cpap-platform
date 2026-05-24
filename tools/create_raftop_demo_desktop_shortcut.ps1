$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE"
$LauncherScript = Join-Path $ProjectRoot "tools\launch_raftop_demo.ps1"
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "RAFTOP DEMO LAUNCHER.lnk"

if (!(Test-Path $LauncherScript)) {
    Write-Host "[FAIL] Launcher script not found:" -ForegroundColor Red
    Write-Host $LauncherScript -ForegroundColor Red
    Write-Host "FINAL STATUS: DEMO_SHORTCUT_BLOCKED" -ForegroundColor Red
    exit 1
}

$WScriptShell = New-Object -ComObject WScript.Shell
$Shortcut = $WScriptShell.CreateShortcut($ShortcutPath)

$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$LauncherScript`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.WindowStyle = 1
$Shortcut.Description = "Launch RAFTOP CPAP CARE Pro demo with pre-demo evidence check"

$PowerShellIcon = "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe"
$Shortcut.IconLocation = $PowerShellIcon

$Shortcut.Save()

Write-Host ""
Write-Host "[OK] Desktop shortcut created:" -ForegroundColor Green
Write-Host $ShortcutPath -ForegroundColor Green
Write-Host ""
Write-Host "Double-click this shortcut before every RAFTOP demo." -ForegroundColor Cyan
Write-Host ""
Write-Host "FINAL STATUS: DEMO_SHORTCUT_READY" -ForegroundColor Green
exit 0