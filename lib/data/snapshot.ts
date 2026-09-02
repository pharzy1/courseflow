import type { CatalogPage,CatalogQuery,CatalogRecord,CourseDataRepository } from "./types";
import seed from "../../data/catalog.snapshot.json";

const records=(seed.records as Array<Omit<CatalogRecord,"averageGrade"|"medianGrade"|"gradeSampleSize">&Partial<Pick<CatalogRecord,"averageGrade"|"medianGrade"|"gradeSampleSize">>>).map(record=>({...record,averageGrade:record.averageGrade??null,medianGrade:record.medianGrade??null,gradeSampleSize:record.gradeSampleSize??0}));
export class SnapshotCourseRepository implements CourseDataRepository{
  async searchCatalog(query:CatalogQuery):Promise<CatalogPage>{
    const needle=(query.search??"").trim().toLowerCase();
    let filtered=records.filter(record=>record.term===query.term)
      .filter(record=>!needle||`${record.code} ${record.title} ${record.description}`.toLowerCase().includes(needle))
      .filter(record=>!query.department||record.department===query.department)
      .filter(record=>!query.openOnly||record.enrolled<record.capacity)
      .filter(record=>!query.level||record.level===query.level)
      .filter(record=>query.unitsMin===undefined||record.unitsMax>=query.unitsMin)
      .filter(record=>query.unitsMax===undefined||record.unitsMin<=query.unitsMax)
      .filter(record=>!query.minimumMedian||!record.medianGrade||gradeRank(record.medianGrade)>=gradeRank(query.minimumMedian));
    if(query.sortBy==="median")filtered=filtered.toSorted((a,b)=>gradeRank(b.medianGrade)-gradeRank(a.medianGrade));
    const total=filtered.length,offset=query.offset??0,limit=Math.min(query.limit??50,100);
    filtered=filtered.slice(offset,offset+limit);
    return {records:filtered,total,mode:"snapshot",generatedAt:seed.generatedAt,facets:{departments:[...new Set(records.filter(record=>record.term===query.term).map(record=>record.department))].sort()}};
  }
}
const grades=["F","D-","D","D+","C-","C","C+","B-","B","B+","A-","A","A+"];
const gradeRank=(grade:string|null|undefined)=>grade?grades.indexOf(grade):-1;
