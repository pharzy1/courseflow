import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const sql=neon(connectionString);
const migration=await readFile("migrations/0001_neon_course_data.sql","utf8");
const statements=migration.split(";").map(statement=>statement.trim()).filter(Boolean);
for(const statement of statements)await sql.query(statement);
console.log(`Applied ${statements.length} idempotent schema statements`);
