import React, { useEffect, useState } from 'react';
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
      <div style={{ color: '#101828', fontWeight: 700 }}>{value || '—'}</div>
    </div>
  );
}

export default function DeviceProfilePage() {
  const navigate = useNavigate();
  const { deviceId } = useParams();

  const [device, setDevice] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet(`/api/tenant/devices/${encodeURIComponent(deviceId)}`);

        if (!mounted) {
          return;
        }

        setDevice(payload?.device || null);
        setMeta(payload?.meta || null);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'Failed to load device');
        setDevice(null);
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
  }, [deviceId]);

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
            DEVICE PROFILE
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
            {device?.model || device?.serialNumber || deviceId || 'Device'}
          </h1>
          <div style={{ color: '#667085' }}>
            Device detail, serial tracking, and compatibility-safe lookup.
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/tenant/devices')}
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
          Back to devices
        </button>
      </div>

      {loading ? (
        <div style={sectionStyle()}>Loading device profile...</div>
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
      ) : !device ? (
        <div style={sectionStyle()}>Device not found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={sectionStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
              Device Overview
            </div>

            {row('ID', device?.id)}
            {row('Public ID', device?.publicId)}
            {row('Placeholder ID', device?.placeholderId)}
            {row('Serial Number', device?.serialNumber)}
            {row('Device Serial', device?.deviceSerial)}
            {row('Brand', device?.brand)}
            {row('Manufacturer', device?.manufacturer)}
            {row('Model', device?.model)}
            {row('Status', device?.status)}
            {row('Patient ID', device?.patientId)}
            {row('Doctor ID', device?.doctorId)}
            {row('Tenant ID', device?.tenantId)}
            {row('Last Sync', device?.lastSyncAt)}
            {row('Created At', device?.createdAt)}
            {row('Updated At', device?.updatedAt)}
          </div>

          <div style={sectionStyle()}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#101828', marginBottom: 8 }}>
              Lookup Metadata
            </div>

            {row('Requested ID', meta?.requestedId)}
            {row('Table', meta?.table)}
            {row('Fallback Matched', String(Boolean(meta?.fallbackMatched)))}
          </div>
        </div>
      )}
    </div>
  );
}