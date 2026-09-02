import { courseKey,type CourseMetadata,type CourseMetadataAdapter } from "./course-metadata";

const catalogHost="https://undergraduate.catalog.berkeley.edu";
const apiHost="https://app.coursedog.com/api/v1";

export function parseCsv(text:string){
  const rows:string[][]=[];let row:string[]=[],field="",quoted=false;
  for(let index=0;index<text.length;index++){const char=text[index];if(quoted){if(char==='"'&&text[index+1]==='"'){field+='"';index++;}else if(char==='"')quoted=false;else field+=char;}else if(char==='"')quoted=true;else if(char===","){row.push(field);field="";}else if(char==="\n"){row.push(field);rows.push(row);row=[];field="";}else if(char!=="\r")field+=char;}
  if(field||row.length){row.push(field);rows.push(row);}return rows;
}

const numberValue=(value:string)=>{const parsed=Number(value);return Number.isFinite(parsed)?parsed:0;};
export function parseCoursedogMetadata(text:string){
  const [headers,...rows]=parseCsv(text),indexes=new Map((headers??[]).map((header,index)=>[header,index])),value=(row:string[],name:string)=>row[indexes.get(name)??-1]??"";
  for(const required of ["Subject","Course Number","Course Title","Course Description"])if(!indexes.has(required))throw new Error(`Official catalog export is missing required column: ${required}`);
  const result=new Map<string,CourseMetadata>();
  for(const row of rows){const subject=value(row,"Subject"),number=value(row,"Course Number");if(!subject||!number)continue;const unitsMin=numberValue(value(row,"Credits - Units - Minimum Units")),unitsMax=numberValue(value(row,"Credits - Units - Maximum Units"));result.set(courseKey(subject,number),{subject,number,department:value(row,"Department(s)")||subject,title:value(row,"Course Title")||`${subject} ${number}`,description:value(row,"Course Description"),unitsMin,unitsMax:unitsMax||unitsMin,crossListings:value(row,"Cross-Listed Course(s)").split(",").map(item=>item.trim()).filter(item=>item&&item!=="-")});}
  return result;
}

export class CoursedogMetadataAdapter implements CourseMetadataAdapter{
  readonly source={name:"UC Berkeley Undergraduate Catalog",url:`${catalogHost}/courses`,official:true};
  async fetchAll(){
    const bootstrap=await fetch(`${apiHost}/catalogs/urls?url=undergraduate.catalog.berkeley.edu`,{signal:AbortSignal.timeout(20_000),headers:{accept:"application/json","user-agent":"CourseFlow/1.0 (+https://github.com/pharzy1/courseflow)"}});if(!bootstrap.ok)throw new Error(`Official catalog bootstrap returned ${bootstrap.status}`);
    const config=await bootstrap.json() as {school:string;catalog:{_id:string}};if(!config.school||!config.catalog?._id)throw new Error("Official catalog bootstrap contract changed");
    const endpoint=`${apiHost}/ca/${encodeURIComponent(config.school)}/catalogs/${encodeURIComponent(config.catalog._id)}/courses/csv/%24filters?orderBy=code`;
    const response=await fetch(endpoint,{method:"POST",signal:AbortSignal.timeout(90_000),headers:{accept:"text/csv","content-type":"application/json","user-agent":"CourseFlow/1.0 (+https://github.com/pharzy1/courseflow)"},body:"{}"});if(!response.ok)throw new Error(`Official catalog export returned ${response.status}`);
    return parseCoursedogMetadata(await response.text());
  }
}
