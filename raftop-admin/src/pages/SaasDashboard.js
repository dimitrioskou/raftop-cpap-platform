import React, { useEffect, useState } from 'react';
import { getSaasOverview, getOrganizations, getClinics, getPlatformUsers } from '../api/saas';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '14px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

export default function SaasDashboard() {
  const [overview, setOverview] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, orgs, cls, us] = await Promise.all([
          getSaasOverview(),
          getOrganizations(),
          getClinics(),
          getPlatformUsers()
        ]);

        setOverview(ov);
        setOrganizations(orgs || []);
        setClinics(cls || []);
        setUsers(us || []);
      } catch (error) {
        console.error('Error loading SaaS dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return <div style={{ padding: 24 }}>Loading SaaS dashboard...</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 8 }}>SaaS Management</h1>
      <p style={{ color: '#4b5563', marginBottom: 24 }}>
        Multi-clinic, organization and user structure for platform scaling.
      </p>

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
            <div style={{ fontSize: 13, color: '#6b7280' }}>Organizations</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalOrganizations}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Active Orgs</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#16a34a' }}>{overview.activeOrganizations}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Clinics</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalClinics}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Active Clinics</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2563eb' }}>{overview.activeClinics}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Users</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{overview.totalUsers}</div>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Admin Users</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#7c3aed' }}>{overview.adminUsers}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        <div style={cardStyle}>
          <h3>Organizations</h3>
          {organizations.length === 0 ? (
            <p>No organizations found.</p>
          ) : (
            <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Contact Email</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => (
                  <tr key={org.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td>{org.name}</td>
                    <td>{org.slug || '-'}</td>
                    <td>{org.status || '-'}</td>
                    <td>{org.plan || '-'}</td>
                    <td>{org.contact_email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={cardStyle}>
          <h3>Clinics</h3>
          {clinics.length === 0 ? (
            <p>No clinics found.</p>
          ) : (
            <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th>Name</th>
                  <th>Organization</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr key={clinic.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td>{clinic.name}</td>
                    <td>{clinic.organizations?.name || '-'}</td>
                    <td>{clinic.city || '-'}</td>
                    <td>{clinic.status || '-'}</td>
                    <td>{clinic.email || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={cardStyle}>
          <h3>Platform Users</h3>
          {users.length === 0 ? (
            <p>No platform users found.</p>
          ) : (
            <table width="100%" cellPadding="12" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Clinic</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td>{user.full_name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.organizations?.name || '-'}</td>
                    <td>{user.clinics?.name || '-'}</td>
                    <td>{user.status || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}