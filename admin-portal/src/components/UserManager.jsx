import { useEffect, useState } from "react";

export default function UserManager() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const token = localStorage.getItem("token");

  const loadUsers = () => {
    fetch("http://localhost:3000/api/admin/users", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => setUsers(data));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = () => {
    if (!username || !password) {
      alert("Enter username & password");
      return;
    }

    fetch("http://localhost:3000/api/admin/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        username: username,
        password: password,
        role: "user"
      })
    }).then(() => {
      setUsername("");
      setPassword("");
      loadUsers();
    });
  };

  const deleteUser = (id) => {
    fetch(`http://localhost:3000/api/admin/users/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(loadUsers);
  };

  return (
    <div style={{ marginTop: "30px" }}>
      <h2>User Management (Database)</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button onClick={createUser}>Create User</button>

      <ul style={{ marginTop: "20px" }}>
        {users.map(u => (
          <li key={u.id}>
            {u.username} ({u.role})
            <button onClick={() => deleteUser(u.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
