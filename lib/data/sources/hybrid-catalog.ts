import { BerkeleyTimeCatalogAdapter } from "./berkeleytime-catalog";
import type { CatalogIngestionAdapter,SourceQualityEvidence } from "./catalog-source";
import { courseKey,type CourseMetadataAdapter } from "./course-metadata";
import { CoursedogMetadataAdapter } from "./coursedog-metadata";

export class HybridCatalogAdapter implements CatalogIngestionAdapter{
  readonly descriptor={id:"berkeley-official-metadata-berkeleytime-sections",name:"UC Berkeley official catalog metadata + BerkeleyTime section fallback",url:"https://undergraduate.catalog.berkeley.edu/courses",official:false,license:null,kind:"transitional" as const};
  readonly metadataDescriptor={id:"uc-berkeley-coursedog-catalog",name:"UC Berkeley official catalog metadata",url:"https://undergraduate.catalog.berkeley.edu/courses",official:true,license:null,kind:"official" as const};
  readonly sectionDescriptor:{id:string;name:string;url:string;official:boolean;license:string|null;kind:"transitional"}={...this.sections.descriptor,kind:"transitional"};
  private metadata:Promise<Awaited<ReturnType<CourseMetadataAdapter["fetchAll"]>>>|null=null;
  private sectionCourseKeys=new Set<string>();
  private matchedCourseKeys=new Set<string>();
  constructor(private readonly sections:CatalogIngestionAdapter=new BerkeleyTimeCatalogAdapter(),private readonly courses:CourseMetadataAdapter=new CoursedogMetadataAdapter()){}
  async fetchPage(input:Parameters<CatalogIngestionAdapter["fetchPage"]>[0]){this.metadata??=this.courses.fetchAll();const [page,metadata]=await Promise.all([this.sections.fetchPage(input),this.metadata]);return {...page,results:page.results.map(record=>{const key=courseKey(record.subject,record.courseNumber),official=metadata.get(key);this.sectionCourseKeys.add(key);if(official){this.matchedCourseKeys.add(key);return {...record,courseTitle:official.title,courseDescription:official.description,crossListings:official.crossListings,courseMetadataOfficial:true};}return {...record,courseMetadataOfficial:false};})};}
  async qualityEvidence():Promise<SourceQualityEvidence>{const metadata=await this.metadata;if(!metadata)return{sampleSize:0,matchedCourses:0,coverage:0,catalogCourses:0,sectionCourses:0};const sample=[...this.sectionCourseKeys].sort().slice(0,250),matchedCourses=sample.filter(key=>metadata.has(key)).length;return{sampleSize:sample.length,matchedCourses,coverage:sample.length?matchedCourses/sample.length:0,catalogCourses:metadata.size,sectionCourses:this.sectionCourseKeys.size};}
}
