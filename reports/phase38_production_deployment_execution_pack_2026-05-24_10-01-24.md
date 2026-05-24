# RAFTOP CPAP CARE Pro - Phase 38.1 Production Deployment Execution Pack

Generated: 2026-05-24 10:01:24

FINAL STATUS

FINAL STATUS: PHASE38_PRODUCTION_DEPLOYMENT_EXECUTION_PACK_READY

------------------------------------------------------------

PURPOSE

This execution pack defines the ordered production deployment sequence for RAFTOP CPAP CARE Pro.

This phase does not deploy automatically.
It defines the controlled execution path from pre-production readiness to production deployment.

------------------------------------------------------------

CURRENT BASELINE

- Phase 35 Master: READY
- Patient Portal and myAir layer: READY
- Patient APIs: READY
- Patient Access Guard: READY
- Advanced Security and Compliance: READY
- Security Command Center: READY
- Demo Operations: READY
- Phase 36 Production Baseline: READY WITH WARNINGS
- Phase 36.5 Production Readiness Summary: READY
- Phase 37.1 Deployment Master Checklist: READY
- Phase 37.2 Render Backend Deployment Guide: READY
- Phase 37.3 Production PostgreSQL Setup Guide: READY
- Phase 37.4 Frontend Deployment Guide: READY
- Phase 37.5 Production Environment Checklist: READY
- Phase 37.6 Production Smoke Test Script: READY
- Phase 37.7 Go-Live Checklist: READY

------------------------------------------------------------

EXECUTION RULE

Production deployment must follow the correct order.

The wrong order creates false success.

For example, deploying frontend before backend and database are stable creates a working-looking UI that fails under real use.

The correct order is:

1. Freeze code
2. Verify repository
3. Provision production database
4. Configure backend environment variables
5. Deploy backend
6. Verify backend health
7. Deploy frontend
8. Configure backend CORS against frontend URL
9. Run production smoke test
10. Bootstrap production tenant and admin
11. Verify security and tenant isolation
12. Verify backup and restore
13. Make go or no-go decision

------------------------------------------------------------

STEP 1 - CODE FREEZE

Required:

- Stop adding new product features during deployment
- Only allow deployment fixes
- Confirm backend starts locally
- Confirm frontend builds locally
- Confirm tools scripts exist
- Confirm reports directory exists

Acceptance:

- Code freeze approved: PENDING
- Local backend preflight complete: PENDING
- Local frontend preflight complete: PENDING

------------------------------------------------------------

STEP 2 - REPOSITORY VERIFICATION

Required:

- Latest code committed
- Latest code pushed to GitHub
- No real secrets in repository
- No real .env.production file committed
- enterprise-backend exists
- enterprise-frontend exists
- tools exists
- reports exists

Acceptance:

- GitHub repository ready: PENDING
- Secrets scan completed: PENDING

------------------------------------------------------------

STEP 3 - PRODUCTION DATABASE PROVISIONING

Required:

- Create production PostgreSQL database
- Enable SSL connection
- Obtain external DATABASE_URL
- Confirm DATABASE_URL includes sslmode=require when applicable
- Confirm database is not demo, staging, local, expired, or suspended
- Define backup policy
- Define restore test plan

Acceptance:

- Production database created: PENDING
- SSL database URL ready: PENDING
- Backup policy active: PENDING

------------------------------------------------------------

STEP 4 - BACKEND ENVIRONMENT CONFIGURATION

Required backend env vars:

- NODE_ENV=production
- DATABASE_URL=production PostgreSQL SSL URL
- JWT_SECRET=strong production secret
- CORS_ORIGIN=temporary or final frontend URL

Recommended backend env vars:

- RESTORE_KEY=strong private key
- SUPER_ADMIN_API_KEY=strong private key
- DEMO_MODE=false
- LOG_LEVEL=info

Acceptance:

- Backend env vars configured: PENDING
- Weak JWT blocked: PENDING
- No localhost database URL: PENDING

------------------------------------------------------------

STEP 5 - BACKEND DEPLOYMENT

Render backend settings:

- Service type: Web Service
- Runtime: Node.js
- Root directory: enterprise-backend
- Build command: npm install
- Start command: npm start

Required after deployment:

- Service starts
- Logs show no crash
- Database connection works
- Health endpoint responds

Acceptance:

- Backend deployed: PENDING
- Backend logs clean: PENDING

------------------------------------------------------------

STEP 6 - BACKEND HEALTH VERIFICATION

Required check:

GET /api/health

Expected:

