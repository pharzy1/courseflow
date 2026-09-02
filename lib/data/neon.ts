import { and,desc,eq,gte,ilike,inArray,lte,or,sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { courses,gradeDistributions,sections,sources } from "../../db/schema";
import { getDb } from "../../db";
import type { CatalogPage,CatalogQuery,CourseDataRepository } from "./types";

export class NeonCourseRepository implements CourseDataRepository{
  async searchCatalog(query:CatalogQuery):Promise<CatalogPage>{
    const db=getDb();
    const conditions=[eq(sections.term,query.term)];
    if(query.ids?.length)conditions.push(inArray(sections.id,query.ids));
    if(query.search){const search=query.search.trim();conditions.push(or(ilike(courses.subject,`%${search}%`),ilike(courses.number,`%${search}%`),ilike(courses.title,`%${search}%`),ilike(sql`${courses.subject} || ' ' || ${courses.number}`,`%${search}%`))!);}
    if(query.department)conditions.push(eq(courses.department,query.department));
    if(query.openOnly)conditions.push(sql`${sections.enrolled}<${sections.capacity}`);
    if(query.level)conditions.push(eq(courses.level,query.level));
    if(query.unitsMin!==undefined)conditions.push(gte(courses.unitsMax,String(query.unitsMin)));
    if(query.unitsMax!==undefined)conditions.push(lte(courses.unitsMin,String(query.unitsMax)));
    const medianRank=sql<number>`CASE ${gradeDistributions.median} WHEN 'A+' THEN 12 WHEN 'A' THEN 11 WHEN 'A-' THEN 10 WHEN 'B+' THEN 9 WHEN 'B' THEN 8 WHEN 'B-' THEN 7 WHEN 'C+' THEN 6 WHEN 'C' THEN 5 WHEN 'C-' THEN 4 WHEN 'D+' THEN 3 WHEN 'D' THEN 2 WHEN 'D-' THEN 1 WHEN 'F' THEN 0 ELSE -1 END`;
    const minimumRanks:Record<string,number>={"F":0,"D-":1,"D":2,"D+":3,"C-":4,"C":5,"C+":6,"B-":7,"B":8,"B+":9,"A-":10,"A":11,"A+":12};
    if(query.minimumMedian&&minimumRanks[query.minimumMedian]!==undefined)conditions.push(gte(medianRank,minimumRanks[query.minimumMedian]));
    const offset=query.offset??0,limit=Math.min(query.limit??50,100);
    const gradeJoin=and(eq(gradeDistributions.courseId,courses.id),eq(gradeDistributions.term,"All terms"),eq(gradeDistributions.instructor,"All instructors"));
    const sectionSources=alias(sources,"section_sources");
    const base=db.select({course:courses,section:sections,source:sources,sectionSource:sectionSources,grade:gradeDistributions}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).innerJoin(sources,eq(courses.sourceId,sources.id)).innerJoin(sectionSources,eq(sections.sourceId,sectionSources.id)).leftJoin(gradeDistributions,gradeJoin).where(and(...conditions));
    const rows=await (query.sortBy==="median"?base.orderBy(desc(medianRank),courses.subject,courses.number):base.orderBy(courses.subject,courses.number)).limit(limit).offset(offset);
    const [{count}]=await db.select({count:sql<number>`count(*)`}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).leftJoin(gradeDistributions,gradeJoin).where(and(...conditions));
    const departmentRows=await db.selectDistinct({department:courses.department}).from(sections).innerJoin(courses,eq(sections.courseId,courses.id)).where(eq(sections.term,query.term)).orderBy(courses.department);
    const [latestSource]=await db.select({retrievedAt:sources.retrievedAt}).from(sources).orderBy(desc(sources.retrievedAt)).limit(1);
    const generatedAt=rows[0]?.source.retrievedAt.toISOString()??latestSource?.retrievedAt.toISOString()??new Date(0).toISOString();
    return {records:rows.map(({course,section,source,sectionSource,grade})=>({id:section.id,courseId:course.id,code:`${course.subject} ${course.number}`,subject:course.subject,number:course.number,title:course.title,description:course.description,department:course.department,unitsMin:Number(course.unitsMin),unitsMax:Number(course.unitsMax),level:course.level,requirements:course.requirementTags,prerequisites:course.prerequisites,crossListings:course.crossListings,term:section.term,sectionNumber:section.sectionNumber,component:section.component,meetings:section.meetings.map(meeting=>({...meeting,instructors:section.instructors})),enrolled:section.enrolled,capacity:section.capacity,waitlisted:section.waitlisted,waitlistCapacity:section.waitlistCapacity,averageGrade:grade?.mean===null||grade?.mean===undefined?null:Number(grade.mean),medianGrade:grade?.median??null,gradeSampleSize:grade?.sampleSize??0,provenance:{sourceId:source.id,sourceName:source.name,sourceUrl:source.url,official:source.official,retrievedAt:source.retrievedAt.toISOString(),license:source.license},sectionProvenance:{sourceId:sectionSource.id,sourceName:sectionSource.name,sourceUrl:sectionSource.url,official:sectionSource.official,retrievedAt:sectionSource.retrievedAt.toISOString(),license:sectionSource.license}})),total:Number(count),mode:"neon",generatedAt,facets:{departments:departmentRows.map(row=>row.department)}};
  }
}
