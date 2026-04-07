import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGet } from '../lib/api';

function cardStyle() {
  return {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 18,
    padding: 18,
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)'
  };
}

function resolveDeviceRouteId(device, index) {
  return (
    device?.publicId ||
    device?.serialNumber ||
    device?.deviceSerial ||
    device?.placeholderId ||
    device?.deviceId ||
    device?.id ||
    `DEVICE-${index + 1}`
  );
}

function valueOrDash(value) {
  return value === null || typeof value === 'undefined' || value === ''
    ? '—'
    : String(value);
}

export default function DevicesPage() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError('');

      try {
        const payload = await apiGet('/api/tenant/devices');
        const rows = Array.isArray(payload?.devices) ? payload.devices : [];

        if (!mounted) {
          return;
        }

        setDevices(rows);
      } catch (err) {
        if (!mounted) {
          return;
        }

        setError(err?.message || 'Failed to load devices');
        setDevices([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredDevices = useMemo(() => {
    const normalized = String(query || '').trim().toLowerCase();

    if (!normalized) {
      return devices;
    }

    return devices.filter((device) => {
      return [
        device?.publicId,
        device?.serialNumber,
        device?.deviceSerial,
        device?.brand,
        device?.manufacturer,
        device?.model,
        device?.status
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized));
    });
  }, [devices, query]);

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
            RAFTOP DEVICES
          </div>
          <h1 style={{ margin: '6px 0 4px', fontSize: 28, fontWeight: 900, color: '#101828' }}>
            Devices
          </h1>
          <div style={{ color: '#667085' }}>
            Tenant device registry and profile access.
          </div>
        </div>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search serial, model, brand..."
          style={{
            width: 320,
            maxWidth: '100%',
            border: '1px solid #d0d5dd',
            borderRadius: 14,
            padding: '12px 14px',
            outline: 'none',
            fontSize: 14
          }}
        />
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 16,
            background: '#fff1f2',
            border: '1px solid #fda4af',
            color: '#b42318',
            borderRadius: 14,
            padding: '12px 14px',
            fontWeight: 700
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle()}>Loading devices...</div>
      ) : filteredDevices.length === 0 ? (
        <div style={cardStyle()}>No devices found.</div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {filteredDevices.map((device, index) => {
            const routeId = resolveDeviceRouteId(device, index);

            return (
              <div
                key={`${routeId}-${index}`}
                style={{
                  ...cardStyle(),
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto',
                  gap: 14,
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, color: '#101828', marginBottom: 4 }}>
                    {valueOrDash(device?.model)}
                  </div>
                  <div style={{ color: '#667085', fontSize: 13 }}>
                    Serial: {valueOrDash(device?.serialNumber || device?.deviceSerial)}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Brand</div>
                  <div style={{ fontWeight: 700 }}>{valueOrDash(device?.brand || device?.manufacturer)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Status</div>
                  <div style={{ fontWeight: 700 }}>{valueOrDash(device?.status)}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: '#667085', marginBottom: 4 }}>Last Sync</div>
                  <div style={{ fontWeight: 700 }}>{valueOrDash(device?.lastSyncAt)}</div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(`/tenant/devices/${encodeURIComponent(routeId)}`)}
                  style={{
                    border: '1px solid #1d4ed8',
                    background: '#1d4ed8',
                    color: '#fff',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Open
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}