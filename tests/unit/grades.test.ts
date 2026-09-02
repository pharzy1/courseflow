import assert from "node:assert/strict";
import test from "node:test";
import { summarizeGrades } from "../../lib/grades";

test("grade summaries derive a reproducible median, mean, and sample size",()=>{
  const result=summarizeGrades({A:1,B:2,C:1});
  assert.equal(result.sampleSize,4);
  assert.equal(result.median,"B");
  assert.equal(result.mean,3);
});

test("source-reported means remain authoritative while empty cohorts stay honest",()=>{
  assert.deepEqual(summarizeGrades({},null),{sampleSize:0,mean:null,median:null});
  assert.equal(summarizeGrades({A:2,B:1},3.74).mean,3.74);
});
