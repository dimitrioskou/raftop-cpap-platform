# RAFTOP CPAP CARE Pro - Phase 37.4 Frontend Deployment Guide

Generated: 2026-05-24 09:54:41

FINAL STATUS

FINAL STATUS: PHASE37_FRONTEND_DEPLOYMENT_GUIDE_READY

------------------------------------------------------------

PURPOSE

This guide defines the production frontend deployment plan for RAFTOP CPAP CARE Pro.

The frontend must be deployed only after the production backend URL and production environment policy are clear.

------------------------------------------------------------

FRONTEND DEPLOYMENT TARGET

- Platform: Render Static Site, Vercel, Netlify, or similar production frontend hosting
- Application directory: enterprise-frontend
- Build system: React
- Production build command: npm install && npm run build
- Publish directory: build or dist, depending on the frontend toolchain
- API connection: production backend URL only

------------------------------------------------------------

CRITICAL RULE

The production frontend must never point to localhost, demo backend, or stale backend URLs.

The frontend API base URL must point to the production backend service.

Example production API URL:

https://your-backend.onrender.com

Not allowed:

- http://localhost:5001
- http://127.0.0.1:5001
- expired Render backend
- old demo backend
- staging backend used as production

------------------------------------------------------------

REQUIRED FRONTEND ENVIRONMENT VARIABLES

The exact variable name depends on the React setup.

Common CRA pattern:

REACT_APP_API_BASE_URL=https://your-backend.onrender.com

Common Vite pattern:

VITE_API_BASE_URL=https://your-backend.onrender.com

Only one correct production API base URL should be active.

------------------------------------------------------------

PRODUCTION BUILD REQUIREMENTS

- Dependencies install successfully
- Frontend builds without fatal errors
- Production API URL is configured
- No localhost backend reference remains
- No demo-only frontend flags remain enabled
- Patient portal routes are included
- Admin routes are included
- Tenant context UI works
- Auth state persists correctly

------------------------------------------------------------

SUGGESTED RENDER STATIC SITE SETTINGS

- Service type: Static Site
- Root directory: enterprise-frontend
- Build command: npm install && npm run build
- Publish directory for Create React App: build
- Publish directory for Vite: dist
- Environment: production

If the project uses Create React App, publish directory is usually build.
If the project uses Vite, publish directory is usually dist.

------------------------------------------------------------

FRONTEND DEPLOYMENT STEPS

1. Confirm latest code is pushed to GitHub.
2. Create a new frontend hosting service.
3. Set root directory to enterprise-frontend.
4. Set build command.
5. Set publish directory.
6. Add production API base URL environment variable.
7. Deploy latest commit.
8. Open the deployed frontend URL.
9. Run login and route verification.

------------------------------------------------------------

REQUIRED FRONTEND ROUTE CHECKS

- Login page loads
- Admin dashboard loads after login
- Tenant context bar loads
- Patients page loads
- Devices page loads
- Compliance page loads
- ATLAS pages load
- Security Command Center loads
- Patient portal login or access flow loads
- Patient dashboard loads
- Patient therapy page loads
- Demo launcher routes do not expose restricted production controls

------------------------------------------------------------

ACCEPTABLE RESPONSES

- Login page renders
- Protected routes redirect unauthenticated users
- Authenticated routes load after login
- Tenant data appears only for the selected tenant
- Patient routes are guarded
- API errors are displayed safely

------------------------------------------------------------

NOT ACCEPTABLE RESPONSES

- Blank white screen
- Cannot GET route errors
- 404 for expected frontend routes
- Mixed content errors
- CORS errors caused by wrong backend origin
- Frontend still calling localhost
- Frontend calling old demo backend
- Patient portal accessible without guard
- Admin routes accessible to patient role

------------------------------------------------------------

CORS DEPENDENCY

The backend CORS_ORIGIN must match the production frontend URL.

Example:

Frontend URL:
https://raftop-frontend.onrender.com

Backend CORS_ORIGIN:
https://raftop-frontend.onrender.com

Wildcard CORS is not acceptable for production.

------------------------------------------------------------

SECURITY RULES

- Do not store secrets in frontend code
- Do not expose SUPER_ADMIN_API_KEY
- Do not expose RESTORE_KEY
- Do not expose database credentials
- Do not expose JWT secret
- Do not hardcode production tokens
- Patient portal must remain guarded
- Admin tools must remain role-protected

------------------------------------------------------------

COMMON FRONTEND DEPLOYMENT FAILURES

- Build failed: check dependencies and package.json
- Wrong publish directory: use build for CRA or dist for Vite
- API not working: check API base URL
- CORS blocked: backend CORS_ORIGIN is wrong
- Login fails: backend URL, auth route, or database problem
- Blank screen: check browser console and build output
- Route not found on refresh: hosting rewrite rule may be missing
- Localhost calls in production: environment variable is wrong

------------------------------------------------------------

SPA REWRITE RULE

React single page apps often need a rewrite rule so direct route refresh works.

Required behavior:

All frontend routes should serve index.html.

Without this, routes may work through navigation but fail on browser refresh.

------------------------------------------------------------

MINIMUM FRONTEND ACCEPTANCE CHECKLIST

- Frontend deployed: PENDING
- Production API URL configured: PENDING
- No localhost references: PENDING
- Login page tested: PENDING
- Admin dashboard tested: PENDING
- Tenant context tested: PENDING
- Patients page tested: PENDING
- Devices page tested: PENDING
- ATLAS page tested: PENDING
- Security Command Center tested: PENDING
- Patient portal tested: PENDING
- Route refresh tested: PENDING
- CORS verified: PENDING
- Role guards verified: PENDING

------------------------------------------------------------

NEXT PHASE

Phase 37.5 - Production Environment Checklist

This will consolidate backend env vars, frontend env vars, database URL rules, secrets policy, CORS policy, and deployment validation.

------------------------------------------------------------

FINAL VERDICT

RAFTOP CPAP CARE Pro now has a frontend deployment guide.

The frontend must not be treated as production-ready until production API URL, CORS, route refresh, role guards, tenant context, and patient portal access are verified.

FINAL STATUS: PHASE37_FRONTEND_DEPLOYMENT_GUIDE_READY
