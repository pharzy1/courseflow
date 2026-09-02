import { syncCatalog } from "../../../../lib/data/catalog-sync";
import { evaluateEnrollmentAlerts } from "../../../../lib/watchlists";
import { operationalLog } from "../../../../lib/observability";
import { syncAcademicProgram,ensureAcademicSchema } from "../../../../lib/academic";
import { getDb } from "../../../../db";
import { refreshRuns } from "../../../../db/schema";
import { randomUUID } from "node:crypto";

export async function POST(request:Request){
  const secret=process.env.COURSEFLOW_REFRESH_SECRET;
  if(!secret||request.headers.get("authorization")!==`Bearer ${secret}`){operationalLog("warn","catalog_refresh_rejected");return Response.json({error:"Unauthorized"},{status:401});}
  const started=Date.now(),startedAt=new Date();operationalLog("info","catalog_refresh_started");
  try{
    const result=await syncCatalog(),alerts=await evaluateEnrollmentAlerts(),academic=await syncAcademicProgram(),durationMs=Date.now()-started,quality=result.quality?` · official metadata ${Math.round(result.quality.coverage*1000)/10}% (${result.quality.matchedCourses}/${result.quality.sampleSize})`:"";await ensureAcademicSchema();await getDb().insert(refreshRuns).values({id:randomUUID(),kind:"production_ingestion",status:"success",startedAt,finishedAt:new Date(),durationMs,records:result.distinctSections,detail:`${result.source}${quality} · ${academic.name} ${academic.degree} verified`});
    operationalLog("info","catalog_refresh_completed",{durationMs,source:result.source,quality:result.quality,sections:result.distinctSections,courses:result.courses,pages:result.pages,alertsCreated:alerts.created,emailsSent:alerts.emailed,academicProgram:academic.id});return Response.json({ok:true,generatedAt:result.generatedAt,source:result.source,quality:result.quality,sourceRows:result.sourceRows,distinctSections:result.distinctSections,courses:result.courses,pages:result.pages,durationMs:result.durationMs,alerts,academic:{id:academic.id,retrievedAt:academic.retrievedAt}},{headers:{"cache-control":"no-store"}});
  }catch(error){
    const durationMs=Date.now()-started,detail=error instanceof Error?error.message:"Unknown refresh error";operationalLog("error","catalog_refresh_failed",{durationMs,error:detail});try{await ensureAcademicSchema();await getDb().insert(refreshRuns).values({id:randomUUID(),kind:"production_ingestion",status:"failed",startedAt,finishedAt:new Date(),durationMs,records:0,detail:detail.slice(0,500)});}catch{}
    return Response.json({ok:false,error:error instanceof Error?error.message:"Unknown refresh error"},{status:502,headers:{"cache-control":"no-store"}});
  }
}
