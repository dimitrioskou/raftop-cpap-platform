import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Sidebar({ title, sections, atlasBadge }) {
  return (
    <div
      style={{
        width: 260,
        background: '#111827',
        color: '#ffffff',
        height: '100vh',
        padding: 16,
        boxSizing: 'border-box'
      }}
    >
      <h2 style={{ marginTop: 0 }}>{title}</h2>

      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 6 }}>
            {section.title}
          </div>

          {section.items.map((item, j) => {
            const isAtlasQueue = item.to.includes('/atlas/queue') || item.to.includes('/my-atlas');

            return (
              <NavLink
                key={j}
                to={item.to}
                end={item.end}
                style={({ isActive }) => ({
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 10,
                  marginBottom: 6,
                  textDecoration: 'none',
                  color: isActive ? '#111827' : '#ffffff',
                  background: isActive ? '#ffffff' : 'transparent'
                })}
              >
                <span>{item.label}</span>

                {isAtlasQueue && atlasBadge > 0 && (
                  <span
                    style={{
                      background: '#ef4444',
                      color: '#ffffff',
                      borderRadius: 999,
                      padding: '2px 8px',
                      fontSize: 12,
                      fontWeight: 700
                    }}
                  >
                    {atlasBadge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </div>
  );
}