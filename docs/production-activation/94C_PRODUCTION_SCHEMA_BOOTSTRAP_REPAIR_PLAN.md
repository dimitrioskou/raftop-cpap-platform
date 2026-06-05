# RAFTOP CPAP CARE Pro - Production Schema Bootstrap Repair Plan

REQUIRED_MARKER: PHASE94C_PRODUCTION_SCHEMA_BOOTSTRAP_REPAIR_PLAN
REQUIRED_MARKER: NON_DESTRUCTIVE_SQL_ONLY
REQUIRED_MARKER: CREATES_PATIENTS_DEVICES_COMPLIANCE_TASKS
REQUIRED_MARKER: BEFORE_PHASE95_TENANT_USERS

## Purpose

This phase creates a non-destructive SQL bootstrap script to complete the minimum production schema needed before tenant/user activation.

## Current production DB issue

The current production database appears to have partial schema:
- users exists
- tenant_profiles exists
- tenant_subscriptions exists
- atlas_tasks exists
- demo tables exist

Missing production-compatible tables include:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs

## Created SQL file

enterprise-backend/sql/phase94c_production_schema_bootstrap.sql

## What the SQL does

It creates, if missing:
- tenants
- patients
- devices
- compliance_nights
- tasks
- import_audit_logs
- patient_compliance_latest view

It also inserts/updates:
- raftopoulos-production tenant

## What the SQL does not do

It does not:
- table removal
- table emptying
- delete data
- import real patient data
- create production users
- expose secrets

## Next phase

Phase 94D must apply the SQL to production DB only after review.
Phase 95 can run only after schema apply and verification.
