import { randomUUID } from "node:crypto";
import { and,desc,eq } from "drizzle-orm";
import { getDb } from "../db";
import { savedPlans,userProfiles } from "../db/schema";
import type { CourseFlowIdentity } from "./auth";

export type PlanPayload={selected:string[];priorities:string[];variant:0|1;savedAt:string};
export type CloudPlan={id:string;name:string;payload:PlanPayload;updatedAt:string};
export const MAX_CLOUD_PLANS=20;

function validPayload(value:unknown):value is PlanPayload{
  if(!value||typeof value!=="object")return false;
  const candidate=value as Partial<PlanPayload>;
  return Array.isArray(candidate.selected)&&candidate.selected.length<=50&&candidate.selected.every(item=>typeof item==="string"&&item.length<=40)&&Array.isArray(candidate.priorities)&&candidate.priorities.length<=10&&candidate.priorities.every(item=>typeof item==="string"&&item.length<=40)&&(candidate.variant===0||candidate.variant===1)&&typeof candidate.savedAt==="string"&&!Number.isNaN(Date.parse(candidate.savedAt));
}

export function parsePlanPayload(value:unknown){if(!validPayload(value))throw new Error("Invalid plan payload");return value;}
export function parsePlanName(value:unknown){if(typeof value!=="string"||!value.trim())throw new Error("Plan name is required");return value.trim().slice(0,80);}

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

export async function createPlan(identity:CourseFlowIdentity,name:string,payload:PlanPayload):Promise<CloudPlan>{
  const db=getDb(),userId=await ensureProfile(identity),existing=await db.select({id:savedPlans.id}).from(savedPlans).where(eq(savedPlans.userId,userId));
  if(existing.length>=MAX_CLOUD_PLANS)throw new Error(`Cloud plan limit reached (${MAX_CLOUD_PLANS})`);
  const now=new Date(),id=`${userId}:${randomUUID()}`;
  await db.insert(savedPlans).values({id,userId,name,payload,createdAt:now,updatedAt:now});
  return {id,name,payload,updatedAt:now.toISOString()};
}

export async function updatePlan(identity:CourseFlowIdentity,planId:string,changes:{name?:string;payload?:PlanPayload}):Promise<CloudPlan|null>{
  const db=getDb(),userId=await ensureProfile(identity),current=(await db.select().from(savedPlans).where(and(eq(savedPlans.id,planId),eq(savedPlans.userId,userId))).limit(1))[0];
  if(!current)return null;
  const now=new Date(),name=changes.name??current.name,payload=changes.payload??parsePlanPayload(current.payload);
  await db.update(savedPlans).set({name,payload,updatedAt:now}).where(and(eq(savedPlans.id,planId),eq(savedPlans.userId,userId)));
  return {id:planId,name,payload,updatedAt:now.toISOString()};
}

export async function deletePlan(identity:CourseFlowIdentity,planId:string):Promise<boolean>{
  const db=getDb(),userId=await ensureProfile(identity);
  const removed=await db.delete(savedPlans).where(and(eq(savedPlans.id,planId),eq(savedPlans.userId,userId))).returning({id:savedPlans.id});
  return removed.length===1;
}
