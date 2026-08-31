import { syncCatalog } from "../../../../lib/data/catalog-sync";

export async function POST(request:Request){
  const secret=process.env.COURSEFLOW_REFRESH_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`)return Response.json({error:"Unauthorized"},{status:401});
  try{
    const result=await syncCatalog();
    return Response.json({ok:true,generatedAt:result.generatedAt,sourceRows:result.sourceRows,distinctSections:result.distinctSections,courses:result.courses,pages:result.pages,durationMs:result.durationMs},{headers:{"cache-control":"no-store"}});
  }catch(error){
    console.error("Catalog refresh failed",error);
    return Response.json({ok:false,error:error instanceof Error?error.message:"Unknown refresh error"},{status:502,headers:{"cache-control":"no-store"}});
  }
}
