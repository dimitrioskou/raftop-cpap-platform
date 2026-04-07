import React, { useEffect, useMemo, useState } from 'react';
import { getTenantPatients } from '../api/tenant';
import { ErrorBanner, SuccessBanner } from '../components/SystemBanner';
import {
  buildSuggestedMessages,
  calculateRiskScore,
  getRiskLevel
} from '../utils/aiPatientInsights';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function extractList(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
}

export default function TenantAutoFollowupAIPage() {
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [channel, setChannel] = useState('sms');
  const [messageBody, setMessageBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadPatients() {
    try {
      setLoading(true);
      setError('');
      const res = await getTenantPatients();
      const list = extractList(res).map((p) => {
        const riskScore = calculateRiskScore(p);
        return {
          ...p,
          ai_risk_score: riskScore,
          ai_risk_level: getRiskLevel(riskScore)
        };
      });
      setPatients(list);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const criticalPatients = useMemo(() => {
    return patients
      .filter((p) => p.ai_risk_level === 'critical' || p.ai_risk_level === 'high')
      .sort((a, b) => b.ai_risk_score - a.ai_risk_score);
  }, [patients]);

  function handleSelect(patient) {
    setSelected(patient);
    const messages = buildSuggestedMessages(patient);
    setMessageBody(channel === 'sms' ? messages.sms : messages.email);
  }

  function handleChangeChannel(nextChannel) {
    setChannel(nextChannel);
    if (selected) {
      const messages = buildSuggestedMessages(selected);
      setMessageBody(nextChannel === 'sms' ? messages.sms : messages.email);
    }
  }

  async function handleSend() {
    try {
      setSending(true);
      setError('');
      setSuccess('');
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSuccess(`${channel.toUpperCase()} follow-up prepared for ${selected?.full_name || 'patient'}.`);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to prepare follow-up');
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h1 style={{ margin: 0 }}>Auto-followup AI</h1>
        <p style={{ color: '#64748b' }}>
          AI-assisted patient outreach for high-risk compliance deterioration cases.
        </p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      {loading ? (
        <div style={cardStyle()}>Loading AI follow-up queue...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 20 }}>
          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              High-risk Patients
            </div>

            {criticalPatients.length === 0 ? (
              <div style={{ color: '#64748b' }}>No high-risk patients found.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {criticalPatients.map((patient) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelect(patient)}
                    style={{
                      border: selected?.id === patient.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      background: selected?.id === patient.id ? '#eff6ff' : '#f8fafc',
                      borderRadius: 12,
                      padding: 12,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{patient.full_name}</div>
                    <div style={{ marginTop: 4, color: '#64748b' }}>
                      Risk: {patient.ai_risk_level} ({patient.ai_risk_score})
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={cardStyle()}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>
              AI Follow-up Composer
            </div>

            {!selected ? (
              <div style={{ color: '#64748b' }}>Select a patient to prepare a message.</div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ fontWeight: 700 }}>{selected.full_name}</div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleChangeChannel('sms')}
                    style={{
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 12px',
                      background: channel === 'sms' ? '#2563eb' : '#e2e8f0',
                      color: channel === 'sms' ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    SMS
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChangeChannel('email')}
                    style={{
                      border: 'none',
                      borderRadius: 10,
                      padding: '8px 12px',
                      background: channel === 'email' ? '#2563eb' : '#e2e8f0',
                      color: channel === 'email' ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      fontWeight: 700
                    }}
                  >
                    Email
                  </button>
                </div>

                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 180,
                    borderRadius: 12,
                    border: '1px solid #dbe2ea',
                    padding: 12,
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />

                <button
                  type="button"
                  disabled={sending}
                  onClick={handleSend}
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 14px',
                    background: '#16a34a',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  {sending ? 'Preparing...' : `Prepare ${channel.toUpperCase()} Follow-up`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}