import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { createPlan,deletePlan,updatePlan } from "../../lib/plans";

const payload={selected:["COMPSCI 61B"],priorities:["morning"],variant:0 as const,savedAt:"2026-08-31T00:00:00.000Z"};

test("Neon plan mutations enforce Clerk identity ownership",{skip:!process.env.DATABASE_URL},async()=>{
  const suffix=randomUUID(),owner={userId:`isolation-owner-${suffix}`,email:null,provider:"clerk" as const},intruder={userId:`isolation-intruder-${suffix}`,email:null,provider:"clerk" as const};
  const plan=await createPlan(owner,"Private plan",payload);
  assert.equal(await updatePlan(intruder,plan.id,{name:"Compromised"}),null);
  assert.equal(await deletePlan(intruder,plan.id),false);
  assert.equal((await updatePlan(owner,plan.id,{name:"Owner update"}))?.name,"Owner update");
  assert.equal(await deletePlan(owner,plan.id),true);
});
