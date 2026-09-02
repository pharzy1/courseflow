import assert from "node:assert/strict";
import test from "node:test";
import { compareCatalogSources } from "../../lib/data/source-validation";
import type { CatalogRecord } from "../../lib/data/types";

const record=(id:string,overrides:Partial<CatalogRecord>={}):CatalogRecord=>({id,courseId:id,code:"COMPSCI 61B",subject:"COMPSCI",number:"61B",title:"Data Structures",description:"",department:"COMPSCI",unitsMin:4,unitsMax:4,level:"Upper Division",requirements:[],prerequisites:[],crossListings:[],term:"Fall 2026",sectionNumber:"001",component:"LEC",meetings:[{days:["Monday"],startTime:"10:00",endTime:"11:00",location:null,instructors:[]}],enrolled:100,capacity:200,waitlisted:0,waitlistCapacity:0,averageGrade:null,medianGrade:null,gradeSampleSize:0,provenance:{sourceId:"source",sourceName:"Source",sourceUrl:"https://example.edu",official:true,retrievedAt:"2026-09-01T00:00:00Z",license:null},...overrides});

test("source validation reports coverage and field-level agreement",()=>{
  const baseline=[record("a"),record("b")],candidate=[record("a"),record("b",{capacity:190})];
  const report=compareCatalogSources(baseline,candidate);
  assert.equal(report.coverage,1);
  assert.equal(report.fieldAgreement.title,1);
  assert.equal(report.fieldAgreement.enrollment,.5);
});

test("source validation names missing canonical sections",()=>{
  const report=compareCatalogSources([record("a"),record("b")],[record("a")]);
  assert.equal(report.coverage,.5);
  assert.deepEqual(report.missingSectionIds,["b"]);
});
