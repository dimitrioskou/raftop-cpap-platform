import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTenantFollowup,
  getTenantNotes,
  getTenantPatientById,
  getTenantTasks
} from '../api/tenant';
import { ErrorBanner, SuccessBanner } from '../components/SystemBanner';
import TrendLineChart from '../components/charts/TrendLineChart';
import {
  buildRiskTrajectory,
  buildSuggestedMessages,
  calculateRiskScore,
  getPredictionText,
  getRecommendedActions,
  getRiskLevel,
  safeNumber
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

function extractObject(result) {
  if (result?.data && !Array.isArray(result.data)) {
    if (result.data.data && !Array.isArray(result.data.data)) return result.data.data;
    return result.data;
  }
  return result || {};
}

function badge(level) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 800
  };

  if (level === 'critical') return { ...base, background: '#fee2e2', color: '#991b1b' };
  if (level === 'high') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (level === 'medium') return { ...base, background: '#dbeafe', color: '#1d4ed8' };
  return { ...base, background: '#dcfce7', color: '#166534' };
}

export default function TenantPatientProfileAIPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');

      const [patientRes, tasksRes, followupsRes, notesRes] = await Promise.all([
        getTenantPatientById(patientId),
        getTenantTasks(),
        getTenantFollowup(),
        getTenantNotes()
      ]);

      const patientData = extractObject(patientRes);

      setPatient(patientData);
      setTasks(
        extractList(tasksRes).filter(
          (t) =>
            String(t.patient_id) === String(patientData.id) ||
            t.patient_name === patientData.full_name
        )
      );
      setFollowups(
        extractList(followupsRes).filter(
          (f) =>
            String(f.patient_id) === String(patientData.id) ||
            f.patient_name === patientData.full_name
        )
      );
      setNotes(
        extractList(notesRes).filter(
          (n) =>
            String(n.patient_id) === String(patientData.id) ||
            n.patient_name === patientData.full_name
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load patient AI profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [patientId]);

  const ai = useMemo(() => {
    if (!patient) return null;

    const riskScore = calculateRiskScore(patient);
    const riskLevel = getRiskLevel(riskScore);

    return {
      riskScore,
      riskLevel,
      prediction: getPredictionText(patient),
      actions: getRecommendedActions(patient),
      trajectory: buildRiskTrajectory(patient),
      messages: buildSuggestedMessages(patient)
    };
  }, [patient]);

  const timeline = useMemo(() => {
    const items = [];

    tasks.forEach((t) => {
      items.push({
        id: `task-${t.id}`,
        type: 'Task',
        title: t.title || 'Untitled Task',
        meta: t.status || 'open'
      });
    });

    followups.forEach((f) => {
      items.push({
        id: `followup-${f.id}`,
        type: 'Follow-up',
        title: f.reason || 'General follow-up',
        meta: f.status || 'pending'
      });
    });

    notes.forEach((n) => {
      items.push({
        id: `note-${n.id}`,
        type: 'Note',
        title: n.title || 'Untitled Note',
        meta: n.type || 'operational'
      });
    });

    return items;
  }, [tasks, followups, notes]);

  if (loading) return <div style={cardStyle()}>Loading patient AI profile...</div>;

  if (!patient) {
    return <ErrorBanner message={error || 'Patient not found'} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            border: 'none',
            background: '#e2e8f0',
            color: '#0f172a',
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 700,
            marginBottom: 12
          }}
        >
          Back
        </button>

        <h1 style={{ margin: 0 }}>{patient.full_name || 'Patient AI Profile'}</h1>
        <p style={{ color: '#64748b' }}>
          AI risk prediction, clinical trajectory, and automated follow-up guidance.
        </p>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}
      >
        <div style={{ ...cardStyle(), background: '#eff6ff' }}>
          <div style={{ color: '#64748b' }}>Risk Score</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{ai.riskScore}</div>
        </div>

        <div style={{ ...cardStyle(), background: '#ecfdf5' }}>
          <div style={{ color: '#64748b' }}>Usage / Month</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>
            {safeNumber(patient.usage_hours_month)}h
          </div>
        </div>

        <div style={{ ...cardStyle(), background: '#fef3c7' }}>
          <div style={{ color: '#64748b' }}>AHI</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{safeNumber(patient.ahi)}</div>
        </div>

        <div style={{ ...cardStyle(), background: '#fee2e2' }}>
          <div style={{ color: '#64748b' }}>Leak</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{safeNumber(patient.leak)}</div>
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>AI Prediction</div>
        <div style={{ marginBottom: 12 }}>
          <span style={badge(ai.riskLevel)}>{ai.riskLevel}</span>
        </div>
        <div style={{ color: '#475569' }}>{ai.prediction}</div>
      </div>

      <TrendLineChart
        title="Risk Score Trajectory"
        subtitle="Historical + forecasted AI risk view"
        data={ai.trajectory}
        lines={[{ dataKey: 'risk', name: 'Risk Score', stroke: '#dc2626' }]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={cardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Recommended Actions</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {ai.actions.map((action) => (
              <div
                key={action}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 12
                }}
              >
                {action}
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Suggested Messages</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12
              }}
            >
              <strong>SMS</strong>
              <div style={{ marginTop: 8, color: '#475569' }}>{ai.messages.sms}</div>
            </div>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12
              }}
            >
              <strong>Email</strong>
              <div style={{ marginTop: 8, color: '#475569' }}>{ai.messages.email}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 12 }}>Patient Timeline</div>

        {timeline.length === 0 ? (
          <div style={{ color: '#64748b' }}>No timeline activity found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {timeline.map((item) => (
              <div
                key={item.id}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 12
                }}
              >
                <div style={{ fontWeight: 700 }}>{item.type}: {item.title}</div>
                <div style={{ color: '#64748b', marginTop: 4 }}>{item.meta}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}