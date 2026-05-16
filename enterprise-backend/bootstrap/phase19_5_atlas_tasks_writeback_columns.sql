BEGIN;

ALTER TABLE atlas_tasks
  ADD COLUMN IF NOT EXISTS linked_signal_id text,
  ADD COLUMN IF NOT EXISTS signal_id text,
  ADD COLUMN IF NOT EXISTS atlas_signal_id text,
  ADD COLUMN IF NOT EXISTS coaching_context_id text,
  ADD COLUMN IF NOT EXISTS linked_coaching_context_id text,
  ADD COLUMN IF NOT EXISTS patient_coaching_context_id text,
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS module text,
  ADD COLUMN IF NOT EXISTS action_type text,
  ADD COLUMN IF NOT EXISTS task_type text,
  ADD COLUMN IF NOT EXISTS linked_task_id text,
  ADD COLUMN IF NOT EXISTS source_action_id text,
  ADD COLUMN IF NOT EXISTS source_ref text,
  ADD COLUMN IF NOT EXISTS writeback_status text,
  ADD COLUMN IF NOT EXISTS signal_writeback_status text,
  ADD COLUMN IF NOT EXISTS coaching_writeback_status text,
  ADD COLUMN IF NOT EXISTS writeback_synced_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS writeback_error text,
  ADD COLUMN IF NOT EXISTS writeback_events jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

UPDATE atlas_tasks
SET
  source_type = COALESCE(source_type, 'atlas_action_center'),
  source = COALESCE(source, 'atlas_action_center'),
  module = COALESCE(module, 'atlas_action_center'),
  action_type = COALESCE(action_type, 'followup_review'),
  task_type = COALESCE(task_type, 'atlas_action'),
  source_action_id = COALESCE(source_action_id, id),
  source_ref = COALESCE(source_ref, case_id, id),
  linked_signal_id = COALESCE(linked_signal_id, case_id),
  signal_id = COALESCE(signal_id, case_id),
  atlas_signal_id = COALESCE(atlas_signal_id, case_id),
  writeback_status = COALESCE(
    writeback_status,
    CASE
      WHEN case_id IS NOT NULL THEN 'pending'
      ELSE 'not_applicable'
    END
  ),
  signal_writeback_status = COALESCE(
    signal_writeback_status,
    CASE
      WHEN case_id IS NOT NULL THEN 'pending'
      ELSE 'skipped'
    END
  ),
  coaching_writeback_status = COALESCE(coaching_writeback_status, 'skipped'),
  writeback_events = COALESCE(writeback_events, '[]'::jsonb),
  metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'phase', '19.5',
    'mapped_case_id_to_linked_signal_id', CASE WHEN case_id IS NOT NULL THEN true ELSE false END,
    'source_action_id', id,
    'source_ref', COALESCE(case_id, id)
  )
WHERE id IS NOT NULL;

COMMIT;

SELECT
  id,
  tenant_id,
  case_id,
  linked_signal_id,
  signal_id,
  atlas_signal_id,
  coaching_context_id,
  writeback_status,
  signal_writeback_status,
  coaching_writeback_status,
  source_type,
  source_action_id,
  source_ref
FROM atlas_tasks
ORDER BY created_at DESC
LIMIT 10;