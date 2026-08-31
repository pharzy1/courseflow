import { getOptionalIdentity } from "../../../lib/auth";
import { parseRoadmap } from "../../../lib/roadmap";
import { loadRoadmap,saveRoadmap } from "../../../lib/roadmaps";
const headers={"cache-control":"private, no-store","vary":"Cookie, Authorization"};
export async function GET(){const identity=await getOptionalIdentity();if(!identity)return Response.json({error:"Authentication required"},{status:401,headers});try{return Response.json({roadmap:await loadRoadmap(identity)},{headers});}catch(error){return Response.json({error:"Roadmap unavailable",detail:error instanceof Error?error.message:"Unknown error"},{status:503,headers});}}
export async function PUT(request:Request){const identity=await getOptionalIdentity();if(!identity)return Response.json({error:"Authentication required"},{status:401,headers});try{return Response.json({roadmap:await saveRoadmap(identity,parseRoadmap(await request.json()))},{headers});}catch(error){return Response.json({error:"Roadmap could not be saved",detail:error instanceof Error?error.message:"Unknown error"},{status:400,headers});}}
