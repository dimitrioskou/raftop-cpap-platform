# RAFTOP CPAP CARE Pro - Tenant + Users + Credentials Activation Pack

REQUIRED_MARKER: PHASE95_TENANT_USERS_CREDENTIALS_ACTIVATION_PACK
REQUIRED_MARKER: TENANT_RAFTOPoulos_PRODUCTION
REQUIRED_MARKER: USERS_READY_FOR_PHASE95B_APPLY
REQUIRED_MARKER: NO_REAL_PASSWORDS_STORED
REQUIRED_MARKER: CREDENTIALS_SEPARATE_DELIVERY

## Purpose

This pack prepares the production tenant/user activation for Raftopoulos.

It does not execute SQL.
It does not create users yet.
It does not store real passwords.
It does not expose secrets.

## Tenant

Tenant slug:
raftopoulos-production

Tenant name:
Raftopoulos Production

## Initial access model

1. Platform Super Admin
   - stays with platform owner
   - not shared with buyer

2. Tenant Admin
   - Raftopoulos management
   - controls only raftopoulos-production tenant

3. Operations Users
   - follow-up / CPAP support team
   - patient monitoring and task workflow

4. Management Viewer
   - read-only dashboards/reports

5. Doctor Users
   - future stage

6. Patient Users
   - future stage

## Next phase

Phase 95B will apply real user activation only after:
- Phase 94D schema verified
- buyer confirms named users
- temporary passwords are generated outside Git
- credentials are delivered separately
