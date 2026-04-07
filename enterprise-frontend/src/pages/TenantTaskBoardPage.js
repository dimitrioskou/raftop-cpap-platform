import React, { useEffect, useState } from 'react';
import { getDailyBoard } from '../api/atlas';

function card() {
  return {
    background: '#fff',
    borderRadius: 16,
    padding: 18
  };
}

export default function TenantDailyBoardPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await getDailyBoard();
      setData(res.data || []);
    }
    load();
  }, []);

  return (
    <div>
      <h2>Daily Action Board</h2>

      <div style={{ display: 'grid', gap: 12 }}>
        {data.map((task) => (
          <div key={task.id} style={card()}>
            <div style={{ fontWeight: 700 }}>{task.patient_name}</div>
            <div>{task.action}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Score: {task.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}