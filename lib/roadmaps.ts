import { eq,sql } from "drizzle-orm";
import { getDb } from "../db";
import { degreeRoadmaps,userProfiles } from "../db/schema";
import type { CourseFlowIdentity } from "./auth";
import { parseRoadmap,type RoadmapPayload } from "./roadmap";
async function ensure(identity:CourseFlowIdentity){const db=getDb();await db.execute(sql`CREATE TABLE IF NOT EXISTS degree_roadmaps (id text PRIMARY KEY,user_id text NOT NULL UNIQUE REFERENCES user_profiles(id),payload jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL,updated_at timestamptz NOT NULL)`);const userId=`clerk:${identity.userId}`,now=new Date();await db.insert(userProfiles).values({id:userId,clerkUserId:identity.userId,email:identity.email,priorities:{},createdAt:now,updatedAt:now}).onConflictDoUpdate({target:userProfiles.clerkUserId,set:{email:identity.email,updatedAt:now}});return userId;}
export async function loadRoadmap(identity:CourseFlowIdentity){const db=getDb(),userId=await ensure(identity),row=(await db.select().from(degreeRoadmaps).where(eq(degreeRoadmaps.userId,userId)).limit(1))[0];return row?parseRoadmap(row.payload):null;}
export async function saveRoadmap(identity:CourseFlowIdentity,payload:RoadmapPayload){const db=getDb(),userId=await ensure(identity),id=`${userId}:degree-roadmap`,now=new Date();await db.insert(degreeRoadmaps).values({id,userId,payload,createdAt:now,updatedAt:now}).onConflictDoUpdate({target:degreeRoadmaps.userId,set:{payload,updatedAt:now}});return payload;}
