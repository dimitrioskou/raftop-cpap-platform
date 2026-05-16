import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function getCurrentPageTitle(pathname = '') {
  const map = [
    ['/patient/dashboard', 'Patient Dashboard'],
    ['/patient/therapy', 'Therapy Overview'],
    ['/patient/nightly-analysis', 'Nightly Analysis'],
    ['/patient/health-overlay', 'Health Overlay'],
    ['/patient/compare-nights', 'Compare Nights'],
    ['/patient/action-center', 'Action Center'],
    ['/patient/coaching', 'Coaching'],
    ['/patient/insights', 'Insights'],
    ['/patient/goals', 'Goals'],
    ['/patient/messages', 'Messages'],
    ['/patient/reports', 'Reports'],
    ['/patient/data-sync', 'Data Sync'],
    ['/patient/notifications', 'Notifications']
  ];

  const match = map.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match ? match[1] : 'RAFTOP Patient';
}

function navItemStyle(active) {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 14px',
    borderRadius: 16,
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: 14,
    color: active ? '#ffffff' : '#dbeafe',
    background: active
      ? 'linear-gradient(135deg, #0891b2 0%, #0f766e 100%)'
      : 'rgba(255,255,255,0.04)',
    border: active
      ? '1px solid rgba(255,255,255,0.18)'
      : '1px solid rgba(255,255,255,0.06)',
    boxShadow: active
      ? '0 12px 24px rgba(8,145,178,0.28)'
      : '0 4px 10px rgba(0,0,0,0.14)',
    transition: 'all 0.18s ease'
  };
}

function iconBadgeStyle(active) {
  return {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.08)',
    color: '#ffffff',
    border: '1px solid rgba(255,255,255,0.08)',
    fontSize: 15
  };
}

function sectionTitleStyle(color) {
  return {
    fontSize: 12,
    fontWeight: 900,
    color,
    textTransform: 'uppercase',
    letterSpacing: 0.08 + 'em',
    margin: '18px 0 10px',
    paddingLeft: 4
  };
}

function statusPillStyle(background, color, borderColor) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    background,
    color,
    border: `1px solid ${borderColor}`,
    fontSize: 12,
    fontWeight: 800
  };
}

function topButtonStyle(variant = 'secondary') {
  if (variant === 'primary') {
    return {
      borderRadius: 14,
      padding: '10px 14px',
      border: '1px solid #0891b2',
      background: 'linear-gradient(135deg, #0891b2 0%, #155e75 100%)',
      color: '#ffffff',
      fontWeight: 900,
      fontSize: 13,
      cursor: 'pointer',
      boxShadow: '0 10px 20px rgba(8,145,178,0.20)'
    };
  }

  return {
    borderRadius: 14,
    padding: '10px 14px',
    border: '1px solid #d0d5dd',
    background: '#ffffff',
    color: '#344054',
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(16,24,40,0.06)'
  };
}

function NavItem({ to, active, icon, label }) {
  return (
    <Link to={to} style={navItemStyle(active)}>
      <span style={iconBadgeStyle(active)}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active ? <span style={{ fontSize: 12, opacity: 0.95 }}>●</span> : null}
    </Link>
  );
}

