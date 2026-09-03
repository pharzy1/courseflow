import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const migrations=await Promise.all(["migrations/0001_neon_course_data.sql","migrations/0002_enrollment_alerts.sql","migrations/0003_degree_roadmaps.sql","migrations/0004_academic_refresh_evidence.sql","migrations/0005_notification_delivery.sql"].map(path=>readFile(path,"utf8")));
const statements=migrations.flatMap(migration=>migration.split(";").map(statement=>statement.trim()).filter(Boolean));
if(process.env.COURSEFLOW_DATABASE_DRIVER==="postgres-js"){const sql=postgres(connectionString,{max:1});try{for(const statement of statements)await sql.unsafe(statement);}finally{await sql.end();}}
else{const sql=neon(connectionString);for(const statement of statements)await sql.query(statement);}
console.log(`Applied ${statements.length} idempotent schema statements`);
