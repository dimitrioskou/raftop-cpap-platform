# RAFTOP CPAP CARE Pro - Phase 37.5 Production Environment Checklist

Generated: 2026-05-24 09:56:03

FINAL STATUS

FINAL STATUS: PHASE37_PRODUCTION_ENVIRONMENT_CHECKLIST_READY

------------------------------------------------------------

PURPOSE

This checklist defines the production environment variable policy for RAFTOP CPAP CARE Pro.

This phase consolidates backend environment variables, frontend environment variables, database URL rules, secrets policy, CORS policy, and deployment validation.

------------------------------------------------------------

CORE RULE

Production configuration must be stored only in hosting provider environment variables.

Production secrets must never be committed to GitHub.

Production secrets must never be placed in frontend code.

------------------------------------------------------------

BACKEND REQUIRED ENVIRONMENT VARIABLES

- NODE_ENV=production
- DATABASE_URL=production PostgreSQL URL with SSL
- JWT_SECRET=strong private secret
- CORS_ORIGIN=production frontend URL

Recommended backend environment variables:

- RESTORE_KEY=strong private restore key
- SUPER_ADMIN_API_KEY=strong private super admin key
- DEMO_MODE=false
- LOG_LEVEL=info

------------------------------------------------------------

FRONTEND REQUIRED ENVIRONMENT VARIABLES

The exact variable depends on the frontend build tool.

For Create React App:

- REACT_APP_API_BASE_URL=https://production-backend-url

For Vite:

- VITE_API_BASE_URL=https://production-backend-url

Only one production API base URL should be active.

The frontend must never contain secrets.

------------------------------------------------------------

DATABASE_URL RULES

Production DATABASE_URL must:

- point to production PostgreSQL
- use SSL
- be stored only in backend hosting env vars
- not point to localhost
- not point to demo database
- not point to staging database
- not point to expired or suspended database

Required format:

postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require

------------------------------------------------------------

JWT_SECRET RULES

JWT_SECRET must be:

- strong
- random
- private
- unique for production
- different from development and demo

Not allowed values:

- secret
- jwtsecret
- password
- admin
- raftop
- 123456
- demo
- development

If strict JWT mode blocks startup, the production JWT_SECRET is missing or weak.

------------------------------------------------------------

CORS RULES

Backend CORS_ORIGIN must match the production frontend URL.

Example:

CORS_ORIGIN=https://raftop-frontend.onrender.com

Not allowed:

- CORS_ORIGIN=*
- CORS_ORIGIN=http://localhost:3001
- CORS_ORIGIN=http://127.0.0.1:3001
- missing CORS_ORIGIN in production

Wildcard CORS is not acceptable for production.

------------------------------------------------------------

ADMIN AND RESTORE KEY RULES

SUPER_ADMIN_API_KEY and RESTORE_KEY must:

- be strong
- be private
- be stored only in backend env vars
- not appear in frontend code
- not appear in reports
- not appear in GitHub
- not be shared in public messages

These keys should be rotated if exposure is suspected.

------------------------------------------------------------

DEMO VS PRODUCTION SEPARATION

Production must be separate from demo in:

- database
- tenant data
- user accounts
- patient records
- API base URL
- frontend deployment
- admin keys
- JWT secret
- import files
- reports

Demo tenant must not become the production tenant.

------------------------------------------------------------

ENVIRONMENT FILE POLICY

Allowed:

- .env.example files
- .env.production.example files
- documentation without real secrets

Not allowed:

- real .env.production committed to GitHub
- real DATABASE_URL committed to GitHub
- real JWT_SECRET committed to GitHub
- real admin keys committed to GitHub
- frontend files containing backend secrets

------------------------------------------------------------

BACKEND ENVIRONMENT ACCEPTANCE CHECKLIST

- NODE_ENV is production: PENDING
- DATABASE_URL is production database: PENDING
- DATABASE_URL uses SSL: PENDING
- JWT_SECRET is strong: PENDING
- CORS_ORIGIN matches production frontend: PENDING
- RESTORE_KEY is strong: PENDING
- SUPER_ADMIN_API_KEY is strong: PENDING
- DEMO_MODE is false or controlled: PENDING
- No localhost backend config: PENDING

------------------------------------------------------------

FRONTEND ENVIRONMENT ACCEPTANCE CHECKLIST

- Production API base URL configured: PENDING
- Frontend does not call localhost: PENDING
- Frontend does not expose secrets: PENDING
- Build succeeds: PENDING
- Login flow reaches production backend: PENDING
- Tenant context reaches production backend: PENDING
- Patient portal reaches production backend: PENDING

------------------------------------------------------------

SECURITY ACCEPTANCE CHECKLIST

- No real secrets in GitHub: PENDING
- No real secrets in frontend: PENDING
- JWT strict mode active: PENDING
- Helmet active: PENDING
- CORS restricted: PENDING
- Admin keys protected: PENDING
- Restore key protected: PENDING
- Audit logging active: PENDING
- Failed login audit active: PENDING

------------------------------------------------------------

DEPLOYMENT VALIDATION

After setting production environment variables, validate:

- backend starts successfully
- health endpoint returns OK
- database connection works
- login route responds
- protected routes return 401 or 403 when unauthenticated
- frontend calls production backend
- CORS does not block frontend
- patient portal remains guarded
- admin routes remain role-protected

------------------------------------------------------------

COMMON ENVIRONMENT FAILURES

- Missing DATABASE_URL
- Missing JWT_SECRET
- Weak JWT_SECRET blocked by strict mode
- DATABASE_URL points to localhost
- DATABASE_URL points to old Render database
- SSL/TLS required
- CORS blocked
- Frontend calls localhost in production
- Backend starts but database connection fails
- Secrets accidentally added to GitHub

------------------------------------------------------------

MINIMUM GO-LIVE REQUIREMENTS

Before production go-live, the following must be true:

- production backend env vars configured
- production frontend env vars configured
- production PostgreSQL configured
- SSL database connection verified
- frontend CORS verified
- no secrets in GitHub
- no secrets in frontend
- demo and production data separated
- smoke test script passes

------------------------------------------------------------

NEXT PHASE

Phase 37.6 - Production Smoke Test Script

This will create a script that checks backend health, route availability, protected route behavior, environment readiness, and production endpoint responses.

------------------------------------------------------------

FINAL VERDICT

RAFTOP CPAP CARE Pro now has a production environment checklist.

The system must not go live until production environment variables, database URL, JWT secret, CORS, frontend API URL, and secrets policy are verified.

FINAL STATUS: PHASE37_PRODUCTION_ENVIRONMENT_CHECKLIST_READY
