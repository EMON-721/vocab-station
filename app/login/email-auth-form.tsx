"use client";
import { useState, type FormEvent } from "react";

export default function EmailAuthForm({returnTo}:{returnTo:string}){
  const [mode,setMode]=useState<"register"|"login">("register");
  const [name,setName]=useState(""),[email,setEmail]=useState(""),[loginId,setLoginId]=useState("");
  const [identifier,setIdentifier]=useState(""),[password,setPassword]=useState("");
  const [busy,setBusy]=useState(false),[error,setError]=useState("");
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(busy)return;
    setBusy(true);setError("");
    try{
      const response=await fetch("/api/auth/email",{
        method:"POST",headers:{"Content-Type":"application/json"},
        credentials:"same-origin",
        body:JSON.stringify(mode==="register"
          ?{action:mode,name,email,loginId,password,returnTo}
          :{action:mode,identifier,password,returnTo})
      });
      const data=await response.json() as {error?:string;returnTo?:string};
      if(!response.ok)throw Error(data.error||"Unable to sign in.");
      window.location.assign(data.returnTo||"/");
    }catch(e){setError(e instanceof Error?e.message:"Unable to sign in.");setBusy(false);}
  }
  function switchMode(next:"register"|"login"){setMode(next);setError("");setPassword("");}
  return <div className="email-auth">
    <div className="email-auth-tabs" role="group" aria-label="Account access">
      <button type="button" className={mode==="register"?"active":""} aria-pressed={mode==="register"} onClick={()=>switchMode("register")}>Create account</button>
      <button type="button" className={mode==="login"?"active":""} aria-pressed={mode==="login"} onClick={()=>switchMode("login")}>Sign in</button>
    </div>
    <form onSubmit={submit} className="email-auth-form">
      {mode==="register"?<>
        <label>Full name<input type="text" required autoComplete="name" value={name} maxLength={100} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label>
        <label>Email<input type="email" required autoComplete="email" value={email} maxLength={254} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
        <label>User ID<input type="text" required pattern="[A-Za-z][A-Za-z0-9_]{2,31}" title="3–32 characters, starting with a letter" autoComplete="username" value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="Choose a unique User ID"/></label>
      </>:<label>Email or User ID<input type="text" required autoComplete="username" value={identifier} onChange={e=>setIdentifier(e.target.value)} placeholder="Enter email or User ID"/></label>}
      <label>Password<input type="password" required minLength={8} maxLength={128} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="8+ characters"/></label>
      {error&&<p className="email-auth-error" role="alert">{error}</p>}
      <button className="primary email-auth-submit" type="submit" disabled={busy}>{busy?"Please wait…":mode==="register"?"Create account":"Sign in"}</button>
    </form>
  </div>;
}
