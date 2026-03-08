import { useEffect, useState } from "react"
import axios from "axios"
import PatientActivation from "../components/PatientActivation"

export default function AdminDashboard(){

const [patients,setPatients] = useState([])
const [doctors,setDoctors] = useState([])
const [stats,setStats] = useState({})

useEffect(()=>{

loadData()

},[])

const loadData = async () => {

try{

const patientsRes = await axios.get(
"http://localhost:3000/api/patients"
)

const doctorsRes = await axios.get(
"http://localhost:3000/api/admin/doctors"
)

setPatients(patientsRes.data.patients || [])
setDoctors(doctorsRes.data.doctors || [])

setStats({
patients:patientsRes.data.count || 0,
doctors:doctorsRes.data.doctors?.length || 0
})

}catch(err){

console.log(err)

}

}

return(

<div style={{padding:30,fontFamily:"Arial"}}>

<h1>RAFTOP CPAP CARE — Admin Dashboard</h1>

{/* ===================== */}
{/* STATS */}
{/* ===================== */}

<div style={{
display:"flex",
gap:20,
marginTop:20
}}>

<div style={{
background:"#f1f3f5",
padding:20,
borderRadius:10
}}>

<h3>Total Patients</h3>

<div style={{fontSize:24,fontWeight:"bold"}}>
{stats.patients}
</div>

</div>

<div style={{
background:"#f1f3f5",
padding:20,
borderRadius:10
}}>

<h3>Total Doctors</h3>

<div style={{fontSize:24,fontWeight:"bold"}}>
{stats.doctors}
</div>

</div>

</div>

{/* ===================== */}
{/* PATIENT ACTIVATION */}
{/* ===================== */}

<PatientActivation/>

{/* ===================== */}
{/* DOCTORS */}
{/* ===================== */}

<h2 style={{marginTop:40}}>Doctors</h2>

<table
style={{
width:"100%",
borderCollapse:"collapse",
marginTop:10
}}
>

<thead>

<tr style={{background:"#eee"}}>

<th>ID</th>
<th>Name</th>
<th>Email</th>
<th>Role</th>

</tr>

</thead>

<tbody>

{doctors.map(d => (

<tr key={d.id}>

<td>{d.id}</td>
<td>{d.name}</td>
<td>{d.email}</td>
<td>{d.role}</td>

</tr>

))}

</tbody>

</table>

{/* ===================== */}
{/* PATIENTS */}
{/* ===================== */}

<h2 style={{marginTop:40}}>Patients</h2>

<table
style={{
width:"100%",
borderCollapse:"collapse",
marginTop:10
}}
>

<thead>

<tr style={{background:"#eee"}}>

<th>ID</th>
<th>Name</th>
<th>Age</th>
<th>Diagnosis</th>
<th>CPAP Hours</th>
<th>Compliance</th>

</tr>

</thead>

<tbody>

{patients.map(p => (

<tr key={p.id}>

<td>{p.id}</td>
<td>{p.name}</td>
<td>{p.age}</td>
<td>{p.diagnosis}</td>
<td>{p.cpap_hours}</td>
<td>{p.compliance_status}</td>

</tr>

))}

</tbody>

</table>

</div>

)

}