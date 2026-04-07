import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getTenantDoctors,
  getTenantFollowup,
  getTenantPatients,
  getTenantReferrals,
  getTenantTasks
} from '../api/tenant';
import { getAtlasQueue } from '../api/atlas';
import { ErrorBanner, SuccessBanner } from '../components/SystemBanner';

function cardStyle() {
  return {
    background: '#ffffff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 8px 24px rgba(15,23,42,0.06)'
  };
}

function statCardStyle(bg = '#ffffff') {
  return {
    background: bg,
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(15,23,42,0.05)'
  };
}

function extractList(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  return [];
}

function safe(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function MiniBarChart({ title, items, color = '#2563eb', prefix = '', suffix = '' }) {
  const max = Math.max(...items.map((item) => safe(item.value)), 1);

  return (
    <div style={cardStyle()}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>{title}</div>

      <div style={{ display: 'grid', gap: 14 }}>
        {items.map((item) => (
          <div key={item.label}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 6
              }}
            >
              <span style={{ color: '#334155', fontWeight: 600 }}>{item.label}</span>
              <span style={{ color: '#0f172a', fontWeight: 800 }}>
                {prefix}
                {safe(item.value)}
                {suffix}
              </span>
            </div>

            <div
              style={{
                width: '100%',
                height: 10,
                background: '#e2e8f0',
                borderRadius: 999,
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: `${(safe(item.value) / max) * 100}%`,
                  height: '100%',
                  background: color,
                  borderRadius: 999
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineItem({ title, subtitle, meta, color = '#2563eb' }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '18px 1fr', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: color,
            marginTop: 6
          }}
        />
      </div>

      <div
        style={{
          background: '#f8fafc',
          borderRadius: 12,
          padding: 14,
          border: '1px solid #e5e7eb'
        }}
      >
        <div style={{ fontWeight: 800, color: '#0f172a' }}>{title}</div>
        <div style={{ marginTop: 4, color: '#475569' }}>{subtitle}</div>
        {meta ? <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>{meta}</div> : null}
      </div>
    </div>
  );
}

function statusBadgeStyle(status) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700
  };

  if (status === 'active') return { ...base, background: '#dcfce7', color: '#166534' };
  if (status === 'pending') return { ...base, background: '#fef3c7', color: '#92400e' };
  if (status === 'inactive') return { ...base, background: '#fee2e2', color: '#991b1b' };
  return { ...base, background: '#dbeafe', color: '#1d4ed8' };
}

export default function TenantDoctorProfilePage() {
  const { doctorId } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [atlasCases, setAtlasCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError('');

      const [doctorsRes, patientsRes, tasksRes, referralsRes, followupRes, atlasRes] =
        await Promise.all([
          getTenantDoctors(),
          getTenantPatients(),
          getTenantTasks(),
          getTenantReferrals(),
          getTenantFollowup(),
          getAtlasQueue()
        ]);

      const doctors = extractList(doctorsRes);
      const allPatients = extractList(patientsRes);
      const allTasks = extractList(tasksRes);
      const allReferrals = extractList(referralsRes);
      const allFollowups = extractList(followupRes);
      const allAtlas = extractList(atlasRes);

      const foundDoctor = doctors.find((d) => String(d.id) === String(doctorId));

      if (!foundDoctor) {
        setDoctor(null);
        setError('Doctor not found');
        return;
      }

      const doctorName = foundDoctor.full_name || foundDoctor.name || 'Unknown Doctor';

      setDoctor({
        id: foundDoctor.id,
        full_name: doctorName,
        specialty: foundDoctor.specialty || 'General',
        email: foundDoctor.email || '',
        phone: foundDoctor.phone || '',
        clinic: foundDoctor.clinic || '',
        city: foundDoctor.city || '',
        status: foundDoctor.status || 'active',
        patients_count: safe(foundDoctor.patients_count),
        active_cases: safe(foundDoctor.active_cases),
        compliance_rate: safe(foundDoctor.compliance_rate),
        referrals_count: safe(foundDoctor.referrals_count),
        revenue: safe(foundDoctor.revenue),
        created_at: foundDoctor.created_at || '',
        notes: foundDoctor.notes || ''
      });

      setPatients(
        allPatients.filter(
          (p) =>
            String(p.doctor_id) === String(foundDoctor.id) ||
            p.doctor_name === doctorName
        )
      );

      setTasks(
        allTasks.filter(
          (t) =>
            String(t.doctor_id) === String(foundDoctor.id) ||
            t.doctor_name === doctorName
        )
      );

      setReferrals(
        allReferrals.filter(
          (r) =>
            String(r.doctor_id) === String(foundDoctor.id) ||
            r.doctor_name === doctorName
        )
      );

      setFollowups(
        allFollowups.filter(
          (f) =>
            String(f.doctor_id) === String(foundDoctor.id) ||
            f.doctor_name === doctorName
        )
      );

      setAtlasCases(
        allAtlas.filter(
          (a) =>
            String(a.doctor_id) === String(foundDoctor.id) ||
            a.doctor_name === doctorName
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load doctor profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [doctorId]);

  const analytics = useMemo(() => {
    const compliantPatients = patients.filter((p) => p.status === 'compliant').length;
    const atRiskPatients = patients.filter((p) => p.status === 'at_risk').length;
    const nonCompliantPatients = patients.filter((p) => p.status === 'non_compliant').length;

    const openTasks = tasks.filter((t) => t.status === 'open').length;
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;

    const pendingReferrals = referrals.filter((r) => r.status === 'pending').length;
    const convertedReferrals = referrals.filter((r) => r.status === 'converted').length;

    const criticalAtlas = atlasCases.filter((a) => a.priority === 'critical').length;
    const highAtlas = atlasCases.filter((a) => a.priority === 'high').length;

    const avgUsage =
      patients.length > 0
        ? Math.round(
            patients.reduce((sum, p) => sum + safe(p.usage_hours_month), 0) / patients.length
          )
        : 0;

    const avgAhi =
      patients.length > 0
        ? (
            patients.reduce((sum, p) => sum + safe(p.ahi), 0) / patients.length
          ).toFixed(1)
        : '0.0';

    return {
      compliantPatients,
      atRiskPatients,
      nonCompliantPatients,
      openTasks,
      completedTasks,
      pendingReferrals,
      convertedReferrals,
      criticalAtlas,
      highAtlas,
      avgUsage,
      avgAhi
    };
  }, [patients, tasks, referrals, atlasCases]);

  const timeline = useMemo(() => {
    const taskEvents = tasks.map((t) => ({
      key: `task-${t.id}`,
      title: `Task: ${t.title || 'Untitled Task'}`,
      subtitle: `${t.status || 'open'} • ${t.priority || 'medium'}`,
      meta: t.notes || t.due_date || '-',
      date: t.created_at || t.due_date || '',
      color: '#2563eb'
    }));

    const referralEvents = referrals.map((r) => ({
      key: `ref-${r.id}`,
      title: `Referral: ${r.patient_name || 'Unknown Patient'}`,
      subtitle: `${r.status || 'pending'} • ${r.source || 'doctor'}`,
      meta: r.notes || r.created_at || '-',
      date: r.created_at || '',
      color: '#16a34a'
    }));

    const followupEvents = followups.map((f) => ({
      key: `follow-${f.id}`,
      title: `Follow-up: ${f.patient_name || 'Unknown Patient'}`,
      subtitle: `${f.status || 'pending'} • ${f.channel || 'phone'}`,
      meta: f.outcome || f.notes || '-',
      date: f.last_contact || f.due_date || '',
      color: '#7c3aed'
    }));

    const atlasEvents = atlasCases.map((a) => ({
      key: `atlas-${a.id}`,
      title: `ATLAS Case: ${a.patient_name || 'Unknown Patient'}`,
      subtitle: `${a.priority || 'medium'} • score ${safe(a.score)}`,
      meta: a.reason || '-',
      date: a.created_at || '',
      color: '#dc2626'
    }));

    return [...taskEvents, ...referralEvents, ...followupEvents, ...atlasEvents].sort((a, b) => {
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();
      return db - da;
    });
  }, [tasks, referrals, followups, atlasCases]);

  if (loading) {
    return <div style={cardStyle()}>Loading doctor profile...</div>;
  }

  if (!doctor) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <ErrorBanner message={error || 'Doctor not found'} />
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: 'fit-content',
            border: 'none',
            background: '#e2e8f0',
            color: '#0f172a',
            borderRadius: 10,
            padding: '8px 12px',
            cursor: 'pointer',
            fontWeight: 700
          }}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={cardStyle()}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          <div>
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

            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>
              {doctor.full_name}
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b' }}>
              Doctor performance, patient panel, referrals, ATLAS cases, and activity timeline.
            </p>
          </div>

          <span style={statusBadgeStyle(doctor.status || 'active')}>
            {doctor.status || 'active'}
          </span>
        </div>
      </div>

      <ErrorBanner message={error} />
      <SuccessBanner message={success} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
          gap: 16
        }}
      >
        <div style={statCardStyle('#eff6ff')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Patients</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{patients.length}</div>
        </div>

        <div style={statCardStyle('#ecfdf5')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Revenue</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>€{doctor.revenue || 0}</div>
        </div>

        <div style={statCardStyle('#fef3c7')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Referrals</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{referrals.length}</div>
        </div>

        <div style={statCardStyle('#fee2e2')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>ATLAS Cases</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{atlasCases.length}</div>
        </div>

        <div style={statCardStyle('#f8fafc')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Average Usage</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{analytics.avgUsage}h</div>
        </div>

        <div style={statCardStyle('#f8fafc')}>
          <div style={{ fontSize: 13, color: '#64748b' }}>Average AHI</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{analytics.avgAhi}</div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20
        }}
      >
        <MiniBarChart
          title="Patient Compliance Mix"
          items={[
            { label: 'Compliant', value: analytics.compliantPatients },
            { label: 'At Risk', value: analytics.atRiskPatients },
            { label: 'Non-Compliant', value: analytics.nonCompliantPatients }
          ]}
          color="#16a34a"
        />

        <MiniBarChart
          title="Doctor Operations"
          items={[
            { label: 'Open Tasks', value: analytics.openTasks },
            { label: 'Completed Tasks', value: analytics.completedTasks },
            { label: 'Pending Referrals', value: analytics.pendingReferrals },
            { label: 'Converted Referrals', value: analytics.convertedReferrals }
          ]}
          color="#2563eb"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20
        }}
      >
        <MiniBarChart
          title="ATLAS Priority Load"
          items={[
            { label: 'Critical', value: analytics.criticalAtlas },
            { label: 'High', value: analytics.highAtlas },
            { label: 'All Cases', value: atlasCases.length }
          ]}
          color="#dc2626"
        />

        <MiniBarChart
          title="Business Snapshot"
          items={[
            { label: 'Revenue', value: doctor.revenue || 0 },
            { label: 'Compliance Rate', value: doctor.compliance_rate || 0 },
            { label: 'Patients', value: patients.length }
          ]}
          color="#7c3aed"
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20
        }}
      >
        <div style={cardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Doctor Details</div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div><strong>Specialty:</strong> {doctor.specialty || '-'}</div>
            <div><strong>Email:</strong> {doctor.email || '-'}</div>
            <div><strong>Phone:</strong> {doctor.phone || '-'}</div>
            <div><strong>Clinic:</strong> {doctor.clinic || '-'}</div>
            <div><strong>City:</strong> {doctor.city || '-'}</div>
            <div><strong>Created:</strong> {doctor.created_at || '-'}</div>
            <div><strong>Notes:</strong> {doctor.notes || '-'}</div>
          </div>
        </div>

        <div style={cardStyle()}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Linked Patients</div>

          {patients.length === 0 ? (
            <div style={{ color: '#64748b' }}>No linked patients found.</div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {patients.slice(0, 8).map((patient) => (
                <div
                  key={patient.id}
                  style={{
                    padding: 14,
                    borderRadius: 12,
                    background: '#f8fafc',
                    border: '1px solid #e5e7eb',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                  }}
                  onClick={() => navigate(`/tenant/patients/${patient.id}`)}
                >
                  <div style={{ fontWeight: 800 }}>{patient.full_name || patient.name || 'Unknown Patient'}</div>
                  <div style={{ marginTop: 6, color: '#475569' }}>
                    Usage: {safe(patient.usage_hours_month)}h • Status: {patient.status || 'at_risk'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle()}>
        <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>Doctor Timeline</div>

        {timeline.length === 0 ? (
          <div style={{ color: '#64748b' }}>No doctor activity found.</div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {timeline.map((item) => (
              <TimelineItem
                key={item.key}
                title={item.title}
                subtitle={item.subtitle}
                meta={item.meta || item.date || '-'}
                color={item.color}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}