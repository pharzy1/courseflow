import assert from "node:assert/strict";
import test from "node:test";
import { calculateEnrollmentInsights,type EnrollmentObservation } from "../../lib/data/enrollment";

test("enrollment insights derive real deltas, velocity, and fill estimate",()=>{
  const points:EnrollmentObservation[]=[{observedAt:"2026-08-30T00:00:00.000Z",enrolled:80,capacity:100,waitlisted:1},{observedAt:"2026-08-31T00:00:00.000Z",enrolled:90,capacity:100,waitlisted:4}];
  assert.deepEqual(calculateEnrollmentInsights(points),{availableSeats:10,enrolledDelta:10,waitlistDelta:3,velocityPerDay:10,estimatedDaysToFill:1,trend:"filling"});
});
test("one observation is disclosed as collecting rather than fabricated",()=>{assert.deepEqual(calculateEnrollmentInsights([{observedAt:"2026-08-31T00:00:00.000Z",enrolled:40,capacity:50,waitlisted:0}]),{availableSeats:10,enrolledDelta:0,waitlistDelta:0,velocityPerDay:null,estimatedDaysToFill:null,trend:"collecting"});});
test("negative enrollment movement is classified as opening",()=>{const result=calculateEnrollmentInsights([{observedAt:"2026-08-30T00:00:00.000Z",enrolled:50,capacity:50,waitlisted:3},{observedAt:"2026-08-31T00:00:00.000Z",enrolled:45,capacity:50,waitlisted:0}]);assert.equal(result.trend,"opening");assert.equal(result.estimatedDaysToFill,null);});
