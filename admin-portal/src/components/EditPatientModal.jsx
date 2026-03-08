import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function EditPatientModal({ patient, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: "",
    age: "",
    diagnosis: "",
    phone: "",
    cpap_hours: "",
    compliance_status: "pending",
  });

  useEffect(() => {
    if (patient) {
      setForm({
        name: patient.name || "",
        age: patient.age || "",
        diagnosis: patient.diagnosis || "",
        phone: patient.phone || "",
        cpap_hours: patient.cpap_hours || 0,
        compliance_status: patient.compliance_status || "pending",
      });
    }
  }, [patient]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    try {
      await axios.put(`/patients/${patient.id}`, {
        ...form,
        age: form.age ? parseInt(form.age) : null,
        cpap_hours: form.cpap_hours ? parseInt(form.cpap_hours) : 0,
      });

      alert("Patient updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  if (!patient) return null;

  return (
    <div style={overlay}>
      <div style={modal}>
        <h2>Edit Patient</h2>

        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
        <input name="age" value={form.age} onChange={handleChange} placeholder="Age" />
        <input name="diagnosis" value={form.diagnosis} onChange={handleChange} placeholder="Diagnosis" />
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
        <input name="cpap_hours" value={form.cpap_hours} onChange={handleChange} placeholder="CPAP Hours" />

        <select name="compliance_status" value={form.compliance_status} onChange={handleChange}>
          <option value="pending">Pending</option>
          <option value="compliant">Compliant</option>
          <option value="non-compliant">Non-Compliant</option>
        </select>

        <div style={{ marginTop: 15 }}>
          <button onClick={handleUpdate}>Save Changes</button>
          <button onClick={onClose} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modal = {
  background: "white",
  padding: "25px",
  borderRadius: "10px",
  width: "400px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};
