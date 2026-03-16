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

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>RAFTOP Admin Dashboard</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Operational control center for patients, devices, compliance and follow-up actions.
      </p>

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