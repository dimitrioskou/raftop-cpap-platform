import React, { useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  {
    label: 'Dashboard',
    to: '/patient/dashboard',
    icon: '◉',
    description: 'Score, ύπνος, πρόοδος'
  },
  {
    label: 'Therapy',
    to: '/patient/therapy',
    icon: '◎',
    description: 'Χρήση CPAP, coaching, ιστορικό'
  },
  {
    label: 'Insights',
    to: '/patient/insights',
    icon: '▲',
    description: 'ATLAS trend intelligence'
  },
  {
    label: 'Notifications',
    to: '/patient/notifications',
    icon: '✦',
    description: 'Nudges, milestones, alerts'
  },
  {
    label: 'Goals',
    to: '/patient/goals',
    icon: '◆',
    description: 'Targets, streaks, discipline'
  },
  {
    label: 'Messages',
    to: '/patient/messages',
    icon: '✉',
    description: 'Care communication layer'
  },
  {
    label: 'Action Center',
    to: '/patient/action-center',
    icon: '⚑',
    description: 'Issue, callback, confirm'
  }
];

function safeReadUser() {
  try {
    const raw = localStorage.getItem('raftop_auth_user');
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PT';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getPatientDisplayName(user) {
  return (
    user?.fullName ||
    user?.name ||
    user?.patientName ||
    user?.profile?.name ||
    'Patient User'
  );
}

function getPatientCode(user) {
  return (
    user?.patientCode ||
    user?.patientId ||
    user?.profile?.patientCode ||
    user?.id ||
    'N/A'
  );
}

function logoutPatientSession() {
  try {
    localStorage.removeItem('raftop_auth_token');
    localStorage.removeItem('raftop_auth_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    sessionStorage.clear();
  } catch (_error) {
    // ignore
  }

  window.location.hash = '#/login';
}

export default function PatientLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useMemo(() => safeReadUser(), []);
  const patientName = getPatientDisplayName(user);
  const patientCode = getPatientCode(user);

  const currentPage =
    navItems.find((item) => location.pathname.startsWith(item.to))?.label || 'Patient';

  return (
    <div className="patient-shell">
      <style>{`
        .patient-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(79, 70, 229, 0.14), transparent 30%),
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%),
            linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
          color: #0f172a;
          display: flex;
        }

        .patient-sidebar {
          width: 280px;
          min-width: 280px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
          color: #e2e8f0;
          border-right: 1px solid rgba(148, 163, 184, 0.18);
          padding: 24px 18px;
          display: flex;
          flex-direction: column;
          gap: 22px;
          position: sticky;
          top: 0;
          height: 100vh;
          z-index: 30;
        }

        .patient-brand {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .patient-brand-badge {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 800;
          letter-spacing: 0.5px;
          box-shadow: 0 12px 30px rgba(79, 70, 229, 0.35);
        }

        .patient-brand h2 {
          margin: 0;
          font-size: 17px;
          line-height: 1.2;
        }

        .patient-brand p {
          margin: 4px 0 0;
          color: #94a3b8;
          font-size: 12px;
        }

        .patient-profile {
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 20px;
          padding: 16px;
        }

        .patient-profile-top {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .patient-avatar {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }

        .patient-profile-name {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
        }

        .patient-profile-meta {
          margin: 4px 0 0;
          font-size: 12px;
          color: #94a3b8;
        }

        .patient-chip-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .patient-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 7px 10px;
          border-radius: 999px;
          background: rgba(79, 70, 229, 0.18);
          color: #c7d2fe;
          border: 1px solid rgba(99, 102, 241, 0.28);
        }

        .patient-nav {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .patient-nav-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          text-decoration: none;
          padding: 14px 14px;
          border-radius: 18px;
          color: #cbd5e1;
          border: 1px solid transparent;
          transition: all 0.22s ease;
          background: rgba(255, 255, 255, 0.02);
        }

        .patient-nav-link:hover {
          transform: translateX(3px);
          color: #ffffff;
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.16);
        }

        .patient-nav-link.active {
          color: #ffffff;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.24), rgba(6, 182, 212, 0.18));
          border-color: rgba(129, 140, 248, 0.34);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.28);
        }

        .patient-nav-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .patient-nav-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
        }

        .patient-nav-text {
          min-width: 0;
        }

        .patient-nav-title {
          margin: 0;
          font-size: 14px;
          font-weight: 700;
        }

        .patient-nav-description {
          margin: 4px 0 0;
          font-size: 11px;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .patient-sidebar-footer {
          margin-top: auto;
          border-top: 1px solid rgba(148, 163, 184, 0.16);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .patient-sidebar-note {
          font-size: 12px;
          line-height: 1.5;
          color: #94a3b8;
        }

        .patient-logout-btn {
          border: 0;
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          font-weight: 700;
          background: rgba(239, 68, 68, 0.12);
          color: #fecaca;
          transition: all 0.2s ease;
        }

        .patient-logout-btn:hover {
          background: rgba(239, 68, 68, 0.18);
          transform: translateY(-1px);
        }

        .patient-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .patient-topbar {
          position: sticky;
          top: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 20px 28px;
          background: rgba(248, 250, 252, 0.78);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(148, 163, 184, 0.18);
        }

        .patient-topbar-left {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .patient-menu-btn {
          display: none;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: white;
          cursor: pointer;
          font-size: 18px;
        }

        .patient-eyebrow {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #6366f1;
          margin-bottom: 4px;
        }

        .patient-page-title {
          margin: 0;
          font-size: 24px;
          line-height: 1.15;
          color: #0f172a;
        }

        .patient-page-subtitle {
          margin: 6px 0 0;
          color: #475569;
          font-size: 14px;
        }

        .patient-topbar-right {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .patient-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ecfeff;
          color: #0f766e;
          border: 1px solid #a5f3fc;
          border-radius: 999px;
          padding: 9px 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .patient-topbar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .patient-topbar-user strong {
          display: block;
          font-size: 13px;
          color: #0f172a;
        }

        .patient-topbar-user span {
          display: block;
          font-size: 11px;
          color: #64748b;
        }

        .patient-content {
          padding: 28px;
        }

        .patient-overlay {
          display: none;
        }

        @media (max-width: 980px) {
          .patient-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            transform: translateX(-100%);
            transition: transform 0.24s ease;
            box-shadow: 0 18px 40px rgba(15, 23, 42, 0.28);
          }

          .patient-sidebar.open {
            transform: translateX(0);
          }

          .patient-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.46);
            z-index: 25;
            border: 0;
          }

          .patient-menu-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .patient-topbar {
            padding: 18px 18px;
          }

          .patient-content {
            padding: 18px;
          }
        }

        @media (max-width: 640px) {
          .patient-page-title {
            font-size: 20px;
          }

          .patient-topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .patient-topbar-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>

      <aside className={`patient-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="patient-brand">
          <div className="patient-brand-badge">RC</div>
          <div>
            <h2>RAFTOP CPAP CARE</h2>
            <p>Patient-facing layer • myAir-equivalent</p>
          </div>
        </div>

        <div className="patient-profile">
          <div className="patient-profile-top">
            <div className="patient-avatar">{getInitials(patientName)}</div>
            <div>
              <p className="patient-profile-name">{patientName}</p>
              <p className="patient-profile-meta">Patient ID: {patientCode}</p>
            </div>
          </div>

          <div className="patient-chip-row">
            <span className="patient-chip">ATLAS-connected</span>
            <span className="patient-chip">CPAP coaching</span>
          </div>
        </div>

        <nav className="patient-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `patient-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <div className="patient-nav-left">
                <div className="patient-nav-icon">{item.icon}</div>
                <div className="patient-nav-text">
                  <p className="patient-nav-title">{item.label}</p>
                  <p className="patient-nav-description">{item.description}</p>
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="patient-sidebar-footer">
          <div className="patient-sidebar-note">
            Το patient layer δείχνει πρόοδο, θεραπεία, notifications και insights
            μέσα στο ίδιο οικοσύστημα με provider dashboards και ATLAS actions.
          </div>

          <button type="button" className="patient-logout-btn" onClick={logoutPatientSession}>
            Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="patient-overlay"
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="patient-main">
        <header className="patient-topbar">
          <div className="patient-topbar-left">
            <button
              className="patient-menu-btn"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>

            <div>
              <div className="patient-eyebrow">Patient Experience Layer</div>
              <h1 className="patient-page-title">{currentPage}</h1>
              <p className="patient-page-subtitle">
                Προσωπική εμπειρία τύπου myAir, αλλά συνδεδεμένη με πραγματικό
                clinical + operational οικοσύστημα.
              </p>
            </div>
          </div>

          <div className="patient-topbar-right">
            <span className="patient-status-badge">● Sync + Coaching Active</span>

            <div className="patient-topbar-user">
              <div className="patient-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>
                {getInitials(patientName)}
              </div>
              <div>
                <strong>{patientName}</strong>
                <span>{patientCode}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="patient-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}