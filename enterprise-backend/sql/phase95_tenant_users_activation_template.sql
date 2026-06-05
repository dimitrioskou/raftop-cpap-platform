-- RAFTOP CPAP CARE Pro
-- Phase 95 - Tenant Users Activation SQL Template
-- TEMPLATE ONLY - DO NOT EXECUTE WITHOUT EDITING VARIABLES
-- Does not contain real passwords.
-- Does not contain real emails.
-- Use Phase 95B to apply with real approved user details.

BEGIN;

-- Ensure tenant exists.
INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-production',
    'Raftopoulos Production',
    'active',
    'enterprise',
    'Production tenant for controlled CPAP portfolio rollout.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    updated_at = now();

-- IMPORTANT:
-- This template assumes public.users supports at least email-like identity and role fields.
-- Phase 95B must inspect users columns before applying real inserts.

-- Placeholder examples only.
-- Replace in Phase 95B after confirming users schema:
-- TENANT_ADMIN_EMAIL
-- OPERATIONS_01_EMAIL
-- OPERATIONS_02_EMAIL
-- VIEWER_01_EMAIL
-- PASSWORD_HASH_OR_TEMP_AUTH_FLOW

COMMIT;
