import React, { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTenant } from '../context/TenantContext';
import { useAuth } from '../context/AuthContext';
import {
  FEATURE_KEYS,
  getRoleLabel,
  hasRoleAccess,
  normalizeRole
} from '../utils/roleAccess';

function getTonePalette(tone = 'blue', active = false) {
  const palettes = {
    blue: active
      ? {
          text: '#ffffff',
          bg: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 55%, #172554 100%)',
          border: '#2563eb',
          iconBg: 'rgba(255,255,255,0.16)',
          iconColor: '#ffffff',
          glow: '0 14px 30px rgba(29, 78, 216, 0.32)'
        }
      : {
          text: '#c7dcff',
          bg: 'linear-gradient(135deg, #16284a 0%, #13233f 100%)',
          border: '#223b69',
          iconBg: 'rgba(255,255,255,0.08)',
          iconColor: '#93c5fd',
          glow: '0 4px 12px rgba(15, 23, 42, 0.22)'
        },

    purple: active
      ? {
          text: '#ffffff',
          bg: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 55%, #2e1065 100%)',
          border: '#8b5cf6',
          iconBg: 'rgba(255,255,255,0.16)',
          iconColor: '#ffffff',
          glow: '0 14px 30px rgba(124, 58, 237, 0.32)'
        }
      : {
          text: '#e6d8ff',
          bg: 'linear-gradient(135deg, #24163c 0%, #1e1432 100%)',
          border: '#3a275c',
          iconBg: 'rgba(255,255,255,0.08)',
          iconColor: '#c4b5fd',
          glow: '0 4px 12px rgba(15, 23, 42, 0.22)'
        },

    green: active
      ? {
          text: '#ffffff',
          bg: 'linear-gradient(135deg, #16a34a 0%, #166534 55%, #052e16 100%)',
          border: '#22c55e',
          iconBg: 'rgba(255,255,255,0.16)',
          iconColor: '#ffffff',
          glow: '0 14px 30px rgba(22, 163, 74, 0.32)'
        }
      : {
          text: '#d5ffe3',
          bg: 'linear-gradient(135deg, #122d22 0%, #10271e 100%)',
          border: '#1f4b39',
          iconBg: 'rgba(255,255,255,0.08)',
          iconColor: '#86efac',
          glow: '0 4px 12px rgba(15, 23, 42, 0.22)'
        },

    orange: active
      ? {
          text: '#ffffff',
          bg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 55%, #7c2d12 100%)',
          border: '#f97316',
          iconBg: 'rgba(255,255,255,0.16)',
          iconColor: '#ffffff',
          glow: '0 14px 30px rgba(234, 88, 12, 0.32)'
        }
      : {
          text: '#ffe1cb',
          bg: 'linear-gradient(135deg, #3a2319 0%, #2f1d15 100%)',
          border: '#5d3726',
          iconBg: 'rgba(255,255,255,0.08)',
          iconColor: '#fdba74',
          glow: '0 4px 12px rgba(15, 23, 42, 0.22)'
        }
  };

  return palettes[tone] || palettes.blue;
}

function getCurrentPageTitle(pathname = '') {
  const map = [
    ['/tenant/dashboard', 'Dashboard'],
    ['/tenant/patients', 'Patients'],
    ['/tenant/devices', 'Devices'],
    ['/tenant/compliance', 'Compliance'],
    ['/tenant/followup', 'Follow-up Center'],
    ['/tenant/tasks', 'Tasks'],
    ['/tenant/notes', 'Notes'],
    ['/tenant/referrals', 'Referrals'],
    ['/tenant/notifications', 'Notifications'],
    ['/tenant/atlas/summary', 'ATLAS Summary'],
    ['/tenant/atlas/queue', 'ATLAS Queue'],
    ['/tenant/atlas/daily', 'ATLAS Daily Board'],
    ['/tenant/atlas/tasks', 'ATLAS Tasks'],
    ['/tenant/atlas/alerts', 'ATLAS Alerts'],
    ['/tenant/atlas/auto-actions', 'ATLAS Auto Actions'],
    ['/tenant/predictive-ai', 'Predictive AI'],
    ['/tenant/doctor-billing', 'Doctor Billing'],
    ['/tenant/revenue', 'Revenue'],
    ['/tenant/payments/checkout', 'Payments Checkout'],
    ['/tenant/payments/admin', 'Payments Admin'],
    ['/tenant/users', 'Users'],
    ['/tenant/modules', 'Modules'],
    ['/tenant/integrations', 'Integrations'],
    ['/tenant/branding', 'Branding'],
    ['/tenant/system-status', 'System Status']
  ];

  const match = map.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match ? match[1] : 'RAFTOP Enterprise';
}

