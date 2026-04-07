import React, { useEffect, useState } from 'react';
import { getTenantSettings, updateTenantSettings } from '../api/tenant';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function inputStyle() {
  return {
    width: '100%',
    padding: '11px 12px',
    borderRadius: 10,
    border: '1px solid #dbe2ea',
    background: '#ffffff',
    fontSize: 14,
    boxSizing: 'border-box'
  };
}

function buttonStyle(variant = 'primary', disabled = false) {
  const base = {
    border: 'none',
    borderRadius: 10,
    padding: '10px 12px',
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: 14,
    opacity: disabled ? 0.7 : 1
  };

  if (variant === 'secondary') {
    return { ...base, background: '#e2e8f0', color: '#0f172a' };
  }

  return { ...base, background: '#2563eb', color: '#fff' };
}

const defaults = {
  tenantName: 'RAFTOP Enterprise',
  userName: 'Tenant User',
  supportEmail: '',
  supportPhone: '',
  defaultDoctor: '',
  defaultComplianceTarget: 80,
  timezone: 'Europe/Athens',
  language: 'en',
  reminderWindowDays: 3,
  smsSender: 'RAFTOP',
  notificationEmail: '',
  atlasEnabled: true,
  followupAutomation: true,
  doctorPortalEnabled: true,
  patientNotifications: true,
  smsNotifications: false,
  emailNotifications: true,
  aiScoringEnabled: true,
  nightlySyncEnabled: true,
  leakAlertsEnabled: true,
  ahiAlertsEnabled: true
};

export default function TenantSettingsPage() {
  const [form, setForm] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [error, setError] = useState('');

  async function loadSettings() {
    try {
      setLoading(true);
      setError('');
      const result = await getTenantSettings();
      const payload = result?.data || result || {};
      setForm({
        ...defaults,
        ...payload
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError('');
      const result = await updateTenantSettings(form);
      const payload = result?.data || result || form;
      setForm({
        ...defaults,
        ...payload
      });
      setSavedAt(new Date().toLocaleString());
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div style={cardStyle()}>Loading settings...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Settings</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Tenant-wide operational and automation configuration.
        </p>
      </div>

      {error ? (
        <div style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: 12, padding: 14 }}>
          {error}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 20 }}>
        <div style={cardStyle()}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Tenant Profile</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input style={inputStyle()} placeholder="Tenant name" value={form.tenantName} onChange={(e) => updateField('tenantName', e.target.value)} />
            <input style={inputStyle()} placeholder="User name" value={form.userName} onChange={(e) => updateField('userName', e.target.value)} />
            <input style={inputStyle()} placeholder="Support email" value={form.supportEmail} onChange={(e) => updateField('supportEmail', e.target.value)} />
            <input style={inputStyle()} placeholder="Support phone" value={form.supportPhone} onChange={(e) => updateField('supportPhone', e.target.value)} />
            <input style={inputStyle()} placeholder="Default doctor" value={form.defaultDoctor} onChange={(e) => updateField('defaultDoctor', e.target.value)} />
            <input style={inputStyle()} type="number" placeholder="Compliance target" value={form.defaultComplianceTarget} onChange={(e) => updateField('defaultComplianceTarget', e.target.value)} />
            <input style={inputStyle()} placeholder="Timezone" value={form.timezone} onChange={(e) => updateField('timezone', e.target.value)} />
            <input style={inputStyle()} placeholder="Language" value={form.language} onChange={(e) => updateField('language', e.target.value)} />
            <input style={inputStyle()} type="number" placeholder="Reminder window days" value={form.reminderWindowDays} onChange={(e) => updateField('reminderWindowDays', e.target.value)} />
            <input style={inputStyle()} placeholder="SMS sender" value={form.smsSender} onChange={(e) => updateField('smsSender', e.target.value)} />
            <div style={{ gridColumn: '1 / -1' }}>
              <input style={inputStyle()} placeholder="Notification email" value={form.notificationEmail} onChange={(e) => updateField('notificationEmail', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16 }}>Automation Toggles</div>

          <div style={{ display: 'grid', gap: 12 }}>
            {[
              ['atlasEnabled', 'ATLAS enabled'],
              ['followupAutomation', 'Follow-up automation'],
              ['doctorPortalEnabled', 'Doctor portal enabled'],
              ['patientNotifications', 'Patient notifications'],
              ['smsNotifications', 'SMS notifications'],
              ['emailNotifications', 'Email notifications'],
              ['aiScoringEnabled', 'AI scoring enabled'],
              ['nightlySyncEnabled', 'Nightly sync enabled'],
              ['leakAlertsEnabled', 'Leak alerts enabled'],
              ['ahiAlertsEnabled', 'AHI alerts enabled']
            ].map(([key, label]) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: '1px solid #eef2f7'
                }}
              >
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => updateField(key, e.target.checked)}
                />
              </label>
            ))}
          </div>

          <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" disabled={saving} style={buttonStyle('primary', saving)} onClick={handleSave}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            <button type="button" style={buttonStyle('secondary')} onClick={loadSettings}>
              Reload
            </button>
          </div>

          {savedAt ? (
            <div style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
              Last saved: {savedAt}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}