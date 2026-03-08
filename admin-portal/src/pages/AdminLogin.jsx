import React, { useState } from "react";
import axios from "axios";

const API="http://localhost:3000/api";

export default function AdminLogin(){

const [username,setUsername]=useState("");
const [password,setPassword]=useState("");

const login = async ()=>{

const res = await axios.post(API+"/auth/login",{
username,
password
});

if(res.data.user.role!=="admin"){
alert("Not admin");
return;
}

localStorage.setItem("token",res.data.token);

window.location="/admin";

};

return(

<div style={{padding:40}}>

<h1>Admin Login</h1>

<input
placeholder="username"
onChange={e=>setUsername(e.target.value)}
/>

<input
type="password"
placeholder="password"
onChange={e=>setPassword(e.target.value)}
/>

<button onClick={login}>
Login
</button>

</div>

);

}