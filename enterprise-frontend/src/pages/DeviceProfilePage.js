import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EntityProfilePage from '../components/EntityProfilePage';
import { formatDateTime } from '../utils/tenantDataHelpers';

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeDoctorName(value, doctorId) {
  if (value && String(value).trim()) return String(value).trim();
  if (doctorId != null && String(doctorId).trim()) return `Doctor #${doctorId}`;
  return '—';
}

function normalizePatientName(value) {
  if (value && String(value).trim()) return String(value).trim();
  return '—';
}

function normalizePerformanceStatus(value, monthlyHours) {
  const raw = String(value || '').toLowerCase();

  if (raw.includes('critical')) return 'critical';
  if (raw.includes('warning')) return 'warning';
  if (raw.includes('medium')) return 'warning';
  if (raw.includes('low')) return 'warning';
  if (raw.includes('ok')) return 'ok';
  if (raw.includes('good')) return 'ok';

  const hours = toNumber(monthlyHours, 0);
  if (hours < 50) return 'critical';
  if (hours < 80) return 'warning';
  return 'ok';
}

function normalizeConnectionStatus(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('offline')) return 'offline';
  if (raw.includes('disconnected')) return 'offline';
  return 'online';
}

function fallbackRecord(id) {
  return {
    id: String(id || 'PATIENT-1'),
    serial: String(id || 'PATIENT-1'),
    model: 'CPAP Device',
    patientName: 'CPAP Test Patient',
    doctorName: 'Doctor #1',
    monthlyHours: 7,
    ahi: 0,
    leak: 0,
    performanceStatus: 'critical',
    connectionStatus: 'online',
    notes: 'Virtual device derived from patients data',
    lastSyncAt: '2026-02-14T21:45:36.008845Z'
  };
}

function extractDevicePayload(payload) {
  if (payload?.device && typeof payload.device === 'object') return payload.device;
  return payload;
}

function normalizeDeviceRecord(item) {
  if (!item || typeof item !== 'object') return fallbackRecord();

  const serial =
    item.serial ||
    item.serial_number ||
    item.serialNumber ||
    item.device_serial ||
    item.deviceSerial ||
    item.id ||
    'UNKNOWN-DEVICE';

  const monthlyHours =
    toNumber(
      item.monthly_usage_hours ??
        item.monthlyHours ??
        item.compliance_hours ??
        item.complianceHours ??
        item.total_hours_30d ??
        item.totalHours30d ??
        item.usage_hours ??
        item.usageHours ??
        item.usage_7d ??
        item.usage_avg_7d ??
        item.cpap_hours,
      0
    );

  const ahi = toNumber(item.ahi ?? item.avg_ahi ?? item.averageAhi, 0);
  const leak = toNumber(item.leak ?? item.mask_leak ?? item.maskLeak, 0);

  return {
    id: String(item.id || item.device_id || item.deviceId || serial),
    serial: String(serial),
    model:
      item.model ||
      item.device_model ||
      item.deviceModel ||
      item.device_type ||
      item.deviceType ||
      'CPAP Device',
    patientName: normalizePatientName(
      item.patient_name || item.patientName || item.patient_full_name || item.patientFullName || item.name
    ),
    doctorName: normalizeDoctorName(
      item.doctor_name || item.doctorName || item.referring_doctor || item.physician,
      item.doctor_id || item.doctorId
    ),
    monthlyHours,
    ahi,
    leak,
    performanceStatus: normalizePerformanceStatus(item.status || item.performance_status, monthlyHours),
    connectionStatus: normalizeConnectionStatus(
      item.connectivity_status || item.connection_status || item.connectionStatus || item.status
    ),
    notes: item.notes || item.summary || '—',
    lastSyncAt:
      item.last_sync_at ||
      item.lastSyncAt ||
      item.last_sync ||
      item.updated_at ||
      item.updatedAt ||
      item.created_at ||
      item.createdAt ||
      null
  };
}

function toneForPerformance(value) {
  if (value === 'critical') return 'dark';
  if (value === 'warning') return 'orange';
  return 'green';
}

export default function DeviceProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <EntityProfilePage
      title="Device Profile"
      subtitle="Premium device view with connectivity and usage metrics."
      entityLabel="device profile"
      endpointGroups={[
        `/api/tenant/devices/${encodeURIComponent(id)}`,
        `/api/tenant/workspace/devices/${encodeURIComponent(id)}`,
        `/api/devices/${encodeURIComponent(id)}`
      ]}
      extractRecord={extractDevicePayload}
      normalizeRecord={normalizeDeviceRecord}
      fallbackRecord={fallbackRecord(id)}
      metricsBuilder={(device) => [
        { label: 'Device Serial', value: device.serial || '—', tone: 'blue' },
        { label: 'Monthly Hours', value: `${toNumber(device.monthlyHours, 0).toFixed(0)}h`, tone: toneForPerformance(device.performanceStatus) },
        { label: 'AHI', value: toNumber(device.ahi, 0).toFixed(1), tone: 'purple' },
        { label: 'Leak', value: `${toNumber(device.leak, 0).toFixed(0)} L/min`, tone: 'orange' },
        { label: 'Connectivity', value: device.connectionStatus || '—', tone: device.connectionStatus === 'offline' ? 'dark' : 'green' }
      ]}
      sectionsBuilder={(device) => [
        {
          title: 'Device Identity',
          fields: [
            { label: 'Serial', value: device.serial || '—' },
            { label: 'Model', value: device.model || '—' },
            { label: 'Device ID', value: device.id || '—' }
          ]
        },
        {
          title: 'Linked Context',
          fields: [
            { label: 'Patient', value: device.patientName || '—' },
            { label: 'Doctor', value: device.doctorName || '—' },
            { label: 'Connectivity', value: device.connectionStatus || '—' }
          ]
        },
        {
          title: 'Performance',
          fields: [
            { label: 'Monthly Usage', value: `${toNumber(device.monthlyHours, 0).toFixed(0)}h` },
            { label: 'AHI', value: toNumber(device.ahi, 0).toFixed(1) },
            { label: 'Leak', value: `${toNumber(device.leak, 0).toFixed(0)} L/min` },
            { label: 'Performance Status', value: device.performanceStatus || '—' }
          ]
        },
        {
          title: 'Timeline & Notes',
          fields: [
            { label: 'Last Sync', value: formatDateTime(device.lastSyncAt) },
            { label: 'Notes', value: device.notes || '—' }
          ]
        }
      ]}
      actionsBuilder={(device, { navigate: nav }) => [
        {
          label: 'Open Patients',
          primary: false,
          onClick: () => nav('/tenant/patients')
        },
        {
          label: 'Back to Devices',
          primary: true,
          onClick: () => navigate('/tenant/devices')
        }
      ]}
    />
  );
}