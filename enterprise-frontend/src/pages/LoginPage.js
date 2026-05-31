import React, { useState } from "react";

// Robust production login page
// tenantId payload plus x-tenant-id
// tenant_id payload plus x-tenant-id
// x-tenant-id only
// raftop_auth_token
// raftop_redirect_after_login
// commercial_demo_mode

const BACKEND_URL =
  process.env.REACT_APP_API_URL ||
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_BASE_URL ||
  "https://raftop-cpap-backend.onrender.com";

function extractToken(payload) {
  return (
    payload?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    payload?.jwt ||
    payload?.authToken ||
    payload?.data?.token ||
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    ""
  );
}

function extractUser(payload) {
  return payload?.user || payload?.data?.user || null;
}

function getRedirectTarget() {
  try {
    return (
      localStorage.getItem("raftop_redirect_after_login") ||
      "/sales/raftopoulos/quality-profit"
    );
  } catch (error) {
    return "/sales/raftopoulos/quality-profit";
  }
}

function storeLoginSession({ token, user, tenantId }) {
  localStorage.setItem("raftop_auth_token", token);
  localStorage.setItem("token", token);
  localStorage.setItem("access_token", token);
  localStorage.setItem("auth_token", token);

  localStorage.setItem("tenant_id", tenantId);
  localStorage.setItem("tenantId", tenantId);
  localStorage.setItem("commercial_demo_mode", "true");

  if (user) {
    localStorage.setItem("raftop_auth_user", JSON.stringify(user));
    localStorage.setItem("user", JSON.stringify(user));
  }

  localStorage.removeItem("raftop_redirect_after_login");
}

async function attemptLogin({ email, password, tenantId }) {
  const attempts = [
    {
      name: "tenantId payload plus x-tenant-id",
      headers: { "x-tenant-id": tenantId },
      body: { email, password, tenantId }
    },
    {
      name: "tenant_id payload plus x-tenant-id",
      headers: { "x-tenant-id": tenantId },
      body: { email, password, tenant_id: tenantId }
    },
    {
      name: "x-tenant-id only",
      headers: { "x-tenant-id": tenantId },
      body: { email, password }
    },
    {
      name: "no tenant header tenantId payload",
      headers: {},
      body: { email, password, tenantId }
    },
    {
      name: "no tenant header tenant_id payload",
      headers: {},
      body: { email, password, tenant_id: tenantId }
    }
  ];

  let lastError = "Login failed.";

  for (const attempt of attempts) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...attempt.headers
        },
        body: JSON.stringify(attempt.body)
      });

      const text = await response.text();
      let payload = null;

      try {
        payload = text ? JSON.parse(text) : null;
      } catch (error) {
        payload = null;
      }

      const token = extractToken(payload);

      if (response.ok && token) {
        return {
          ok: true,
          mode: attempt.name,
          token,
          user: extractUser(payload),
          payload
        };
      }

      lastError =
        payload?.error ||
        payload?.message ||
        `Backend returned status ${response.status}`;
    } catch (error) {
      lastError = error?.message || "Network login error.";
    }
  }

  return {
    ok: false,
    error: lastError
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState("dimitrisgelly@gmail.com");
  const [tenantId, setTenantId] = useState("raftopoulos-live");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setStatus("loading");
    setError("");

    const cleanEmail = String(email || "").trim();
    const cleanTenant = String(tenantId || "raftopoulos-live").trim();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword || !cleanTenant) {
      setStatus("error");
      setError("Συμπλήρωσε email, tenant και password.");
      return;
    }

    const result = await attemptLogin({
      email: cleanEmail,
      password: cleanPassword,
      tenantId: cleanTenant
    });

    if (!result.ok) {
      setStatus("error");
      setError(result.error || "Login failed.");
      return;
    }

    storeLoginSession({
      token: result.token,
      user: result.user,
      tenantId: cleanTenant
    });

    setStatus("success");

    const target = getRedirectTarget();
    window.location.href = target;
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.kicker}>RAFTOP CPAP CARE Pro</div>
        <h1 style={styles.title}>Secure Login</h1>
        <p style={styles.subtitle}>
          Σύνδεση στο production demo περιβάλλον της Raftopoulos. Το login
          δοκιμάζει όλα τα backend-compatible payloads και αποθηκεύει σωστά
          token και tenant context.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Tenant
            <input
              style={styles.input}
              value={tenantId}
              onChange={(event) => setTenantId(event.target.value)}
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <div style={styles.error}>{error}</div> : null}

          {status === "success" ? (
            <div style={styles.success}>Login successful. Redirecting...</div>
          ) : null}

          <button style={styles.button} type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Login"}
          </button>
        </form>

        <div style={styles.footer}>
          Backend: <strong>{BACKEND_URL}</strong>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    boxSizing: "border-box",
    padding: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Inter, Arial, sans-serif",
    background:
      "radial-gradient(circle at top left, rgba(20,184,166,0.22), transparent 34%), linear-gradient(135deg, #07111f 0%, #0f172a 58%, #0f766e 140%)"
  },
  card: {
    width: "100%",
    maxWidth: "520px",
    background: "rgba(255,255,255,0.97)",
    color: "#0f172a",
    borderRadius: "30px",
    padding: "34px",
    boxShadow: "0 28px 90px rgba(0,0,0,0.28)"
  },
  kicker: {
    color: "#0f766e",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 950,
    letterSpacing: "0.16em"
  },
  title: {
    margin: "10px 0 10px",
    fontSize: "36px",
    lineHeight: 1.04,
    fontWeight: 950,
    letterSpacing: "-0.04em"
  },
  subtitle: {
    margin: 0,
    color: "#475569",
    fontSize: "14px",
    lineHeight: 1.55,
    fontWeight: 750
  },
  form: {
    display: "grid",
    gap: "14px",
    marginTop: "24px"
  },
  label: {
    display: "grid",
    gap: "7px",
    color: "#334155",
    fontSize: "12px",
    fontWeight: 950,
    textTransform: "uppercase",
    letterSpacing: "0.08em"
  },
  input: {
    height: "50px",
    border: "1px solid #cbd5e1",
    borderRadius: "16px",
    padding: "0 14px",
    color: "#0f172a",
    background: "#ffffff",
    fontSize: "15px",
    fontWeight: 800,
    outline: "none",
    boxSizing: "border-box"
  },
  button: {
    height: "52px",
    border: 0,
    borderRadius: "16px",
    background: "#0f766e",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 950,
    cursor: "pointer"
  },
  error: {
    background: "#fee2e2",
    border: "1px solid #fecaca",
    color: "#991b1b",
    borderRadius: "14px",
    padding: "12px",
    fontSize: "13px",
    fontWeight: 850
  },
  success: {
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    color: "#166534",
    borderRadius: "14px",
    padding: "12px",
    fontSize: "13px",
    fontWeight: 850
  },
  footer: {
    marginTop: "18px",
    color: "#64748b",
    fontSize: "12px",
    fontWeight: 800,
    wordBreak: "break-word"
  }
};
