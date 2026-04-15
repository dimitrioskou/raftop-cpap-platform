import React, { useMemo, useState } from 'react';
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
    maxWidth: 920,
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

function deriveComplianceStatus(monthlyHours, monitoringActive, paymentStatus) {
  if (!monitoringActive) return 'inactive';
  if (paymentStatus !== 'paid') return 'inactive';

  const hours = Number(monthlyHours || 0);
  if (!hours) return 'no_data';
  if (hours >= 80) return 'ok';
  if (hours >= 50) return 'warning';
  return 'critical';
}

const INITIAL_STATE = {
  full_name: '',
  phone: '',
  email: '',
  doctor_name: '',
  doctor_id: '',
  patient_code: '',
  device_serial: '',
  device_brand: 'ResMed',
  therapy_start_date: '',
  monthly_usage_hours: '',
  ahi: '',
  last_sync_at: '',
  package_type: '6m',
  payment_status: 'paid',
  package_start_date: '',
  package_end_date: '',
  monitoring_active: true,
  notifications_active: true,
  followup_active: true,
  consent_contact: true
};

export default function PatientEnrollmentModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const compliancePreview = useMemo(() => {
    return deriveComplianceStatus(
      form.monthly_usage_hours,
      form.monitoring_active,
      form.payment_status
    );
  }, [form.monthly_usage_hours, form.monitoring_active, form.payment_status]);

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
        monthly_usage_hours:
          form.monthly_usage_hours === '' ? null : Number(form.monthly_usage_hours),
        ahi: form.ahi === '' ? null : Number(form.ahi)
      };

      const response = await apiPost('/api/tenant/patients', payload);

      setSuccess('Patient enrolled successfully.');
      setForm(INITIAL_STATE);

      if (typeof onCreated === 'function') {
        onCreated(response?.patient || null);
      }

      setTimeout(() => {
        if (typeof onClose === 'function') onClose();
      }, 500);
    } catch (err) {
      setError(err?.message || 'Failed to enroll patient.');
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
              PATIENT ENROLLMENT
            </div>
            <h2
              style={{
                margin: '6px 0 0',
                fontSize: 28,
                fontWeight: 900,
                color: '#101828'
              }}
            >
              New Patient Enrollment
            </h2>
            <div style={{ color: '#667085', marginTop: 6 }}>
              Create patient, activate monitoring and set the 80-hour compliance workflow.
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
              <div style={labelStyle()}>Full name *</div>
              <input
                value={form.full_name}
                onChange={(e) => updateField('full_name', e.target.value)}
                style={inputStyle()}
                placeholder="Patient full name"
              />
            </div>

            <div>
              <div style={labelStyle()}>Phone</div>
              <input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                style={inputStyle()}
                placeholder="Mobile phone"
              />
            </div>

            <div>
              <div style={labelStyle()}>Email</div>
              <input
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                style={inputStyle()}
                placeholder="Email"
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
              <div style={labelStyle()}>Doctor ID</div>
              <input
                value={form.doctor_id}
                onChange={(e) => updateField('doctor_id', e.target.value)}
                style={inputStyle()}
                placeholder="Doctor ID"
              />
            </div>

            <div>
              <div style={labelStyle()}>Patient code</div>
              <input
                value={form.patient_code}
                onChange={(e) => updateField('patient_code', e.target.value)}
                style={inputStyle()}
                placeholder="Internal patient code"
              />
            </div>

            <div>
              <div style={labelStyle()}>Device serial</div>
              <input
                value={form.device_serial}
                onChange={(e) => updateField('device_serial', e.target.value)}
                style={inputStyle()}
                placeholder="CPAP serial"
              />
            </div>

            <div>
              <div style={labelStyle()}>Device brand</div>
              <input
                value={form.device_brand}
                onChange={(e) => updateField('device_brand', e.target.value)}
                style={inputStyle()}
                placeholder="ResMed / Philips / Löwenstein"
              />
            </div>

            <div>
              <div style={labelStyle()}>Therapy start date</div>
              <input
                type="datetime-local"
                value={form.therapy_start_date}
                onChange={(e) => updateField('therapy_start_date', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <div style={labelStyle()}>Last sync</div>
              <input
                type="datetime-local"
                value={form.last_sync_at}
                onChange={(e) => updateField('last_sync_at', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <div style={labelStyle()}>Monthly usage hours</div>
              <input
                type="number"
                value={form.monthly_usage_hours}
                onChange={(e) => updateField('monthly_usage_hours', e.target.value)}
                style={inputStyle()}
                placeholder="e.g. 72"
              />
            </div>

            <div>
              <div style={labelStyle()}>AHI</div>
              <input
                type="number"
                step="0.1"
                value={form.ahi}
                onChange={(e) => updateField('ahi', e.target.value)}
                style={inputStyle()}
                placeholder="e.g. 4.3"
              />
            </div>

            <div>
              <div style={labelStyle()}>Package type</div>
              <select
                value={form.package_type}
                onChange={(e) => updateField('package_type', e.target.value)}
                style={inputStyle()}
              >
                <option value="3m">3 months</option>
                <option value="6m">6 months</option>
                <option value="12m">12 months</option>
              </select>
            </div>

            <div>
              <div style={labelStyle()}>Payment status</div>
              <select
                value={form.payment_status}
                onChange={(e) => updateField('payment_status', e.target.value)}
                style={inputStyle()}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <div style={labelStyle()}>Package start date</div>
              <input
                type="datetime-local"
                value={form.package_start_date}
                onChange={(e) => updateField('package_start_date', e.target.value)}
                style={inputStyle()}
              />
            </div>

            <div>
              <div style={labelStyle()}>Package end date</div>
              <input
                type="datetime-local"
                value={form.package_end_date}
                onChange={(e) => updateField('package_end_date', e.target.value)}
                style={inputStyle()}
              />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 12,
              marginTop: 18,
              padding: 16,
              borderRadius: 16,
              border: '1px solid #e5e7eb',
              background: '#f8fafc'
            }}
          >
            <label>
              <input
                type="checkbox"
                checked={form.monitoring_active}
                onChange={(e) => updateField('monitoring_active', e.target.checked)}
              />{' '}
              Monitoring active
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.notifications_active}
                onChange={(e) => updateField('notifications_active', e.target.checked)}
              />{' '}
              Notifications active
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.followup_active}
                onChange={(e) => updateField('followup_active', e.target.checked)}
              />{' '}
              Follow-up active
            </label>

            <label>
              <input
                type="checkbox"
                checked={form.consent_contact}
                onChange={(e) => updateField('consent_contact', e.target.checked)}
              />{' '}
              Contact consent
            </label>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              background:
                compliancePreview === 'critical'
                  ? '#fef2f2'
                  : compliancePreview === 'warning'
                  ? '#fff7ed'
                  : compliancePreview === 'ok'
                  ? '#f0fdf4'
                  : '#f8fafc',
              border:
                compliancePreview === 'critical'
                  ? '1px solid #fecaca'
                  : compliancePreview === 'warning'
                  ? '1px solid #fed7aa'
                  : compliancePreview === 'ok'
                  ? '1px solid #bbf7d0'
                  : '1px solid #e5e7eb'
            }}
          >
            <strong>Compliance preview:</strong> {compliancePreview}
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
              {submitting ? 'Saving...' : 'Save patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}