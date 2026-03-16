import React, { useEffect, useMemo, useState } from 'react';
import {
  getFollowUpPatients,
  createFollowUpTask,
  createFollowUpOutcome,
  createFollowUpNote,
  getFollowUpOutcomesSummary
} from '../api/followup';

const pageStyle = {
  padding: 24
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  boxSizing: 'border-box'
};

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 600,
  cursor: 'pointer'
};

const primaryButtonStyle = {
  ...buttonStyle,
  background: '#111827',
  color: '#ffffff',
  border: '1px solid #111827'
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getPatientId(patient) {
  return (
    patient?.patientId ||
    patient?.patient_id ||
    patient?.id ||
    patient?._id ||
    patient?.patients?.id ||
    patient?.patients?._id
  );
}

function getPatientName(patient) {
  if (patient?.patients) {
    const full = `${patient.patients.first_name || ''} ${patient.patients.last_name || ''}`.trim();
    if (full) return full;
  }

  if (patient?.patientName) return patient.patientName;
  if (patient?.fullName) return patient.fullName;
  if (patient?.name) return patient.name;

  const fallback = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
  return fallback || 'Patient';
}

function getPatientPhone(patient) {
  return (
    patient?.patients?.phone ||
    patient?.phone ||
    patient?.mobile ||
    patient?.telephone ||
    '-'
  );
}

function getUsageHours(patient) {
  return (
    patient?.usage_hours ??
    patient?.usageHours ??
    patient?.hours_used ??
    patient?.hours ??
    0
  );
}

function getTargetHours(patient) {
  return (
    patient?.target_hours ??
    patient?.targetHours ??
    80
  );
}

function getComplianceStatus(patient) {
  return (
    patient?.compliance_status ||
    patient?.complianceStatus ||
    'warning'
  );
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function badgeStyle(type, value) {
  const v = String(value || '').toLowerCase();

  if (type === 'status') {
    if (v === 'critical') {
      return {
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5'
      };
    }
    if (v === 'warning') {
      return {
        background: '#ffedd5',
        color: '#9a3412',
        border: '1px solid #fdba74'
      };
    }
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (type === 'priority') {
    if (v === 'critical') {
      return {
        background: '#fee2e2',
        color: '#991b1b',
        border: '1px solid #fca5a5'
      };
    }
    if (v === 'high') {
      return {
        background: '#ffedd5',
        color: '#9a3412',
        border: '1px solid #fdba74'
      };
    }
    if (v === 'low') {
      return {
        background: '#ecfdf5',
        color: '#047857',
        border: '1px solid #a7f3d0'
      };
    }
    return {
      background: '#ede9fe',
      color: '#6d28d9',
      border: '1px solid #c4b5fd'
    };
  }

  return {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };
}

function getSuggestedPriority(patient) {
  const status = String(getComplianceStatus(patient)).toLowerCase();
  const hours = Number(getUsageHours(patient) || 0);

  if (status === 'critical' || hours < 40) return 'CRITICAL';
  if (status === 'warning' || hours < 80) return 'HIGH';
  return 'MEDIUM';
}

const outcomeInitialState = {
  outcome_status: 'reached',
  note: '',
  callback_date: ''
};

const taskInitialState = {
  type: 'FOLLOW_UP',
  priority: 'HIGH',
  dueDate: '',
  note: ''
};

const noteInitialState = {
  note: ''
};

export default function FollowUpCenter() {
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPatientId, setBusyPatientId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [outcomeForm, setOutcomeForm] = useState(outcomeInitialState);
  const [taskForm, setTaskForm] = useState(taskInitialState);
  const [noteForm, setNoteForm] = useState(noteInitialState);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [patientsData, summaryData] = await Promise.all([
        getFollowUpPatients(),
        getFollowUpOutcomesSummary()
      ]);

      setPatients(safeArray(patientsData));
      setSummary(summaryData || null);
    } catch (err) {
      console.error('Error loading follow-up center:', err);
      setPatients([]);
      setSummary(null);
      setError('Αποτυχία φόρτωσης follow-up data.');
    } finally {
      setLoading(false);
    }
  }

  function openPatientPanel(patient) {
    const suggestedPriority = getSuggestedPriority(patient);
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);

    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');

    setSelectedPatient(patient);
    setOutcomeForm({
      outcome_status: 'reached',
      note: '',
      callback_date: ''
    });
    setTaskForm({
      type: 'FOLLOW_UP',
      priority: suggestedPriority,
      dueDate: `${yyyy}-${mm}-${dd}`,
      note: ''
    });
    setNoteForm({
      note: ''
    });
    setSuccess('');
    setError('');
  }

  function closePatientPanel() {
    setSelectedPatient(null);
    setOutcomeForm(outcomeInitialState);
    setTaskForm(taskInitialState);
    setNoteForm(noteInitialState);
  }

  async function handleCreateTask() {
    if (!selectedPatient) return;

    const patientId = getPatientId(selectedPatient);
    if (!patientId) {
      setError('Δεν βρέθηκε patientId.');
      return;
    }

    if (!taskForm.dueDate) {
      setError('Δώσε due date για το task.');
      return;
    }

    try {
      setBusyPatientId(patientId);
      setError('');
      setSuccess('');

      await createFollowUpTask({
        patientId,
        type: taskForm.type,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate,
        note: taskForm.note,
        source: 'FOLLOWUP_CENTER'
      });

      setSuccess(`Δημιουργήθηκε task για ${getPatientName(selectedPatient)}.`);
      await loadData();
    } catch (err) {
      console.error('Error creating follow-up task:', err);
      setError('Αποτυχία δημιουργίας follow-up task.');
    } finally {
      setBusyPatientId(null);
    }
  }

  async function handleCreateOutcome() {
    if (!selectedPatient) return;

    const patientId = getPatientId(selectedPatient);
    if (!patientId) {
      setError('Δεν βρέθηκε patientId.');
      return;
    }

    try {
      setBusyPatientId(patientId);
      setError('');
      setSuccess('');

      const payload = {
        patientId,
        outcome_status: outcomeForm.outcome_status,
        note: outcomeForm.note
      };

      if (outcomeForm.callback_date) {
        payload.callback_date = new Date(outcomeForm.callback_date).toISOString();
      }

      await createFollowUpOutcome(payload);

      setSuccess(`Καταχωρήθηκε outcome για ${getPatientName(selectedPatient)}.`);
      setOutcomeForm(outcomeInitialState);
      await loadData();
    } catch (err) {
      console.error('Error creating follow-up outcome:', err);
      setError('Αποτυχία καταχώρησης outcome.');
    } finally {
      setBusyPatientId(null);
    }
  }

  async function handleCreateNote() {
    if (!selectedPatient) return;

    const patientId = getPatientId(selectedPatient);
    if (!patientId) {
      setError('Δεν βρέθηκε patientId.');
      return;
    }

    if (!noteForm.note.trim()) {
      setError('Γράψε σημείωση.');
      return;
    }

    try {
      setBusyPatientId(patientId);
      setError('');
      setSuccess('');

      await createFollowUpNote({
        patientId,
        note: noteForm.note.trim(),
        source: 'FOLLOWUP_CENTER'
      });

      setSuccess(`Αποθηκεύτηκε note για ${getPatientName(selectedPatient)}.`);
      setNoteForm(noteInitialState);
      await loadData();
    } catch (err) {
      console.error('Error creating follow-up note:', err);
      setError('Αποτυχία αποθήκευσης note.');
    } finally {
      setBusyPatientId(null);
    }
  }

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();

    return patients.filter((patient) => {
      const status = String(getComplianceStatus(patient)).toLowerCase();
      const name = getPatientName(patient).toLowerCase();
      const phone = String(getPatientPhone(patient)).toLowerCase();
      const patientId = String(getPatientId(patient) || '').toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        phone.includes(q) ||
        patientId.includes(q);

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [patients, search, statusFilter]);

  const stats = useMemo(() => {
    const critical = patients.filter(
      (p) => String(getComplianceStatus(p)).toLowerCase() === 'critical'
    ).length;

    const warning = patients.filter(
      (p) => String(getComplianceStatus(p)).toLowerCase() === 'warning'
    ).length;

    return {
      total: patients.length,
      critical,
      warning
    };
  }, [patients]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Follow-up Center</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Διαχείριση ασθενών κάτω από 80 ώρες, outcomes, notes και follow-up tasks.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Below 80h Patients</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Critical</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {stats.critical}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Warning</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {stats.warning}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Reached</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {summary?.reached || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>No Answer</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {summary?.no_answer || 0}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Callback Requested</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {summary?.callback_requested || 0}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Filters</h2>

        {error ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca'
            }}
          >
            {error}
          </div>
        ) : null}

        {success ? (
          <div
            style={{
              marginBottom: 14,
              padding: 12,
              borderRadius: 10,
              background: '#ecfdf5',
              color: '#166534',
              border: '1px solid #a7f3d0'
            }}
          >
            {success}
          </div>
        ) : null}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14
          }}
        >
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={inputStyle}
              placeholder="patient name / phone / id"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="critical">critical</option>
              <option value="warning">warning</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="button" style={buttonStyle} onClick={loadData}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedPatient ? '1.6fr 1fr' : '1fr',
          gap: 16
        }}
      >
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Patients Requiring Follow-up</h2>

          {loading ? (
            <div>Loading follow-up patients...</div>
          ) : filteredPatients.length === 0 ? (
            <div>No follow-up patients found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {filteredPatients.map((patient, index) => {
                const patientId = getPatientId(patient);
                const complianceStatus = getComplianceStatus(patient);
                const usageHours = getUsageHours(patient);
                const targetHours = getTargetHours(patient);
                const isSelected =
                  String(getPatientId(selectedPatient) || '') === String(patientId || '');

                return (
                  <div
                    key={patientId || index}
                    style={{
                      border: isSelected ? '2px solid #111827' : '1px solid #e5e7eb',
                      borderRadius: 14,
                      padding: 16,
                      background: '#ffffff'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                        marginBottom: 10
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                          {getPatientName(patient)}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap'
                          }}
                        >
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              ...badgeStyle('status', complianceStatus)
                            }}
                          >
                            {complianceStatus}
                          </span>

                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              ...badgeStyle('priority', getSuggestedPriority(patient))
                            }}
                          >
                            {getSuggestedPriority(patient)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          style={primaryButtonStyle}
                          onClick={() => openPatientPanel(patient)}
                        >
                          Open Actions
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: 12
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Usage</div>
                        <div style={{ fontWeight: 700 }}>
                          {usageHours} / {targetHours} ώρες
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                        <div style={{ fontWeight: 700 }}>{getPatientPhone(patient)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Patient ID</div>
                        <div style={{ fontWeight: 700 }}>{patientId || '-'}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Last Sync / Update</div>
                        <div style={{ fontWeight: 700 }}>
                          {formatDate(
                            patient?.last_sync_at ||
                              patient?.updated_at ||
                              patient?.created_at
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedPatient ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: 10 }}>Selected Patient</h2>

              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {getPatientName(selectedPatient)}
              </div>

              <div style={{ color: '#4b5563', marginBottom: 8 }}>
                {getPatientPhone(selectedPatient)}
              </div>

              <div style={{ color: '#4b5563', marginBottom: 12 }}>
                {getUsageHours(selectedPatient)} / {getTargetHours(selectedPatient)} ώρες ·{' '}
                {getComplianceStatus(selectedPatient)}
              </div>

              <button type="button" style={buttonStyle} onClick={closePatientPanel}>
                Close Panel
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 14 }}>Create Follow-up Task</h3>

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Type
                  </label>
                  <select
                    value={taskForm.type}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, type: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="FOLLOW_UP">FOLLOW_UP</option>
                    <option value="CALL_BACK">CALL_BACK</option>
                    <option value="RECHECK">RECHECK</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, priority: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, dueDate: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Note
                  </label>
                  <textarea
                    rows={3}
                    value={taskForm.note}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Internal note for follow-up task"
                  />
                </div>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleCreateTask}
                  disabled={busyPatientId === getPatientId(selectedPatient)}
                >
                  {busyPatientId === getPatientId(selectedPatient)
                    ? 'Saving...'
                    : 'Create Task'}
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 14 }}>Record Outcome</h3>

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Outcome Status
                  </label>
                  <select
                    value={outcomeForm.outcome_status}
                    onChange={(e) =>
                      setOutcomeForm((prev) => ({
                        ...prev,
                        outcome_status: e.target.value
                      }))
                    }
                    style={inputStyle}
                  >
                    <option value="reached">reached</option>
                    <option value="no_answer">no_answer</option>
                    <option value="callback_requested">callback_requested</option>
                    <option value="refused">refused</option>
                    <option value="promised_improvement">promised_improvement</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Callback Date
                  </label>
                  <input
                    type="datetime-local"
                    value={outcomeForm.callback_date}
                    onChange={(e) =>
                      setOutcomeForm((prev) => ({
                        ...prev,
                        callback_date: e.target.value
                      }))
                    }
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Note
                  </label>
                  <textarea
                    rows={3}
                    value={outcomeForm.note}
                    onChange={(e) =>
                      setOutcomeForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Patient response / call result"
                  />
                </div>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleCreateOutcome}
                  disabled={busyPatientId === getPatientId(selectedPatient)}
                >
                  {busyPatientId === getPatientId(selectedPatient)
                    ? 'Saving...'
                    : 'Save Outcome'}
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 14 }}>Add Internal Note</h3>

              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    Note
                  </label>
                  <textarea
                    rows={4}
                    value={noteForm.note}
                    onChange={(e) =>
                      setNoteForm((prev) => ({ ...prev, note: e.target.value }))
                    }
                    style={{ ...inputStyle, resize: 'vertical' }}
                    placeholder="Internal communication note"
                  />
                </div>

                <button
                  type="button"
                  style={buttonStyle}
                  onClick={handleCreateNote}
                  disabled={busyPatientId === getPatientId(selectedPatient)}
                >
                  {busyPatientId === getPatientId(selectedPatient)
                    ? 'Saving...'
                    : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}