-- RAFTOP CPAP CARE Pro
-- Phase 102 - Pilot 20 Tenant/User SQL Template
-- TEMPLATE ONLY.
-- Do not store real passwords here.
-- Real credentials must be generated outside Git.

BEGIN;

INSERT INTO public.tenants (slug, name, status, plan_name, notes)
VALUES (
    'raftopoulos-pilot-20',
    'Raftopoulos Pilot 20',
    'active',
    'pilot',
    'Two-month controlled pilot for 20 pseudonymized CPAP patients.'
)
ON CONFLICT (slug) DO UPDATE
SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    plan_name = EXCLUDED.plan_name,
    notes = EXCLUDED.notes,
    updated_at = now();

-- Pilot users must use tenant_id = 'raftopoulos-pilot-20'
-- Actual user creation happens in Phase 102B / 103 after confirming auth flow.

COMMIT;
