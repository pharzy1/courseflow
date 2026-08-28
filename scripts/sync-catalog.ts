import { mkdir,writeFile } from "node:fs/promises";
import { courses, enrollmentSnapshots, sections, sources } from "../db/schema";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const endpoint=process.env.BERKELEYTIME_GRAPHQL_URL??"https://berkeleytime.com/api/graphql";
const year=Number(process.env.COURSEFLOW_SYNC_YEAR??2026),semester=process.env.COURSEFLOW_SYNC_SEMESTER??"Fall";
const pageSize=Math.min(Number(process.env.COURSEFLOW_SYNC_PAGE_SIZE??500),500);
const maxPages=Math.max(1,Number(process.env.COURSEFLOW_SYNC_MAX_PAGES??100));
type Instructor={givenName?:string|null;familyName?:string|null};
type SourceMeeting={days?:boolean[];startTime?:string|null;endTime?:string|null;location?:string|null;instructors?:Instructor[]};
type SourceRecord={termId:string;sessionId:string;subject:string;courseNumber:string;number:string;courseId:string;courseTitle?:string|null;courseDescription?:string|null;unitsMin:number;unitsMax:number;level?:string|null;breadthRequirements?:string[];universityRequirements?:string[];enrolledCount?:number;maxEnroll?:number;waitlistedCount?:number;maxWaitlist?:number;primaryComponent?:string|null;meetings?:SourceMeeting[]};
type CatalogRecord={id:string;courseId:string;code:string;subject:string;number:string;title:string;description:string;department:string;unitsMin:number;unitsMax:number;level:string|null;requirements:string[];prerequisites:string[];crossListings:string[];term:string;sectionNumber:string;component:string|null;meetings:Array<{days:string[];startTime:string|null;endTime:string|null;location:string|null;instructors:string[]}>;enrolled:number;capacity:number;waitlisted:number;waitlistCapacity:number;averageGrade:null;provenance:{sourceId:string;sourceName:string;sourceUrl:string;official:boolean;retrievedAt:string;license:null}};
const query=`query Snapshot($year:Int!,$semester:Semester!,$page:Int!,$pageSize:Int!){catalogSearch(year:$year,semester:$semester,page:$page,pageSize:$pageSize,sortBy:RELEVANCE,sortOrder:ASC){totalCount results{year semester termId sessionId subject courseNumber number courseId courseTitle courseDescription unitsMin unitsMax level breadthRequirements universityRequirements enrollmentStatus enrolledCount maxEnroll waitlistedCount maxWaitlist primaryComponent meetings{days startTime endTime location instructors{givenName familyName}}}}}`;
const retrievedAt=new Date().toISOString(),dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

async function fetchPage(page:number){
  const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json","user-agent":"CourseFlow independent student project"},body:JSON.stringify({query,variables:{year,semester,page,pageSize}})});
  if(!response.ok)throw new Error(`Catalog source returned ${response.status}`);
  const payload=await response.json() as {data?:{catalogSearch?:{totalCount:number;results:SourceRecord[]}};errors?:unknown};
  if(!payload.data?.catalogSearch)throw new Error(`Catalog response invalid: ${JSON.stringify(payload.errors)}`);
  return payload.data.catalogSearch;
}

function normalize(item:SourceRecord):CatalogRecord{return {
  id:`${item.termId}-${item.sessionId}-${item.subject}-${item.courseNumber}-${item.number}`,courseId:String(item.courseId),code:`${item.subject} ${item.courseNumber}`,subject:item.subject,number:item.courseNumber,title:item.courseTitle??`${item.subject} ${item.courseNumber}`,description:item.courseDescription??"",department:item.subject,unitsMin:item.unitsMin,unitsMax:item.unitsMax,level:item.level??null,
  requirements:[...(item.breadthRequirements??[]),...(item.universityRequirements??[])],prerequisites:[],crossListings:[],term:`${semester} ${year}`,sectionNumber:item.number,component:item.primaryComponent??null,
  meetings:(item.meetings??[]).map(meeting=>({days:(meeting.days??[]).map((active,index)=>active?dayNames[index]:null).filter((day):day is string=>Boolean(day)),startTime:meeting.startTime??null,endTime:meeting.endTime??null,location:meeting.location??null,instructors:(meeting.instructors??[]).map(instructor=>[instructor.givenName,instructor.familyName].filter(Boolean).join(" "))})),
  enrolled:item.enrolledCount??0,capacity:item.maxEnroll??0,waitlisted:item.waitlistedCount??0,waitlistCapacity:item.maxWaitlist??0,averageGrade:null,
  provenance:{sourceId:"berkeleytime-public-graphql",sourceName:"BerkeleyTime public GraphQL catalog",sourceUrl:endpoint,official:false,retrievedAt,license:null},
};}

