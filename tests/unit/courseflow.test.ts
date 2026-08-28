import assert from "node:assert/strict";
import test from "node:test";
import { bestFeasibleVariant, blocksFor, compareCourses, courseSignal, courses, findConflicts, rankVariants, scoreSchedule, searchCourses } from "../../lib/courseflow";

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
  const selected=[...defaultCourses,"INFO 159"];
  const overlaps=findConflicts(blocksFor(selected,0));
  assert.equal(overlaps.length,2);
  assert.equal(scoreSchedule(selected,0,[]).contributions.conflicts,-30);
  assert.equal(findConflicts(blocksFor(selected,1)).length,0);
  const winner=bestFeasibleVariant(selected,["morning","lunch","rating"]);
  assert.equal(winner?.variant,1);
  assert.equal(winner?.result.conflictCount,0);
});

test("every selectable course subset has a conflict-free ranked winner",()=>{
  const codes=courses.map(course=>course.code);
  for(let mask=1;mask<2**codes.length;mask++){
    const selected=codes.filter((_,index)=>mask&(1<<index));
    const winner=bestFeasibleVariant(selected,["morning","lunch","rating"]);
    assert.ok(winner,`expected a feasible variant for ${selected.join(", ")}`);
    assert.equal(winner.result.conflictCount,0,`winner conflicts for ${selected.join(", ")}`);
    assert.equal(rankVariants(selected,[])[0].result.conflictCount,0);
  }
});

test("empty schedules never receive an artificial score",()=>{
  assert.equal(scoreSchedule([],0,["morning","lunch","rating"]).score,0);
});

test("course intelligence is transparent and comparison preserves catalog order",()=>{
  const data100=courses.find(course=>course.code==="DATA C100")!;
  assert.deepEqual(courseSignal(data100),{availability:0,fit:84,risk:"Closing fast"});
  const compared=compareCourses(["DATA C100","COMPSCI 61B"]);
  assert.deepEqual(compared.map(course=>course.code),["COMPSCI 61B","DATA C100"]);
  assert.equal(compared.every(course=>course.requirements.length>0&&course.trend.length===4),true);
});
