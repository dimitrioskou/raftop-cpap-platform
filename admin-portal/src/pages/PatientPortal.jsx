import { useEffect, useState } from "react"
import axios from "axios"

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from "recharts"

export default function PatientPortal(){

// ==============================
// GET PATIENT FROM LOGIN
// ==============================

const storedPatient = JSON.parse(localStorage.getItem("patient"))

const patientId = storedPatient?.id

// ==============================
// STATES
// ==============================

const [patient,setPatient] = useState(null)
const [usage,setUsage] = useState([])
const [score,setScore] = useState(null)

// ==============================
// LOAD DATA
// ==============================

useEffect(()=>{

if(patientId){

loadData()

}

},[])

const loadData = async ()=>{

try{

const res = await axios.get(
"http://localhost:3000/api/patient-portal/" + patientId
)

const rows = (res.data.usage || []).map((u)=>({

usage_date:String(u.usage_date).slice(0,10),
hours_used:Number(u.hours_used || 0),
ahi:Number(u.ahi || 0),
mask_leak:Number(u.mask_leak || 0)

}))

setPatient(res.data.patient)

setUsage(rows.reverse())

setScore(res.data.therapy_score)

}catch(err){

console.log(err)

}

}

// ==============================
// SCORE COLOR
// ==============================

const getScoreColor = (value)=>{

if(value >= 80) return "#16a34a"
if(value >= 60) return "#f59e0b"

return "#dc2626"

}

// ==============================
// UI
// ==============================

return(

<div style={{
padding:30,
fontFamily:"Arial",
background:"#f5f7fb",
minHeight:"100vh"
}}>

<h1>CPAP Patient Portal</h1>

<p style={{color:"#6b7280"}}>
Παρακολούθηση θεραπείας CPAP
</p>

{/* ============================== */}
{/* PATIENT INFO */}
{/* ============================== */}

{patient && (

<div style={{display:"flex",gap:16,flexWrap:"wrap",marginTop:20}}>

<Card title="Ασθενής" value={patient.name} color="#2563eb"/>

<Card title="Διάγνωση" value={patient.diagnosis} color="#7c3aed"/>

<Card title="Συνολικές Ώρες" value={patient.cpap_hours} color="#111827"/>

<Card title="Compliance" value={patient.compliance_status} color="#16a34a"/>

</div>

)}

{/* ============================== */}
{/* THERAPY SCORE */}
{/* ============================== */}

{score && (

<div style={{
marginTop:24,
padding:24,
background:"#fff",
borderRadius:12,
boxShadow:"0 4px 12px rgba(0,0,0,0.08)"
}}>

<h2>Therapy Score</h2>

<div style={{
fontSize:46,
fontWeight:"bold",
color:getScoreColor(score.score),
marginTop:10
}}>

{score.score} / 100

</div>

<div style={{
display:"flex",
gap:16,
flexWrap:"wrap",
marginTop:20
}}>

<MiniCard title="Avg Hours" value={score.avgHours?.toFixed(1)} color="#2563eb"/>

<MiniCard title="Avg AHI" value={score.avgAHI?.toFixed(1)} color="#dc2626"/>

<MiniCard title="Avg Leak" value={score.avgLeak?.toFixed(1)} color="#f59e0b"/>

</div>

</div>

)}

{/* ============================== */}
{/* USAGE CHART */}
{/* ============================== */}

<div style={panelStyle}>

<h2>Usage Hours</h2>

<ResponsiveContainer width="100%" height={300}>

<BarChart data={usage}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="usage_date"/>

<YAxis/>

<Tooltip/>

<Legend/>

<Bar dataKey="hours_used" name="Hours Used" fill="#2563eb"/>

</BarChart>

</ResponsiveContainer>

</div>

{/* ============================== */}
{/* AHI CHART */}
{/* ============================== */}

<div style={panelStyle}>

<h2>AHI Trend</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={usage}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="usage_date"/>

<YAxis/>

<Tooltip/>

<Legend/>

<Line
type="monotone"
dataKey="ahi"
stroke="#dc2626"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

{/* ============================== */}
{/* LEAK CHART */}
{/* ============================== */}

<div style={panelStyle}>

<h2>Mask Leak</h2>

<ResponsiveContainer width="100%" height={300}>

<LineChart data={usage}>

<CartesianGrid strokeDasharray="3 3"/>

<XAxis dataKey="usage_date"/>

<YAxis/>

<Tooltip/>

<Legend/>

<Line
type="monotone"
dataKey="mask_leak"
stroke="#f59e0b"
strokeWidth={3}
/>

</LineChart>

</ResponsiveContainer>

</div>

{/* ============================== */}
{/* USAGE TABLE */}
{/* ============================== */}

<div style={panelStyle}>

<h2>Last 30 Days</h2>

<table style={{
width:"100%",
borderCollapse:"collapse",
marginTop:16
}}>

<thead>

<tr style={{background:"#eef2ff"}}>

<th style={thStyle}>Date</th>
<th style={thStyle}>Hours</th>
<th style={thStyle}>AHI</th>
<th style={thStyle}>Leak</th>

</tr>

</thead>

<tbody>

{usage.map((u,i)=>(

<tr key={i}>

<td style={tdStyle}>{u.usage_date}</td>
<td style={tdStyle}>{u.hours_used}</td>
<td style={tdStyle}>{u.ahi}</td>
<td style={tdStyle}>{u.mask_leak}</td>

</tr>

))}

</tbody>

</table>

</div>

</div>

)

}

// ==============================
// COMPONENTS
// ==============================

function Card({title,value,color}){

return(

<div style={{
background:"#fff",
padding:20,
borderRadius:12,
minWidth:180,
borderLeft:`6px solid ${color}`,
boxShadow:"0 4px 12px rgba(0,0,0,0.08)"
}}>

<div style={{color:"#6b7280",fontSize:14}}>
{title}
</div>

<div style={{fontSize:22,fontWeight:"bold",marginTop:8}}>
{value}
</div>

</div>

)

}

function MiniCard({title,value,color}){

return(

<div style={{
background:"#f9fafb",
padding:16,
borderRadius:10,
minWidth:160,
borderLeft:`5px solid ${color}`
}}>

<div style={{color:"#6b7280",fontSize:13}}>
{title}
</div>

<div style={{fontSize:22,fontWeight:"bold",marginTop:6}}>
{value}
</div>

</div>

)

}

// ==============================
// STYLES
// ==============================

const panelStyle = {

marginTop:24,
padding:24,
background:"#fff",
borderRadius:12,
boxShadow:"0 4px 12px rgba(0,0,0,0.08)"

}

const thStyle = {

padding:12,
textAlign:"left",
borderBottom:"1px solid #ddd"

}

const tdStyle = {

padding:12,
borderBottom:"1px solid #eee"

}