import { useState } from "react";
import api from "../api/axios";

export default function AddPatientForm({ onCreated }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    diagnosis: "",
    phone: "",
    cpap_hours: "",
    compliance_status: "pending",
  });

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      age: form.age === "" ? null : Number(form.age),
      diagnosis: form.diagnosis.trim() || null,
      phone: form.phone.trim() || null,
      cpap_hours: form.cpap_hours === "" ? 0 : Number(form.cpap_hours),
      compliance_status: form.compliance_status,
    };

    try {
      await api.post("/patients", payload);
      alert("Patient created!");

      setForm({
        name: "",
        age: "",
        diagnosis: "",
        phone: "",
        cpap_hours: "",
        compliance_status: "pending",
      });

      if (onCreated) onCreated();
    } catch (err) {
      console.error(err);
      alert("Error creating patient");
    }
  };

  return (
    <form onSubmit={submit} style={{ marginTop: 20, border: "1px solid #ccc", padding: 12 }}>
      <h3>Add Patient</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label>Name *</label>
          <input name="name" value={form.name} onChange={onChange} required style={{ width: "100%" }} />
        </div>

        <div>
          <label>Age</label>
          <input name="age" value={form.age} onChange={onChange} type="number" style={{ width: "100%" }} />
        </div>

        <div>
          <label>Diagnosis</label>
          <input name="diagnosis" value={form.diagnosis} onChange={onChange} style={{ width: "100%" }} />
        </div>

        <div>
          <label>Phone</label>
          <input name="phone" value={form.phone} onChange={onChange} style={{ width: "100%" }} />
        </div>

        <div>
          <label>CPAP Hours</label>
          <input name="cpap_hours" value={form.cpap_hours} onChange={onChange} type="number" style={{ width: "100%" }} />
        </div>

        <div>
          <label>Status</label>
          <select name="compliance_status" value={form.compliance_status} onChange={onChange} style={{ width: "100%" }}>
            <option value="pending">pending</option>
            <option value="compliant">compliant</option>
            <option value="noncompliant">noncompliant</option>
          </select>
        </div>
      </div>

      <button type="submit" style={{ marginTop: 12 }}>Create</button>
    </form>
  );
}
