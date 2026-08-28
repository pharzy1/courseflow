"use client";

import { SignInButton,SignUpButton,SignedIn,SignedOut,UserButton } from "@clerk/nextjs";

export function AccountControl({configured}:{configured:boolean}){
  if(!configured)return <span className="account-status" title="Authentication tenant pending">Guest mode</span>;
  return <div className="account-control"><SignedOut><SignInButton mode="modal"><button className="account-signin">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="account-signup">Create account</button></SignUpButton></SignedOut><SignedIn><span className="cloud-status">Cloud sync on</span><UserButton/></SignedIn></div>;
}
