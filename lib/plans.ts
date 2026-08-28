import { desc,eq } from "drizzle-orm";
import { getDb } from "../db";
import { savedPlans,userProfiles } from "../db/schema";
import type { CourseFlowIdentity } from "./auth";

export type PlanPayload={selected:string[];priorities:string[];variant:0|1;savedAt:string};
export type CloudPlan={id:string;name:string;payload:PlanPayload;updatedAt:string};

function validPayload(value:unknown):value is PlanPayload{
  if(!value||typeof value!=="object")return false;
  const candidate=value as Partial<PlanPayload>;
  return Array.isArray(candidate.selected)&&candidate.selected.length<=50&&candidate.selected.every(item=>typeof item==="string"&&item.length<=40)&&Array.isArray(candidate.priorities)&&candidate.priorities.length<=10&&candidate.priorities.every(item=>typeof item==="string"&&item.length<=40)&&(candidate.variant===0||candidate.variant===1)&&typeof candidate.savedAt==="string"&&!Number.isNaN(Date.parse(candidate.savedAt));
}

export function parsePlanPayload(value:unknown){if(!validPayload(value))throw new Error("Invalid plan payload");return value;}

async function ensureProfile(identity:CourseFlowIdentity){
  const db=getDb(),now=new Date(),id=`clerk:${identity.userId}`;
  await db.insert(userProfiles).values({id,clerkUserId:identity.userId,email:identity.email,priorities:{},createdAt:now,updatedAt:now}).onConflictDoUpdate({target:userProfiles.clerkUserId,set:{email:identity.email,updatedAt:now}});
  return id;
}

export async function listPlans(identity:CourseFlowIdentity):Promise<CloudPlan[]>{
  const db=getDb(),userId=await ensureProfile(identity);
  const rows=await db.select().from(savedPlans).where(eq(savedPlans.userId,userId)).orderBy(desc(savedPlans.updatedAt));
  return rows.map(row=>({id:row.id,name:row.name,payload:parsePlanPayload(row.payload),updatedAt:row.updatedAt.toISOString()}));
}

export async function savePlan(identity:CourseFlowIdentity,name:string,payload:PlanPayload):Promise<CloudPlan>{
  const db=getDb(),userId=await ensureProfile(identity),now=new Date(),id=`${userId}:primary`;
  await db.insert(savedPlans).values({id,userId,name,payload,createdAt:now,updatedAt:now}).onConflictDoUpdate({target:savedPlans.id,set:{name,payload,updatedAt:now}});
  return {id,name,payload,updatedAt:now.toISOString()};
}
