import { Link, useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const menuStyle = (path) => ({
    padding: "12px 16px",
    display: "block",
    color: location.pathname === path ? "#fff" : "#ddd",
    background: location.pathname === path ? "#2563eb" : "transparent",
    textDecoration: "none",
    borderRadius: "6px",
    marginBottom: "8px",
    fontWeight: "500",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "Arial" }}>
      {/* SIDEBAR */}
      <div
        style={{
          width: "240px",
          background: "#111827",
          color: "white",
          padding: "20px",
        }}
      >
        <h2 style={{ marginBottom: "30px" }}>CPAP Care</h2>

        <nav>
          <Link to="/dashboard" style={menuStyle("/dashboard")}>
            📊 Dashboard
          </Link>

          <Link to="/patients" style={menuStyle("/patients")}>
            🧑‍⚕️ Patients
          </Link>

          <Link to="/users" style={menuStyle("/users")}>
            👨‍💼 Admin Users
          </Link>
        </nav>

        <button
          onClick={logout}
          style={{
            marginTop: "40px",
            width: "100%",
            padding: "10px",
            background: "#dc2626",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, background: "#f3f4f6" }}>
        {/* TOPBAR */}
        <div
          style={{
            background: "white",
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            fontWeight: "bold",
          }}
        >
          Admin Panel – CPAP Care SaaS
        </div>

        {/* PAGE CONTENT */}
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}
