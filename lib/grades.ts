import { and,eq,sql } from "drizzle-orm";
import { getDb } from "../db";
import { courses,gradeDistributions,sources } from "../db/schema";
import { BerkeleyTimeGradeAdapter,type GradeQuery,type GradeSummary } from "./data/sources/berkeleytime-grades";
import { letterGradeOrder,letterGradePoints,type GradeDetail } from "./grade-types";

export function summarizeGrades(counts:Record<string,number>,reportedMean:number|null=null){
  const sampleSize=letterGradeOrder.reduce((sum,letter)=>sum+(counts[letter]??0),0);
  const mean=reportedMean??(sampleSize?letterGradeOrder.reduce((sum,letter)=>sum+(counts[letter]??0)*(letterGradePoints[letter]??0),0)/sampleSize:null);
  let median:string|null=null,seen=0;const midpoint=sampleSize/2;
  for(const letter of letterGradeOrder){seen+=counts[letter]??0;if(seen>=midpoint&&sampleSize){median=letter;break;}}
  return {sampleSize,mean,median};
}

const adapter=new BerkeleyTimeGradeAdapter();
const sourceId="berkeleytime-public-grades";

async function ensureGradeSource(retrievedAt:Date){
  await getDb().insert(sources).values({id:sourceId,name:"BerkeleyTime public grade distributions",url:adapter.endpoint,official:false,retrievedAt,license:null,metadata:{operation:"persisted public GraphQL"}}).onConflictDoUpdate({target:sources.id,set:{retrievedAt,metadata:{operation:"persisted public GraphQL"}}});
}

async function persistSummary(courseId:string,summary:GradeSummary,term:string,instructor:string,updatedAt:Date){
  const stats=summarizeGrades(summary.counts,summary.mean);
  const id=`${courseId}:${term}:${instructor}`;
  await getDb().insert(gradeDistributions).values({id,courseId,term,instructor,counts:summary.counts,mean:stats.mean===null?null:String(stats.mean),median:stats.median,sampleSize:stats.sampleSize,sourceId,updatedAt}).onConflictDoUpdate({target:gradeDistributions.id,set:{counts:summary.counts,mean:stats.mean===null?null:String(stats.mean),median:stats.median,sampleSize:stats.sampleSize,sourceId,updatedAt}});
  return stats;
}

export async function syncGradeSummaries(){
  const summaries=await adapter.listCourseSummaries(),db=getDb(),updatedAt=new Date();
  await ensureGradeSource(updatedAt);
  const courseRows=await db.select({id:courses.id,subject:courses.subject,number:courses.number}).from(courses);
  const ids=new Map(courseRows.map(course=>[`${course.subject}\u0000${course.number}`,course.id]));
  let persisted=0;
  for(let index=0;index<summaries.length;index+=50){
    const batch=summaries.slice(index,index+50).flatMap(summary=>{const courseId=ids.get(`${summary.subject}\u0000${summary.number}`);if(!courseId)return[];const stats=summarizeGrades(summary.counts,summary.mean);persisted++;return[{id:`${courseId}:All terms:All instructors`,courseId,term:"All terms",instructor:"All instructors",counts:summary.counts,mean:stats.mean===null?null:String(stats.mean),median:stats.median,sampleSize:stats.sampleSize,sourceId,updatedAt}];});
    if(batch.length)await db.insert(gradeDistributions).values(batch).onConflictDoUpdate({target:gradeDistributions.id,set:{counts:sql`excluded.counts`,mean:sql`excluded.mean`,median:sql`excluded.median`,sampleSize:sql`excluded.sample_size`,sourceId:sql`excluded.source_id`,updatedAt:sql`excluded.updated_at`}});
  }
  return {received:summaries.length,persisted,updatedAt:updatedAt.toISOString()};
}

export async function getGradeDetail(courseId:string,query:GradeQuery):Promise<GradeDetail|null>{
  const db=getDb(),[course]=await db.select().from(courses).where(eq(courses.id,courseId)).limit(1);if(!course)return null;
  const metadata=await adapter.getCourseOptions(course.subject,course.number);
  const term=metadata.terms.find(option=>option.value===query.term),instructor=metadata.instructors.find(option=>option.value===query.instructor);
  const normalizedQuery:GradeQuery={term:term?.value,instructor:instructor?.value};
  const termLabel=term?.label??"All terms",instructorLabel=instructor?.label??"All instructors";
  const [cached]=await db.select().from(gradeDistributions).where(and(eq(gradeDistributions.courseId,courseId),eq(gradeDistributions.term,termLabel),eq(gradeDistributions.instructor,instructorLabel))).limit(1);
  const fresh=cached&&Date.now()-cached.updatedAt.getTime()<24*60*60*1000;
  let counts=cached?.counts??{},mean=cached?.mean===null||cached?.mean===undefined?null:Number(cached.mean),median=cached?.median??null,sampleSize=cached?.sampleSize??0,updatedAt=cached?.updatedAt??new Date(0);
  if(!fresh){const summary=await adapter.getDistribution({subject:course.subject,courseId:course.id,...normalizedQuery});updatedAt=new Date();await ensureGradeSource(updatedAt);const stats=await persistSummary(course.id,summary,termLabel,instructorLabel,updatedAt);counts=summary.counts;mean=stats.mean;median=stats.median;sampleSize=stats.sampleSize;}
  return {course:{id:course.id,code:`${course.subject} ${course.number}`,title:course.title},term:termLabel,instructor:instructorLabel,counts,mean,median,sampleSize,updatedAt:updatedAt.toISOString(),provenance:{sourceName:"BerkeleyTime public grade distributions",sourceUrl:adapter.endpoint,official:false},options:metadata};
}
