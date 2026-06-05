# RAFTOP CPAP CARE Pro - Phase 95 Apply Guide

REQUIRED_MARKER: PHASE95_SQL_APPLY_GUIDE
REQUIRED_MARKER: PHASE95B_APPLY_ONLY_AFTER_USER_SCHEMA_DISCOVERY
REQUIRED_MARKER: REAL_EMAILS_OUTSIDE_GIT
REQUIRED_MARKER: PASSWORDS_OUTSIDE_GIT

## Meaning

Phase 95 only prepares activation material.

## Do not execute the SQL template directly

The users table schema must be inspected first.

## Required before Phase 95B

1. Confirm Phase 94D passed.
2. Inspect public.users columns.
3. Confirm auth model:
   - email column
   - password/hash column
   - role column
   - tenant reference column
4. Get named buyer users.
5. Generate temporary credentials outside Git.
6. Apply SQL safely.
7. Verify login.

## Real user creation happens in Phase 95B

Phase 95B must:
- inspect users table
- create exact SQL based on actual columns
- avoid committing real emails/passwords if confidential
- verify users exist
- create separate credentials delivery file outside repo
