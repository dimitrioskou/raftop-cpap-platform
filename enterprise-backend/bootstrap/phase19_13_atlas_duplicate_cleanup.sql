BEGIN;

ALTER TABLE atlas_tasks
  ADD COLUMN IF NOT EXISTS duplicate_group_key text,
  ADD COLUMN IF NOT EXISTS duplicate_rank integer,
  ADD COLUMN IF NOT EXISTS duplicate_archived_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS duplicate_keep_reason text;

WITH ranked_followups AS (
  SELECT
    id,
    COALESCE(source_action_id, source_ref, case_id, id) AS action_key,
    COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id, source_ref, id) AS signal_key,
    ROW_NUMBER() OVER (
      PARTITION BY
        COALESCE(source_action_id, source_ref, case_id, id),
        COALESCE(linked_signal_id, signal_id, atlas_signal_id, case_id, source_ref, id)
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS rn
  FROM atlas_tasks
  WHERE
    id LIKE 'atlas-task-%'
    OR action_type = 'create_task'
    OR task_type = 'followup_task'
),
updated AS (
  UPDATE atlas_tasks t
  SET
    duplicate_group_key = CONCAT(r.action_key, '::', r.signal_key),
    duplicate_rank = r.rn,
    duplicate_keep_reason = CASE
      WHEN r.rn = 1 THEN 'kept_latest_active_followup_task'
      ELSE 'archived_duplicate_followup_task'
    END,
    status = CASE
      WHEN r.rn = 1 THEN COALESCE(NULLIF(t.status, 'duplicate_archived'), 'open')
      ELSE 'duplicate_archived'
    END,
    writeback_status = CASE
      WHEN r.rn = 1 THEN COALESCE(t.writeback_status, 'synced')
      ELSE 'duplicate_archived'
    END,
    signal_writeback_status = CASE
      WHEN r.rn = 1 THEN COALESCE(t.signal_writeback_status, 'synced')
      ELSE 'duplicate_archived'
    END,
    duplicate_archived_at = CASE
      WHEN r.rn = 1 THEN NULL
      ELSE NOW()
    END,
    updated_at = NOW()
  FROM ranked_followups r
  WHERE t.id = r.id
  RETURNING t.id, t.status, t.duplicate_group_key, t.duplicate_rank
)
SELECT *
FROM updated
ORDER BY duplicate_group_key, duplicate_rank;

COMMIT;

SELECT
  duplicate_group_key,
  COUNT(*) AS total_in_group,
  COUNT(*) FILTER (WHERE duplicate_rank = 1) AS active_kept,
  COUNT(*) FILTER (WHERE duplicate_rank > 1) AS archived_duplicates
FROM atlas_tasks
WHERE duplicate_group_key IS NOT NULL
GROUP BY duplicate_group_key
ORDER BY total_in_group DESC, duplicate_group_key;

SELECT
  id,
  source_action_id,
  source_ref,
  linked_signal_id,
  signal_id,
  task_type,
  action_type,
  status,
  writeback_status,
  signal_writeback_status,
  duplicate_group_key,
  duplicate_rank,
  duplicate_keep_reason,
  duplicate_archived_at,
  created_at
FROM atlas_tasks
WHERE duplicate_group_key IS NOT NULL
ORDER BY duplicate_group_key, duplicate_rank, created_at DESC;