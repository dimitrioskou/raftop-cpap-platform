import React, { useEffect, useState } from 'react';
import { apiPost } from '../../lib/api';

function overlayStyle() {
  return {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.55)',
    display: 'grid',
    placeItems: 'center',
    zIndex: 9999,
    padding: 20
  };
}

function cardStyle() {
  return {
    width: '100%',
    maxWidth: 860,
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: 24,
    border: '1px solid #e5e7eb',
    boxShadow: '0 24px 60px rgba(15, 23, 42, 0.20)',
    padding: 24
  };
}

function inputStyle() {
  return {
    width: '100%',
    border: '1px solid #d0d5dd',
    borderRadius: 12,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff'
  };
}

function labelStyle() {
  return {
    fontSize: 12,
    fontWeight: 800,
    color: '#667085',
    marginBottom: 6
  };
}

const INITIAL_STATE = {
  patient_id: '',
  patient_name: '',
  doctor_id: '',
  doctor_name: '',
  priority: 'warning',
  channel: 'phone',
  status: 'pending',
  outcome: 'pending',
  scheduled_at: '',
  assigned_to: 'RAFTOP Team',
  notes: ''
};

export default function FollowupCreateModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open) {
      setForm(INITIAL_STATE);
      setSubmitting(false);
      setError('');
      setSuccess('');
    }
  }, [open]);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        ...form,
        scheduled_at: form.scheduled_at || null
      };

      const response = await apiPost('/api/tenant/followup', payload);

      setSuccess('Follow-up created successfully.');

      if (typeof onCreated === 'function') {
        onCreated(response?.followup || null);
      }

      setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 500);
    } catch (err) {
      setError(err?.message || 'Failed to create follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={overlayStyle()}>
      <div style={cardStyle()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 18
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 900,
                color: '#1d4ed8',
                letterSpacing: 0.6
              }}
            >
              FOLLOW-UP WORKSPACE
            </div>
            <h2
              style={{
                margin: '6px 0 0',
                fontSize: 28,
                fontWeight: 900,
                color: '#101828'
              }}
            >
              New Follow-up
            </h2>
            <div style={{ color: '#667085', marginTop: 6 }}>
              Create a follow-up case and add it to the outreach workflow.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: '1px solid #d0d5dd',
              background: '#fff',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              cursor: 'pointer',
              height: 'fit-content'
            }}
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 16
            }}
          >
            <div>
              <div style={labelStyle()}>Patient ID</div>
              <input
                value={form.patient_id}
                onChange={(e) => updateField('patient_id', e.target.value)}
                style={inputStyle()}
                placeholder="Optional patient ID"
              />
            </div>

            <div>
              <div style={labelStyle()}>Patient name *</div>
              <input
                value={form.patient_name}
                onChange={(e) => updateField('patient_name', e.target.value)}
                style={inputStyle()}
                placeholder="Patient name"
              />
            </div>

            <div>
              <div style={labelStyle()}>Doctor ID</div>
              <input
                value={form.doctor_id}
                onChange={(e) => updateField('doctor_id', e.target.value)}
                style={inputStyle()}
                placeholder="Optional doctor ID"
              />
            </div>

            <div>
              <div style={labelStyle()}>Doctor name</div>
              <input
                value={form.doctor_name}
                onChange={(e) => updateField('doctor_name', e.target.value)}
                style={inputStyle()}
                placeholder="Doctor name"
              />
            </div>

            <div>
              <div style={labelStyle()}>Priority</div>
              <select
                value={form.priority}
                onChange={(e) => updateField('priority', e.target.value)}
                style={inputStyle()}
              >
                <option value="normal">Normal</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div>
              <div style={labelStyle()}>Channel</div>
              <select
                value={form.channel}
                onChange={(e) => updateField('channel', e.target.value)}
                style={inputStyle()}
              >
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>

            <div>
              <div style={labelStyle()}>Status</div>
              <select
                value={form.status}
                onChange={(e) => {
                  updateField('status', e.target.value);
                  updateField('outcome', e.target.value);
                }}
                style={inputStyle()}
              >
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="no_answer">No Answer</option>
                <option value="callback_requested">Callback Requested</option>
                <option value="resolved">Resolved</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div>
              <div style={labelStyle()}>Scheduled at</div>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(e) => updateField('scheduled_at', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <div style={labelStyle()}>Assigned to</div>
              <input
                value={form.assigned_to}
                onChange={(e) => updateField('assigned_to', e.target.value)}
                style={inputStyle()}
                placeholder="Assigned owner"
              />
            </div>

            <div>
              <div style={labelStyle()}>Notes</div>
              <input
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                style={inputStyle()}
                placeholder="Short note"
              />
            </div>
          </div>

          {error ? (
            <div style={{ marginTop: 14, color: '#b42318', fontWeight: 700 }}>
              {error}
            </div>
          ) : null}

          {success ? (
            <div style={{ marginTop: 14, color: '#027a48', fontWeight: 700 }}>
              {success}
            </div>
          ) : null}

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              marginTop: 20
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                border: '1px solid #d0d5dd',
                background: '#fff',
                borderRadius: 12,
                padding: '12px 16px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              style={{
                border: '1px solid #1d4ed8',
                background: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
                color: '#fff',
                borderRadius: 12,
                padding: '12px 16px',
                fontWeight: 800,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Saving...' : 'Save follow-up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}