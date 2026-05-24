# RAFTOP CPAP CARE Pro - Phase 37.7 Production Go-Live Checklist

Generated: 2026-05-24 10:00:07

FINAL STATUS

FINAL STATUS: PHASE37_GO_LIVE_CHECKLIST_READY

------------------------------------------------------------

PURPOSE

This checklist defines the minimum go-live requirements for RAFTOP CPAP CARE Pro.

This document does not approve production launch by itself.
It defines the gates that must be passed before real customers, real providers, or real patient data are onboarded.

------------------------------------------------------------

CURRENT BASELINE

- Phase 35 Master: READY
- Patient Portal and myAir layer: READY
- Patient APIs: READY
- Patient Access Guard: READY
- Advanced Security and Compliance: READY
- User Activity Audit: READY
- Failed Login Audit: READY
- Security Command Center: READY
- Pre-demo check: READY
- Evidence report generator: READY
- Demo launcher: READY
- Demo operations verification: READY
- Phase 36 production baseline: READY WITH WARNINGS
- Phase 36.5 production readiness summary: READY
- Phase 37.1 deployment master checklist: READY
- Phase 37.2 Render backend deployment guide: READY
- Phase 37.3 production PostgreSQL setup guide: READY
- Phase 37.4 frontend deployment guide: READY
- Phase 37.5 production environment checklist: READY
- Phase 37.6 production smoke test script: READY

------------------------------------------------------------

GO-LIVE RULE

RAFTOP CPAP CARE Pro must not go live until all critical gates are passed.

A demo-ready system is not the same as a production-ready system.

Production readiness requires hosted infrastructure, production database, SSL, secrets policy, backups, restore validation, smoke tests, access control verification, and operational support.

------------------------------------------------------------

CRITICAL GO-LIVE BLOCKERS

The system is blocked from production if any of the following are true:

- Production backend is not deployed
- Production frontend is not deployed
- Production PostgreSQL database is missing
- DATABASE_URL points to localhost, demo, staging, expired, or suspended database
- SSL database connection is not verified
- JWT_SECRET is missing or weak
- CORS_ORIGIN is wildcard or wrong
- Frontend calls localhost
- Real secrets exist in GitHub
- Real secrets exist in frontend code
- Backup policy is missing
- Restore test has not been completed
- Tenant isolation has not been verified
- Patient access guard has not been verified
- Admin routes are accessible to non-admin roles
- Patient portal is accessible without proper guard
- Production smoke test has not passed
- Demo data is mixed with production data
- No incident response process exists

------------------------------------------------------------

BACKEND GO-LIVE GATE

Required:

- Backend deployed to production hosting
- NODE_ENV is production
- Health endpoint returns 200
- Auth route exists
- Protected tenant routes respond with 401 or 403 when unauthenticated
- Backend connects to production database
- Helmet is active
- Strict JWT mode is active
- Logs show no startup crash
- No critical 500 errors during smoke test

Status: PENDING UNTIL LIVE DEPLOYMENT

------------------------------------------------------------

DATABASE GO-LIVE GATE

Required:

- Production PostgreSQL database exists
- SSL DATABASE_URL is configured
- DATABASE_URL is stored only in backend hosting environment variables
- Development, demo, staging, and production databases are separate
- Backup policy is active
- Restore test completed
- Admin bootstrap defined
- Tenant bootstrap defined
- Migration strategy defined
- Patient import policy defined
- Audit and security tables verified

Status: PENDING UNTIL PRODUCTION DATABASE EXISTS

------------------------------------------------------------

FRONTEND GO-LIVE GATE

Required:

- Frontend deployed to production hosting
- Production API base URL is configured
- Frontend does not call localhost
- Login page loads
- Admin dashboard loads after login
- Tenant context works
- Patient pages load
- Device pages load
- ATLAS pages load
- Security Command Center loads
- Patient portal routes load
- Direct route refresh works
- No blank white screen
- No exposed frontend secrets

Status: PENDING UNTIL LIVE FRONTEND DEPLOYMENT

------------------------------------------------------------

SECURITY GO-LIVE GATE

Required:

- No production secrets in GitHub
- No production secrets in frontend code
- JWT_SECRET strong and private
- SUPER_ADMIN_API_KEY strong and private
- RESTORE_KEY strong and private
- CORS restricted to production frontend
- Failed login audit active
- User activity audit active
- Patient access guard active
- Role-based route protection verified
- Tenant isolation verified
- Super admin access controlled

