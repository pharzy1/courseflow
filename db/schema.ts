import { boolean, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const sources=pgTable("data_sources",{
  id:text("id").primaryKey(),name:text("name").notNull(),url:text("url").notNull(),official:boolean("official").notNull().default(false),
  retrievedAt:timestamp("retrieved_at",{withTimezone:true}).notNull(),license:text("license"),metadata:jsonb("metadata").$type<Record<string,unknown>>().notNull().default({}),
});
export const courses=pgTable("courses",{
  id:text("id").primaryKey(),subject:text("subject").notNull(),number:text("number").notNull(),title:text("title").notNull(),description:text("description").notNull().default(""),
  department:text("department").notNull(),unitsMin:numeric("units_min").notNull(),unitsMax:numeric("units_max").notNull(),level:text("level"),prerequisites:jsonb("prerequisites").$type<string[]>().notNull().default([]),
  requirementTags:jsonb("requirement_tags").$type<string[]>().notNull().default([]),crossListings:jsonb("cross_listings").$type<string[]>().notNull().default([]),sourceId:text("source_id").notNull().references(()=>sources.id),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
},table=>[uniqueIndex("courses_code_idx").on(table.subject,table.number),index("courses_department_idx").on(table.department)]);
export const sections=pgTable("sections",{
  id:text("id").primaryKey(),courseId:text("course_id").notNull().references(()=>courses.id),term:text("term").notNull(),sectionNumber:text("section_number").notNull(),component:text("component"),instructors:jsonb("instructors").$type<string[]>().notNull().default([]),
  meetings:jsonb("meetings").$type<Array<{days:string[];startTime:string|null;endTime:string|null;location:string|null}>>().notNull().default([]),enrolled:integer("enrolled").notNull().default(0),capacity:integer("capacity").notNull().default(0),waitlisted:integer("waitlisted").notNull().default(0),waitlistCapacity:integer("waitlist_capacity").notNull().default(0),sourceId:text("source_id").notNull().references(()=>sources.id),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
},table=>[index("sections_term_course_idx").on(table.term,table.courseId)]);
export const gradeDistributions=pgTable("grade_distributions",{
  id:text("id").primaryKey(),courseId:text("course_id").notNull().references(()=>courses.id),term:text("term").notNull(),instructor:text("instructor").notNull(),counts:jsonb("counts").$type<Record<string,number>>().notNull(),mean:numeric("mean"),median:text("median"),sampleSize:integer("sample_size").notNull(),sourceId:text("source_id").notNull().references(()=>sources.id),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
},table=>[index("grades_course_term_idx").on(table.courseId,table.term)]);
export const enrollmentSnapshots=pgTable("enrollment_snapshots",{
  sectionId:text("section_id").notNull().references(()=>sections.id),observedAt:timestamp("observed_at",{withTimezone:true}).notNull(),enrolled:integer("enrolled").notNull(),capacity:integer("capacity").notNull(),waitlisted:integer("waitlisted").notNull(),sourceId:text("source_id").notNull().references(()=>sources.id),
},table=>[primaryKey({columns:[table.sectionId,table.observedAt]}),index("enrollment_section_time_idx").on(table.sectionId,table.observedAt)]);
export const userProfiles=pgTable("user_profiles",{
  id:text("id").primaryKey(),clerkUserId:text("clerk_user_id").notNull().unique(),email:text("email"),priorities:jsonb("priorities").$type<Record<string,unknown>>().notNull().default({}),createdAt:timestamp("created_at",{withTimezone:true}).notNull(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
});
export const savedPlans=pgTable("saved_plans",{
  id:text("id").primaryKey(),userId:text("user_id").notNull().references(()=>userProfiles.id),name:text("name").notNull(),payload:jsonb("payload").$type<Record<string,unknown>>().notNull(),createdAt:timestamp("created_at",{withTimezone:true}).notNull(),updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
},table=>[index("saved_plans_user_idx").on(table.userId)]);
