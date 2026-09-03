import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createPlan,deletePlan,updatePlan } from "../../lib/plans";

const payload={selected:["COMPSCI 61B"],priorities:["morning"],variant:0 as const,savedAt:"2026-08-31T00:00:00.000Z"};
const databaseAvailable=Boolean(process.env.DATABASE_URL);
if(process.env.COURSEFLOW_REQUIRE_DATABASE_TESTS==="1"&&!databaseAvailable)throw new Error("DATABASE_URL is required: plan-isolation tests may not skip in CI");

test("Neon plan mutations enforce Clerk identity ownership",{skip:!databaseAvailable},async()=>{
  const suffix=randomUUID(),owner={userId:`isolation-owner-${suffix}`,email:null,provider:"clerk" as const},intruder={userId:`isolation-intruder-${suffix}`,email:null,provider:"clerk" as const};
  const plan=await createPlan(owner,"Private plan",payload);
  assert.equal(await updatePlan(intruder,plan.id,{name:"Compromised"}),null);
  assert.equal(await deletePlan(intruder,plan.id),false);
  assert.equal((await updatePlan(owner,plan.id,{name:"Owner update"}))?.name,"Owner update");
  assert.equal(await deletePlan(owner,plan.id),true);
});
