import { getGradeDetail } from "../../../../lib/grades";

export async function GET(request:Request,{params}:{params:Promise<{courseId:string}>}){
  if(process.env.COURSEFLOW_DATA_MODE!=="neon"||!process.env.DATABASE_URL)return Response.json({error:"Grade distributions require the production data adapter"},{status:503});
  const {courseId}=await params,url=new URL(request.url);
  try{const detail=await getGradeDetail(decodeURIComponent(courseId),{term:url.searchParams.get("term")??undefined,instructor:url.searchParams.get("instructor")??undefined});return detail?Response.json(detail,{headers:{"cache-control":"public, max-age=3600, stale-while-revalidate=86400"}}):Response.json({error:"Course not found"},{status:404});}
  catch(error){return Response.json({error:"Grade distribution unavailable",detail:error instanceof Error?error.message:"Unknown error"},{status:503});}
}
