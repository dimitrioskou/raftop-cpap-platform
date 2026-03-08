import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "http://localhost:3000/api";

export default function AdminBillingDashboard() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [doctors, setDoctors] = useState([]);

  const token = localStorage.getItem("token");

  const authHeaders = {
    headers: {
      Authorization: "Bearer " + token
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [subsRes, revenueRes, doctorsRes] = await Promise.all([
      axios.get(`${API}/billing/subscriptions`, authHeaders),
      axios.get(`${API}/billing/revenue`, authHeaders),
      axios.get(`${API}/admin/doctors`, authHeaders)
    ]);

    setSubscriptions(subsRes.data.subscriptions || []);
    setRevenue(revenueRes.data || null);
    setDoctors(doctorsRes.data.doctors || []);
  };

  const createSubscription = async () => {
    const doctor_id = prompt("Doctor ID");
    const plan_name = prompt("Plan Name (DOCTOR_BASIC / DOCTOR_PRO / CLINIC_PREMIUM)");
    const price_yearly = prompt("Yearly Price");
    const end_date = prompt("End Date (YYYY-MM-DD)");

    if (!doctor_id || !plan_name || !end_date) return;

    await axios.post(
      `${API}/billing/subscriptions`,
      {
        doctor_id,
        plan_name,
        price_yearly,
        billing_cycle: "yearly",
        status: "active",
        start_date: new Date().toISOString().slice(0, 10),
        end_date,
        auto_renew: false
      },
      authHeaders
    );

    alert("Subscription created");
    loadAll();
  };

  const suspendDoctor = async (doctorId) => {
    await axios.put(`${API}/billing/doctors/${doctorId}/suspend`, {}, authHeaders);
    alert("Doctor suspended");
    loadAll();
  };

  const activateDoctor = async (doctorId) => {
    await axios.put(`${API}/billing/doctors/${doctorId}/activate`, {}, authHeaders);
    alert("Doctor activated");
    loadAll();
  };

  return (
    <div style={{ padding: 30, fontFamily: "Arial, sans-serif", background: "#f5f7fb", minHeight: "100vh" }}>
      <h1>Admin Billing Dashboard</h1>
      <p style={{ color: "#4b5563" }}>SaaS Subscription Engine • Revenue • Accounts</p>

      {revenue ? (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 20 }}>
          <Card title="Total Subs" value={revenue.summary.total_subscriptions} color="#2563eb" />
          <Card title="Active Subs" value={revenue.summary.active_subscriptions} color="#16a34a" />
          <Card title="Suspended Subs" value={revenue.summary.suspended_subscriptions} color="#dc2626" />
          <Card title="Yearly Revenue (€)" value={revenue.summary.active_revenue_yearly} color="#7c3aed" />
        </div>
      ) : null}

      <div style={panelStyle}>
        <h2>💳 Create Subscription</h2>
        <button style={buttonStyle} onClick={createSubscription}>
          New Subscription
        </button>
      </div>

      <div style={panelStyle}>
        <h2>👨‍⚕️ Doctor Accounts</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Doctor</th>
              <th>Email</th>
              <th>Status</th>
              <th>Patients</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {doctors.map((d) => (
              <tr key={d.id}>
                <td>{d.id}</td>
                <td>{d.name || d.username}</td>
                <td>{d.email}</td>
                <td>{d.account_status || "active"}</td>
                <td>{d.patient_count}</td>
                <td>
                  <button style={buttonStyle} onClick={() => activateDoctor(d.id)}>
                    Activate
                  </button>
                  <button style={{ ...buttonStyle, marginLeft: 8, background: "#b91c1c" }} onClick={() => suspendDoctor(d.id)}>
                    Suspend
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={panelStyle}>
        <h2>📄 Subscriptions</h2>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th>Doctor</th>
              <th>Plan</th>
              <th>Price Yearly</th>
              <th>Status</th>
              <th>Start</th>
              <th>End</th>
              <th>Account</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id}>
                <td>{s.name || s.username}</td>
                <td>{s.plan_name}</td>
                <td>{s.price_yearly}</td>
                <td>{s.status}</td>
                <td>{String(s.start_date).slice(0, 10)}</td>
                <td>{String(s.end_date).slice(0, 10)}</td>
                <td>{s.account_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {revenue ? (
        <div style={panelStyle}>
          <h2>📈 Revenue by Plan</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Count</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenue.by_plan.map((p, i) => (
                <tr key={i}>
                  <td>{p.plan_name}</td>
                  <td>{p.count}</td>
                  <td>{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {revenue ? (
        <div style={panelStyle}>
          <h2>⏳ Expiring Soon</h2>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Email</th>
                <th>Plan</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              {revenue.expiring_soon.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.plan_name}</td>
                  <td>{String(e.end_date).slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        padding: 20,
        borderRadius: 12,
        minWidth: 180,
        borderLeft: `6px solid ${color}`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: "bold", marginTop: 8 }}>{value}</div>
    </div>
  );
}

const panelStyle = {
  background: "#fff",
  marginTop: 24,
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: 16
};

const buttonStyle = {
  padding: "8px 12px",
  border: "none",
  borderRadius: 8,
  background: "#111827",
  color: "#fff",
  cursor: "pointer"
};