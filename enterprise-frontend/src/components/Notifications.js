import React, { useEffect, useRef, useState } from 'react';
import { getAlertsPanel } from '../api/atlas';

function Toast({ color, text, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: 12,
        borderRadius: 12,
        background: color,
        color: '#fff',
        minWidth: 240,
        textAlign: 'left',
        border: 'none',
        cursor: 'pointer',
        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
      }}
    >
      {text}
    </button>
  );
}

export default function Notifications() {
  const [alerts, setAlerts] = useState(null);
  const previousRef = useRef({
    criticalCases: 0,
    overdueTasks: 0,
    noDataPatients: 0
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await getAlertsPanel();
        if (!mounted) return;

        const nextAlerts = res.data || {
          criticalCases: 0,
          overdueTasks: 0,
          noDataPatients: 0,
          revenueRisk: 0
        };

        previousRef.current = alerts || previousRef.current;
        setAlerts(nextAlerts);
      } catch (e) {
        console.error(e);
      }
    }

    load();

    const interval = setInterval(load, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [alerts]);

  if (!alerts) return null;

  const hasCritical = Number(alerts.criticalCases || 0) > 0;
  const hasOverdue = Number(alerts.overdueTasks || 0) > 0;
  const hasNoData = Number(alerts.noDataPatients || 0) > 0;

  if (!hasCritical && !hasOverdue && !hasNoData) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}
    >
      {hasCritical && (
        <Toast
          color="#dc2626"
          text={`🔥 ${alerts.criticalCases} critical cases`}
          onClick={() => {
            window.location.href = '/tenant/alerts';
          }}
        />
      )}

      {hasOverdue && (
        <Toast
          color="#f97316"
          text={`⚠️ ${alerts.overdueTasks} overdue tasks`}
          onClick={() => {
            window.location.href = '/tenant/task-board';
          }}
        />
      )}

      {hasNoData && (
        <Toast
          color="#6b7280"
          text={`📡 ${alerts.noDataPatients} no data patients`}
          onClick={() => {
            window.location.href = '/tenant/atlas/queue';
          }}
        />
      )}
    </div>
  );
}