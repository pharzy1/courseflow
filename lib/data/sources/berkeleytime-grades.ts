export type GradeQuery={term?:string;instructor?:string};
export type GradeSummary={subject:string;number:string;courseId:string;counts:Record<string,number>;mean:number|null};
type GradePayload={average:number|null;distribution:Array<{letter:string;count:number}>};
type ClassRecord={year:number;semester:string;sessionId:string;term:{temporalPosition:string};gradeDistribution:{average:number|null};primarySection:null|{meetings:Array<{instructors:Array<{familyName:string;givenName:string}>}>}};

export interface GradeSourceAdapter{
  listCourseSummaries():Promise<GradeSummary[]>;
  getCourseOptions(subject:string,number:string):Promise<{terms:Array<{value:string;label:string}>;instructors:Array<{value:string;label:string}>}>;
  getDistribution(input:{subject:string;courseId:string;term?:string;instructor?:string}):Promise<GradeSummary>;
}

const operations={all:"ef3a260a0e8b4a6e32dcef6bc90c7193b333e9c9d3e552b484b986e1f440b397",course:"2e5bd7f134a8e007e7a6c2fa41a2d18b0dea3028df5f4f45942fa1d0c7205bf3",grade:"3b25e544b49e4ce0b13cfe0e3a89f2ccf5ac28fa836d315e558929f11ab086b5"};
const counts=(distribution:GradePayload["distribution"])=>(Object.fromEntries(distribution.map(bucket=>[bucket.letter,bucket.count])) as Record<string,number>);
const termValue=(item:Pick<ClassRecord,"year"|"semester"|"sessionId">)=>`${item.year}|${item.semester}|${item.sessionId}`;

export class BerkeleyTimeGradeAdapter implements GradeSourceAdapter{
  readonly endpoint=process.env.BERKELEYTIME_GRAPHQL_URL??"https://berkeleytime.com/api/graphql";
  private async request<T>(id:string,variables:Record<string,unknown>={}){const response=await fetch(this.endpoint,{method:"POST",signal:AbortSignal.timeout(30_000),headers:{accept:"application/json","content-type":"application/json","user-agent":"CourseFlow/1.0 (+https://github.com/pharzy1/courseflow)"},body:JSON.stringify({id,variables})});if(!response.ok)throw new Error(`Grade source returned ${response.status}`);const payload=await response.json() as {data?:T;errors?:unknown};if(!payload.data)throw new Error(`Grade source response invalid: ${JSON.stringify(payload.errors)}`);return payload.data;}
  async listCourseSummaries(){const data=await this.request<{courses:Array<{courseId:string;subject:string;number:string;gradeDistribution:GradePayload|null}>}>(operations.all);return data.courses.flatMap(course=>course.gradeDistribution?[{subject:course.subject,number:course.number,courseId:course.courseId,counts:counts(course.gradeDistribution.distribution),mean:course.gradeDistribution.average}]:[]);}
  async getCourseOptions(subject:string,number:string){const data=await this.request<{course:null|{classes:ClassRecord[]}}>(operations.course,{subject,number,includeFormerNames:false}),classes=data.course?.classes??[];
    const terms=[...new Map(classes.filter(item=>item.term.temporalPosition.toLowerCase()==="past"&&item.gradeDistribution.average!==null).map(item=>[termValue(item),{value:termValue(item),label:`${item.semester} ${item.year}`}])).values()].sort((a,b)=>b.value.localeCompare(a.value));
    const instructorMap=new Map<string,{value:string;label:string}>();for(const item of classes)for(const meeting of item.primarySection?.meetings??[])for(const person of meeting.instructors){const value=`${person.familyName}|${person.givenName}`;instructorMap.set(value,{value,label:`${person.givenName} ${person.familyName}`});}
    return {terms,instructors:[...instructorMap.values()].sort((a,b)=>a.label.localeCompare(b.label))};}
  async getDistribution(input:{subject:string;courseId:string;term?:string;instructor?:string}){const variables:Record<string,unknown>={subject:input.subject,courseId:input.courseId};if(input.term){const [year,semester,sessionId]=input.term.split("|");variables.year=Number(year);variables.semester=semester;variables.sessionId=sessionId;}if(input.instructor){const [familyName,givenName]=input.instructor.split("|");variables.familyName=familyName;variables.givenName=givenName;}const data=await this.request<{grade:GradePayload|null}>(operations.grade,variables),grade=data.grade??{average:null,distribution:[]};return {subject:input.subject,number:"",courseId:input.courseId,counts:counts(grade.distribution),mean:grade.average};}
}
