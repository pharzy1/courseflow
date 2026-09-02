export type SourceInstructor={givenName?:string|null;familyName?:string|null};
export type SourceMeeting={days?:boolean[];startTime?:string|null;endTime?:string|null;location?:string|null;instructors?:SourceInstructor[]};
export type SourceCatalogRecord={termId?:string;sessionId:string;subject:string;courseNumber:string;number:string;courseId?:string;title?:string|null;courseTitle?:string|null;courseDescription?:string|null;unitsMin:number;unitsMax:number;level?:string|null;breadthRequirements?:string[];universityRequirements?:string[];enrolledCount?:number;maxEnroll?:number;waitlistedCount?:number;maxWaitlist?:number;allTimeAverageGrade?:number|null;primaryComponent?:string|null;meetings?:SourceMeeting[]};
export type SourceCatalogPage={totalCount:number;results:SourceCatalogRecord[]};
export type CatalogSourceDescriptor={id:string;name:string;url:string;official:boolean;license:string|null;kind:"official"|"transitional"|"snapshot"};

export interface CatalogIngestionAdapter{
  readonly descriptor:CatalogSourceDescriptor;
  fetchPage(input:{year:number;semester:string;page:number;pageSize:number;timeoutMs:number}):Promise<SourceCatalogPage>;
}
