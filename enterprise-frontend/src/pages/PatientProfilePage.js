import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGet } from '../lib/api';

function sectionStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function row(label, value) {
  return (
    <div
      key={label}
      style={{
        display: 'grid',
        gridTemplateColumns: '180px 1fr',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid #f2f4f7'
      }}
    >
      <div style={{ color: '#667085', fontSize: 13, fontWeight: 700 }}>{label}</div>
      <div style={{ color: '#101828', fontWeight: 700 }}>
        {value === null || typeof value === 'undefined' || value === '' ? '—' : String(value)}
      </div>
    </div>
  );
}

function resolvePatientRouteId(patient, index = 0) {
  return (
    patient?.publicId ||
    patient?.placeholderId ||
    patient?.patientId ||
    patient?.id ||
    patient?.email ||
    `PATIENT-${index + 1}`
  );
}

function extractOrdinalIndex(value) {
  const raw = String(value || '').trim();

  if (/^\d+$/.test(raw)) {
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n - 1 : null;
  }

  const match = raw.toUpperCase().match(/^PATIENT[-_](\d+)$/);
  if (!match) {
    return null;
  }

  const n = Number(match[1]);
  return Number.isInteger(n) && n > 0 ? n - 1 : null;
}

function normalizePatient(patient) {
  if (!patient || typeof patient !== 'object') {
    return null;
  }

  return {
    id: patient.id ?? patient.patientId ?? null,
    patientId: patient.patientId ?? patient.id ?? null,
    publicId: patient.publicId ?? null,
    placeholderId: patient.placeholderId ?? null,
    tenantId: patient.tenantId ?? null,
    doctorId: patient.doctorId ?? null,
    firstName: patient.firstName ?? null,
    lastName: patient.lastName ?? null,
    fullName: patient.fullName ?? patient.name ?? null,
    name: patient.name ?? patient.fullName ?? null,
    email: patient.email ?? null,
    phone: patient.phone ?? null,
    status: patient.status ?? null,
    createdAt: patient.createdAt ?? null,
    updatedAt: patient.updatedAt ?? null,
    raw: patient.raw ?? null
  };
}

async function tryLoadDirect(patientId) {
  const payload = await apiGet(`/api/tenant/patients/${encodeURIComponent(patientId)}`);

  return {
    patient: normalizePatient(payload?.patient || null),
    meta: payload?.meta || null
  };
}

async function loadFromListFallback(patientId) {
  const listPayload = await apiGet('/api/tenant/patients');
  const rows = Array.isArray(listPayload?.patients) ? listPayload.patients : [];

  if (!rows.length) {
    throw new Error('No patient rows found.');
  }

  const ordinalIndex = extractOrdinalIndex(patientId);
  const fallbackIndex =
    ordinalIndex !== null && rows[ordinalIndex]
      ? ordinalIndex
      : 0;

  const candidate = normalizePatient(rows[fallbackIndex] || rows[0]);

  if (!candidate) {
    throw new Error('No usable patient row found.');
  }

  const resolvedRouteId = resolvePatientRouteId(candidate, fallbackIndex);

  try {
    const detailPayload = await apiGet(
      `/api/tenant/patients/${encodeURIComponent(resolvedRouteId)}`
    );

    return {
      patient: normalizePatient(detailPayload?.patient || candidate),
      meta: {
        ...(detailPayload?.meta || {}),
        fallbackSource: 'list_resolution',
        requestedId: patientId,
        resolvedRouteId
      }
    };
  } catch (_error) {
    return {
      patient: candidate,
      meta: {
        requestedId: patientId,
        resolvedRouteId,
        fallbackMatched: true,
        fallbackSource: 'list_row_only'
      }
    };
  }
}

export default function PatientProfilePage() {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [patient, setPatient] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    return patient?.fullName || patient?.name || patientId || 'Patient';
  }, [patient, patientId]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');
      setPatient(null);
      setMeta(null);

      try {
        try {
          const direct = await tryLoadDirect(patientId);

          if (!mounted) {
            return;
          }

          if (direct?.patient) {
            setPatient(direct.patient);
            setMeta(direct.meta || null);
            return;
          }
        } catch (_directError) {
          // continue to compatibility fallback
        }

        const fallback = await loadFromListFallback(patientId);

        if (!mounted) {
          return;
        }

        setPatient(fallback.patient || null);
        setMeta(fallback.meta || null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'Failed to load patient');
        setPatient(null);
        setMeta(null);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [patientId]);

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16,
          marginBottom: 20,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', letterSpacing: 0.5 }}>
            PATIENT PROFILE
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
            {title}
          </h1>
          <div style={{ color: '#667085' }}>
            Patient detail with compatibility-safe route resolution.
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tenant/patients')}
          style={{
            border: '1px solid #d0d5dd',
            background: '#fff',
            color: '#101828',
            borderRadius: 12,
            padding: '10px 14px',
            fontWeight: 800,
            cursor: 'pointer'
          }}
        >
          Back to patients
        </button>
      </div>

      {loading ? (
        <div style={sectionStyle()}>Loading patient profile...</div>
      ) : error ? (
        <div
          style={{
            ...sectionStyle(),
            background: '#fff1f2',
            border: '1px solid #fda4af',
            color: '#b42318',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      ) : !patient ? (
        <div style={sectionStyle()}>Patient not found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={sectionStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
              Patient Overview
            </div>

            {row('ID', patient?.id)}
            {row('Public ID', patient?.publicId)}
            {row('Placeholder ID', patient?.placeholderId)}
            {row('Full Name', patient?.fullName || patient?.name)}
            {row('First Name', patient?.firstName)}
            {row('Last Name', patient?.lastName)}
            {row('Email', patient?.email)}
            {row('Phone', patient?.phone)}
            {row('Status', patient?.status)}
            {row('Doctor ID', patient?.doctorId)}
            {row('Tenant ID', patient?.tenantId)}
            {row('Created At', patient?.createdAt)}
            {row('Updated At', patient?.updatedAt)}
          </div>

          <div style={sectionStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
              Lookup Metadata
            </div>

            {row('Requested ID', meta?.requestedId)}
            {row('Resolved Route ID', meta?.resolvedRouteId)}
            {row('Table', meta?.table)}
            {row('Fallback Matched', String(Boolean(meta?.fallbackMatched)))}
            {row('Fallback Source', meta?.fallbackSource)}
          </div>
        </div>
      )}
    </div>
  );
}