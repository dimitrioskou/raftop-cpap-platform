-- RAFTOP CPAP CARE Pro
-- Phase 95B - Real Tenant Users Apply Template
-- TEMPLATE ONLY.
-- Do not commit real emails or real temporary secrets.
-- Do not execute before filling approved user details outside Git.
-- This template was generated after discovering public.users schema.

BEGIN;

-- Ensure tenant is active.
INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-production',
    'Raftopoulos Production',
    'active',
    'enterprise',
    'Production tenant for Raftopoulos controlled CPAP rollout.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    updated_at = now();

-- DISCOVERED USERS COLUMN MAP
-- id column: id
-- login/email column: email
-- secret/hash column: password_hash
-- role column: role
-- tenant column: tenant_id
-- status column: status
-- created_at column: created_at
-- updated_at column: updated_at

-- Next step:
-- Phase 95C must generate an apply script outside Git with:
-- 1. approved buyer emails
-- 2. temporary secrets or auth reset flow
-- 3. exact INSERT/UPSERT syntax matching the discovered columns
-- 4. verification queries
-- 5. separate credentials delivery file outside repository

COMMIT;
