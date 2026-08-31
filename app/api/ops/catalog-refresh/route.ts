import { syncCatalog } from "../../../../lib/data/catalog-sync";
import { evaluateEnrollmentAlerts } from "../../../../lib/watchlists";
import { operationalLog } from "../../../../lib/observability";

export async function POST(request:Request){
  const secret=process.env.COURSEFLOW_REFRESH_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`){operationalLog("warn","catalog_refresh_rejected");return Response.json({error:"Unauthorized"},{status:401});}
  const started=Date.now();operationalLog("info","catalog_refresh_started");
  try{
    const result=await syncCatalog(),alerts=await evaluateEnrollmentAlerts();
    operationalLog("info","catalog_refresh_completed",{durationMs:Date.now()-started,sections:result.distinctSections,courses:result.courses,pages:result.pages,alertsCreated:alerts.created,emailsSent:alerts.emailed});return Response.json({ok:true,generatedAt:result.generatedAt,sourceRows:result.sourceRows,distinctSections:result.distinctSections,courses:result.courses,pages:result.pages,durationMs:result.durationMs,alerts},{headers:{"cache-control":"no-store"}});
  }catch(error){
    operationalLog("error","catalog_refresh_failed",{durationMs:Date.now()-started,error:error instanceof Error?error.message:"Unknown refresh error"});
    return Response.json({ok:false,error:error instanceof Error?error.message:"Unknown refresh error"},{status:502,headers:{"cache-control":"no-store"}});
  }
}
