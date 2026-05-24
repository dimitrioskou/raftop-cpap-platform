# RAFTOP CPAP CARE Pro - Phase 37.3 Production PostgreSQL Setup Guide

Generated: 2026-05-24 09:53:26

FINAL STATUS

FINAL STATUS: PHASE37_PRODUCTION_POSTGRESQL_SETUP_GUIDE_READY

------------------------------------------------------------

PURPOSE

This guide defines the production PostgreSQL preparation plan for RAFTOP CPAP CARE Pro.

This phase does not create the database automatically.
It defines the production database rules before live deployment.

------------------------------------------------------------

CORE RULE

The production database must be separate from development, demo, test, expired, suspended, or debugging databases.

Real patient data must never be stored in a demo or test database.

------------------------------------------------------------

REQUIRED INFRASTRUCTURE

- Database Engine: PostgreSQL
- Hosting: Render PostgreSQL, Neon, Supabase, or another production-grade PostgreSQL provider
- SSL: Required
- Backups: Required
- Restore Test: Required before go-live
- Demo and Production Separation: Required
- Access Control: Restricted
- Connection String: Stored only in hosted environment variables

------------------------------------------------------------

PRODUCTION DATABASE_URL

Required format:

postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require

Not allowed:

- localhost
- 127.0.0.1
- demo database
- test database
- expired database
- suspended Render database

------------------------------------------------------------

RECOMMENDED ENVIRONMENT STRUCTURE

- Development database: raftop_dev
- Demo database: raftop_demo
- Staging database: raftop_staging
- Production database: raftop_production

------------------------------------------------------------

REQUIRED DATA MODULES

- users
- tenants
- patients
- devices
- compliance records
- tasks
- notes
- referrals
- notifications
- subscriptions
- atlas signals
- atlas actions
- audit logs
- failed login logs
- patient access records
- security events

------------------------------------------------------------

BACKUP POLICY

- Automated database backup: daily
- Manual backup before major updates: required
- Backup retention: at least 7 days
- Restore test: required before go-live and after major schema changes

A backup is not enough. Restore must be tested.

------------------------------------------------------------

RESTORE TEST

Minimum restore test:

1. Create backup.
2. Restore into a separate test or staging database.
3. Verify core tables.
4. Verify login.
5. Verify tenant.
6. Verify patients and devices.
7. Verify ATLAS.
8. Verify audit logs.

If restore was not tested, backup is only a hope.

------------------------------------------------------------

MIGRATION AND SEED STRATEGY

- Schema creation: SQL migrations or controlled bootstrap
- Initial admin user: bootstrap script
- Initial tenant: bootstrap script
- Demo data: not inside production database
- Patient import: controlled CSV import flow
- Rollback: backup before migration
- Schema changes: versioned migration plan only

------------------------------------------------------------

ADMIN BOOTSTRAP

The production database must have a controlled initial admin.

Requirements:

- no hardcoded password
- no admin123 password
- no public password sharing
- mandatory password change after first login
- audit event for admin creation

------------------------------------------------------------

TENANT BOOTSTRAP

First production tenant requirements:

- tenant_id: raftopoulos-live
- tenant_name: RAFTOPOULOS
- plan: enterprise
- status: active
- patient_limit: real commercial limit
- seats: real user count
- modules: patient portal, atlas, compliance, security

The demo tenant must not become the production tenant.

------------------------------------------------------------

PATIENT DATA IMPORT RULES

Before importing real patient data:

1. Assign import owner.
2. Use a fixed CSV format.
3. Validate before import.
4. Reject incomplete records.
5. Write audit event.
6. Take backup before import.
7. Run sample verification after import.

------------------------------------------------------------

SSL RULES

Backend to database connection must use SSL.

Required DATABASE_URL suffix:

?sslmode=require

If SSL/TLS required appears, the DATABASE_URL or backend SSL configuration is wrong.

------------------------------------------------------------

ACCESS CONTROL

Production database access must be limited to:

- backend service
- authorized admin or devops operator
- backup and restore process

Frontend, demo users, public scripts, and unrelated partners must not access the database directly.

------------------------------------------------------------

ACCEPTANCE CHECKLIST

- Production database created: PENDING
- SSL DATABASE_URL available: PENDING
- DATABASE_URL stored only in Render env vars: PENDING
- Development and demo databases separated: PENDING
- Backup policy selected: PENDING
- Restore test completed: PENDING
- Admin bootstrap defined: PENDING
- Tenant bootstrap defined: PENDING
- Migration strategy defined: PENDING
- Patient import policy defined: PENDING
- Audit and security tables verified: PENDING

------------------------------------------------------------

CRITICAL RISKS

- Demo database used as production: Critical
- No SSL: Critical
- No backup: Critical
- No restore test: High
- Demo data inside production: High
- Weak admin bootstrap: High
- Tenant mix-up: Critical
- Patient import without validation: Critical

------------------------------------------------------------

NEXT PHASE

Phase 37.4 - Frontend Deployment Guide

This will define frontend deployment, production backend connection, login verification, tenant context verification, patient portal verification, and admin route verification.

------------------------------------------------------------

FINAL VERDICT

RAFTOP CPAP CARE Pro now has a production PostgreSQL setup guide.

The platform must not go live until production database, SSL, backups, restore test, admin bootstrap, tenant bootstrap, and migration strategy are completed.

FINAL STATUS: PHASE37_PRODUCTION_POSTGRESQL_SETUP_GUIDE_READY
