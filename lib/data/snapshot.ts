import type { CatalogPage,CatalogQuery,CatalogRecord,CourseDataRepository } from "./types";
import seed from "../../data/catalog.snapshot.json";

const records=seed.records as CatalogRecord[];
export class SnapshotCourseRepository implements CourseDataRepository{
  async searchCatalog(query:CatalogQuery):Promise<CatalogPage>{
    const needle=(query.search??"").trim().toLowerCase();
    let filtered=records.filter(record=>record.term===query.term)
      .filter(record=>!needle||`${record.code} ${record.title} ${record.description}`.toLowerCase().includes(needle))
      .filter(record=>!query.department||record.department===query.department)
      .filter(record=>!query.openOnly||record.enrolled<record.capacity)
      .filter(record=>!query.level||record.level===query.level)
      .filter(record=>query.unitsMin===undefined||record.unitsMax>=query.unitsMin)
      .filter(record=>query.unitsMax===undefined||record.unitsMin<=query.unitsMax);
    const total=filtered.length,offset=query.offset??0,limit=Math.min(query.limit??50,100);
    filtered=filtered.slice(offset,offset+limit);
    return {records:filtered,total,mode:"snapshot",generatedAt:seed.generatedAt};
  }
}
