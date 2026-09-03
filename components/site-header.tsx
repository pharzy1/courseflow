"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useRef,useState } from "react";
import { AccountControl } from "./account-control";

const navigation=[{label:"Home",href:"/"},{label:"Find Courses",href:"/catalog"},{label:"Degree Plan",href:"/roadmap"},{label:"Guided Demo",href:"/demo"},{label:"System Status",href:"/status"}];
const accountsEnabled=Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function SiteHeader({context}:{context?:string}){
  const pathname=usePathname(),[open,setOpen]=useState(false),active=(href:string)=>href==="/"?pathname===href:pathname.startsWith(href);
  const menuButton=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    if(!open)return;
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);menuButton.current?.focus();}};
    document.addEventListener("keydown",closeOnEscape);
    return()=>document.removeEventListener("keydown",closeOnEscape);
  },[open]);
  if(pathname.startsWith("/demo"))return null;
  return <header className="site-header global-site-header"><Link href="/" className="brand" aria-label="CourseFlow home"><span className="brand-mark">CF</span><span>Course<span>Flow</span></span></Link><button ref={menuButton} className="site-menu-button" aria-expanded={open} aria-controls="site-navigation" onClick={()=>setOpen(value=>!value)}><span aria-hidden="true">☰</span> Menu</button><nav id="site-navigation" className={open?"open":""} aria-label="Primary navigation">{navigation.map(item=><Link key={item.href} href={item.href} aria-current={active(item.href)?"page":undefined} onClick={()=>setOpen(false)}>{item.label}</Link>)}</nav><div className="site-account">{context?<span className="site-context">{context}</span>:null}<AccountControl configured={accountsEnabled}/></div></header>;
}
