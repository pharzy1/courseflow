import { mkdir,writeFile } from "node:fs/promises";

const endpoint=process.env.BERKELEYTIME_GRAPHQL_URL??"https://berkeleytime.com/api/graphql";
const year=Number(process.env.COURSEFLOW_SYNC_YEAR??2026),semester=process.env.COURSEFLOW_SYNC_SEMESTER??"Fall";
const pageSize=Math.min(Number(process.env.COURSEFLOW_SYNC_PAGE_SIZE??100),500),page=Number(process.env.COURSEFLOW_SYNC_PAGE??1);
type Instructor={givenName?:string|null;familyName?:string|null};
type SourceMeeting={days?:boolean[];startTime?:string|null;endTime?:string|null;location?:string|null;instructors?:Instructor[]};
type SourceRecord={termId:string;sessionId:string;subject:string;courseNumber:string;number:string;courseId:string;courseTitle?:string|null;courseDescription?:string|null;unitsMin:number;unitsMax:number;level?:string|null;breadthRequirements?:string[];universityRequirements?:string[];enrolledCount?:number;maxEnroll?:number;waitlistedCount?:number;maxWaitlist?:number;primaryComponent?:string|null;meetings?:SourceMeeting[]};
const query=`query Snapshot($year:Int!,$semester:Semester!,$page:Int!,$pageSize:Int!){catalogSearch(year:$year,semester:$semester,page:$page,pageSize:$pageSize,sortBy:RELEVANCE,sortOrder:ASC){totalCount results{year semester termId sessionId subject courseNumber number courseId courseTitle courseDescription unitsMin unitsMax level breadthRequirements universityRequirements enrollmentStatus enrolledCount maxEnroll waitlistedCount maxWaitlist primaryComponent meetings{days startTime endTime location instructors{givenName familyName}}}}}`;
const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json","user-agent":"CourseFlow independent student project"},body:JSON.stringify({query,variables:{year,semester,page,pageSize}})});
if(!response.ok)throw new Error(`Catalog source returned ${response.status}`);
const payload=await response.json() as {data?:{catalogSearch?:{totalCount:number;results:SourceRecord[]}};errors?:unknown};
if(!payload.data?.catalogSearch)throw new Error(`Catalog response invalid: ${JSON.stringify(payload.errors)}`);
const retrievedAt=new Date().toISOString(),dayNames=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const records=payload.data.catalogSearch.results.map(item=>({
  id:`${item.termId}-${item.sessionId}-${item.subject}-${item.courseNumber}-${item.number}`,courseId:String(item.courseId),code:`${item.subject} ${item.courseNumber}`,subject:item.subject,number:item.courseNumber,title:item.courseTitle??`${item.subject} ${item.courseNumber}`,description:item.courseDescription??"",department:item.subject,unitsMin:item.unitsMin,unitsMax:item.unitsMax,level:item.level??null,
  requirements:[...(item.breadthRequirements??[]),...(item.universityRequirements??[])],prerequisites:[],crossListings:[],term:`${semester} ${year}`,sectionNumber:item.number,component:item.primaryComponent??null,
  meetings:(item.meetings??[]).map(meeting=>({days:(meeting.days??[]).map((active,index)=>active?dayNames[index]:null).filter((day):day is string=>Boolean(day)),startTime:meeting.startTime??null,endTime:meeting.endTime??null,location:meeting.location??null,instructors:(meeting.instructors??[]).map(instructor=>[instructor.givenName,instructor.familyName].filter(Boolean).join(" "))})),
  enrolled:item.enrolledCount??0,capacity:item.maxEnroll??0,waitlisted:item.waitlistedCount??0,waitlistCapacity:item.maxWaitlist??0,averageGrade:null,
  provenance:{sourceId:"berkeleytime-public-graphql",sourceName:"BerkeleyTime public GraphQL catalog",sourceUrl:endpoint,official:false,retrievedAt,license:null},
}));
await mkdir("data",{recursive:true});
await writeFile("data/catalog.snapshot.json",JSON.stringify({generatedAt:retrievedAt,totalAvailable:payload.data.catalogSearch.totalCount,records},null,2)+"\n");
console.log(`Wrote ${records.length} of ${payload.data.catalogSearch.totalCount} real catalog sections to data/catalog.snapshot.json`);
