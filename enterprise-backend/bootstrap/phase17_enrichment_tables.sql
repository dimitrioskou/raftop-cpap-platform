BEGIN;

CREATE TABLE IF NOT EXISTS coaching_assignments (
  id BIGSERIAL PRIMARY KEY,
  patient_email TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  priority TEXT NOT NULL DEFAULT 'warning',
  trigger_reason TEXT,
  why_this_lesson TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_assignments_patient_email
  ON coaching_assignments (LOWER(patient_email));

CREATE INDEX IF NOT EXISTS idx_coaching_assignments_status
  ON coaching_assignments (status);

CREATE INDEX IF NOT EXISTS idx_coaching_assignments_updated_at
  ON coaching_assignments (updated_at DESC);

CREATE TABLE IF NOT EXISTS import_jobs (
  id BIGSERIAL PRIMARY KEY,
  patient_email TEXT,
  source_type TEXT NOT NULL DEFAULT 'csv_import',
  source_name TEXT NOT NULL DEFAULT 'Import Center',
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_patient_email
  ON import_jobs (LOWER(patient_email));

CREATE INDEX IF NOT EXISTS idx_import_jobs_status
  ON import_jobs (status);

CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at
  ON import_jobs (created_at DESC);

/*
  Demo seed rows
  Μπαίνουν μόνο αν δεν υπάρχουν ήδη αντίστοιχα records
*/

INSERT INTO coaching_assignments (
  patient_email,
  lesson_id,
  status,
  priority,
  trigger_reason,
  why_this_lesson
)
SELECT
  'patient@raftop.local',
  'first_4_hours_protocol',
  'assigned',
  'warning',
  'Usage below therapeutic target',
  'Patient needs early adherence reinforcement.'
WHERE NOT EXISTS (
  SELECT 1
  FROM coaching_assignments
  WHERE LOWER(patient_email) = LOWER('patient@raftop.local')
    AND lesson_id = 'first_4_hours_protocol'
);

INSERT INTO coaching_assignments (
  patient_email,
  lesson_id,
  status,
  priority,
  trigger_reason,
  why_this_lesson
)
SELECT
  'patient1@raftop.local',
  'mask_comfort_recovery',
  'in_progress',
  'critical',
  'Patient reported discomfort and fragmented sleep',
  'Coaching escalation for mask tolerance and rapid recovery.'
WHERE NOT EXISTS (
  SELECT 1
  FROM coaching_assignments
  WHERE LOWER(patient_email) = LOWER('patient1@raftop.local')
    AND lesson_id = 'mask_comfort_recovery'
);

INSERT INTO import_jobs (
  patient_email,
  source_type,
  source_name,
  status,
  error_message
)
SELECT
  'patient2@raftop.local',
  'csv_import',
  'AirView CSV',
  'failed',
  'Malformed CSV header'
WHERE NOT EXISTS (
  SELECT 1
  FROM import_jobs
  WHERE LOWER(COALESCE(patient_email, '')) = LOWER('patient2@raftop.local')
    AND source_name = 'AirView CSV'
    AND status = 'failed'
);

INSERT INTO import_jobs (
  patient_email,
  source_type,
  source_name,
  status,
  error_message
)
SELECT
  'patient@raftop.local',
  'csv_import',
  'Import Center',
  'completed',
  NULL
WHERE NOT EXISTS (
  SELECT 1
  FROM import_jobs
  WHERE LOWER(COALESCE(patient_email, '')) = LOWER('patient@raftop.local')
    AND source_name = 'Import Center'
    AND status = 'completed'
);

COMMIT;