function iconBadgeStyle(palette, active) {
  return {
    width: 34,
    height: 34,
    minWidth: 34,
    borderRadius: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: palette.iconBg,
    color: palette.iconColor,
    boxShadow: active
      ? '0 10px 22px rgba(0,0,0,0.24)'
      : '0 2px 8px rgba(0,0,0,0.18)',
    fontSize: 15,
    lineHeight: 1,
    border: '1px solid rgba(255,255,255,0.08)'
  };
}

function navLinkStyle(active, tone = 'blue') {
  const palette = getTonePalette(tone, active);

  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '11px 12px',
    borderRadius: 16,
    textDecoration: 'none',
    fontWeight: 800,
    color: palette.text,
    background: palette.bg,
    border: `1px solid ${palette.border}`,
    boxShadow: palette.glow,
    transition: 'all 0.18s ease',
    transform: active ? 'translateY(-1px)' : 'none'
  };
}

function sectionTitleStyle(color = '#94a3b8') {
  return {
    fontSize: 12,
    fontWeight: 900,
    color,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    margin: '18px 0 10px',
    paddingLeft: 4
  };
}

function collapseButtonStyle(color) {
  return {
    border: 'none',
    background: 'transparent',
    color,
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
    padding: 0
  };
}

function topHeaderButtonStyle(variant = 'secondary') {
  const base = {
    borderRadius: 14,
    padding: '10px 16px',
    fontWeight: 900,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  if (variant === 'primary') {
    return {
      ...base,
      border: '1px solid #1d4ed8',
      background: 'linear-gradient(135deg, #1d4ed8 0%, #172554 100%)',
      color: '#ffffff',
      boxShadow: '0 10px 20px rgba(29,78,216,0.22)'
    };
  }

  return {
    ...base,
    border: '1px solid #d0d5dd',
    background: '#ffffff',
    color: '#344054',
    boxShadow: '0 2px 8px rgba(16,24,40,0.06)'
  };
}

function statusPillStyle(bg, color, border) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 10px',
    borderRadius: 999,
    background: bg,
    color,
    border: `1px solid ${border}`,
    fontSize: 12,
    fontWeight: 900,
    boxShadow: '0 1px 2px rgba(16,24,40,0.05)'
  };
}

function NavItem({ to, active, tone, icon, label }) {
  const palette = getTonePalette(tone, active);

  return (
    <Link to={to} style={navLinkStyle(active, tone)}>
      <span style={iconBadgeStyle(palette, active)}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {active ? <span style={{ fontSize: 12, opacity: 0.95 }}>●</span> : null}
    </Link>
  );
}

