import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getKpiOverview } from '../api/kpi';
import { getActivityLogs } from '../api/activity';
import { getTasks } from '../api/tasks';
import { getReferrals } from '../api/referrals';
import { getDevices } from '../api/devices';
import {
  getFollowUpPatients,
  getFollowUpOutcomesSummary,
  getAllFollowUpOutcomes,
  getPriorityQueue
} from '../api/followup';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '18px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const linkCardStyle = {
  ...cardStyle,
  textDecoration: 'none',
  color: '#111827',
  display: 'block'
};

const alertCardBase = {
  borderRadius: '14px',
  padding: '16px',
  border: '1px solid',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const quickActionStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: '10px',
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  textDecoration: 'none',
  fontWeight: 600
};

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTask(task) {
  return {
    ...task,
    id: task?.id || task?._id || `${task?.title || 'task'}-${Math.random()}`,
    title: task?.title || task?.task_title || 'Untitled Task',
    description: task?.description || task?.details || task?.note || '',
    status: task?.status || task?.task_status || 'pending',
    priority: task?.priority || task?.task_priority || 'medium',
    due_date: task?.due_date || task?.dueDate || task?.scheduled_for || null,
    category: task?.category || task?.type || 'general',
    assignee: task?.assignee || task?.owner || '',
    patient_name: task?.patient_name || task?.patientName || task?.fullName || '',
    created_at: task?.created_at || task?.createdAt || ''
  };
}

