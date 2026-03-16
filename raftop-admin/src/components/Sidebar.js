import React from 'react';
import { NavLink } from 'react-router-dom';

const sidebarStyle = {
  width: 260,
  minHeight: '100vh',
  background: '#111827',
  color: '#ffffff',
  padding: 20,
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: 18
};

const brandStyle = {
  fontSize: 22,
  fontWeight: 800,
  letterSpacing: 0.3,
  marginBottom: 8
};

const sectionTitleStyle = {
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: 1,
  color: '#9ca3af',
  marginBottom: 8,
  marginTop: 10
};

const navGroupStyle = {
  display: 'grid',
  gap: 8
};

const baseLinkStyle = {
  display: 'block',
  padding: '11px 12px',
  borderRadius: 10,
  textDecoration: 'none',
  color: '#e5e7eb',
  fontWeight: 600,
  transition: 'all 0.2s ease'
};

const activeLinkStyle = {
  background: '#2563eb',
  color: '#ffffff'
};

function navLinkStyle({ isActive }) {
  return {
    ...baseLinkStyle,
    ...(isActive ? activeLinkStyle : {})
  };
}

export default function Sidebar() {
  return (
    <aside style={sidebarStyle}>
      <div>
        <div style={brandStyle}>RAFTOP Admin</div>
        <div style={{ color: '#9ca3af', fontSize: 13 }}>
          CPAP Care Control Center
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>Overview</div>
        <div style={navGroupStyle}>
          <NavLink to="/" end style={navLinkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/search" style={navLinkStyle}>
            Search Center
          </NavLink>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>Core Operations</div>
        <div style={navGroupStyle}>
          <NavLink to="/patients" style={navLinkStyle}>
            Patients
          </NavLink>
          <NavLink to="/devices" style={navLinkStyle}>
            Devices
          </NavLink>
          <NavLink to="/tasks" style={navLinkStyle}>
            Tasks
          </NavLink>
          <NavLink to="/notes" style={navLinkStyle}>
            Notes
          </NavLink>
          <NavLink to="/referrals" style={navLinkStyle}>
            Referrals
          </NavLink>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>Compliance & Follow-up</div>
        <div style={navGroupStyle}>
          <NavLink to="/compliance" style={navLinkStyle}>
            80h Compliance
          </NavLink>
          <NavLink to="/followup" style={navLinkStyle}>
            Follow-up Center
          </NavLink>
          <NavLink to="/followup-outcomes" style={navLinkStyle}>
            Follow-up Outcomes
          </NavLink>
          <NavLink to="/priority-queue" style={navLinkStyle}>
            Priority Queue
          </NavLink>
          <NavLink to="/daily-board" style={navLinkStyle}>
            Daily Action Board
          </NavLink>
          <NavLink to="/recheck-scheduler" style={navLinkStyle}>
            Recheck Scheduler
          </NavLink>
          <NavLink to="/recovery-funnel" style={navLinkStyle}>
            Recovery Funnel
          </NavLink>
        </div>
      </div>

      <div>
        <div style={sectionTitleStyle}>System</div>
        <div style={navGroupStyle}>
          <NavLink to="/activity" style={navLinkStyle}>
            Activity
          </NavLink>
          <NavLink to="/settings" style={navLinkStyle}>
            Settings
          </NavLink>
        </div>
      </div>

      <div style={{ marginTop: 'auto', color: '#6b7280', fontSize: 12 }}>
        RAFTOP Admin v1
      </div>
    </aside>
  );
}