import React, { useEffect, useMemo, useState } from 'react';
import {
  getPriorityQueue,
  createFollowUpTask,
  createFollowUpOutcome,
  createFollowUpNote
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

function getPatientId(item) {
  return (
    item?.patientId ||
    item?.patient_id ||
    item?.id ||
    item?._id
  );
}

function getPatientName(item) {
  return (
    item?.patientName ||
    item?.fullName ||
    item?.name ||
    `${item?.firstName || ''} ${item?.lastName || ''}`.trim() ||
    `${item?.first_name || ''} ${item?.last_name || ''}`.trim() ||
    'Patient'
  );
}

function getPatientPhone(item) {
  return item?.phone || item?.mobile || item?.telephone || '-';
}

function getPriority(item) {
  return item?.priority || 'MEDIUM';
}

function getReason(item) {
  return item?.reason || item?.recommendedAction || item?.note || '-';
}

function getUsageHours(item) {
  return item?.usage_hours ?? item?.usageHours ?? item?.hours ?? 0;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function priorityBadgeStyle(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'critical') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (p === 'high') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (p === 'low') {
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

const taskInitialState = {
  type: 'FOLLOW_UP',
  priority: 'HIGH',
  dueDate: '',
  note: ''
};

const outcomeInitialState = {
  outcome_status: 'reached',
  note: '',
  callback_date: ''
};

const noteInitialState = {
  note: ''
};

export default function PriorityQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPatientId, setBusyPatientId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [taskForm, setTaskForm] = useState(taskInitialState);
  const [outcomeForm, setOutcomeForm] = useState(outcomeInitialState);
  const [noteForm, setNoteForm] = useState(noteInitialState);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    try {
      setLoading(true);
      setError('');
      const data = await getPriorityQueue();
      setQueue(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading priority queue:', err);
      setQueue([]);
      setError('Αποτυχία φόρτωσης priority queue.');
    } finally {
      setLoading(false);
    }
  }

  function openPanel(item) {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 1);

    const yyyy = defaultDate.getFullYear();
    const mm = String(defaultDate.getMonth() + 1).padStart(2, '0');
    const dd = String(defaultDate.getDate()).padStart(2, '0');

    setSelectedItem(item);
    setTaskForm({
      type: 'FOLLOW_UP',
      priority: getPriority(item),
      dueDate: `${yyyy}-${mm}-${dd}`,
      note: getReason(item) === '-' ? '' : getReason(item)
    });
    setOutcomeForm(outcomeInitialState);
    setNoteForm(noteInitialState);
    setError('');
    setSuccess('');
  }

  function closePanel() {
    setSelectedItem(null);
    setTaskForm(taskInitialState);
    setOutcomeForm(outcomeInitialState);
    setNoteForm(noteInitialState);
  }

  async function handleCreateTask() {
    if (!selectedItem) return;

    const patientId = getPatientId(selectedItem);
    if (!patientId) {
      setError('Δεν βρέθηκε patientId.');
      return;
    }

    if (!taskForm.dueDate) {
      setError('Δώσε due date.');
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
        source: 'PRIORITY_QUEUE'
      });

      setSuccess(`Δημιουργήθηκε task για ${getPatientName(selectedItem)}.`);
      await loadQueue();
    } catch (err) {
      console.error('Error creating priority queue task:', err);
      setError('Αποτυχία δημιουργίας task.');
    } finally {
      setBusyPatientId(null);
    }
  }

  async function handleCreateOutcome() {
    if (!selectedItem) return;

    const patientId = getPatientId(selectedItem);
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

      setSuccess(`Καταχωρήθηκε outcome για ${getPatientName(selectedItem)}.`);
      setOutcomeForm(outcomeInitialState);
    } catch (err) {
      console.error('Error creating priority queue outcome:', err);
      setError('Αποτυχία καταχώρησης outcome.');
    } finally {
      setBusyPatientId(null);
    }
  }

  async function handleCreateNote() {
    if (!selectedItem) return;

    const patientId = getPatientId(selectedItem);
    if (!patientId) {
      setError('Δεν βρέθηκε patientId.');
      return;
    }

    if (!noteForm.note.trim()) {
      setError('Γράψε note.');
      return;
    }

    try {
      setBusyPatientId(patientId);
      setError('');
      setSuccess('');

      await createFollowUpNote({
        patientId,
        note: noteForm.note.trim(),
        source: 'PRIORITY_QUEUE'
      });

      setSuccess(`Αποθηκεύτηκε note για ${getPatientName(selectedItem)}.`);
      setNoteForm(noteInitialState);
    } catch (err) {
      console.error('Error creating priority queue note:', err);
      setError('Αποτυχία αποθήκευσης note.');
    } finally {
      setBusyPatientId(null);
    }
  }

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase();

    return queue.filter((item) => {
      const patientName = getPatientName(item).toLowerCase();
      const patientPhone = String(getPatientPhone(item)).toLowerCase();
      const patientId = String(getPatientId(item) || '').toLowerCase();
      const priority = String(getPriority(item) || '').toLowerCase();

      const matchesSearch =
        !q ||
        patientName.includes(q) ||
        patientPhone.includes(q) ||
        patientId.includes(q);

      const matchesPriority =
        priorityFilter === 'all' || priority === priorityFilter.toLowerCase();

      return matchesSearch && matchesPriority;
    });
  }, [queue, search, priorityFilter]);

  const stats = useMemo(() => {
    return {
      total: queue.length,
      critical: queue.filter((item) => String(getPriority(item)).toLowerCase() === 'critical').length,
      high: queue.filter((item) => String(getPriority(item)).toLowerCase() === 'high').length,
      medium: queue.filter((item) => String(getPriority(item)).toLowerCase() === 'medium').length
    };
  }, [queue]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Priority Queue</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Ασθενείς υψηλής προτεραιότητας για follow-up, note και άμεσο task scheduling.
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Total Queue</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{stats.total}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Critical</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {stats.critical}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>High</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c' }}>
            {stats.high}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Medium</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
            {stats.medium}
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
              placeholder="name / phone / patient id"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={inputStyle}
            >
              <option value="all">all</option>
              <option value="critical">critical</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button type="button" style={buttonStyle} onClick={loadQueue}>
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: selectedItem ? '1.6fr 1fr' : '1fr',
          gap: 16
        }}
      >
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Queue Items</h2>

          {loading ? (
            <div>Loading priority queue...</div>
          ) : filteredQueue.length === 0 ? (
            <div>No priority queue patients found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {filteredQueue.map((item, index) => {
                const patientId = getPatientId(item);
                const isSelected =
                  String(getPatientId(selectedItem) || '') === String(patientId || '');

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
                          {getPatientName(item)}
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
                              ...priorityBadgeStyle(getPriority(item))
                            }}
                          >
                            {getPriority(item)}
                          </span>
                        </div>
                      </div>

                      <div>
                        <button
                          type="button"
                          style={primaryButtonStyle}
                          onClick={() => openPanel(item)}
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
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Reason</div>
                        <div style={{ fontWeight: 700 }}>{getReason(item)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Phone</div>
                        <div style={{ fontWeight: 700 }}>{getPatientPhone(item)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Usage Hours</div>
                        <div style={{ fontWeight: 700 }}>{getUsageHours(item)}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Updated</div>
                        <div style={{ fontWeight: 700 }}>
                          {formatDate(item?.updatedAt || item?.updated_at || item?.createdAt || item?.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedItem ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0, marginBottom: 10 }}>Selected Patient</h2>

              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                {getPatientName(selectedItem)}
              </div>

              <div style={{ color: '#4b5563', marginBottom: 8 }}>
                {getPatientPhone(selectedItem)}
              </div>

              <div style={{ color: '#4b5563', marginBottom: 8 }}>
                Priority: {getPriority(selectedItem)}
              </div>

              <div style={{ color: '#4b5563', marginBottom: 12 }}>
                Reason: {getReason(selectedItem)}
              </div>

              <button type="button" style={buttonStyle} onClick={closePanel}>
                Close Panel
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0, marginBottom: 14 }}>Create Task</h3>

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
                  />
                </div>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleCreateTask}
                  disabled={busyPatientId === getPatientId(selectedItem)}
                >
                  {busyPatientId === getPatientId(selectedItem) ? 'Saving...' : 'Create Task'}
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
                  />
                </div>

                <button
                  type="button"
                  style={primaryButtonStyle}
                  onClick={handleCreateOutcome}
                  disabled={busyPatientId === getPatientId(selectedItem)}
                >
                  {busyPatientId === getPatientId(selectedItem) ? 'Saving...' : 'Save Outcome'}
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
                  />
                </div>

                <button
                  type="button"
                  style={buttonStyle}
                  onClick={handleCreateNote}
                  disabled={busyPatientId === getPatientId(selectedItem)}
                >
                  {busyPatientId === getPatientId(selectedItem) ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}