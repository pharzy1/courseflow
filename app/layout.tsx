import type { Metadata } from "next";
import { headers } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";
import { authConfigured,clerkProxyUrl,clerkPublishableKey } from "../lib/auth";
import "./globals.css";

// Account controls depend on the active production Clerk environment.
export const dynamic="force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const base = new URL(`${protocol}://${host}`);
  return {
    metadataBase: base,
    title: "CourseFlow — Build a better Berkeley semester",
    description: "A preference-aware course planner that generates conflict-free Berkeley schedules and explains every recommendation.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title: "CourseFlow", description: "Your semester, without the guesswork.", images: [{ url: "/og.png", width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: "CourseFlow", description: "Preference-aware scheduling for Berkeley", images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const publishableKey=clerkPublishableKey();
  return <html lang="en"><body>{authConfigured()&&publishableKey?<ClerkProvider publishableKey={publishableKey} proxyUrl={clerkProxyUrl()}>{children}</ClerkProvider>:children}</body></html>;
}
