import { useState } from "react";
import axios from "axios";

export default function UploadForm() {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const token = localStorage.getItem("token");

  const upload = () => {
    axios.post("http://localhost:3000/api/upload",
      { name, hours: parseFloat(hours) },
      { headers: { Authorization: `Bearer ${token}` } }
    ).then(() => alert("Uploaded!"));
  };

  return (
    <div>
      <h3>Upload CPAP Data</h3>
      <input placeholder="Patient Name" onChange={e => setName(e.target.value)} />
      <input placeholder="Hours" onChange={e => setHours(e.target.value)} />
      <button onClick={upload}>Upload</button>
    </div>
  );
}