const first=await fetchPage(1),records=first.results.map(normalize),effectivePageSize=Math.max(1,first.results.length),pages=Math.min(maxPages,Math.ceil(first.totalCount/effectivePageSize));
for(let page=2;page<=pages;page++){const next=await fetchPage(page);records.push(...next.results.map(normalize));console.log(`Fetched ${records.length}/${first.totalCount} sections`);}
await mkdir("data",{recursive:true});
const canonicalRecords=[...new Map(records.map(record=>[record.id,record])).values()];
await writeFile("data/catalog.snapshot.json",JSON.stringify({generatedAt:retrievedAt,totalAvailable:first.totalCount,distinctSections:canonicalRecords.length,records:canonicalRecords},null,2)+"\n");

if(process.env.DATABASE_URL){
  const db=getDb(),now=new Date(retrievedAt),sourceId="berkeleytime-public-graphql";
  await db.insert(sources).values({id:sourceId,name:"BerkeleyTime public GraphQL catalog",url:endpoint,official:false,retrievedAt:now,license:null,metadata:{term:`${semester} ${year}`,sourceRows:first.totalCount,distinctSections:canonicalRecords.length}}).onConflictDoUpdate({target:sources.id,set:{retrievedAt:now,metadata:{term:`${semester} ${year}`,sourceRows:first.totalCount,distinctSections:canonicalRecords.length}}});
  const uniqueCourses=[...new Map(canonicalRecords.map(record=>[record.courseId,record])).values()];
  const writeBatchSize=50;
  for(let index=0;index<uniqueCourses.length;index+=writeBatchSize){const values=uniqueCourses.slice(index,index+writeBatchSize).map(record=>({id:record.courseId,subject:record.subject,number:record.number,title:record.title,description:record.description,department:record.department,unitsMin:String(record.unitsMin),unitsMax:String(record.unitsMax),level:record.level,prerequisites:record.prerequisites,requirementTags:record.requirements,crossListings:record.crossListings,sourceId,updatedAt:now}));await db.insert(courses).values(values).onConflictDoUpdate({target:courses.id,set:{title:sql`excluded.title`,description:sql`excluded.description`,unitsMin:sql`excluded.units_min`,unitsMax:sql`excluded.units_max`,level:sql`excluded.level`,requirementTags:sql`excluded.requirement_tags`,updatedAt:now}});}
  for(let index=0;index<canonicalRecords.length;index+=writeBatchSize){const batch=canonicalRecords.slice(index,index+writeBatchSize);await db.insert(sections).values(batch.map(record=>({id:record.id,courseId:record.courseId,term:record.term,sectionNumber:record.sectionNumber,component:record.component,instructors:[...new Set(record.meetings.flatMap(meeting=>meeting.instructors))],meetings:record.meetings.map(meeting=>({days:meeting.days,startTime:meeting.startTime,endTime:meeting.endTime,location:meeting.location})),enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,waitlistCapacity:record.waitlistCapacity,sourceId,updatedAt:now}))).onConflictDoUpdate({target:sections.id,set:{component:sql`excluded.component`,instructors:sql`excluded.instructors`,meetings:sql`excluded.meetings`,enrolled:sql`excluded.enrolled`,capacity:sql`excluded.capacity`,waitlisted:sql`excluded.waitlisted`,waitlistCapacity:sql`excluded.waitlist_capacity`,updatedAt:now}});await db.insert(enrollmentSnapshots).values(batch.map(record=>({sectionId:record.id,observedAt:now,enrolled:record.enrolled,capacity:record.capacity,waitlisted:record.waitlisted,sourceId}))).onConflictDoNothing();}
  console.log(`Upserted ${uniqueCourses.length} courses and ${canonicalRecords.length} distinct sections into Neon (${first.totalCount} source rows)`);
}
console.log(`Wrote ${canonicalRecords.length} distinct sections from ${first.totalCount} source rows to data/catalog.snapshot.json`);
