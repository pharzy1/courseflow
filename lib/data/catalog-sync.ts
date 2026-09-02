import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { courses,enrollmentSnapshots,sections,sources } from "../../db/schema";
import type { CatalogRecord } from "./types";
import { BerkeleyTimeCatalogAdapter } from "./sources/berkeleytime-catalog";
import { HybridCatalogAdapter } from "./sources/hybrid-catalog";
import type { CatalogIngestionAdapter,SourceCatalogRecord } from "./sources/catalog-source";

export type CatalogSyncResult={generatedAt:string;sourceRows:number;distinctSections:number;courses:number;pages:number;durationMs:number;records:CatalogRecord[]};
const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export async function syncCatalog(options:{writeDatabase?:boolean;adapter?:CatalogIngestionAdapter}={}):Promise<CatalogSyncResult>{
  const adapter=options.adapter??(process.env.COURSEFLOW_CATALOG_SOURCE==="hybrid"?new HybridCatalogAdapter():new BerkeleyTimeCatalogAdapter()),source=adapter.descriptor;
  const year=Number(process.env.COURSEFLOW_SYNC_YEAR??2026),semester=process.env.COURSEFLOW_SYNC_SEMESTER??"Fall";
  const termId=process.env.COURSEFLOW_SYNC_TERM_ID??(year===2026&&semester==="Fall"?"2268":`${year}-${semester}`);
  const pageSize=Math.min(Number(process.env.COURSEFLOW_SYNC_PAGE_SIZE??500),500);
  const maxPages=Math.max(1,Number(process.env.COURSEFLOW_SYNC_MAX_PAGES??100));
  const timeout=Math.max(5_000,Number(process.env.COURSEFLOW_SYNC_TIMEOUT_MS??20_000));
  const started=Date.now(),generatedAt=new Date().toISOString();
  const fetchPage=(page:number)=>adapter.fetchPage({year,semester,page,pageSize,timeoutMs:timeout});
  const normalize=(item:SourceCatalogRecord):CatalogRecord=>({id:`${item.termId??termId}-${item.sessionId}-${item.subject}-${item.courseNumber}-${item.number}`,courseId:item.courseId?String(item.courseId):`${source.id}-${item.subject}-${item.courseNumber}`,code:`${item.subject} ${item.courseNumber}`,subject:item.subject,number:item.courseNumber,title:item.courseTitle??item.title??`${item.subject} ${item.courseNumber}`,description:item.courseDescription??"",department:item.subject,unitsMin:item.unitsMin,unitsMax:item.unitsMax,level:item.level??null,requirements:[...(item.breadthRequirements??[]),...(item.universityRequirements??[])],prerequisites:[],crossListings:[],term:`${semester} ${year}`,sectionNumber:item.number,component:item.primaryComponent??null,meetings:(item.meetings??[]).map(meeting=>({days:(meeting.days??[]).map((active,index)=>active?dayNames[index]:null).filter((day):day is string=>Boolean(day)),startTime:meeting.startTime??null,endTime:meeting.endTime??null,location:meeting.location??null,instructors:(meeting.instructors??[]).map(instructor=>[instructor.givenName,instructor.familyName].filter(Boolean).join(" "))})),enrolled:item.enrolledCount??0,capacity:item.maxEnroll??0,waitlisted:item.waitlistedCount??0,waitlistCapacity:item.maxWaitlist??0,averageGrade:item.allTimeAverageGrade??null,medianGrade:null,gradeSampleSize:0,provenance:{sourceId:source.id,sourceName:source.name,sourceUrl:source.url,official:source.official,retrievedAt:generatedAt,license:source.license}});
  const first=await fetchPage(1),records=first.results.map(normalize),effectivePageSize=Math.max(1,first.results.length),pages=Math.min(maxPages,Math.ceil(first.totalCount/effectivePageSize));
  for(let page=2;page<=pages;page++)records.push(...(await fetchPage(page)).results.map(normalize));
  const canonical=[...new Map(records.map(record=>[record.id,record])).values()];
  let uniqueCourses=[...new Map(canonical.map(record=>[record.courseId,record])).values()];
  if(options.writeDatabase!==false){
    const db=getDb(),now=new Date(generatedAt),sourceId=source.id,batchSize=50;
    await db.insert(sources).values({id:sourceId,name:source.name,url:source.url,official:source.official,retrievedAt:now,license:source.license,metadata:{kind:source.kind}}).onConflictDoNothing();
    const existingCourses=await db.select({id:courses.id,subject:courses.subject,number:courses.number}).from(courses);
    const existingIds=new Map(existingCourses.map(course=>[`${course.subject}\u0000${course.number}`,course.id]));
    for(const record of canonical)record.courseId=existingIds.get(`${record.subject}\u0000${record.number}`)??record.courseId;
    uniqueCourses=[...new Map(canonical.map(record=>[record.courseId,record])).values()];
    for(let index=0;index<uniqueCourses.length;index+=batchSize){const values=uniqueCourses.slice(index,index+batchSize).map(record=>({id:record.courseId,subject:record.subject,number:record.number,title:record.title,description:record.description,department:record.department,unitsMin:String(record.unitsMin),unitsMax:String(record.unitsMax),level:record.level,prerequisites:record.prerequisites,requirementTags:record.requirements,crossListings:record.crossListings,sourceId,updatedAt:now}));await db.insert(courses).values(values).onConflictDoUpdate({target:courses.id,set:{title:sql`excluded.title`,description:sql`excluded.description`,unitsMin:sql`excluded.units_min`,unitsMax:sql`excluded.units_max`,level:sql`excluded.level`,requirementTags:sql`excluded.requirement_tags`,updatedAt:now}});}
    for(let index=0;index<canonical.length;index+=batchSize){const batch=canonical.slice(index,index+batchSize);await db.insert(sections).values(batch.map(record=>({id:record.id,courseId:record.courseId,term:record.term,sectionNumber:record.sectionNumber,component:record.component,instructors:[...new Set(record.meetings.flatMap(meeting=>meeting.instructors))],meetings:record.meetings.map(meeting=>({days:meeting.days,startTime:meeting.startTime,endTime:meeting.endTime,location:meeting.location})),enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,waitlistCapacity:record.waitlistCapacity,sourceId,updatedAt:now}))).onConflictDoUpdate({target:sections.id,set:{component:sql`excluded.component`,instructors:sql`excluded.instructors`,meetings:sql`excluded.meetings`,enrolled:sql`excluded.enrolled`,capacity:sql`excluded.capacity`,waitlisted:sql`excluded.waitlisted`,waitlistCapacity:sql`excluded.waitlist_capacity`,updatedAt:now}});await db.insert(enrollmentSnapshots).values(batch.map(record=>({sectionId:record.id,observedAt:now,enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,sourceId}))).onConflictDoNothing();}
    await db.update(sources).set({retrievedAt:now,metadata:{term:`${semester} ${year}`,sourceRows:first.totalCount,distinctSections:canonical.length,pages,lastSuccessfulSync:generatedAt,durationMs:Date.now()-started}}).where(sql`${sources.id}=${sourceId}`);
  }
  return {generatedAt,sourceRows:first.totalCount,distinctSections:canonical.length,courses:uniqueCourses.length,pages,durationMs:Date.now()-started,records:canonical};
}