function normalizePatientName(patient) {
  if (patient?.patients) {
    const full = `${patient.patients.first_name || ''} ${patient.patients.last_name || ''}`.trim();
    if (full) return full;
  }

  if (patient?.patientName) return patient.patientName;
  if (patient?.fullName) return patient.fullName;
  if (patient?.name) return patient.name;

  const fallback = `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim();
  return fallback || 'Patient';
}

function normalizePhone(patient) {
  return (
    patient?.patients?.phone ||
    patient?.phone ||
    patient?.mobile ||
    patient?.telephone ||
    '-'
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [offlineDevices, setOfflineDevices] = useState([]);
  const [followUpPatients, setFollowUpPatients] = useState([]);
  const [priorityQueue, setPriorityQueue] = useState([]);
  const [outcomesSummary, setOutcomesSummary] = useState(null);
  const [recentOutcomes, setRecentOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExecutiveModal, setShowExecutiveModal] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          kpiData,
          activityData,
          tasksData,
          referralsData,
          devicesData,
          followUpData,
          priorityQueueData,
          outcomesSummaryData,
          allOutcomesData
        ] = await Promise.all([
          getKpiOverview(),
          getActivityLogs(),
          getTasks(),
          getReferrals(),
          getDevices({ status: 'offline' }),
          getFollowUpPatients(),
          getPriorityQueue(),
          getFollowUpOutcomesSummary(),
          getAllFollowUpOutcomes()
        ]);

        const normalizedTasks = safeArray(tasksData).map(normalizeTask);
        const normalizedFollowUpPatients = safeArray(followUpData);
        const normalizedPriorityQueue = safeArray(priorityQueueData?.data || priorityQueueData);

        setOverview(kpiData || null);
        setActivity(safeArray(activityData).slice(0, 6));
        setTasks(normalizedTasks);
        setReferrals(safeArray(referralsData));
        setOfflineDevices(safeArray(devicesData));
        setFollowUpPatients(normalizedFollowUpPatients);
        setPriorityQueue(normalizedPriorityQueue);
        setOutcomesSummary(outcomesSummaryData || null);
        setRecentOutcomes(safeArray(allOutcomesData).slice(0, 5));
      } catch (error) {
        console.error('Error loading dashboard:', error);
        setOverview(null);
        setActivity([]);
        setTasks([]);
        setReferrals([]);
        setOfflineDevices([]);
        setFollowUpPatients([]);
        setPriorityQueue([]);
        setOutcomesSummary(null);
        setRecentOutcomes([]);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const now = new Date();

  const pendingTasks = tasks.filter((t) => {
    const status = String(t.status || '').toLowerCase();
    return status !== 'completed' && status !== 'done';
  });

  const overdueTasks = pendingTasks.filter(
    (t) => t.due_date && new Date(t.due_date) < now
  );

  const recentTasks = pendingTasks.slice(0, 5);

  const highPriorityReferrals = referrals.filter((r) => {
    const priority = String(r?.priority || '').toLowerCase();
    return priority === 'high' || priority === 'urgent';
  });

  const criticalFollowUpPatients = followUpPatients.filter((p) => {
    const status = String(p?.compliance_status || '').toLowerCase();
    return status === 'critical';
  });

  const warningFollowUpPatients = followUpPatients.filter((p) => {
    const status = String(p?.compliance_status || '').toLowerCase();
    return status === 'warning';
  });

  const criticalPriorityQueue = priorityQueue.filter((p) => {
    const priority = String(p?.priority || '').toLowerCase();
    return priority === 'critical';
  });

  const hasAlerts =
    overdueTasks.length > 0 ||
    offlineDevices.length > 0 ||
    highPriorityReferrals.length > 0 ||
    criticalFollowUpPatients.length > 0 ||
    criticalPriorityQueue.length > 0;

  const executiveDemoStats = {
    recoveredPatients: 1840,
    avgUsageHours: 76,
    repeatabilityScore: 88,
    activeStaff: 14
  };

  const commercialDemoStats = {
    atRiskRevenuePatients: 312,
    recoveryOpportunityPatients: 824,
    highValueReferrals: 46,
    missedFollowUpsCost: '€8.500',
    growthOpportunity: '€18.000+',
    retainedValue: '€12.000+'
  };

  return (
    <div style={{ padding: 24, position: 'relative' }}>
      {!loading && showExecutiveModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(17,24,39,0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 820,
              background: '#ffffff',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}
          >
            <div
              style={{
                padding: 20,
                background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
                color: '#ffffff'
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: '5px 10px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10
                }}
              >
                OWNER ALERT
              </div>

              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                High operational and commercial attention required
              </div>

              <div style={{ color: '#fee2e2', lineHeight: 1.55 }}>
                The platform indicates both operational risk and clear commercial opportunity.
                Immediate review can protect revenue and increase recovery value.
              </div>
            </div>

            <div style={{ padding: 20 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: 12,
                  marginBottom: 18
                }}
              >
                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Critical Cases
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#dc2626' }}>
                    {criticalFollowUpPatients.length}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Overdue Tasks
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#ea580c' }}>
                    {overdueTasks.length}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Revenue at Risk
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#b45309' }}>
                    {commercialDemoStats.missedFollowUpsCost}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: 14 }}>
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Growth Opportunity
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>
                    {commercialDemoStats.growthOpportunity}
                  </div>
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  marginBottom: 18
                }}
              >
                <div style={{ fontWeight: 800, color: '#111827', marginBottom: 8 }}>
                  Recommended owner action
                </div>
                <div style={{ color: '#374151', lineHeight: 1.6 }}>
                  Focus on the warning and critical groups first, reduce missed callbacks,
                  recover at-risk patient value, and use staff repeatability insights to improve
                  execution discipline. This protects recurring value and creates upsell / partner growth opportunities.
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  justifyContent: 'flex-end',
                  flexWrap: 'wrap'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowExecutiveModal(false)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1px solid #d1d5db',
                    background: '#ffffff',
                    color: '#111827',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>

                <Link
                  to="/executive-analytics"
                  onClick={() => setShowExecutiveModal(false)}
                  style={{
                    ...quickActionStyle,
                    background: '#111827',
                    color: '#ffffff',
                    border: '1px solid #111827'
                  }}
                >
                  Open Executive Analytics
                </Link>

                <Link
                  to="/staff-performance"
                  onClick={() => setShowExecutiveModal(false)}
                  style={{
                    ...quickActionStyle,
                    background: '#dc2626',
                    color: '#ffffff',
                    border: '1px solid #dc2626'
                  }}
                >
                  Open Staff Performance
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <h1 style={{ marginBottom: 8 }}>RAFTOP Admin Dashboard</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Operational control center for patients, devices, compliance, follow-up actions and executive management insight.
      </p>

      {!loading && (
        <div
          style={{
            marginBottom: 24,
            borderRadius: 18,
            padding: 18,
            border: '1px solid #fecaca',
            background: 'linear-gradient(135deg, #fff1f2 0%, #fef2f2 100%)',
            boxShadow: '0 4px 14px rgba(220,38,38,0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#dc2626',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10
                }}
              >
                EXECUTIVE RISK ALERT
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#991b1b',
                  marginBottom: 8
                }}
              >
                Immediate management attention recommended
              </div>

              <div style={{ color: '#7f1d1d', fontSize: 15, marginBottom: 12 }}>
                High operational pressure detected across follow-up activity, priority queue
                and staff discipline indicators.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 10
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Critical Cases
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#dc2626' }}>
                    {criticalFollowUpPatients.length}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Overdue Tasks
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c' }}>
                    {overdueTasks.length}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Offline Devices
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>
                    {offlineDevices.length}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fecaca',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Team Repeatability
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                    88/100
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                minWidth: 280,
                flex: '0 0 320px',
                background: '#ffffff',
                border: '1px solid #fecaca',
                borderRadius: 14,
                padding: 14
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#991b1b',
                  marginBottom: 8
                }}
              >
                Recommended Action
              </div>

              <div style={{ color: '#374151', marginBottom: 14, lineHeight: 1.55 }}>
                Review critical follow-up queue, overdue callbacks and staff execution
                consistency today. Priority coaching and queue cleanup are recommended.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 10
                }}
              >
                <Link to="/executive-analytics" style={quickActionStyle}>
                  Open Executive Analytics
                </Link>
                <Link to="/staff-performance" style={quickActionStyle}>
                  Open Staff Performance
                </Link>
                <Link to="/followup" style={quickActionStyle}>
                  Open Follow-up Center
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div
          style={{
            marginBottom: 24,
            borderRadius: 18,
            padding: 18,
            border: '1px solid #fde68a',
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            boxShadow: '0 4px 14px rgba(245,158,11,0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: 260 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: '#d97706',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 10
                }}
              >
                COMMERCIAL OPPORTUNITY ALERT
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#92400e',
                  marginBottom: 8
                }}
              >
                Revenue protection and growth opportunity detected
              </div>

              <div style={{ color: '#92400e', fontSize: 15, marginBottom: 12 }}>
                The application indicates where money may be lost through missed follow-up
                and where additional value can be created through recovery, retention and partner growth.
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: 10
                }}
              >
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Revenue at Risk
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309' }}>
                    {commercialDemoStats.missedFollowUpsCost}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Growth Opportunity
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#16a34a' }}>
                    {commercialDemoStats.growthOpportunity}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    Retained Value
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#2563eb' }}>
                    {commercialDemoStats.retainedValue}
                  </div>
                </div>

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    padding: 12
                  }}
                >
                  <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                    High-Value Referrals
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#7c3aed' }}>
                    {commercialDemoStats.highValueReferrals}
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                minWidth: 280,
                flex: '0 0 320px',
                background: '#ffffff',
                border: '1px solid #fde68a',
                borderRadius: 14,
                padding: 14
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#92400e',
                  marginBottom: 8
                }}
              >
                How to gain more money / avoid loss
              </div>

              <div style={{ color: '#374151', marginBottom: 14, lineHeight: 1.55 }}>
                Prioritize warning and critical patients, reduce missed callbacks, convert more
                referrals to active long-term follow-up, and use analytics to identify the best-performing
                clinics, doctors and staff workflows.
              </div>

              <div style={{ display: 'grid', gap: 8, color: '#374151', marginBottom: 14 }}>
                <div>• recover value from at-risk patients before churn or disengagement</div>
                <div>• increase conversion of referrals into stable active cases</div>
                <div>• identify top-performing partner accounts for growth expansion</div>
                <div>• reduce money loss from delayed follow-up and inconsistent execution</div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 10
                }}
              >
                <Link to="/executive-analytics" style={quickActionStyle}>
                  Open Revenue Insights
                </Link>
                <Link to="/followup" style={quickActionStyle}>
                  Open Recovery Workflows
                </Link>
                <Link to="/staff-performance" style={quickActionStyle}>
                  Improve Team Execution
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={cardStyle}>Loading dashboard...</div>
      ) : (
        <>
          {overview && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}
            >
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Patients</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalPatients || 0}</div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Devices</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalDevices || 0}</div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Active Devices</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
                  {overview.activeDevices || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Offline Devices</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
                  {overview.offlineDevices || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Doctors</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalDoctors || 0}</div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Referrals</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalReferrals || 0}</div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>New Referrals</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
                  {overview.newReferrals || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Clinics</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalClinics || 0}</div>
              </div>
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Below 80 Hours</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                {followUpPatients.length}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Critical Follow-ups</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
                {criticalFollowUpPatients.length}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Warning Follow-ups</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                {warningFollowUpPatients.length}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Pending Follow-up Tasks</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
                {pendingTasks.length}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Priority Queue</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
                {priorityQueue.length}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Critical Rechecks</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#b91c1c' }}>
                {criticalPriorityQueue.length}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Recovered Patients</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
                {executiveDemoStats.recoveredPatients}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Avg Usage Hours</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
                {executiveDemoStats.avgUsageHours}h
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Team Repeatability</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
                {executiveDemoStats.repeatabilityScore}/100
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Active Staff</div>
              <div style={{ fontSize: 28, fontWeight: 700 }}>
                {executiveDemoStats.activeStaff}
              </div>
            </div>
          </div>

          {outcomesSummary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 16,
                marginBottom: 24
              }}
            >
              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Reached</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>
                  {outcomesSummary.reached || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>No Answer</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#d97706' }}>
                  {outcomesSummary.no_answer || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Callback Requested</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>
                  {outcomesSummary.callback_requested || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Refused</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626' }}>
                  {outcomesSummary.refused || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Promised Improvement</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>
                  {outcomesSummary.promised_improvement || 0}
                </div>
              </div>

              <div style={cardStyle}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Total Outcomes</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {outcomesSummary.total || 0}
                </div>
              </div>
            </div>
          )}

          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <h2 style={{ marginTop: 0, marginBottom: 14 }}>Quick Actions</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12
              }}
            >
              <Link to="/executive-analytics" style={quickActionStyle}>Open Executive Analytics</Link>
              <Link to="/staff-performance" style={quickActionStyle}>Open Staff Performance</Link>
              <Link to="/followup" style={quickActionStyle}>Open Follow-up Center</Link>
              <Link to="/followup-outcomes" style={quickActionStyle}>Open Outcomes Summary</Link>
              <Link to="/compliance" style={quickActionStyle}>Open 80h Compliance</Link>
              <Link to="/tasks" style={quickActionStyle}>Open Tasks</Link>
              <Link to="/priority-queue" style={quickActionStyle}>Open Priority Queue</Link>
              <Link to="/daily-board" style={quickActionStyle}>Open Daily Board</Link>
              <Link to="/recheck-scheduler" style={quickActionStyle}>Open Recheck Scheduler</Link>
              <Link to="/recovery-funnel" style={quickActionStyle}>Open Recovery Funnel</Link>
              <Link to="/devices" style={quickActionStyle}>Open Devices</Link>
              <Link to="/notes" style={quickActionStyle}>Open Notes</Link>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24
            }}
          >
            <Link to="/executive-analytics" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Executive Analytics Preview</h3>
              <p style={{ color: '#4b5563', marginBottom: 12 }}>
                Διοικητική εικόνα για συμμόρφωση, recovery, brands, operational performance, revenue opportunity και management signals.
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ color: '#111827', fontWeight: 600 }}>Recovered Patients: 1,840</div>
                <div style={{ color: '#111827', fontWeight: 600 }}>Average Usage: 76h</div>
                <div style={{ color: '#111827', fontWeight: 600 }}>Growth Opportunity: €18.000+</div>
              </div>
            </Link>

            <Link to="/staff-performance" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Staff Performance Preview</h3>
              <p style={{ color: '#4b5563', marginBottom: 12 }}>
                Παρακολούθηση productivity, workflow discipline και repeatability score ανά υπάλληλο.
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ color: '#111827', fontWeight: 600 }}>Average Repeatability: 88/100</div>
                <div style={{ color: '#111827', fontWeight: 600 }}>Tasks Closed Today: 97</div>
                <div style={{ color: '#111827', fontWeight: 600 }}>Overdue Tasks: 38</div>
              </div>
            </Link>
          </div>

          <div style={{ marginBottom: 24 }}>
            <h2 style={{ marginBottom: 12 }}>Alerts</h2>

            {!hasAlerts ? (
              <div
                style={{
                  ...alertCardBase,
                  background: '#ecfdf5',
                  borderColor: '#a7f3d0'
                }}
              >
                <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 6 }}>
                  No critical alerts
                </div>
                <div style={{ color: '#047857' }}>
                  No overdue tasks, urgent referrals, offline-device spikes, or critical CPAP follow-ups right now.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: 16
                }}
              >
                <div
                  style={{
                    ...alertCardBase,
                    background: '#fef2f2',
                    borderColor: '#fecaca'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                    Critical CPAP Follow-ups
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#dc2626', marginBottom: 8 }}>
                    {criticalFollowUpPatients.length}
                  </div>
                  <div style={{ color: '#7f1d1d', marginBottom: 12 }}>
                    Patients with very low CPAP usage who need immediate contact.
                  </div>
                  <Link to="/followup" style={{ color: '#991b1b', fontWeight: 600 }}>
                    Open Follow-up Center
                  </Link>
                </div>

                <div
                  style={{
                    ...alertCardBase,
                    background: '#fff7ed',
                    borderColor: '#fed7aa'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 6 }}>
                    Overdue Tasks
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#ea580c', marginBottom: 8 }}>
                    {overdueTasks.length}
                  </div>
                  <div style={{ color: '#9a3412', marginBottom: 12 }}>
                    Operational tasks with due dates in the past.
                  </div>
                  <Link to="/tasks" style={{ color: '#9a3412', fontWeight: 600 }}>
                    Open Tasks
                  </Link>
                </div>

                <div
                  style={{
                    ...alertCardBase,
                    background: '#eff6ff',
                    borderColor: '#bfdbfe'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1d4ed8', marginBottom: 6 }}>
                    Offline Devices
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb', marginBottom: 8 }}>
                    {offlineDevices.length}
                  </div>
                  <div style={{ color: '#1d4ed8', marginBottom: 12 }}>
                    Devices that may need sync check or follow-up.
                  </div>
                  <Link to="/devices" style={{ color: '#1d4ed8', fontWeight: 600 }}>
                    Open Devices
                  </Link>
                </div>

                <div
                  style={{
                    ...alertCardBase,
                    background: '#faf5ff',
                    borderColor: '#d8b4fe'
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: 6 }}>
                    Critical Recheck Queue
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed', marginBottom: 8 }}>
                    {criticalPriorityQueue.length}
                  </div>
                  <div style={{ color: '#6b21a8', marginBottom: 12 }}>
                    High-priority patients waiting for recheck scheduling.
                  </div>
                  <Link to="/recheck-scheduler" style={{ color: '#6b21a8', fontWeight: 600 }}>
                    Open Recheck Scheduler
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Critical CPAP Follow-ups</h3>
              {criticalFollowUpPatients.length === 0 ? (
                <p>No critical CPAP follow-ups.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {criticalFollowUpPatients.slice(0, 5).map((patient, index) => (
                    <div key={patient.id || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {normalizePatientName(patient)}
                      </div>
                      <div style={{ color: '#4b5563' }}>
                        {patient.usage_hours || 0} ώρες · {patient.compliance_status || '-'}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {normalizePhone(patient)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Recent Contact Outcomes</h3>
              {recentOutcomes.length === 0 ? (
                <p>No follow-up outcomes yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {recentOutcomes.map((item, index) => (
                    <div key={item.id || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {item.patients
                          ? `${item.patients.first_name || ''} ${item.patients.last_name || ''}`.trim() || 'Patient'
                          : item.patientName || 'Patient'}
                      </div>
                      <div style={{ color: '#4b5563' }}>
                        {item.outcome_status || item.status || '-'}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Pending Tasks</h3>
              {recentTasks.length === 0 ? (
                <p>No pending tasks.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {recentTasks.map((task, index) => (
                    <div key={task.id || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{task.title}</div>
                      <div style={{ color: '#4b5563' }}>
                        {task.status} · {task.priority}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        Due: {task.due_date ? new Date(task.due_date).toLocaleString() : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Patients Below 80 Hours</h3>
              {followUpPatients.length === 0 ? (
                <p>No follow-up patients.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {followUpPatients.slice(0, 5).map((patient, index) => (
                    <div key={patient.id || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {normalizePatientName(patient)}
                      </div>
                      <div style={{ color: '#4b5563' }}>
                        {patient.usage_hours || 0} / {patient.target_hours || 80} ώρες
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {patient.compliance_status || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Priority Queue</h3>
              {priorityQueue.length === 0 ? (
                <p>No priority queue patients.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {priorityQueue.slice(0, 5).map((item, index) => (
                    <div key={item.id || item.patientId || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>
                        {item.patientName ||
                          item.fullName ||
                          `${item.firstName || ''} ${item.lastName || ''}`.trim() ||
                          'Patient'}
                      </div>
                      <div style={{ color: '#4b5563' }}>
                        {item.priority || 'MEDIUM'} · {item.reason || item.recommendedAction || '-'}
                      </div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {item.phone || item.mobile || '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
              {activity.length === 0 ? (
                <p>No activity logs.</p>
              ) : (
                <div style={{ display: 'grid', gap: 10 }}>
                  {activity.slice(0, 5).map((item, index) => (
                    <div key={item.id || index} style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{item.title || item.message || 'Activity event'}</div>
                      <div style={{ color: '#4b5563' }}>{item.type || item.event_type || 'activity'}</div>
                      <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 16
            }}
          >
            <Link to="/patients" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Patients</h3>
              <p style={{ color: '#4b5563' }}>View and manage patient records.</p>
            </Link>

            <Link to="/devices" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Devices</h3>
              <p style={{ color: '#4b5563' }}>Monitor CPAP devices and assignments.</p>
            </Link>

            <Link to="/compliance" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>80h Compliance</h3>
              <p style={{ color: '#4b5563' }}>Track eligibility, warning and critical usage.</p>
            </Link>

            <Link to="/followup" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Follow-up</h3>
              <p style={{ color: '#4b5563' }}>Communicate with patients below 80 hours.</p>
            </Link>

            <Link to="/priority-queue" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Priority Queue</h3>
              <p style={{ color: '#4b5563' }}>Review patients that need fast follow-up prioritization.</p>
            </Link>

            <Link to="/daily-board" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Daily Board</h3>
              <p style={{ color: '#4b5563' }}>Track today’s operational follow-up actions.</p>
            </Link>

            <Link to="/recheck-scheduler" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Recheck Scheduler</h3>
              <p style={{ color: '#4b5563' }}>Schedule rechecks for priority follow-up patients.</p>
            </Link>

            <Link to="/recovery-funnel" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Recovery Funnel</h3>
              <p style={{ color: '#4b5563' }}>Track patients from risk to improvement and recovery.</p>
            </Link>

            <Link to="/executive-analytics" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Executive Analytics</h3>
              <p style={{ color: '#4b5563' }}>Management statistics for owner, strategy and revenue opportunity.</p>
            </Link>

            <Link to="/staff-performance" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Staff Performance</h3>
              <p style={{ color: '#4b5563' }}>View staff productivity, discipline and repeatability.</p>
            </Link>

            <Link to="/followup-outcomes" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Outcomes</h3>
              <p style={{ color: '#4b5563' }}>Review contact results and patient responses.</p>
            </Link>

            <Link to="/notes" style={linkCardStyle}>
              <h3 style={{ marginTop: 0 }}>Notes</h3>
              <p style={{ color: '#4b5563' }}>Save communication and operational notes.</p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}