import assert from "node:assert/strict";
import test from "node:test";
import { blocksFor, findConflicts, rankVariants, scoreSchedule, searchCourses } from "../../lib/courseflow";

const defaultCourses=["COMPSCI 61B","DATA C100","STAT 134","DES INV 25"];

test("search supports aliases, semantic keywords, empty results, and filters",()=>{
  assert.deepEqual(searchCourses("CS 61B","All courses","All departments","Best match").map(c=>c.code),["COMPSCI 61B"]);
  assert.deepEqual(searchCourses("machine learning","All courses","All departments","Best match").map(c=>c.code),["DATA C100"]);
  assert.equal(searchCourses("not-a-real-course","All courses","All departments","Best match").length,0);
  assert.equal(searchCourses("","Open seats","All departments","Best match").every(c=>c.seats>0),true);
});

test("derived scores reconcile exactly with their contributions",()=>{
  for(const variant of [0,1] as const){
    const result=scoreSchedule(defaultCourses,variant,["morning","lunch","rating"]);
    assert.equal(result.score,Object.values(result.contributions).reduce((sum,value)=>sum+value,0));
  }
});

test("priorities alter contributions and can change the winning variant",()=>{
  const none=scoreSchedule(defaultCourses,0,[]);
  assert.deepEqual(none.contributions,{base:70,rating:0,morning:0,lunch:0,conflicts:0});
  const morningWinner=rankVariants(defaultCourses,["morning"])[0].variant;
  const lunchWinner=rankVariants(defaultCourses,["lunch"])[0].variant;
  assert.notEqual(morningWinner,lunchWinner);
});

test("conflict fixture produces visible overlaps and a deterministic penalty",()=>{
  const selected=["STAT 134","INFO 159"];
  const overlaps=findConflicts(blocksFor(selected,0));
  assert.equal(overlaps.length,2);
  assert.equal(scoreSchedule(selected,0,[]).contributions.conflicts,-30);
  assert.equal(findConflicts(blocksFor(selected,1)).length,0);
});

test("empty schedules never receive an artificial score",()=>{
  assert.equal(scoreSchedule([],0,["morning","lunch","rating"]).score,0);
});
