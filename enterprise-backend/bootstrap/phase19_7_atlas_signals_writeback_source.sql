BEGIN;

CREATE TABLE IF NOT EXISTS atlas_signals (
  id text PRIMARY KEY,
  tenant_id text,
  patient_name text,
  title text,
  description text,
  priority text DEFAULT 'medium',
  status text DEFAULT 'open',
  task_status text DEFAULT 'pending',
  followup_status text DEFAULT 'pending',
  source_type text DEFAULT 'atlas_action_center',
  source_action_id text,
  source_ref text,
  last_task_action text,
  last_action text,
  last_action_by text,
  last_action_payload jsonb DEFAULT '{}'::jsonb,
  last_writeback_at timestamp with time zone,
  writeback_synced_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE atlas_signals
  ADD COLUMN IF NOT EXISTS tenant_id text,
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS task_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS followup_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'atlas_action_center',
  ADD COLUMN IF NOT EXISTS source_action_id text,
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS last_task_action text,
  ADD COLUMN IF NOT EXISTS last_action text,
  ADD COLUMN IF NOT EXISTS last_action_by text,
  ADD COLUMN IF NOT EXISTS last_action_payload jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_writeback_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

INSERT INTO atlas_signals (
  id,
  tenant_id,
  patient_name,
  title,
  description,
  priority,
  status,
  task_status,
  followup_status,
  source_type,
  source_action_id,
  source_ref,
  metadata
)
SELECT DISTINCT ON (COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id))
  COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id) AS id,
  tenant_id,
  patient_name,
  title,
  CONCAT('Signal source created from atlas_tasks action ', id) AS description,
  COALESCE(priority, 'medium') AS priority,
  CASE
    WHEN status IN ('done', 'resolved', 'closed', 'completed') THEN 'resolved'
    ELSE COALESCE(status, 'open')
  END AS status,
  COALESCE(signal_writeback_status, 'pending') AS task_status,
  COALESCE(signal_writeback_status, 'pending') AS followup_status,
  COALESCE(source_type, 'atlas_action_center') AS source_type,
  id AS source_action_id,
  COALESCE(source_ref, case_id, id) AS source_ref,
  jsonb_build_object(
    'phase', '19.7',
    'created_from', 'atlas_tasks',
    'atlas_task_id', id,
    'case_id', case_id,
    'linked_signal_id', COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id)
  ) AS metadata
FROM atlas_tasks
WHERE COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id) IS NOT NULL
ORDER BY COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id), created_at DESC
ON CONFLICT (id) DO UPDATE
SET
  tenant_id = COALESCE(EXCLUDED.tenant_id, atlas_signals.tenant_id),
  patient_name = COALESCE(EXCLUDED.patient_name, atlas_signals.patient_name),
  title = COALESCE(EXCLUDED.title, atlas_signals.title),
  description = COALESCE(EXCLUDED.description, atlas_signals.description),
  priority = COALESCE(EXCLUDED.priority, atlas_signals.priority),
  source_type = COALESCE(EXCLUDED.source_type, atlas_signals.source_type),
  source_action_id = COALESCE(EXCLUDED.source_action_id, atlas_signals.source_action_id),
  source_ref = COALESCE(EXCLUDED.source_ref, atlas_signals.source_ref),
  metadata = COALESCE(atlas_signals.metadata, '{}'::jsonb) || COALESCE(EXCLUDED.metadata, '{}'::jsonb),
  updated_at = now();

CREATE INDEX IF NOT EXISTS idx_atlas_signals_tenant_id
  ON atlas_signals (tenant_id);

CREATE INDEX IF NOT EXISTS idx_atlas_signals_status
  ON atlas_signals (status);

CREATE INDEX IF NOT EXISTS idx_atlas_signals_task_status
  ON atlas_signals (task_status);

CREATE INDEX IF NOT EXISTS idx_atlas_signals_source_action_id
  ON atlas_signals (source_action_id);

COMMIT;

SELECT
  id,
  tenant_id,
  patient_name,
  title,
  status,
  task_status,
  followup_status,
  source_action_id,
  source_ref,
  last_task_action,
  last_writeback_at,
  writeback_synced_at
FROM atlas_signals
ORDER BY created_at DESC
LIMIT 10;