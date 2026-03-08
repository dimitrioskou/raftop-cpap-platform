import {useState} from "react"
import axios from "axios"

export default function PatientLogin(){

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const login = async () => {

try{

const res = await axios.post(
"http://localhost:3000/api/patient-auth/login",
{
email,
password
}
)

localStorage.setItem(
"patient",
JSON.stringify(res.data.patient)
)

window.location="/patient"

}catch(err){

alert("Login failed")

}

}

return(

<div style={{padding:40,fontFamily:"Arial"}}>

<h1>Patient Login</h1>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{display:"block",marginBottom:10}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{display:"block",marginBottom:10}}
/>

<button onClick={login}>
Login
</button>

</div>

)

}