Status: PENDING UNTIL SECURITY VERIFICATION

------------------------------------------------------------

TENANT GO-LIVE GATE

Required:

- Production tenant created
- Demo tenant is not used as production tenant
- Tenant plan configured
- Tenant status active
- Patient limit configured
- Seat count configured
- Modules configured
- Provider/admin users assigned
- Tenant isolation test passed

Recommended first production tenant:

- tenant_id: raftopoulos-live
- tenant_name: RAFTOPOULOS
- plan: enterprise
- status: active

Status: PENDING UNTIL TENANT BOOTSTRAP

------------------------------------------------------------

PATIENT DATA GO-LIVE GATE

Required before importing real patient data:

- Import owner assigned
- CSV format locked
- Validation rules defined
- Backup taken before import
- Audit event created for import
- Sample verification completed after import
- Failed imports handled safely
- No patient data imported into demo database

Status: PENDING UNTIL PATIENT IMPORT POLICY IS EXECUTED

------------------------------------------------------------

OPERATIONAL GO-LIVE GATE

Required:

- Support owner assigned
- Incident response process defined
- Backup owner assigned
- Restore process documented
- Admin access policy defined
- Tenant onboarding process defined
- Provider onboarding process defined
- Patient support process defined
- Monitoring approach selected
- Error escalation process defined

Status: PENDING UNTIL OPERATIONS OWNER IS ASSIGNED

------------------------------------------------------------

COMMERCIAL GO-LIVE GATE

Required:

- Commercial offer defined
- Pilot agreement or client approval defined
- Pricing model defined
- Billing/subscription rules defined
- Demo vs production boundary explained to client
- Provider onboarding material ready
- Admin training checklist ready
- Patient communication process ready

Status: PENDING UNTIL COMMERCIAL LAUNCH PACKAGE

------------------------------------------------------------

MINIMUM SMOKE TEST REQUIREMENTS

The production smoke test must verify:

- GET /api/health returns 200
- POST /api/auth/login route exists
- GET /api/tenant/subscription/status route exists
- GET /api/tenant/patients route exists
- GET /api/tenant/devices route exists
- GET /api/tenant/atlas/summary route exists
- Protected routes return acceptable protected responses
- Required routes do not return 404
- Required routes do not return 500

Smoke test command example:

.\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live

Status: PENDING UNTIL PRODUCTION BACKEND EXISTS

------------------------------------------------------------

GO-LIVE DECISION MATRIX

APPROVED FOR DEMO:
- Allowed when demo checks pass and no production patient data is used.

APPROVED FOR STAGING:
- Allowed when backend, frontend, database, and smoke tests work with staging data.

APPROVED FOR CONTROLLED PILOT:
- Allowed only after production infrastructure, access controls, backups, restore test, and tenant isolation are verified.

APPROVED FOR FULL PRODUCTION:
- Allowed only after all critical gates are passed and operational support is active.

------------------------------------------------------------

FINAL GO-LIVE CHECKLIST

- Production backend deployed: PENDING
- Production frontend deployed: PENDING
- Production database created: PENDING
- SSL database connection verified: PENDING
- Production env vars configured: PENDING
- No secrets in GitHub: PENDING
- No secrets in frontend: PENDING
- CORS restricted: PENDING
- JWT strict mode verified: PENDING
- Production smoke test passed: PENDING
- Backup policy active: PENDING
- Restore test completed: PENDING
- Tenant bootstrap completed: PENDING
- Tenant isolation verified: PENDING
- Admin bootstrap completed: PENDING
- Role guards verified: PENDING
- Patient access guard verified: PENDING
- Patient import policy approved: PENDING
- Monitoring approach selected: PENDING
- Incident response process defined: PENDING
- Support owner assigned: PENDING
- Commercial launch package approved: PENDING

------------------------------------------------------------

NEXT PHASE

Phase 38 - Production Deployment Execution Pack

This next phase should prepare the actual deployment execution sequence: backend deployment, database provisioning, frontend deployment, production env setup, smoke test execution, and go-live decision report.

------------------------------------------------------------

FINAL VERDICT

RAFTOP CPAP CARE Pro now has a production go-live checklist.

The system remains demo and pre-production ready, but full production launch requires all critical go-live gates to be passed.

FINAL STATUS: PHASE37_GO_LIVE_CHECKLIST_READY
