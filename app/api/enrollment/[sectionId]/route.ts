import { asc,eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { courses,enrollmentSnapshots,sections,sources } from "../../../../db/schema";
import { calculateEnrollmentInsights,type EnrollmentHistory } from "../../../../lib/data/enrollment";

export async function GET(_:Request,{params}:{params:Promise<{sectionId:string}>}){
  if(process.env.COURSEFLOW_DATA_MODE!=="neon"||!process.env.DATABASE_URL)return Response.json({error:"Enrollment history requires the live Neon data adapter"},{status:503});
  try{
    const {sectionId}=await params,id=decodeURIComponent(sectionId),db=getDb();
    const [section]=await db.select({id:sections.id,sectionNumber:sections.sectionNumber,term:sections.term,component:sections.component,instructors:sections.instructors,subject:courses.subject,number:courses.number,title:courses.title,sourceName:sources.name,sourceUrl:sources.url,official:sources.official}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).innerJoin(sources,eq(sections.sourceId,sources.id)).where(eq(sections.id,id)).limit(1);
    if(!section)return Response.json({error:"Section not found"},{status:404});
    const rows=await db.select({observedAt:enrollmentSnapshots.observedAt,enrolled:enrollmentSnapshots.enrolled,capacity:enrollmentSnapshots.capacity,waitlisted:enrollmentSnapshots.waitlisted}).from(enrollmentSnapshots).where(eq(enrollmentSnapshots.sectionId,id)).orderBy(asc(enrollmentSnapshots.observedAt)).limit(672);
    const observations=rows.map(row=>({...row,observedAt:row.observedAt.toISOString()}));
    const history:EnrollmentHistory={section:{id:section.id,code:`${section.subject} ${section.number}`,title:section.title,sectionNumber:section.sectionNumber,term:section.term,component:section.component,instructors:section.instructors},observations,insights:calculateEnrollmentInsights(observations),provenance:{sourceName:section.sourceName,sourceUrl:section.sourceUrl,official:section.official,latestObservedAt:observations.at(-1)?.observedAt??new Date(0).toISOString()}};
    return Response.json(history,{headers:{"cache-control":"public, max-age=60, stale-while-revalidate=300"}});
  }catch(error){return Response.json({error:"Enrollment history unavailable",detail:error instanceof Error?error.message:"Unknown error"},{status:503});}
}
