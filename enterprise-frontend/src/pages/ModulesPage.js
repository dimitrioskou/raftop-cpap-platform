import React, { useEffect, useState } from 'react';
import SuperAdminLayout from '../layouts/SuperAdminLayout';
import { getModules } from '../api/superAdmin';

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: 16,
  padding: 18
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse'
};

const thStyle = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #e5e7eb',
  color: '#6b7280',
  fontSize: 13
};

const tdStyle = {
  padding: '12px 10px',
  borderBottom: '1px solid #f3f4f6'
};

export default function ModulesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await getModules();
        setItems(response?.data || []);
      } catch (err) {
        setError(err.message || 'Failed to load modules');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <SuperAdminLayout title="Modules">
      <div style={cardStyle}>
        {loading ? <div>Loading...</div> : null}
        {error ? <div style={{ color: '#991b1b' }}>{error}</div> : null}

        {!loading && !error ? (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Module Code</th>
                <th style={thStyle}>Enabled</th>
                <th style={thStyle}>Scope</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={tdStyle}>{item.module_code || '-'}</td>
                  <td style={tdStyle}>{String(item.is_enabled)}</td>
                  <td style={tdStyle}>{item.scope || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </SuperAdminLayout>
  );
}