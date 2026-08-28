import { and,eq,gte,ilike,lte,or,sql } from "drizzle-orm";
import { courses,sections,sources } from "../../db/schema";
import { getDb } from "../../db";
import type { CatalogPage,CatalogQuery,CourseDataRepository } from "./types";

export class NeonCourseRepository implements CourseDataRepository{
  async searchCatalog(query:CatalogQuery):Promise<CatalogPage>{
    const db=getDb();
    const conditions=[eq(sections.term,query.term)];
    if(query.search)conditions.push(or(ilike(courses.subject,`%${query.search}%`),ilike(courses.number,`%${query.search}%`),ilike(courses.title,`%${query.search}%`))!);
    if(query.department)conditions.push(eq(courses.department,query.department));
    if(query.openOnly)conditions.push(sql`${sections.enrolled}<${sections.capacity}`);
    if(query.level)conditions.push(eq(courses.level,query.level));
    if(query.unitsMin!==undefined)conditions.push(gte(courses.unitsMax,String(query.unitsMin)));
    if(query.unitsMax!==undefined)conditions.push(lte(courses.unitsMin,String(query.unitsMax)));
    const offset=query.offset??0,limit=Math.min(query.limit??50,100);
    const rows=await db.select({course:courses,section:sections,source:sources}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).innerJoin(sources,eq(courses.sourceId,sources.id)).where(and(...conditions)).limit(limit).offset(offset);
    const [{count}]=await db.select({count:sql<number>`count(*)`}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).where(and(...conditions));
    return {records:rows.map(({course,section,source})=>({id:section.id,courseId:course.id,code:`${course.subject} ${course.number}`,subject:course.subject,number:course.number,title:course.title,description:course.description,department:course.department,unitsMin:Number(course.unitsMin),unitsMax:Number(course.unitsMax),level:course.level,requirements:course.requirementTags,prerequisites:course.prerequisites,crossListings:course.crossListings,term:section.term,sectionNumber:section.sectionNumber,component:section.component,meetings:section.meetings.map(meeting=>({...meeting,instructors:section.instructors})),enrolled:section.enrolled,capacity:section.capacity,waitlisted:section.waitlisted,waitlistCapacity:section.waitlistCapacity,averageGrade:null,provenance:{sourceId:source.id,sourceName:source.name,sourceUrl:source.url,official:source.official,retrievedAt:source.retrievedAt.toISOString(),license:source.license}})),total:Number(count),mode:"neon",generatedAt:new Date().toISOString()};
  }
}
