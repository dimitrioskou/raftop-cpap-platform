import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import Patients from './pages/Patients';
import PatientProfile from './pages/PatientProfile';
import Compliance from './pages/Compliance';
import Devices from './pages/Devices';
import DeviceProfile from './pages/DeviceProfile';

function DashboardHome() {
  return (
    <div style={{ padding: '24px' }}>
      <h1>RAFTOP CPAP CARE</h1>
      <p>Admin Dashboard</p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginTop: '24px'
        }}
      >
        <div style={cardStyle}>
          <h3>Patients</h3>
          <p>Manage all patients</p>
          <Link to="/patients">Open</Link>
        </div>

        <div style={cardStyle}>
          <h3>Compliance</h3>
          <p>View compliance charts</p>
          <Link to="/compliance">Open</Link>
        </div>

        <div style={cardStyle}>
          <h3>Devices</h3>
          <p>Monitor CPAP devices</p>
          <Link to="/devices">Open</Link>
        </div>
      </div>
    </div>
  );
}

const cardStyle = {
  background: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '16px',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};

const layoutStyle = {
  display: 'flex',
  minHeight: '100vh',
  background: '#f9fafb'
};

const sidebarStyle = {
  width: '240px',
  background: '#111827',
  color: '#fff',
  padding: '20px',
  boxSizing: 'border-box'
};

const contentStyle = {
  flex: 1,
  padding: '0',
  boxSizing: 'border-box'
};

const navLinkStyle = {
  display: 'block',
  color: '#fff',
  textDecoration: 'none',
  padding: '10px 12px',
  borderRadius: '8px',
  marginBottom: '8px',
  background: 'transparent'
};

function AppLayout() {
  return (
    <div style={layoutStyle}>
      <aside style={sidebarStyle}>
        <h2 style={{ marginTop: 0 }}>RAFTOP Admin</h2>

        <nav style={{ marginTop: '24px' }}>
          <Link to="/" style={navLinkStyle}>Dashboard</Link>
          <Link to="/patients" style={navLinkStyle}>Patients</Link>
          <Link to="/compliance" style={navLinkStyle}>Compliance</Link>
          <Link to="/devices" style={navLinkStyle}>Devices</Link>
        </nav>
      </aside>

      <main style={contentStyle}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientProfile />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:id" element={<DeviceProfile />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}