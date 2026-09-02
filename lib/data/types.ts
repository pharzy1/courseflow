export type Provenance={sourceId:string;sourceName:string;sourceUrl:string;official:boolean;retrievedAt:string;license:string|null};
export type Meeting={days:string[];startTime:string|null;endTime:string|null;location:string|null;instructors:string[]};
export type CatalogRecord={id:string;courseId:string;code:string;subject:string;number:string;title:string;description:string;department:string;unitsMin:number;unitsMax:number;level:string|null;requirements:string[];prerequisites:string[];crossListings:string[];term:string;sectionNumber:string;component:string|null;meetings:Meeting[];enrolled:number;capacity:number;waitlisted:number;waitlistCapacity:number;averageGrade:number|null;medianGrade:string|null;gradeSampleSize:number;provenance:Provenance;sectionProvenance?:Provenance};
export type CatalogQuery={term:string;search?:string;department?:string;openOnly?:boolean;level?:string;unitsMin?:number;unitsMax?:number;minimumMedian?:string;sortBy?:"default"|"median";limit?:number;offset?:number};
export type CatalogPage={records:CatalogRecord[];total:number;mode:"snapshot"|"neon";generatedAt:string;facets:{departments:string[]}};
export type CatalogFreshness="live"|"aging"|"stale";
export function catalogFreshness(retrievedAt:string,now=Date.now()):CatalogFreshness{
  const age=now-new Date(retrievedAt).getTime();
  if(!Number.isFinite(age)||age>2*60*60*1000)return "stale";
  return age<=30*60*1000?"live":"aging";
}
export interface CourseDataRepository{searchCatalog(query:CatalogQuery):Promise<CatalogPage>;}