export default function TenantLayout({ children }) {
  const location = useLocation();
  const { tenant } = useTenant();
  const { user, logout } = useAuth();

  const [coreOpen, setCoreOpen] = useState(true);
  const [atlasOpen, setAtlasOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(true);

  const role = normalizeRole(user?.role);
  const roleLabel = getRoleLabel(role);

  const currentTitle = useMemo(
    () => getCurrentPageTitle(location.pathname),
    [location.pathname]
  );

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const coreItems = useMemo(
    () =>
      [
        { to: '/tenant/dashboard', tone: 'blue', icon: '📊', label: 'Dashboard', featureKey: FEATURE_KEYS.dashboard },
        { to: '/tenant/patients', tone: 'blue', icon: '👤', label: 'Patients', featureKey: FEATURE_KEYS.patients },
        { to: '/tenant/devices', tone: 'blue', icon: '🩺', label: 'Devices', featureKey: FEATURE_KEYS.devices },
        { to: '/tenant/compliance', tone: 'blue', icon: '✅', label: 'Compliance', featureKey: FEATURE_KEYS.compliance },
        { to: '/tenant/followup', tone: 'blue', icon: '📞', label: 'Follow-up', featureKey: FEATURE_KEYS.followup },
        { to: '/tenant/tasks', tone: 'blue', icon: '🗂', label: 'Tasks', featureKey: FEATURE_KEYS.tasks },
        { to: '/tenant/notes', tone: 'blue', icon: '📝', label: 'Notes', featureKey: FEATURE_KEYS.notes },
        { to: '/tenant/referrals', tone: 'blue', icon: '📨', label: 'Referrals', featureKey: FEATURE_KEYS.referrals },
        { to: '/tenant/notifications', tone: 'blue', icon: '🔔', label: 'Notifications', featureKey: FEATURE_KEYS.notifications }
      ].filter((item) => hasRoleAccess(role, item.featureKey)),
    [role]
  );

  const atlasItems = useMemo(
    () =>
      [
        { to: '/tenant/atlas/summary', tone: 'purple', icon: '🧠', label: 'ATLAS Summary', featureKey: FEATURE_KEYS.atlasSummary },
        { to: '/tenant/atlas/queue', tone: 'purple', icon: '📚', label: 'ATLAS Queue', featureKey: FEATURE_KEYS.atlasQueue },
        { to: '/tenant/atlas/daily', tone: 'purple', icon: '📅', label: 'ATLAS Daily', featureKey: FEATURE_KEYS.atlasDaily },
        { to: '/tenant/atlas/tasks', tone: 'purple', icon: '🎯', label: 'ATLAS Tasks', featureKey: FEATURE_KEYS.atlasTasks },
        { to: '/tenant/atlas/alerts', tone: 'purple', icon: '🚨', label: 'ATLAS Alerts', featureKey: FEATURE_KEYS.atlasAlerts },
        { to: '/tenant/atlas/auto-actions', tone: 'purple', icon: '⚙️', label: 'ATLAS Auto Actions', featureKey: FEATURE_KEYS.atlasAutoActions }
      ].filter((item) => hasRoleAccess(role, item.featureKey)),
    [role]
  );

  const businessItems = useMemo(
    () =>
      [
        { to: '/tenant/predictive-ai', tone: 'green', icon: '🤖', label: 'Predictive AI', featureKey: FEATURE_KEYS.predictiveAi },
        { to: '/tenant/doctor-billing', tone: 'green', icon: '👨‍⚕️', label: 'Doctor Billing', featureKey: FEATURE_KEYS.doctorBilling },
        { to: '/tenant/revenue', tone: 'green', icon: '💶', label: 'Revenue', featureKey: FEATURE_KEYS.revenue },
        { to: '/tenant/payments/checkout', tone: 'green', icon: '💳', label: 'Payments Checkout', featureKey: FEATURE_KEYS.paymentsCheckout },
        { to: '/tenant/payments/admin', tone: 'green', icon: '🏦', label: 'Payments Admin', featureKey: FEATURE_KEYS.paymentsAdmin }
      ].filter((item) => hasRoleAccess(role, item.featureKey)),
    [role]
  );

  const settingsItems = useMemo(
    () =>
      [
        { to: '/tenant/users', tone: 'orange', icon: '👥', label: 'Users', featureKey: FEATURE_KEYS.users },
        { to: '/tenant/modules', tone: 'orange', icon: '🧩', label: 'Modules', featureKey: FEATURE_KEYS.modules },
        { to: '/tenant/integrations', tone: 'orange', icon: '🔌', label: 'Integrations', featureKey: FEATURE_KEYS.integrations },
        { to: '/tenant/branding', tone: 'orange', icon: '🎨', label: 'Branding', featureKey: FEATURE_KEYS.branding },
        { to: '/tenant/system-status', tone: 'orange', icon: '🖥', label: 'System Status', featureKey: FEATURE_KEYS.systemStatus }
      ].filter((item) => hasRoleAccess(role, item.featureKey)),
    [role]
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '330px 1fr',
        background:
          'radial-gradient(circle at top left, rgba(29,78,216,0.10) 0%, transparent 18%), radial-gradient(circle at top right, rgba(124,58,237,0.10) 0%, transparent 16%), linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%)'
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
            'linear-gradient(180deg, #0b1220 0%, #111827 55%, #0f172a 100%)',
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
              'linear-gradient(135deg, #1d4ed8 0%, #172554 52%, #581c87 100%)',
            boxShadow: '0 18px 34px rgba(0,0,0,0.28)'
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.78)', marginBottom: 6 }}>
            Tenant
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
            🏥
          </div>

          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15
            }}
          >
            {tenant?.organization || tenant?.name || 'RAFTOP Enterprise'}
          </div>

          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.84)', marginTop: 8 }}>
            Plan: <strong>{tenant?.plan || 'premium'}</strong>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.88)' }}>
            User: <strong>{user?.name || 'Authenticated User'}</strong>
          </div>

          <div style={{ marginTop: 6, fontSize: 12, color: 'rgba(255,255,255,0.78)' }}>
            Role: {roleLabel}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
            <span style={statusPillStyle('rgba(255,255,255,0.14)', '#ffffff', 'rgba(255,255,255,0.16)')}>
              ● Online
            </span>
            <span style={statusPillStyle('rgba(255,255,255,0.14)', '#ffffff', 'rgba(255,255,255,0.16)')}>
              {roleLabel}
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

        {coreItems.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...sectionTitleStyle('#60a5fa'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Core</span>
              <button type="button" onClick={() => setCoreOpen((v) => !v)} style={collapseButtonStyle('#60a5fa')}>
                {coreOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {coreOpen ? (
              <nav style={{ display: 'grid', gap: 8 }}>
                {coreItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    active={isActive(item.to)}
                    tone={item.tone}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}

        {atlasItems.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...sectionTitleStyle('#c084fc'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>ATLAS</span>
              <button type="button" onClick={() => setAtlasOpen((v) => !v)} style={collapseButtonStyle('#c084fc')}>
                {atlasOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {atlasOpen ? (
              <nav style={{ display: 'grid', gap: 8 }}>
                {atlasItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    active={isActive(item.to)}
                    tone={item.tone}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}

        {businessItems.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...sectionTitleStyle('#4ade80'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Business</span>
              <button type="button" onClick={() => setBusinessOpen((v) => !v)} style={collapseButtonStyle('#4ade80')}>
                {businessOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {businessOpen ? (
              <nav style={{ display: 'grid', gap: 8 }}>
                {businessItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    active={isActive(item.to)}
                    tone={item.tone}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}

        {settingsItems.length ? (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...sectionTitleStyle('#fb923c'), display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Settings</span>
              <button type="button" onClick={() => setSettingsOpen((v) => !v)} style={collapseButtonStyle('#fb923c')}>
                {settingsOpen ? 'Hide' : 'Show'}
              </button>
            </div>
            {settingsOpen ? (
              <nav style={{ display: 'grid', gap: 8 }}>
                {settingsItems.map((item) => (
                  <NavItem
                    key={item.to}
                    to={item.to}
                    active={isActive(item.to)}
                    tone={item.tone}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </nav>
            ) : null}
          </div>
        ) : null}
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
                RAFTOP ENTERPRISE
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: '#101828', marginTop: 2 }}>
                {currentTitle}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={statusPillStyle('#eef2ff', '#4338ca', '#c7d2fe')}>{roleLabel}</span>
              <span style={statusPillStyle('#ecfdf3', '#027a48', '#abefc6')}>Live UI</span>
              <button type="button" style={topHeaderButtonStyle('secondary')}>
                Export
              </button>
              <button type="button" style={topHeaderButtonStyle('primary')}>
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