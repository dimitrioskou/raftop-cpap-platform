$EnvPath = "C:\Users\Administrator\Desktop\RAFTOP_CPA_CARE\enterprise-frontend\.env.production"

Set-Content $EnvPath @"
REACT_APP_API_URL=https://raftop-enterprise-backend.onrender.com
REACT_APP_API_BASE_URL=https://raftop-enterprise-backend.onrender.com
REACT_APP_BACKEND_URL=https://raftop-enterprise-backend.onrender.com
REACT_APP_SHOW_DANGEROUS_DEV_CONTROLS=false
"@ -Encoding UTF8

Write-Host ""
Write-Host "Frontend ENV switched to RENDER production backend." -ForegroundColor Green