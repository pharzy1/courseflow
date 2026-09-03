import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { authConfigured } from "./lib/auth";

const clerkOrigins="https://*.clerk.com https://*.clerk.dev https://*.clerk.accounts.dev";
const contentSecurityPolicy=["default-src 'self'","base-uri 'self'","object-src 'none'","frame-ancestors 'none'",`form-action 'self' ${clerkOrigins}`,"img-src 'self' data: https:","font-src 'self' data: https:","style-src 'self' 'unsafe-inline'",`script-src 'self' 'unsafe-inline' 'unsafe-eval' ${clerkOrigins}`,`connect-src 'self' ${clerkOrigins} https://api.clerk.com`,`frame-src ${clerkOrigins}`,"worker-src 'self' blob:"].join("; ");
const secure=(response:NextResponse)=>{response.headers.set("content-security-policy",contentSecurityPolicy);response.headers.set("x-content-type-options","nosniff");response.headers.set("referrer-policy","strict-origin-when-cross-origin");response.headers.set("permissions-policy","camera=(), microphone=(), geolocation=()");response.headers.set("x-frame-options","DENY");response.headers.set("strict-transport-security","max-age=31536000; includeSubDomains");return response;};
const anonymousMiddleware=()=>secure(NextResponse.next());

export default authConfigured()?clerkMiddleware(()=>secure(NextResponse.next())):anonymousMiddleware;

export const config={matcher:[
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
]};
