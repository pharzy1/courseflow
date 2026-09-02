import { BerkeleyTimeCatalogAdapter } from "./berkeleytime-catalog";
import type { CatalogIngestionAdapter } from "./catalog-source";
import { courseKey,type CourseMetadataAdapter } from "./course-metadata";
import { CoursedogMetadataAdapter } from "./coursedog-metadata";

export class HybridCatalogAdapter implements CatalogIngestionAdapter{
  readonly descriptor={id:"berkeley-official-metadata-berkeleytime-sections",name:"UC Berkeley official catalog metadata + BerkeleyTime section fallback",url:"https://undergraduate.catalog.berkeley.edu/courses",official:false,license:null,kind:"transitional" as const};
  private metadata:Promise<Awaited<ReturnType<CourseMetadataAdapter["fetchAll"]>>>|null=null;
  constructor(private readonly sections:CatalogIngestionAdapter=new BerkeleyTimeCatalogAdapter(),private readonly courses:CourseMetadataAdapter=new CoursedogMetadataAdapter()){}
  async fetchPage(input:Parameters<CatalogIngestionAdapter["fetchPage"]>[0]){this.metadata??=this.courses.fetchAll();const [page,metadata]=await Promise.all([this.sections.fetchPage(input),this.metadata]);return {...page,results:page.results.map(record=>{const official=metadata.get(courseKey(record.subject,record.courseNumber));return official?{...record,courseTitle:official.title,courseDescription:official.description,crossListings:official.crossListings}:record;})};}
}
