export type CourseFlowIdentity={userId:string;email:string|null;provider:"clerk"};
export function authConfigured(){return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY&&process.env.CLERK_SECRET_KEY);}
export async function getOptionalIdentity():Promise<CourseFlowIdentity|null>{
  if(!authConfigured())return null;
  const {auth,currentUser}=await import("@clerk/nextjs/server");
  const {userId}=await auth();
  if(!userId)return null;
  const user=await currentUser();
  return {userId,email:user?.primaryEmailAddress?.emailAddress??null,provider:"clerk"};
}
