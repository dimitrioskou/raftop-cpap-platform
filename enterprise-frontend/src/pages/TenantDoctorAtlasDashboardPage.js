import React, { useEffect, useState } from 'react';
import { getDoctorAtlasSummary } from '../api/atlas';

function cardStyle(background = '#ffffff') {
  return {
    background,
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function normalizeSummary(data = {}) {
  return {
    totalCases: Number(data.totalCases || data.total_cases || data.total || 0),
    criticalCases: Number(data.criticalCases || data.critical_cases || data.critical || 0),
    activePatients: Number(data.activePatients || data.active_patients || data.patients || 0),
    avgRiskScore: Number(data.avgRiskScore || data.avg_risk_score || data.average_score || 0),
    estimatedRevenue: Number(data.estimatedRevenue || data.estimated_revenue || data.revenue || 0),
    unresolvedAlerts: Number(data.unresolvedAlerts || data.unresolved_alerts || data.alerts || 0)
  };
}

export default function TenantDoctorAtlasDashboardPage() {
  const [summary, setSummary] = useState({
    totalCases: 0,
    criticalCases: 0,
    activePatients: 0,
    avgRiskScore: 0,
    estimatedRevenue: 0,
    unresolvedAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getDoctorAtlasSummary();
        const payload = res?.data || res || {};
        setSummary(normalizeSummary(payload));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Doctor ATLAS Dashboard</h2>
        <p style={{ margin: '8px 0 0', color: '#64748b' }}>
          Doctor-focused clinical summary of prioritized cases.
        </p>
      </div>

      {loading ? (
        <div style={cardStyle()}>Loading doctor ATLAS summary...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16
            }}
          >
            <div style={cardStyle()}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Doctor Cases</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>{summary.totalCases}</div>
            </div>
            <div style={cardStyle('#fee2e2')}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Critical Cases</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#991b1b' }}>
                {summary.criticalCases}
              </div>
            </div>
            <div style={cardStyle('#eff6ff')}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Active Patients</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#1d4ed8' }}>
                {summary.activePatients}
              </div>
            </div>
            <div style={cardStyle('#fef3c7')}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Avg Risk Score</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#92400e' }}>
                {summary.avgRiskScore}
              </div>
            </div>
            <div style={cardStyle('#ecfdf5')}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Revenue Opportunity</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8, color: '#166534' }}>
                €{summary.estimatedRevenue}
              </div>
            </div>
            <div style={cardStyle('#f8fafc')}>
              <div style={{ fontSize: 13, color: '#64748b' }}>Unresolved Alerts</div>
              <div style={{ fontSize: 32, fontWeight: 800, marginTop: 8 }}>
                {summary.unresolvedAlerts}
              </div>
            </div>
          </div>

          <div
            style={{
              ...cardStyle(),
              color: '#475569',
              lineHeight: 1.7
            }}
          >
            This doctor view highlights patient cases that need clinical attention first.
            Prioritize critical cases, then review unresolved alerts and moderate-score cases
            that may require intervention or coordination with the care team.
          </div>
        </>
      )}
    </div>
  );
}