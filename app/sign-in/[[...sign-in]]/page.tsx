import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { authConfigured } from "../../../lib/auth";
export default function SignInPage(){return <main className="auth-page">{authConfigured()?<SignIn/>:<div><h1>Accounts are being connected</h1><p>CourseFlow remains available in guest mode while the Clerk tenant is provisioned.</p><Link href="/">Return to CourseFlow</Link></div>}</main>;}
