import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";


const API_BASE = "http://localhost:3000";

export default function Users() {
  const { token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);

  // Create form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [creating, setCreating] = useState(false);

  const authHeaders = useMemo(() => {
    return { Authorization: `Bearer ${token}` };
  }, [token]);

  async function fetchUsers() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        headers: authHeaders,
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/");
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (e) {
      setError("Δεν μπόρεσα να φορτώσω users. Έλεγξε backend στο :3000");
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Βάλε username και password.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          ...authHeaders,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/");
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Create failed");
      }

      // refresh list
      setUsername("");
      setPassword("");
      setRole("admin");
      await fetchUsers();
    } catch (e) {
      setError("Αποτυχία δημιουργίας χρήστη. Δες console/backend logs.");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    if (!confirm("Σίγουρα delete;")) return;

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeaders,
      });

      if (res.status === 401 || res.status === 403) {
        logout();
        navigate("/");
        return;
      }

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(txt || "Delete failed");
      }

      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError("Αποτυχία διαγραφής. Δες console/backend logs.");
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <h1 style={{ margin: 0 }}>Manage Users</h1>

        <button
          onClick={() => {
            logout();
            navigate("/");
          }}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            cursor: "pointer",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <Link to="/dashboard">← Back to Dashboard</Link>
      </div>

      {!!error && <p style={{ color: "crimson" }}>{error}</p>}

      <hr style={{ margin: "18px 0" }} />

      {/* CREATE USER */}
      <h2 style={{ marginTop: 0 }}>Create User</h2>
      <form onSubmit={handleCreate} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="username"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ padding: 8, border: "1px solid #ccc", borderRadius: 6 }}
        >
          <option value="admin">admin</option>
          <option value="coach">coach</option>
          <option value="viewer">viewer</option>
        </select>

        <button
          type="submit"
          disabled={creating}
          style={{
            padding: "8px 12px",
            cursor: creating ? "not-allowed" : "pointer",
            border: "1px solid #ccc",
            borderRadius: 6,
            background: "#fff",
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </form>

      <hr style={{ margin: "18px 0" }} />

      {/* LIST USERS */}
      <h2 style={{ marginTop: 0 }}>Users</h2>

      {loading ? (
        <p>Loading…</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {users.map((u) => (
            <div
              key={u.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{u.username}</div>
                <div style={{ color: "#666" }}>role: {u.role}</div>
                <div style={{ color: "#999", fontSize: 12 }}>id: {u.id}</div>
              </div>

              <button
                onClick={() => handleDelete(u.id)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  background: "#fff",
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
