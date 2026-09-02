export type CourseMetadata={subject:string;number:string;department:string;title:string;description:string;unitsMin:number;unitsMax:number;crossListings:string[]};
export interface CourseMetadataAdapter{readonly source:{name:string;url:string;official:boolean};fetchAll():Promise<Map<string,CourseMetadata>>;}
export const courseKey=(subject:string,number:string)=>`${subject.trim().toUpperCase()}\u0000${number.trim().toUpperCase()}`;
