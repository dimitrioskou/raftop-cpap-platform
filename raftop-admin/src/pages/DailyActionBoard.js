import React, { useEffect, useMemo, useState } from 'react';
import {
  getDailyBoard,
  createDailyBoardTasks,
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

function getStatus(item) {
  return item?.status || item?.task_status || item?.board_status || 'pending';
}

function getDueDate(item) {
  return item?.due_date || item?.dueDate || item?.scheduled_for || item?.date || null;
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

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'completed' || s === 'done') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (s === 'in_progress' || s === 'in-progress') {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (s === 'cancelled') {
    return {
      background: '#f3f4f6',
      color: '#4b5563',
      border: '1px solid #d1d5db'
    };
  }

  return {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d'
  };
}

const outcomeInitialState = {
  outcome_status: 'reached',
  note: '',
  callback_date: ''
};

const noteInitialState = {
  note: ''
};

export default function DailyActionBoard() {
  const [boardItems, setBoardItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [busyPatientId, setBusyPatientId] = useState(null);
  const [creatingBoardTasks, setCreatingBoardTasks] = useState(false);

  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [outcomeForm, setOutcomeForm] = useState(outcomeInitialState);
  const [noteForm, setNoteForm] = useState(noteInitialState);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBoard();
  }, []);

  async function loadBoard() {
    try {
      setLoading(true);
      setError('');
      const data = await getDailyBoard();
      setBoardItems(safeArray(data?.data || data));
    } catch (err) {
      console.error('Error loading daily board:', err);
      setBoardItems([]);
      setError('Αποτυχία φόρτωσης daily board.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBoardTasks() {
    try {
      setCreatingBoardTasks(true);
      setError('');
      setSuccess('');
      await createDailyBoardTasks({});
      setSuccess('Δημιουργήθηκαν daily board tasks.');
      await loadBoard();
    } catch (err) {
      console.error('Error creating daily board tasks:', err);
      setError('Αποτυχία δημιουργίας daily board tasks.');
    } finally {
      setCreatingBoardTasks(false);
    }
  }

  function openPanel(item) {
    setSelectedItem(item);
    setOutcomeForm(outcomeInitialState);
    setNoteForm(noteInitialState);
    setError('');
    setSuccess('');
  }

  function closePanel() {
    setSelectedItem(null);
    setOutcomeForm(outcomeInitialState);
    setNoteForm(noteInitialState);
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
      await loadBoard();
    } catch (err) {
      console.error('Error creating daily board outcome:', err);
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
        source: 'DAILY_BOARD'
      });

      setSuccess(`Αποθηκεύτηκε note για ${getPatientName(selectedItem)}.`);
      setNoteForm(noteInitialState);
      await loadBoard();
    } catch (err) {
      console.error('Error creating daily board note:', err);
      setError('Αποτυχία αποθήκευσης note.');
    } finally {
      setBusyPatientId(null);
    }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    return boardItems.filter((item) => {
      const name = getPatientName(item).toLowerCase();
      const phone = String(getPatientPhone(item)).toLowerCase();
      const id = String(getPatientId(item) || '').toLowerCase();
      const priority = String(getPriority(item)).toLowerCase();
      const status = String(getStatus(item)).toLowerCase();

      const matchesSearch =
        !q || name.includes(q) || phone.includes(q) || id.includes(q);

      const matchesPriority =
        priorityFilter === 'all' || priority === priorityFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' || status === statusFilter.toLowerCase();

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [boardItems, search, priorityFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: boardItems.length,
      critical: boardItems.filter((item) => String(getPriority(item)).toLowerCase() === 'critical').length,
      high: boardItems.filter((item) => String(getPriority(item)).toLowerCase() === 'high').length,
      pending: boardItems.filter((item) => {
        const s = String(getStatus(item)).toLowerCase();
        return s !== 'completed' && s !== 'done' && s !== 'cancelled';
      }).length,
      completed: boardItems.filter((item) => {
        const s = String(getStatus(item)).toLowerCase();
        return s === 'completed' || s === 'done';
      }).length
    };
  }, [boardItems]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Daily Action Board</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Ημερήσιος πίνακας follow-up ενεργειών για calls, outcomes και operational notes.
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Total Board Items</div>
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
            {stats.pending}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {stats.completed}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            marginBottom: 14
          }}
        >
          <h2 style={{ margin: 0 }}>Board Controls</h2>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              style={primaryButtonStyle}
              onClick={handleCreateBoardTasks}
              disabled={creatingBoardTasks}
            >
              {creatingBoardTasks ? 'Creating...' : 'Create Daily Board Tasks'}
            </button>

            <button
              type="button"
              style={buttonStyle}
              onClick={loadBoard}
              disabled={creatingBoardTasks}
            >
              Refresh
            </button>
          </div>
        </div>

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
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
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
          <h2 style={{ marginTop: 0, marginBottom: 14 }}>Today&apos;s Board</h2>

          {loading ? (
            <div>Loading daily board...</div>
          ) : filteredItems.length === 0 ? (
            <div>No board items found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {filteredItems.map((item, index) => {
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

                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              ...statusBadgeStyle(getStatus(item))
                            }}
                          >
                            {getStatus(item)}
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
                        <div style={{ fontSize: 12, color: '#6b7280' }}>Due</div>
                        <div style={{ fontWeight: 700 }}>{formatDate(getDueDate(item))}</div>
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