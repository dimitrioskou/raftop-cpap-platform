-- RAFTOP CPAP CARE Pro
-- Phase 94C - Production Schema Bootstrap / Compatibility Repair SQL
-- NON-DESTRUCTIVE SCRIPT
-- Creates missing production-compatible tables.
-- No table removal statements.
-- Does not delete data.
-- No table emptying statements.
-- Does not import real patient data.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Canonical tenant compatibility table.
-- Existing production DB may already use tenant_profiles.
-- This table gives stable compatibility for services/scripts expecting tenants.
CREATE TABLE IF NOT EXISTS public.tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    plan_name text DEFAULT 'enterprise',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

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

-- 2. Production patients table.
-- Pseudonymized operational patient registry.
-- No direct identifiers: no AMKA, no phone, no email, no address, no full name.
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    patient_code text NOT NULL,
    doctor_external_id text,
    branch_code text,
    status text NOT NULL DEFAULT 'active',
    setup_date date,
    consent_basis text,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, patient_external_id),
    UNIQUE (tenant_slug, patient_code)
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_slug
ON public.patients (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_patients_doctor_external_id
ON public.patients (doctor_external_id);

CREATE INDEX IF NOT EXISTS idx_patients_status
ON public.patients (status);

-- 3. Production devices table.
CREATE TABLE IF NOT EXISTS public.devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    device_serial text NOT NULL,
    device_model text,
    status text NOT NULL DEFAULT 'active',
    setup_date date,
    last_data_date date,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, device_serial)
);

CREATE INDEX IF NOT EXISTS idx_devices_tenant_slug
ON public.devices (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_devices_patient_external_id
ON public.devices (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_devices_last_data_date
ON public.devices (last_data_date);

-- 4. Production compliance nights / records table.
CREATE TABLE IF NOT EXISTS public.compliance_nights (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text NOT NULL,
    device_serial text,
    record_date date NOT NULL,
    month_start date,
    usage_hours numeric(8,2) DEFAULT 0,
    month_usage_hours numeric(8,2) DEFAULT 0,
    usage_hours_30d numeric(8,2) DEFAULT 0,
    days_used_30d integer DEFAULT 0,
    ahi_avg_30d numeric(8,2),
    leak_avg_30d numeric(8,2),
    is_80h_compliant boolean GENERATED ALWAYS AS (month_usage_hours >= 80) STORED,
    data_source text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tenant_slug, patient_external_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_compliance_tenant_slug
ON public.compliance_nights (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_compliance_patient_external_id
ON public.compliance_nights (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_compliance_month_start
ON public.compliance_nights (month_start);

CREATE INDEX IF NOT EXISTS idx_compliance_80h
ON public.compliance_nights (is_80h_compliant);

-- 5. Generic tasks compatibility table.
-- atlas_tasks may already exist. This table supports endpoints/tools expecting tasks.
CREATE TABLE IF NOT EXISTS public.tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    patient_external_id text,
    task_type text NOT NULL DEFAULT 'follow_up',
    title text NOT NULL,
    description text,
    priority text NOT NULL DEFAULT 'medium',
    status text NOT NULL DEFAULT 'open',
    assigned_to text,
    due_date date,
    source text DEFAULT 'manual',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_tenant_slug
ON public.tasks (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_tasks_patient_external_id
ON public.tasks (patient_external_id);

CREATE INDEX IF NOT EXISTS idx_tasks_status
ON public.tasks (status);

CREATE INDEX IF NOT EXISTS idx_tasks_priority
ON public.tasks (priority);

-- 6. Import audit table.
CREATE TABLE IF NOT EXISTS public.import_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_slug text NOT NULL DEFAULT 'raftopoulos-production',
    import_batch_id text,
    import_stage text,
    source_filename text,
    row_count integer DEFAULT 0,
    status text NOT NULL DEFAULT 'created',
    notes text,
    created_by text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_audit_tenant_slug
ON public.import_audit_logs (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_import_audit_batch
ON public.import_audit_logs (import_batch_id);

-- 7. Safety view for latest patient compliance snapshot.
CREATE OR REPLACE VIEW public.patient_compliance_latest AS
SELECT DISTINCT ON (tenant_slug, patient_external_id)
    tenant_slug,
    patient_external_id,
    device_serial,
    record_date,
    month_start,
    month_usage_hours,
    usage_hours_30d,
    days_used_30d,
    ahi_avg_30d,
    leak_avg_30d,
    is_80h_compliant,
    data_source,
    created_at
FROM public.compliance_nights
ORDER BY tenant_slug, patient_external_id, record_date DESC;

COMMIT;
