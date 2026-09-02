import assert from "node:assert/strict";
import test from "node:test";
import { parseCoursedogMetadata } from "../../lib/data/sources/coursedog-metadata";
import { HybridCatalogAdapter } from "../../lib/data/sources/hybrid-catalog";

test("official Coursedog CSV parser preserves quoted course metadata",()=>{
  const csv='"Subject","Course Number","Department(s)","Course Title","Credits - Units - Minimum Units","Credits - Units - Maximum Units","Course Description","Cross-Listed Course(s)"\n"DATA","C100","Data Science","Principles, Techniques & Data Science","4","4","Learn ""carefully"", at scale.","STAT C100, COMPSCI C100"\n';
  const course=parseCoursedogMetadata(csv).get("DATA\u0000C100");
  assert.equal(course?.title,"Principles, Techniques & Data Science");
  assert.equal(course?.description,'Learn "carefully", at scale.');
  assert.deepEqual(course?.crossListings,["STAT C100","COMPSCI C100"]);
  assert.equal(course?.unitsMax,4);
});

test("hybrid adapter overlays official metadata without changing section facts",async()=>{
  const sections={descriptor:{id:"fallback",name:"Fallback",url:"https://example.com",official:false,license:null,kind:"transitional" as const},async fetchPage(){return{totalCount:1,results:[{sessionId:"1",subject:"DATA",courseNumber:"C100",number:"001",courseTitle:"Old title",courseDescription:"Old description",unitsMin:4,unitsMax:4,enrolledCount:25,maxEnroll:30}]};}};
  const metadata={source:{name:"Official",url:"https://example.edu",official:true},async fetchAll(){return parseCoursedogMetadata('"Subject","Course Number","Department(s)","Course Title","Credits - Units - Minimum Units","Credits - Units - Maximum Units","Course Description","Cross-Listed Course(s)"\n"DATA","C100","Data Science","Official title","1","5","Official description","-"\n');}};
  const page=await new HybridCatalogAdapter(sections,metadata).fetchPage({year:2026,semester:"Fall",page:1,pageSize:50,timeoutMs:5000});
  assert.equal(page.results[0].courseTitle,"Official title");
  assert.equal(page.results[0].courseDescription,"Official description");
  assert.equal(page.results[0].unitsMin,4);
  assert.equal(page.results[0].enrolledCount,25);
});
