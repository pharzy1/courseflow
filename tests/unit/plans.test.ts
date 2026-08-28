import assert from "node:assert/strict";
import test from "node:test";
import { parsePlanPayload } from "../../lib/plans";

test("cloud plan boundary accepts canonical schedule snapshots",()=>{
  const payload={selected:["COMPSCI 61B"],priorities:["morning"],variant:1 as const,savedAt:"2026-08-28T00:00:00.000Z"};
  assert.deepEqual(parsePlanPayload(payload),payload);
});

test("cloud plan boundary rejects malformed or unbounded state",()=>{
  assert.throws(()=>parsePlanPayload({selected:"COMPSCI 61B",priorities:[],variant:0,savedAt:"now"}));
  assert.throws(()=>parsePlanPayload({selected:[],priorities:[],variant:4,savedAt:"now"}));
});