- HTTP 200
- JSON response
- No 404
- No 500
- No proxy error

Acceptance:

- Backend health returns 200: PENDING

------------------------------------------------------------

STEP 7 - FRONTEND DEPLOYMENT

Frontend hosting settings:

- Service type: Static Site
- Root directory: enterprise-frontend
- Build command: npm install && npm run build
- Publish directory: build for CRA or dist for Vite

Required env var:

- REACT_APP_API_BASE_URL or VITE_API_BASE_URL must point to production backend

Acceptance:

- Frontend deployed: PENDING
- Frontend opens in browser: PENDING
- Frontend does not call localhost: PENDING

------------------------------------------------------------

STEP 8 - CORS FINALIZATION

After frontend deployment, set backend CORS_ORIGIN to final frontend URL.

Required:

- CORS_ORIGIN equals production frontend URL
- No wildcard CORS
- No localhost CORS in production

Acceptance:

- CORS verified: PENDING
- Frontend can call backend: PENDING

------------------------------------------------------------

STEP 9 - PRODUCTION SMOKE TEST

Use the generated smoke test script:

.\tools\run_phase37_production_smoke_test.ps1 -BackendUrl https://your-backend.onrender.com -TenantId raftopoulos-live

Required checks:

- Health endpoint returns 200
- Auth login route exists
- Tenant subscription route exists
- Patients route exists
- Devices route exists
- ATLAS summary route exists
- Required routes do not return 404
- Required routes do not return 500

Acceptance:

- Production smoke test passed or ready with acceptable warnings: PENDING

------------------------------------------------------------

STEP 10 - PRODUCTION TENANT AND ADMIN BOOTSTRAP

Required:

- Create production tenant
- Create first production admin
- Do not use demo tenant as production tenant
- Do not use weak admin password
- Force password change if applicable
- Log admin creation event

Recommended first production tenant:

- tenant_id: raftopoulos-live
- tenant_name: RAFTOPOULOS
- plan: enterprise
- status: active

Acceptance:

- Production tenant created: PENDING
- Production admin created: PENDING

------------------------------------------------------------

STEP 11 - SECURITY AND TENANT ISOLATION VERIFICATION

Required:

- Admin routes require admin role
- Patient routes require patient access
- Provider/staff roles are restricted
- Tenant A cannot access Tenant B data
- Failed login audit works
- User activity audit works
- Security Command Center loads

Acceptance:

- Role guards verified: PENDING
- Tenant isolation verified: PENDING
- Audit verification completed: PENDING

------------------------------------------------------------

STEP 12 - BACKUP AND RESTORE VERIFICATION

Required:

- Create backup
- Restore backup into separate test or staging database
- Verify login
- Verify tenant records
- Verify patients and devices
- Verify ATLAS data
- Verify audit logs

Acceptance:

- Backup created: PENDING
- Restore test passed: PENDING

------------------------------------------------------------

STEP 13 - GO OR NO-GO DECISION

GO is allowed only if:

- Backend deployed
- Frontend deployed
- Production database active
- SSL verified
- Secrets protected
- Smoke test passed
- Tenant isolation verified
- Backup and restore verified
- Support owner assigned
- Incident response process defined

NO-GO if any critical gate is missing.

Acceptance:

- Go or no-go decision recorded: PENDING

------------------------------------------------------------

EXECUTION CHECKLIST SUMMARY

- Code freeze: PENDING
- Repository verified: PENDING
- Production database provisioned: PENDING
- Backend env vars configured: PENDING
- Backend deployed: PENDING
- Backend health verified: PENDING
- Frontend deployed: PENDING
- CORS finalized: PENDING
- Production smoke test executed: PENDING
- Tenant bootstrap completed: PENDING
- Admin bootstrap completed: PENDING
- Security verified: PENDING
- Tenant isolation verified: PENDING
- Backup verified: PENDING
- Restore verified: PENDING
- Go or no-go decision recorded: PENDING

------------------------------------------------------------

NEXT PHASE

Phase 38.2 - Production Preflight Verification Script

This next phase should create a local verification script that checks whether the project has the required files, tools, deployment guides, smoke test script, and environment templates before actual deployment work begins.

------------------------------------------------------------

FINAL VERDICT

RAFTOP CPAP CARE Pro now has a production deployment execution pack.

The deployment sequence is defined, but production launch remains blocked until the execution gates are completed with real hosted infrastructure.

FINAL STATUS: PHASE38_PRODUCTION_DEPLOYMENT_EXECUTION_PACK_READY
