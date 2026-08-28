import { getOptionalIdentity } from "../../../lib/auth";
import { listPlans,parsePlanPayload,savePlan } from "../../../lib/plans";

const privateHeaders={"cache-control":"private, no-store","vary":"Cookie, Authorization"};

export async function GET(){
  const identity=await getOptionalIdentity();
  if(!identity)return Response.json({error:"Authentication required"},{status:401,headers:privateHeaders});
  try{return Response.json({plans:await listPlans(identity)},{headers:privateHeaders});}
  catch(error){return Response.json({error:"Cloud plans unavailable",detail:error instanceof Error?error.message:"Unknown error"},{status:503,headers:privateHeaders});}
}

export async function POST(request:Request){
  const identity=await getOptionalIdentity();
  if(!identity)return Response.json({error:"Authentication required"},{status:401,headers:privateHeaders});
  try{
    const body=await request.json() as {name?:unknown;payload?:unknown};
    const name=typeof body.name==="string"&&body.name.trim()?body.name.trim().slice(0,80):"My Fall 2026 plan";
    return Response.json({plan:await savePlan(identity,name,parsePlanPayload(body.payload))},{headers:privateHeaders});
  }catch(error){return Response.json({error:"Plan could not be saved",detail:error instanceof Error?error.message:"Unknown error"},{status:400,headers:privateHeaders});}
}
