# RAFTOP CPAP CARE Pro - Phase 38.3 Repository Safety Scan Result v3

Generated: 2026-05-24 10:14:24

PURPOSE

This scan checks for dangerous production deployment issues before GitHub push and Render deployment.

------------------------------------------------------------

CHECK: Project files loaded
STATUS: PASS
DETAILS: Scannable files: 535

CHECK: Real production env files
STATUS: PASS
DETAILS: No real production env files found.

CHECK: Local env files
STATUS: WARN
DETAILS: Local .env files exist. They must remain ignored by Git: backend\.env; enterprise-backend\.env; enterprise-frontend\.env

CHECK: Localhost references
STATUS: WARN
DETAILS: enterprise-backend\.env: line 4; enterprise-backend\.env: line 7; enterprise-backend\.env: line 8; enterprise-backend\.env: line 9; enterprise-backend\.env.example: line 4; enterprise-backend\.env.example: line 7; enterprise-backend\.env.example: line 8; enterprise-backend\.env.example: line 9; enterprise-backend\src\db.js: line 11; enterprise-backend\src\routes\auth\devPatientLogin.js: line 67; ... plus 102 more

CHECK: 127.0.0.1 references
STATUS: WARN
DETAILS: enterprise-backend\src\db.js: line 12; enterprise-backend\src\routes\auth\devPatientLogin.js: line 67; enterprise-backend\src\services\backendProductionConfigAuditService.js: line 19; enterprise-backend\src\services\databaseBackupSafetyAuditService.js: line 90; enterprise-frontend\src\services\frontendProductionConfigAudit.js: line 19; enterprise-frontend\src\services\frontendProductionConfigAudit.js: line 30

CHECK: PostgreSQL URL in local env
STATUS: WARN
DETAILS: enterprise-backend\.env: line 4

CHECK: JWT_SECRET assignment review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 5; enterprise-backend\.env.example: line 5; enterprise-backend\.env.production.example: line 5

CHECK: SUPER_ADMIN_API_KEY assignment review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 23; enterprise-backend\.env.production.example: line 15; enterprise-frontend\.env: line 3

CHECK: RESTORE_KEY assignment
STATUS: PASS
DETAILS: No RESTORE_KEY assignments found.

CHECK: Potential API key pattern review
STATUS: WARN
DETAILS: enterprise-backend\src\routes\tenant\atlas.js: line 196; enterprise-backend\src\routes\tenant\atlas.js: line 212; enterprise-backend\src\routes\tenant\atlas.js: line 531; enterprise-backend\src\routes\tenant\atlas.js: line 564; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 172; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 188; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 204; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 215; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 224; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 233; ... plus 210 more

------------------------------------------------------------

PASS_COUNT: 3
WARN_COUNT: 7
FAIL_COUNT: 0

FINAL STATUS: PHASE38_REPOSITORY_SAFETY_SCAN_READY_WITH_WARNINGS
