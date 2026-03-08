import { useState } from "react"
import axios from "axios"

export default function PatientActivation(){

const [patientId,setPatientId] = useState("")
const [plan,setPlan] = useState("CPAP CARE PRO")
const [price,setPrice] = useState("120")
const [code,setCode] = useState("")

const generateCode = async () => {

try{

const res = await axios.post(
"http://localhost:3000/api/patient-subscriptions/create-code",
{
patient_id:patientId,
plan_name:plan,
price_yearly:price
}
)

setCode(res.data.code.activation_code)

}catch(err){

alert("Code creation failed")

}

}

return (

<div style={{border:"1px solid #ddd",padding:20,marginTop:20}}>

<h2>Patient Subscription Activation</h2>

<input
placeholder="Patient ID"
value={patientId}
onChange={(e)=>setPatientId(e.target.value)}
style={{display:"block",marginBottom:10}}
/>

<select
value={plan}
onChange={(e)=>setPlan(e.target.value)}
style={{display:"block",marginBottom:10}}
>

<option>CPAP CARE BASIC</option>
<option>CPAP CARE PRO</option>
<option>CPAP CARE VIP</option>

</select>

<input
placeholder="Price yearly"
value={price}
onChange={(e)=>setPrice(e.target.value)}
style={{display:"block",marginBottom:10}}
/>

<button onClick={generateCode}>
Generate Activation Code
</button>

{code && (

<div style={{marginTop:20}}>

<h3>Activation Code</h3>

<div style={{
fontSize:24,
fontWeight:"bold",
color:"#2c7be5"
}}>

{code}

</div>

</div>

)}

</div>

)

}