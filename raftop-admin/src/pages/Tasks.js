import React, { useEffect, useMemo, useState } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask
} from '../api/tasks';

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

const dangerButtonStyle = {
  ...buttonStyle,
  background: '#dc2626',
  color: '#ffffff',
  border: '1px solid #dc2626'
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTask(task) {
  return {
    ...task,
    id: task?.id || task?._id || `${task?.title || 'task'}-${Math.random()}`,
    title: task?.title || task?.task_title || '',
    description: task?.description || task?.details || task?.note || '',
    status: task?.status || task?.task_status || 'pending',
    priority: task?.priority || task?.task_priority || 'medium',
    due_date: task?.due_date || task?.dueDate || task?.scheduled_for || '',
    category: task?.category || task?.type || 'general',
    assignee: task?.assignee || task?.owner || '',
    patient_name: task?.patient_name || task?.patientName || task?.fullName || '',
    created_at: task?.created_at || task?.createdAt || ''
  };
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
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

const emptyForm = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  due_date: '',
  category: 'general',
  assignee: '',
  patient_name: ''
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    try {
      setLoading(true);
      setError('');
      const data = await getTasks();
      setTasks(safeArray(data).map(normalizeTask));
    } catch (err) {
      console.error('Error loading tasks:', err);
      setTasks([]);
      setError('Αποτυχία φόρτωσης tasks.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function handleEdit(task) {
    setEditingId(task.id);
    setSuccess('');
    setError('');
    setForm({
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      due_date: toInputDateTime(task.due_date),
      category: task.category || 'general',
      assignee: task.assignee || '',
      patient_name: task.patient_name || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      setError('Το title είναι υποχρεωτικό.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        category: form.category,
        assignee: form.assignee.trim(),
        patient_name: form.patient_name.trim()
      };

      if (editingId) {
        await updateTask(editingId, payload);
        setSuccess('Το task ενημερώθηκε επιτυχώς.');
      } else {
        await createTask(payload);
        setSuccess('Το task δημιουργήθηκε επιτυχώς.');
      }

      resetForm();
      await loadTasks();
    } catch (err) {
      console.error('Error saving task:', err);
      setError('Αποτυχία αποθήκευσης task.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId) {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτό το task;');
    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');
      await deleteTask(taskId);
      setSuccess('Το task διαγράφηκε.');
      if (editingId === taskId) resetForm();
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Αποτυχία διαγραφής task.');
    }
  }

  async function handleQuickStatus(task, nextStatus) {
    try {
      setError('');
      setSuccess('');
      await updateTask(task.id, { status: nextStatus });
      setSuccess('Το status ενημερώθηκε.');
      await loadTasks();
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Αποτυχία ενημέρωσης status.');
    }
  }

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !q ||
        String(task.title || '').toLowerCase().includes(q) ||
        String(task.description || '').toLowerCase().includes(q) ||
        String(task.patient_name || '').toLowerCase().includes(q) ||
        String(task.assignee || '').toLowerCase().includes(q) ||
        String(task.category || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        String(task.status || '').toLowerCase() === statusFilter.toLowerCase();

      const matchesPriority =
        priorityFilter === 'all' ||
        String(task.priority || '').toLowerCase() === priorityFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const summary = useMemo(() => {
    const pending = tasks.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s !== 'completed' && s !== 'done' && s !== 'cancelled';
    }).length;

    const completed = tasks.filter((t) => {
      const s = String(t.status || '').toLowerCase();
      return s === 'completed' || s === 'done';
    }).length;

    const critical = tasks.filter(
      (t) => String(t.priority || '').toLowerCase() === 'critical'
    ).length;

    const overdue = tasks.filter((t) => {
      if (!t.due_date) return false;
      const s = String(t.status || '').toLowerCase();
      if (s === 'completed' || s === 'done' || s === 'cancelled') return false;
      return new Date(t.due_date) < new Date();
    }).length;

    return { pending, completed, critical, overdue };
  }, [tasks]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Tasks</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Διαχείριση operational tasks, follow-up actions και recheck εργασιών.
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
          <div style={{ fontSize: 13, color: '#6b7280' }}>Total Tasks</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{tasks.length}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
            {summary.pending}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Completed</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
            {summary.completed}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Critical</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
            {summary.critical}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Overdue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c' }}>
            {summary.overdue}
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>
          {editingId ? 'Edit Task' : 'Create Task'}
        </h2>

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

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              marginBottom: 14
            }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                style={inputStyle}
                placeholder="π.χ. Call patient for CPAP recheck"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Patient
              </label>
              <input
                type="text"
                value={form.patient_name}
                onChange={(e) => setForm((prev) => ({ ...prev, patient_name: e.target.value }))}
                style={inputStyle}
                placeholder="Patient name"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Assignee
              </label>
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => setForm((prev) => ({ ...prev, assignee: e.target.value }))}
                style={inputStyle}
                placeholder="Owner / assignee"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                style={inputStyle}
              >
                <option value="general">general</option>
                <option value="followup">followup</option>
                <option value="recheck">recheck</option>
                <option value="compliance">compliance</option>
                <option value="device">device</option>
                <option value="referral">referral</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                style={inputStyle}
              >
                <option value="pending">pending</option>
                <option value="in_progress">in_progress</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
                style={inputStyle}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                <option value="critical">critical</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                Due Date
              </label>
              <input
                type="datetime-local"
                value={form.due_date}
                onChange={(e) => setForm((prev) => ({ ...prev, due_date: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              style={{ ...inputStyle, resize: 'vertical' }}
              placeholder="Task details / internal note"
            />
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="submit" style={primaryButtonStyle} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
            </button>

            <button
              type="button"
              style={buttonStyle}
              onClick={resetForm}
              disabled={saving}
            >
              Clear
            </button>

            <button
              type="button"
              style={buttonStyle}
              onClick={loadTasks}
              disabled={saving}
            >
              Refresh
            </button>
          </div>
        </form>
      </div>

      <div style={{ ...cardStyle, marginBottom: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Filters</h2>

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
              placeholder="title / patient / assignee / category"
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
              <option value="pending">pending</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
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
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Task List</h2>

        {loading ? (
          <div>Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div>No tasks found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {filteredTasks.map((task) => {
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                !['completed', 'done', 'cancelled'].includes(
                  String(task.status || '').toLowerCase()
                );

              return (
                <div
                  key={task.id}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 14,
                    padding: 16,
                    background: isOverdue ? '#fff7ed' : '#ffffff'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      flexWrap: 'wrap',
                      marginBottom: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                        {task.title || 'Untitled Task'}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 8
                        }}
                      >
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...statusBadgeStyle(task.status)
                          }}
                        >
                          {task.status || 'pending'}
                        </span>

                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            ...priorityBadgeStyle(task.priority)
                          }}
                        >
                          {task.priority || 'medium'}
                        </span>

                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                            background: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db'
                          }}
                        >
                          {task.category || 'general'}
                        </span>

                        {isOverdue ? (
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: '1px solid #fca5a5'
                            }}
                          >
                            overdue
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        style={buttonStyle}
                        onClick={() => handleEdit(task)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        style={dangerButtonStyle}
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                      gap: 10,
                      marginBottom: 10
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Patient</div>
                      <div style={{ fontWeight: 600 }}>{task.patient_name || '-'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Assignee</div>
                      <div style={{ fontWeight: 600 }}>{task.assignee || '-'}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Due</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(task.due_date)}</div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Created</div>
                      <div style={{ fontWeight: 600 }}>{formatDate(task.created_at)}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12, color: '#374151' }}>
                    {task.description || 'No description.'}
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => handleQuickStatus(task, 'pending')}
                    >
                      Mark Pending
                    </button>

                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => handleQuickStatus(task, 'in_progress')}
                    >
                      Mark In Progress
                    </button>

                    <button
                      type="button"
                      style={primaryButtonStyle}
                      onClick={() => handleQuickStatus(task, 'completed')}
                    >
                      Mark Completed
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}