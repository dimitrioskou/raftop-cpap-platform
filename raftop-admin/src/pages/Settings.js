import React, { useMemo, useState } from 'react';

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

const initialForm = {
  companyName: 'RAFTOP Admin',
  supportEmail: 'support@raftop.local',
  supportPhone: '+30 210 0000000',
  complianceTargetHours: '80',
  warningThresholdHours: '60',
  criticalThresholdHours: '40',
  defaultTaskPriority: 'HIGH',
  defaultFollowUpType: 'FOLLOW_UP',
  autoCreateDailyBoard: true,
  autoCreateCriticalTasks: true,
  enableRecoveryFunnel: true,
  themeMode: 'light'
};

export default function Settings() {
  const [form, setForm] = useState(initialForm);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function handleChange(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  }

  function handleToggle(key) {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  }

  function handleSave(e) {
    e.preventDefault();

    try {
      localStorage.setItem('raftop_admin_settings', JSON.stringify(form));
      setSuccess('Οι ρυθμίσεις αποθηκεύτηκαν τοπικά.');
      setError('');
    } catch (err) {
      console.error('Settings save error:', err);
      setError('Αποτυχία αποθήκευσης ρυθμίσεων.');
      setSuccess('');
    }
  }

  function handleReset() {
    setForm(initialForm);
    setSuccess('');
    setError('');
  }

  const summary = useMemo(() => {
    return {
      target: Number(form.complianceTargetHours || 0),
      warning: Number(form.warningThresholdHours || 0),
      critical: Number(form.criticalThresholdHours || 0)
    };
  }, [form]);

  return (
    <div style={pageStyle}>
      <h1 style={{ marginBottom: 8 }}>Settings</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Βασικές ρυθμίσεις λειτουργίας για compliance, follow-up και automation flow.
      </p>

      <form onSubmit={handleSave}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 16,
            marginBottom: 24
          }}
        >
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>General</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Support Email
                </label>
                <input
                  type="email"
                  value={form.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Support Phone
                </label>
                <input
                  type="text"
                  value={form.supportPhone}
                  onChange={(e) => handleChange('supportPhone', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Theme Mode
                </label>
                <select
                  value={form.themeMode}
                  onChange={(e) => handleChange('themeMode', e.target.value)}
                  style={inputStyle}
                >
                  <option value="light">light</option>
                  <option value="dark">dark</option>
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Compliance Rules</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Target Hours
                </label>
                <input
                  type="number"
                  value={form.complianceTargetHours}
                  onChange={(e) => handleChange('complianceTargetHours', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Warning Threshold
                </label>
                <input
                  type="number"
                  value={form.warningThresholdHours}
                  onChange={(e) => handleChange('warningThresholdHours', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Critical Threshold
                </label>
                <input
                  type="number"
                  value={form.criticalThresholdHours}
                  onChange={(e) => handleChange('criticalThresholdHours', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: '#f9fafb',
                border: '1px solid #e5e7eb'
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Current Rule Summary</div>
              <div style={{ color: '#4b5563' }}>
                Target: {summary.target} ώρες · Warning κάτω από {summary.target} ώρες · Critical κάτω
                από {summary.critical} ώρες
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Follow-up Defaults</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
                  Default Task Priority
                </label>
                <select
                  value={form.defaultTaskPriority}
                  onChange={(e) => handleChange('defaultTaskPriority', e.target.value)}
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
                  Default Follow-up Type
                </label>
                <select
                  value={form.defaultFollowUpType}
                  onChange={(e) => handleChange('defaultFollowUpType', e.target.value)}
                  style={inputStyle}
                >
                  <option value="FOLLOW_UP">FOLLOW_UP</option>
                  <option value="CALL_BACK">CALL_BACK</option>
                  <option value="RECHECK">RECHECK</option>
                </select>
              </div>
            </div>
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Automation</h2>

            <div style={{ display: 'grid', gap: 12 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10
                }}
              >
                <span style={{ fontWeight: 600 }}>Auto Create Daily Board</span>
                <input
                  type="checkbox"
                  checked={form.autoCreateDailyBoard}
                  onChange={() => handleToggle('autoCreateDailyBoard')}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10
                }}
              >
                <span style={{ fontWeight: 600 }}>Auto Create Critical Tasks</span>
                <input
                  type="checkbox"
                  checked={form.autoCreateCriticalTasks}
                  onChange={() => handleToggle('autoCreateCriticalTasks')}
                />
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 12,
                  border: '1px solid #e5e7eb',
                  borderRadius: 10
                }}
              >
                <span style={{ fontWeight: 600 }}>Enable Recovery Funnel</span>
                <input
                  type="checkbox"
                  checked={form.enableRecoveryFunnel}
                  onChange={() => handleToggle('enableRecoveryFunnel')}
                />
              </label>
            </div>
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

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="submit" style={primaryButtonStyle}>
            Save Settings
          </button>

          <button type="button" style={buttonStyle} onClick={handleReset}>
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}