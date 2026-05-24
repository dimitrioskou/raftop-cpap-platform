# RAFTOP CPAP CARE Pro - Phase 38.4 Repository Warning Review

Generated: 2026-05-24 10:19:36

PURPOSE

This review checks whether repository safety scan warnings are controlled before deployment.
No secret values are printed.

------------------------------------------------------------

CHECK: Git available
STATUS: PASS
DETAILS: Git command is available.

CHECK: Git repository detected
STATUS: PASS
DETAILS: .git directory exists.

CHECK: Local .env file presence
STATUS: WARN
DETAILS: Local .env files exist: enterprise-backend\.env; enterprise-frontend\.env

CHECK: Git ignore check for enterprise-backend\.env
STATUS: PASS
DETAILS: This .env file is ignored by Git.

CHECK: Git ignore check for enterprise-frontend\.env
STATUS: PASS
DETAILS: This .env file is ignored by Git.

CHECK: Production env files
STATUS: PASS
DETAILS: No .env.production/.env.prod/.env.live files found inside repo.

CHECK: Project file scan scope
STATUS: PASS
DETAILS: Scannable files: 535

CHECK: Localhost warning review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 4; enterprise-backend\.env: line 7; enterprise-backend\.env: line 8; enterprise-backend\.env: line 9; enterprise-backend\.env.example: line 4; enterprise-backend\.env.example: line 7; enterprise-backend\.env.example: line 8; enterprise-backend\.env.example: line 9; enterprise-backend\src\db.js: line 11; enterprise-backend\src\routes\auth\devPatientLogin.js: line 67; enterprise-backend\src\services\backendProductionConfigAuditService.js: line 18; enterprise-backend\src\services\databaseBackupSafetyAuditService.js: line 90; enterprise-backend\src\services\productionReadinessAuditService.js: line 23; enterprise-backend\src\services\releaseCandidateAuditService.js: line 16; enterprise-backend\src\services\releaseCandidateAuditService.js: line 31; ... plus 97 more

CHECK: 127.0.0.1 warning review
STATUS: WARN
DETAILS: enterprise-backend\src\db.js: line 12; enterprise-backend\src\routes\auth\devPatientLogin.js: line 67; enterprise-backend\src\services\backendProductionConfigAuditService.js: line 19; enterprise-backend\src\services\databaseBackupSafetyAuditService.js: line 90; enterprise-frontend\src\services\frontendProductionConfigAudit.js: line 19; enterprise-frontend\src\services\frontendProductionConfigAudit.js: line 30

CHECK: PostgreSQL URL warning review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 4; enterprise-backend\.env.example: line 4; enterprise-backend\.env.production.example: line 4

CHECK: JWT_SECRET warning review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 5; enterprise-backend\.env.example: line 5; enterprise-backend\.env.production.example: line 5

CHECK: SUPER_ADMIN_API_KEY warning review
STATUS: WARN
DETAILS: enterprise-backend\.env: line 23; enterprise-backend\.env.production.example: line 15; enterprise-frontend\.env: line 3

CHECK: Potential API key warning review
STATUS: WARN
DETAILS: enterprise-backend\src\routes\tenant\atlas.js: line 196; enterprise-backend\src\routes\tenant\atlas.js: line 212; enterprise-backend\src\routes\tenant\atlas.js: line 531; enterprise-backend\src\routes\tenant\atlas.js: line 564; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 172; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 188; enterprise-backend\src\routes\tenant\closedLoopControlSummary.js: line 204; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 215; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 224; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 233; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 242; enterprise-backend\src\routes\tenant\executiveMetrics.js: line 421; enterprise-backend\src\routes\tenant\unifiedTasks.js: line 215; enterprise-backend\src\routes\tenant\unifiedTasks.js: line 237; enterprise-backend\src\routes\tenant\unifiedTasks.js: line 258; ... plus 205 more

------------------------------------------------------------

PASS_COUNT: 6
WARN_COUNT: 7
FAIL_COUNT: 0

FINAL STATUS: PHASE38_REPOSITORY_WARNING_REVIEW_READY_WITH_WARNINGS
