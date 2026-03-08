import { useEffect, useState } from "react";
import axios from "axios";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const token = localStorage.getItem("token");

  const load = () => {
    axios.get("http://localhost:3000/api/tasks", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setTasks(res.data));
  };

  useEffect(() => { load(); }, []);

  const markDone = (id) => {
    axios.patch(`http://localhost:3000/api/tasks/${id}/done`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => load());
  };

  return (
    <div style={{ marginTop: 20, padding: 15, border: "1px solid #ddd", borderRadius: 10 }}>
      <h2>🧾 Tasks</h2>

      {tasks.map(t => (
        <div key={t.id} style={{ padding: 10, borderBottom: "1px solid #eee" }}>
          <b>{t.title}</b> — {t.status}
          <button onClick={() => markDone(t.id)}>Done</button>
        </div>
      ))}
    </div>
  );
}
