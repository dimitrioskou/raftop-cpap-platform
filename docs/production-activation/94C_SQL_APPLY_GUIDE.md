# RAFTOP CPAP CARE Pro - Phase 94C SQL Apply Guide

REQUIRED_MARKER: PHASE94C_SQL_APPLY_GUIDE
REQUIRED_MARKER: REVIEW_BEFORE_APPLY
REQUIRED_MARKER: APPLY_IN_PHASE94D_ONLY

## Do not apply blindly

This phase only creates the SQL.
Apply happens in Phase 94D.

## SQL file

enterprise-backend/sql/phase94c_production_schema_bootstrap.sql

## Required before applying

1. Confirm DATABASE_URL is correct.
2. Confirm backend health is OK.
3. Confirm psql works.
4. Review SQL file.
5. Confirm no DROP/TRUNCATE/DELETE exists.

## Phase 94D will run

psql $env:RAFTOP_PRODUCTION_DATABASE_URL -f .\enterprise-backend\sql\phase94c_production_schema_bootstrap.sql

Only after review.
