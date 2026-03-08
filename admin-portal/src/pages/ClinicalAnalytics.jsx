import { useEffect,useState } from "react"
import axios from "../api/axios"

export default function ClinicalAnalytics(){

const [data,setData] = useState(null)

useEffect(()=>{

load()

},[])

async function load(){

const res = await axios.get("/clinical")

setData(res.data)

}

if(!data) return <div>Loading...</div>

return(

<div style={{padding:30}}>

<h1>Clinical Dashboard</h1>

<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>

<Card title="Total Patients" value={data.patients}/>
<Card title="Compliant" value={data.compliant}/>
<Card title="Non-Compliant" value={data.noncompliant}/>
<Card title="High AHI Alerts" value={data.ahi_alerts}/>
<Card title="Mask Leak Alerts" value={data.mask_leak_alerts}/>
<Card title="High Risk Patients" value={data.high_risk}/>

</div>

</div>

)

}

function Card({title,value}){

return(

<div style={{
background:"#fff",
padding:25,
borderRadius:10,
boxShadow:"0 4px 10px rgba(0,0,0,0.1)"
}}>

<h3>{title}</h3>

<h1>{value}</h1>

</div>

)

}