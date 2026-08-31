"use client";

import { useSyncExternalStore } from "react";
import { Show,SignInButton,SignUpButton,UserButton } from "@clerk/nextjs";

export function AccountControl({configured}:{configured:boolean}){
  const mounted=useSyncExternalStore(()=>()=>{},()=>true,()=>false);
  if(!configured)return <span className="account-status" title="Authentication tenant pending">Guest mode</span>;
  if(!mounted)return <span className="account-status" aria-label="Loading account controls">Account</span>;
  return <div className="account-control"><Show when="signed-out"><SignInButton mode="modal"><button className="account-signin">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="account-signup">Create account</button></SignUpButton></Show><Show when="signed-in"><span className="cloud-status">Cloud sync on</span><UserButton/></Show></div>;
}
