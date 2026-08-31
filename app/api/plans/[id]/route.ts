import { getOptionalIdentity } from "../../../../lib/auth";
import { deletePlan,parsePlanName,parsePlanPayload,updatePlan } from "../../../../lib/plans";

const privateHeaders={"cache-control":"private, no-store","vary":"Cookie, Authorization"};

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const identity=await getOptionalIdentity();
  if(!identity)return Response.json({error:"Authentication required"},{status:401,headers:privateHeaders});
  try{
    const {id}=await params,body=await request.json() as {name?:unknown;payload?:unknown};
    const changes:{name?:string;payload?:ReturnType<typeof parsePlanPayload>}={};
    if(body.name!==undefined)changes.name=parsePlanName(body.name);
    if(body.payload!==undefined)changes.payload=parsePlanPayload(body.payload);
    if(!changes.name&&!changes.payload)throw new Error("No plan changes supplied");
    const plan=await updatePlan(identity,decodeURIComponent(id),changes);
    return plan?Response.json({plan},{headers:privateHeaders}):Response.json({error:"Plan not found"},{status:404,headers:privateHeaders});
  }catch(error){return Response.json({error:"Plan could not be updated",detail:error instanceof Error?error.message:"Unknown error"},{status:400,headers:privateHeaders});}
}

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  const identity=await getOptionalIdentity();
  if(!identity)return Response.json({error:"Authentication required"},{status:401,headers:privateHeaders});
  const {id}=await params;
  return await deletePlan(identity,decodeURIComponent(id))?new Response(null,{status:204,headers:privateHeaders}):Response.json({error:"Plan not found"},{status:404,headers:privateHeaders});
}
