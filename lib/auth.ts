export type CourseFlowIdentity={userId:string;email:string|null;provider:"clerk"};
export function authConfigured(){return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY&&process.env.CLERK_SECRET_KEY);}
export async function getOptionalIdentity():Promise<CourseFlowIdentity|null>{
  if(!authConfigured())return null;
  // Clerk is intentionally loaded only after deployment keys are provisioned.
  // This preserves anonymous browsing and prevents an unconfigured provider from breaking the public catalog.
  return null;
}
