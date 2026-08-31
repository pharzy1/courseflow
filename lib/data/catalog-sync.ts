import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { courses,enrollmentSnapshots,sections,sources } from "../../db/schema";
import type { CatalogRecord } from "./types";

type Instructor={givenName?:string|null;familyName?:string|null};
type SourceMeeting={days?:boolean[];startTime?:string|null;endTime?:string|null;location?:string|null;instructors?:Instructor[]};
type SourceRecord={termId?:string;sessionId:string;subject:string;courseNumber:string;number:string;courseId?:string;title?:string|null;courseTitle?:string|null;courseDescription?:string|null;unitsMin:number;unitsMax:number;level?:string|null;breadthRequirements?:string[];universityRequirements?:string[];enrolledCount?:number;maxEnroll?:number;waitlistedCount?:number;maxWaitlist?:number;primaryComponent?:string|null;meetings?:SourceMeeting[]};
type SourcePage={totalCount:number;results:SourceRecord[]};
export type CatalogSyncResult={generatedAt:string;sourceRows:number;distinctSections:number;courses:number;pages:number;durationMs:number;records:CatalogRecord[]};

// BerkeleyTime's reviewed public GetCatalogSearch operation. The public gateway
// rejects arbitrary GraphQL source and accepts only this stable operation ID.
const catalogOperationId="1ca3cf6917e03729d6cddb6fdb92a508daa862d82c0ff3c29c06686bb8339cd8";
const dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export async function syncCatalog(options:{writeDatabase?:boolean}={}):Promise<CatalogSyncResult>{
  const endpoint=process.env.BERKELEYTIME_GRAPHQL_URL??"https://berkeleytime.com/api/graphql";
  const year=Number(process.env.COURSEFLOW_SYNC_YEAR??2026),semester=process.env.COURSEFLOW_SYNC_SEMESTER??"Fall";
  const termId=process.env.COURSEFLOW_SYNC_TERM_ID??(year===2026&&semester==="Fall"?"2268":`${year}-${semester}`);
  const pageSize=Math.min(Number(process.env.COURSEFLOW_SYNC_PAGE_SIZE??500),500);
  const maxPages=Math.max(1,Number(process.env.COURSEFLOW_SYNC_MAX_PAGES??100));
  const timeout=Math.max(5_000,Number(process.env.COURSEFLOW_SYNC_TIMEOUT_MS??20_000));
  const started=Date.now(),generatedAt=new Date().toISOString();
  async function fetchPage(page:number):Promise<SourcePage>{
    let lastError:unknown;
    for(let attempt=1;attempt<=3;attempt++)try{
      const response=await fetch(endpoint,{method:"POST",signal:AbortSignal.timeout(timeout),headers:{accept:"application/json","content-type":"application/json","user-agent":"CourseFlow/1.0 (+https://github.com/pharzy1/courseflow)"},body:JSON.stringify({id:catalogOperationId,variables:{year,semester,sortBy:"RELEVANCE",sortOrder:"ASC",page,pageSize,semanticSearch:false}})});
      if(!response.ok){const detail=(await response.text()).slice(0,500);throw new Error(`Catalog source returned ${response.status}: ${detail}`);}
      const payload=await response.json() as {data?:{catalogSearch?:SourcePage};errors?:unknown};
      if(!payload.data?.catalogSearch)throw new Error(`Catalog response invalid: ${JSON.stringify(payload.errors)}`);
      return payload.data.catalogSearch;
    }catch(error){lastError=error;if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*750));}
    throw lastError instanceof Error?lastError:new Error(`Catalog page ${page} failed`);
  }
  const normalize=(item:SourceRecord):CatalogRecord=>({id:`${item.termId??termId}-${item.sessionId}-${item.subject}-${item.courseNumber}-${item.number}`,courseId:item.courseId?String(item.courseId):`bt-${item.subject}-${item.courseNumber}`,code:`${item.subject} ${item.courseNumber}`,subject:item.subject,number:item.courseNumber,title:item.courseTitle??item.title??`${item.subject} ${item.courseNumber}`,description:item.courseDescription??"",department:item.subject,unitsMin:item.unitsMin,unitsMax:item.unitsMax,level:item.level??null,requirements:[...(item.breadthRequirements??[]),...(item.universityRequirements??[])],prerequisites:[],crossListings:[],term:`${semester} ${year}`,sectionNumber:item.number,component:item.primaryComponent??null,meetings:(item.meetings??[]).map(meeting=>({days:(meeting.days??[]).map((active,index)=>active?dayNames[index]:null).filter((day):day is string=>Boolean(day)),startTime:meeting.startTime??null,endTime:meeting.endTime??null,location:meeting.location??null,instructors:(meeting.instructors??[]).map(instructor=>[instructor.givenName,instructor.familyName].filter(Boolean).join(" "))})),enrolled:item.enrolledCount??0,capacity:item.maxEnroll??0,waitlisted:item.waitlistedCount??0,waitlistCapacity:item.maxWaitlist??0,averageGrade:null,provenance:{sourceId:"berkeleytime-public-graphql",sourceName:"BerkeleyTime public GraphQL catalog",sourceUrl:endpoint,official:false,retrievedAt:generatedAt,license:null}});
  const first=await fetchPage(1),records=first.results.map(normalize),effectivePageSize=Math.max(1,first.results.length),pages=Math.min(maxPages,Math.ceil(first.totalCount/effectivePageSize));
  for(let page=2;page<=pages;page++)records.push(...(await fetchPage(page)).results.map(normalize));
  const canonical=[...new Map(records.map(record=>[record.id,record])).values()];
  const uniqueCourses=[...new Map(canonical.map(record=>[record.courseId,record])).values()];
  if(options.writeDatabase!==false){
    const db=getDb(),now=new Date(generatedAt),sourceId="berkeleytime-public-graphql",batchSize=50;
    await db.insert(sources).values({id:sourceId,name:"BerkeleyTime public GraphQL catalog",url:endpoint,official:false,retrievedAt:now,license:null,metadata:{}}).onConflictDoNothing();
    for(let index=0;index<uniqueCourses.length;index+=batchSize){const values=uniqueCourses.slice(index,index+batchSize).map(record=>({id:record.courseId,subject:record.subject,number:record.number,title:record.title,description:record.description,department:record.department,unitsMin:String(record.unitsMin),unitsMax:String(record.unitsMax),level:record.level,prerequisites:record.prerequisites,requirementTags:record.requirements,crossListings:record.crossListings,sourceId,updatedAt:now}));await db.insert(courses).values(values).onConflictDoUpdate({target:courses.id,set:{title:sql`excluded.title`,description:sql`excluded.description`,unitsMin:sql`excluded.units_min`,unitsMax:sql`excluded.units_max`,level:sql`excluded.level`,requirementTags:sql`excluded.requirement_tags`,updatedAt:now}});}
    for(let index=0;index<canonical.length;index+=batchSize){const batch=canonical.slice(index,index+batchSize);await db.insert(sections).values(batch.map(record=>({id:record.id,courseId:record.courseId,term:record.term,sectionNumber:record.sectionNumber,component:record.component,instructors:[...new Set(record.meetings.flatMap(meeting=>meeting.instructors))],meetings:record.meetings.map(meeting=>({days:meeting.days,startTime:meeting.startTime,endTime:meeting.endTime,location:meeting.location})),enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,waitlistCapacity:record.waitlistCapacity,sourceId,updatedAt:now}))).onConflictDoUpdate({target:sections.id,set:{component:sql`excluded.component`,instructors:sql`excluded.instructors`,meetings:sql`excluded.meetings`,enrolled:sql`excluded.enrolled`,capacity:sql`excluded.capacity`,waitlisted:sql`excluded.waitlisted`,waitlistCapacity:sql`excluded.waitlist_capacity`,updatedAt:now}});await db.insert(enrollmentSnapshots).values(batch.map(record=>({sectionId:record.id,observedAt:now,enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,sourceId}))).onConflictDoNothing();}
    await db.update(sources).set({retrievedAt:now,metadata:{term:`${semester} ${year}`,sourceRows:first.totalCount,distinctSections:canonical.length,pages,lastSuccessfulSync:generatedAt,durationMs:Date.now()-started}}).where(sql`${sources.id}=${sourceId}`);
  }
  return {generatedAt,sourceRows:first.totalCount,distinctSections:canonical.length,courses:uniqueCourses.length,pages,durationMs:Date.now()-started,records:canonical};
}
