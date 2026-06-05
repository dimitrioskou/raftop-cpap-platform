# RAFTOP CPAP CARE Pro - Users Table Discovery

REQUIRED_MARKER: PHASE95B_USERS_TABLE_DISCOVERY
REQUIRED_MARKER: USERS_SCHEMA_DISCOVERED
REQUIRED_MARKER: REAL_USER_APPLY_NOT_YET_EXECUTED
REQUIRED_MARKER: NO_REAL_PASSWORDS_STORED

## Purpose

This phase inspected the production public.users table before creating real Raftopoulos users.

## Column mapping

ID column:
id

Login/email column:
email

Secret/hash column:
password_hash

Role column:
role

Tenant reference column:
tenant_id

Status/active column:
status

Created at column:
created_at

Updated at column:
updated_at

## Meaning

Real user activation must match the actual production users schema.

## Hard stop

Do not create real users until:
- buyer provides approved names/emails
- temporary credentials are generated outside Git
- exact users insert/update SQL is generated
- credentials delivery process is ready
