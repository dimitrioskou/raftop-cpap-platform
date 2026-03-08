import React, { useState } from "react";
import axios from "axios";

const API = "http://localhost:3000/api";

export default function AdminDoctors(){

const [form,setForm] = useState({
username:"",
password:"",
name:"",
email:""
});

const submit = async ()=>{

await axios.post(API+"/admin/create-doctor",form);

alert("Doctor created");

};

return(

<div style={{padding:40}}>

<h1>Create Doctor Account</h1>

<input
placeholder="username"
onChange={e=>setForm({...form,username:e.target.value})}
/>

<input
placeholder="password"
onChange={e=>setForm({...form,password:e.target.value})}
/>

<input
placeholder="doctor name"
onChange={e=>setForm({...form,name:e.target.value})}
/>

<input
placeholder="email"
onChange={e=>setForm({...form,email:e.target.value})}
/>

<button onClick={submit}>
Create Doctor
</button>

</div>

);

}