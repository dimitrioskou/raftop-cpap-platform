import React, { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000/api";

export default function DoctorLogin() {
  const [email, setEmail] = useState("doctor@sleepstudy.gr");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });

      const { token, user } = res.data;

      if (user.role !== "doctor") {
        setError("Δεν έχετε πρόσβαση ως ιατρός");
        return;
      }

      localStorage.setItem("doctor_token", token);
      localStorage.setItem("doctor_user", JSON.stringify(user));

      window.location.href = "/doctor";
    } catch (err) {
      console.error(err);
      setError("Λάθος email ή password");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h2>👨‍⚕️ Doctor Portal Login</h2>
        <p>RAFTOP CPAP Care – Clinical Access</p>

        <form onSubmit={handleLogin} style={{ marginTop: 20 }}>
          <label>Email</label>
          <input
            style={input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label style={{ marginTop: 10 }}>Password</label>
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p style={{ color: "red" }}>{error}</p>}

          <button style={button} type="submit">
            Login ως Ιατρός
          </button>
        </form>
      </div>
    </div>
  );
}

const container = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#f3f4f6"
};

const card = {
  background: "#fff",
  padding: 30,
  borderRadius: 12,
  width: 350,
  boxShadow: "0 8px 20px rgba(0,0,0,0.1)"
};

const input = {
  width: "100%",
  padding: 10,
  marginTop: 5,
  borderRadius: 8,
  border: "1px solid #ccc"
};

const button = {
  width: "100%",
  marginTop: 20,
  padding: 12,
  borderRadius: 8,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer"
};