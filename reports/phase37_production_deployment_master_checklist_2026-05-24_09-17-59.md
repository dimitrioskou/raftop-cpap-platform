# RAFTOP CPAP CARE Pro β€” Phase 37.1 Production Deployment Master Checklist

Generated: 2026-05-24 09:17:59

## FINAL STATUS

**FINAL STATUS: PHASE37_PRODUCTION_DEPLOYMENT_MASTER_CHECKLIST_READY**

---

## Purpose

This checklist defines the minimum production deployment package required before RAFTOP CPAP CARE Pro can move from controlled demo / pre-production readiness into staged live deployment.

This does **not** mean the platform is already live-production ready.

It means the deployment control plan is ready.

---

## Current Baseline

| Layer | Status |
|---|---|
| Phase 35 Master | READY |
| Patient Portal / myAir Layer | READY |
| Patient APIs | READY |
| Patient Access Guard | READY |
| Advanced Security & Compliance | READY |
| Audit Layer | READY |
| Failed Login Audit | READY |
| Security Command Center | READY |
| Demo Launcher | READY |
| Demo Operations | READY |
| Phase 36 Production Baseline | READY WITH WARNINGS |
| Phase 36.5 Production Readiness Summary | READY |

---

## Production Deployment Workstreams

### 1. Backend Deployment

Required:

- Render backend service
- Correct Node.js build/start command
- Production environment variables
- Production CORS allowed origin
- Strict JWT secret
- DATABASE_URL with SSL
- Health endpoint verification
- Auth endpoint verification
- Tenant endpoint verification

Status:

**PENDING**

---

### 2. Production Database

Required:

- PostgreSQL production database
- SSL-enabled external connection string
- Migration/seed strategy
- Admin/bootstrap user strategy
- Tenant bootstrap strategy
- Backup strategy
- Restore test
- Connection pool limits

Status:

**PENDING**

---

### 3. Frontend Deployment

Required:

- Production frontend build
- Correct API base URL
- Hosted frontend service
- Domain or deployment URL
- Login flow test
- Tenant context test
- Patient portal route test
- Admin/security route test

Status:

**PENDING**

---

### 4. Secrets & Environment Policy

Required:

- No production secrets inside Git
- No weak JWT fallback
- Separate development/demo/production env files
- Strong JWT secret
- Restore/admin keys protected
- Super admin key protected
- API URLs separated by environment

Status:

**PARTIALLY READY**

Reason:

Production env templates exist, but live production values are not yet deployed.

---

### 5. Domain / SSL / HTTPS

Required:

- Backend HTTPS
- Frontend HTTPS
- CORS domain allowlist
- Optional custom domain
- SSL verification
- No mixed-content errors

Status:

**PENDING**

---

### 6. Production Smoke Testing

Required:

- Backend health check
- Login check
- Tenant subscription status check
- Patient list check
- Device list check
- ATLAS summary check
- Security command center check
- Patient portal guard check
- Evidence report generation check

Status:

**PENDING**

---

### 7. Access Control

Required:

- Admin role test
- Provider role test
- Staff role test
- Patient role test
- Super admin access restriction
- Tenant isolation test
- Unauthorized access test
- Failed login audit test

Status:

**PENDING**

---

### 8. Commercial Go-Live Controls

Required:

- Tenant onboarding checklist
- Doctor/provider onboarding checklist
- Patient data import policy
- Support process
- Incident response flow
- Backup responsibility
- Billing/subscription activation rules
- Demo vs production separation

Status:

**PENDING**

---

## Production Deployment Risk Register

| Risk | Severity | Required Action |
|---|---:|---|
| Weak or exposed production secrets | Critical | Use hosted env vars only |
| DATABASE_URL without SSL | Critical | Use SSL-required PostgreSQL URL |
| Tenant isolation not verified | Critical | Run tenant isolation test before live clients |
| Patient data exposure | Critical | Confirm access guards and audit logs |
| Demo data mixed with production | High | Separate demo and live tenants |
| Missing backup policy | High | Configure DB backups before onboarding |
| CORS misconfiguration | Medium | Restrict to production frontend domain |
| No smoke test after deployment | High | Run production smoke test script |

---

## Phase 37 Required Deliverables

| Phase | Deliverable | Status |
|---|---|---|
| 37.1 | Production Deployment Master Checklist | READY |
| 37.2 | Render Backend Deployment Guide | NEXT |
| 37.3 | Production PostgreSQL Setup Guide | PENDING |
| 37.4 | Frontend Deployment Guide | PENDING |
| 37.5 | Production Environment Checklist | PENDING |
| 37.6 | Production Smoke Test Script | PENDING |
| 37.7 | Go-Live Checklist | PENDING |

---

## Next Step

Proceed to:

**Phase 37.2 β€” Render Backend Deployment Guide**

This will define exactly how to deploy the backend safely to Render without exposing secrets and without relying on local development configuration.

---

## Final Verdict

The production deployment control plan is now defined.

**FINAL STATUS: PHASE37_PRODUCTION_DEPLOYMENT_MASTER_CHECKLIST_READY**
