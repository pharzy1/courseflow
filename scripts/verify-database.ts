import { neon } from "@neondatabase/serverless";

const connectionString=process.env.DATABASE_URL;
if(!connectionString)throw new Error("DATABASE_URL is required");
const sql=neon(connectionString);
const [summary]=await sql`select
  (select count(*)::int from data_sources) as sources,
  (select count(*)::int from courses) as courses,
  (select count(*)::int from sections) as sections,
  (select count(*)::int from enrollment_snapshots) as enrollment_snapshots`;
const sample=await sql`select c.subject,c.number,c.title,s.section_number,s.enrolled,s.capacity
  from sections s join courses c on c.id=s.course_id
  where s.term='Fall 2026' order by c.subject,c.number,s.section_number limit 3`;
console.log(JSON.stringify({summary,sample},null,2));
if(Number(summary.sections)!==5928)throw new Error(`Expected 5928 distinct sections, found ${summary.sections}`);