export default function PatientLayout({ children }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentTitle = useMemo(
    () => getCurrentPageTitle(location.pathname),
    [location.pathname]
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const overviewItems = [
    { to: '/patient/dashboard', icon: '🏠', label: 'Dashboard' },
    { to: '/patient/therapy', icon: '😴', label: 'Therapy' },
    { to: '/patient/nightly-analysis', icon: '🌙', label: 'Nightly Analysis' },
    { to: '/patient/health-overlay', icon: '🫀', label: 'Health Overlay' },
    { to: '/patient/compare-nights', icon: '📊', label: 'Compare Nights' }
  ];

  const supportItems = [
    { to: '/patient/action-center', icon: '⚡', label: 'Action Center' },
    { to: '/patient/insights', icon: '🧠', label: 'Insights' },
    { to: '/patient/goals', icon: '🎯', label: 'Goals' },
    { to: '/patient/coaching', icon: '🎓', label: 'Coaching' },
    { to: '/patient/messages', icon: '💬', label: 'Messages' },
    { to: '/patient/reports', icon: '📄', label: 'Reports' },
    { to: '/patient/data-sync', icon: '🔄', label: 'Data Sync' },
    { to: '/patient/notifications', icon: '🔔', label: 'Notifications' }
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        background:
          'radial-gradient(circle at top left, rgba(8,145,178,0.10) 0%, transparent 18%), radial-gradient(circle at top right, rgba(79,70,229,0.08) 0%, transparent 18%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)'
      }}
    >
      <aside
        style={{
          position: 'sticky',
          top: 0,
          alignSelf: 'start',
          height: '100vh',
          overflowY: 'auto',
          borderRight: '1px solid #1f2937',
          background:
            'linear-gradient(180deg, #07111d 0%, #0f172a 55%, #102033 100%)',
          padding: 18,
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.03)'
        }}
      >
        <div
          style={{
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 26,
            padding: 18,
            marginBottom: 18,
            background:
              'linear-gradient(135deg, #0891b2 0%, #155e75 54%, #312e81 100%)',
            boxShadow: '0 18px 34px rgba(0,0,0,0.28)'
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', marginBottom: 6 }}>
            Patient Workspace
          </div>

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.16)',
              color: '#fff',
              fontSize: 26,
              boxShadow: '0 10px 22px rgba(0,0,0,0.18)',
              marginBottom: 10,
              border: '1px solid rgba(255,255,255,0.14)'
            }}
          >
            😴
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15
            }}
          >
            {user?.name || user?.fullName || 'Patient User'}
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', marginTop: 8 }}>
            RAFTOP CPAP CARE
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
            Email: <strong>{user?.email || '—'}</strong>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span
              style={statusPillStyle(
                'rgba(255,255,255,0.14)',
                '#ffffff',
                'rgba(255,255,255,0.16)'
              )}
            >
              ● Active
            </span>
            <span
              style={statusPillStyle(
                'rgba(255,255,255,0.14)',
                '#ffffff',
                'rgba(255,255,255,0.16)'
              )}
            >
              Patient
            </span>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{
              marginTop: 14,
              width: '100%',
              borderRadius: 14,
              padding: '10px 14px',
              fontWeight: 900,
              fontSize: 13,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.16)',
              background: 'rgba(255,255,255,0.12)',
              color: '#ffffff'
            }}
          >
            Sign out
          </button>
        </div>

        <div style={sectionTitleStyle('#67e8f9')}>Overview</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {overviewItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              active={isActive(item.to)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        <div style={sectionTitleStyle('#c4b5fd')}>Care & Support</div>
        <nav style={{ display: 'grid', gap: 8 }}>
          {supportItems.map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              active={isActive(item.to)}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>
      </aside>

      <div style={{ minWidth: 0 }}>
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: 'rgba(248, 250, 252, 0.88)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 22px',
            boxShadow: '0 8px 20px rgba(16,24,40,0.04)'
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#667085', fontWeight: 900, letterSpacing: 0.6 }}>
                RAFTOP PATIENT
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#101828', marginTop: 2 }}>
                {currentTitle}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={statusPillStyle('#ecfeff', '#0f766e', '#a5f3fc')}>
                Patient View
              </span>
              <span style={statusPillStyle('#eef2ff', '#4338ca', '#c7d2fe')}>
                Live Workspace
              </span>
              <button
                type="button"
                style={topButtonStyle('secondary')}
                onClick={() => {
                  window.location.href = '/patient/messages';
                }}
              >
                Messages
              </button>
              <button
                type="button"
                style={topButtonStyle('primary')}
                onClick={() => {
                  window.location.href = '/patient/action-center';
                }}
              >
                Quick Action
              </button>
            </div>
          </div>
        </header>

        <main style={{ minWidth: 0 }}>{children}</main>
      </div>
    </div>
  );
}