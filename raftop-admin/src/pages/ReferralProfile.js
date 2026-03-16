import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReferralById, deleteReferral } from '../api/referrals';

const pageStyle = {
  padding: 24
};

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const buttonStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 600,
  cursor: 'pointer'
};

const dangerButtonStyle = {
  ...buttonStyle,
  background: '#dc2626',
  color: '#ffffff',
  border: '1px solid #dc2626'
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('el-GR');
}

function priorityBadgeStyle(priority) {
  const p = String(priority || '').toLowerCase();

  if (p === 'urgent') {
    return {
      background: '#fee2e2',
      color: '#991b1b',
      border: '1px solid #fca5a5'
    };
  }

  if (p === 'high') {
    return {
      background: '#ffedd5',
      color: '#9a3412',
      border: '1px solid #fdba74'
    };
  }

  if (p === 'low') {
    return {
      background: '#ecfdf5',
      color: '#047857',
      border: '1px solid #a7f3d0'
    };
  }

  return {
    background: '#ede9fe',
    color: '#6d28d9',
    border: '1px solid #c4b5fd'
  };
}

function statusBadgeStyle(status) {
  const s = String(status || '').toLowerCase();

  if (s === 'completed') {
    return {
      background: '#dcfce7',
      color: '#166534',
      border: '1px solid #86efac'
    };
  }

  if (s === 'in_progress') {
    return {
      background: '#dbeafe',
      color: '#1d4ed8',
      border: '1px solid #93c5fd'
    };
  }

  if (s === 'cancelled') {
    return {
      background: '#f3f4f6',
      color: '#4b5563',
      border: '1px solid #d1d5db'
    };
  }

  return {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d'
  };
}

export default function ReferralProfile() {
  const { referralId } = useParams();
  const navigate = useNavigate();

  const [referral, setReferral] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReferral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referralId]);

  async function loadReferral() {
    try {
      setLoading(true);
      setError('');
      const data = await getReferralById(referralId);
      setReferral(data || null);
    } catch (err) {
      console.error('Error loading referral profile:', err);
      setReferral(null);
      setError('Αποτυχία φόρτωσης referral profile.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Θέλεις σίγουρα να διαγράψεις αυτό το referral;');
    if (!confirmed) return;

    try {
      setDeleting(true);
      setError('');
      await deleteReferral(referralId);
      navigate('/referrals');
    } catch (err) {
      console.error('Error deleting referral:', err);
      setError('Αποτυχία διαγραφής referral.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={pageStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 24
        }}
      >
        <div>
          <h1 style={{ marginBottom: 8 }}>Referral Profile</h1>
          <p style={{ color: '#4b5563', margin: 0 }}>
            Αναλυτική προβολή referral και βασικών στοιχείων παραπομπής.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button type="button" style={buttonStyle} onClick={() => navigate('/referrals')}>
            Back to Referrals
          </button>

          <button
            type="button"
            style={dangerButtonStyle}
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete Referral'}
          </button>
        </div>
      </div>

      {error ? (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 10,
            background: '#fef2f2',
            color: '#991b1b',
            border: '1px solid #fecaca'
          }}
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <div style={cardStyle}>Loading referral profile...</div>
      ) : !referral ? (
        <div style={cardStyle}>Referral not found.</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginBottom: 24
            }}
          >
            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Patient</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {referral.patient_name || '-'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Doctor</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {referral.doctor_name || '-'}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Clinic</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {referral.clinic_name || '-'}
              </div>
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 14
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    ...priorityBadgeStyle(referral.priority)
                  }}
                >
                  {referral.priority || 'medium'}
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    padding: '4px 8px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    ...statusBadgeStyle(referral.status)
                  }}
                >
                  {referral.status || 'new'}
                </span>
              </div>

              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Created: {formatDate(referral.created_at || referral.createdAt)}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Referral Reason
              </div>
              <div style={{ color: '#111827', fontWeight: 600 }}>
                {referral.referral_reason || '-'}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                Note
              </div>
              <div style={{ color: '#374151' }}>{referral.note || '-'}</div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Referral ID</div>
                <div style={{ fontWeight: 600 }}>{referral.id || '-'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Updated</div>
                <div style={{ fontWeight: 600 }}>
                  {formatDate(referral.updated_at || referral.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}