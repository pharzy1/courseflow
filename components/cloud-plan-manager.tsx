"use client";

import { useState } from "react";
import type { PlanPayload } from "../lib/plans";

type CloudPlan={id:string;name:string;payload:PlanPayload;updatedAt:string};

export function CloudPlanManager({configured,current,onRestore}:{configured:boolean;current:PlanPayload;onRestore:(payload:PlanPayload)=>void}){
  const [open,setOpen]=useState(false),[plans,setPlans]=useState<CloudPlan[]>([]),[name,setName]=useState("Fall 2026 option"),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  if(!configured)return null;
  const refresh=async()=>{setBusy(true);const response=await fetch("/api/plans",{cache:"no-store"});if(response.ok){const data=await response.json() as {plans:CloudPlan[]};setPlans(data.plans);setMessage(data.plans.length?"":"No cloud plans yet.");}else setMessage(response.status===401?"Sign in to manage cloud plans.":"Cloud plans are temporarily unavailable.");setBusy(false);};
  const toggle=()=>{const next=!open;setOpen(next);if(next)void refresh();};
  const create=async(planName=name,payload=current)=>{setBusy(true);const response=await fetch("/api/plans",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:planName,payload})});if(response.ok){setName("Fall 2026 option");await refresh();setMessage("Plan saved to your account.");}else{const data=await response.json().catch(()=>({})) as {detail?:string};setMessage(data.detail??"Plan could not be saved.");setBusy(false);}};
  const rename=async(plan:CloudPlan)=>{const next=window.prompt("Rename this plan",plan.name)?.trim();if(!next||next===plan.name)return;setBusy(true);await fetch(`/api/plans/${encodeURIComponent(plan.id)}`,{method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify({name:next})});await refresh();};
  const remove=async(plan:CloudPlan)=>{if(!window.confirm(`Delete “${plan.name}”? This cannot be undone.`))return;setBusy(true);await fetch(`/api/plans/${encodeURIComponent(plan.id)}`,{method:"DELETE"});await refresh();setMessage("Plan deleted.");};
  return <div className={`cloud-library ${open?"open":""}`}><button className="cloud-library-toggle" onClick={toggle} aria-expanded={open} aria-controls="cloud-plan-panel">Cloud plans</button>{open&&<section id="cloud-plan-panel" aria-label="Saved cloud plans"><div className="cloud-library-head"><div><span className="kicker">YOUR ACCOUNT</span><h2>Saved plans</h2></div><button onClick={()=>setOpen(false)} aria-label="Close saved plans">×</button></div><form onSubmit={event=>{event.preventDefault();void create();}}><label>Plan name<input value={name} maxLength={80} onChange={event=>setName(event.target.value)} required/></label><button disabled={busy}>Save current as new</button></form><p role="status" aria-live="polite">{busy?"Syncing…":message}</p><div className="cloud-plan-list">{plans.map(plan=><article key={plan.id}><div><b>{plan.name}</b><span>{plan.payload.selected.length} courses · Updated {new Date(plan.updatedAt).toLocaleDateString()}</span></div><div><button onClick={()=>{onRestore(plan.payload);setMessage(`${plan.name} restored.`);}}>Restore</button><button onClick={()=>void create(`${plan.name} copy`,plan.payload)}>Duplicate</button><button onClick={()=>void rename(plan)}>Rename</button><button className="danger" onClick={()=>void remove(plan)}>Delete</button></div></article>)}</div></section>}</div>;
}
