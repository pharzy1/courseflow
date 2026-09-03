import type { CatalogRecord } from "./types";

export type SourceValidationReport={baseline:number;candidate:number;matched:number;coverage:number;fieldAgreement:{title:number;units:number;component:number;meetings:number;enrollment:number};missingSectionIds:string[]};
const ratio=(matches:number,total:number)=>total?matches/total:1;
const stableMeetings=(record:CatalogRecord)=>JSON.stringify(record.meetings.map(({days,startTime,endTime})=>({days,startTime,endTime})));

export function stratifiedCatalogSample(records:CatalogRecord[],sampleLimit=250){
  const limit=Math.max(1,sampleLimit),byDepartment=new Map<string,CatalogRecord[]>();
  for(const record of records){const key=record.department||record.subject||"UNKNOWN";byDepartment.set(key,[...(byDepartment.get(key)??[]),record]);}
  const groups=[...byDepartment.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([,items])=>items.toSorted((a,b)=>a.id.localeCompare(b.id)));
  const sample:CatalogRecord[]=[];
  for(let index=0;sample.length<limit;index++){let added=false;for(const group of groups){if(group[index]){sample.push(group[index]);added=true;if(sample.length===limit)break;}}if(!added)break;}
  return sample;
}

export function compareCatalogSources(baseline:CatalogRecord[],candidate:CatalogRecord[],sampleLimit=250):SourceValidationReport{
  const candidateById=new Map(candidate.map(record=>[record.id,record])),sample=stratifiedCatalogSample(baseline,sampleLimit);
  let matched=0,title=0,units=0,component=0,meetings=0,enrollment=0;const missingSectionIds:string[]=[];
  for(const expected of sample){const actual=candidateById.get(expected.id);if(!actual){missingSectionIds.push(expected.id);continue;}matched++;if(actual.title===expected.title)title++;if(actual.unitsMin===expected.unitsMin&&actual.unitsMax===expected.unitsMax)units++;if(actual.component===expected.component)component++;if(stableMeetings(actual)===stableMeetings(expected))meetings++;if(actual.enrolled===expected.enrolled&&actual.capacity===expected.capacity&&actual.waitlisted===expected.waitlisted)enrollment++;}
  return {baseline:sample.length,candidate:candidate.length,matched,coverage:ratio(matched,sample.length),fieldAgreement:{title:ratio(title,matched),units:ratio(units,matched),component:ratio(component,matched),meetings:ratio(meetings,matched),enrollment:ratio(enrollment,matched)},missingSectionIds};
}
