import type { CatalogRecord } from "./types";

export type SourceValidationReport={baseline:number;candidate:number;matched:number;coverage:number;fieldAgreement:{title:number;units:number;component:number;meetings:number;enrollment:number};missingSectionIds:string[]};
const ratio=(matches:number,total:number)=>total?matches/total:1;
const stableMeetings=(record:CatalogRecord)=>JSON.stringify(record.meetings.map(({days,startTime,endTime})=>({days,startTime,endTime})));

export function compareCatalogSources(baseline:CatalogRecord[],candidate:CatalogRecord[],sampleLimit=250):SourceValidationReport{
  const candidateById=new Map(candidate.map(record=>[record.id,record])),sample=baseline.toSorted((a,b)=>a.id.localeCompare(b.id)).slice(0,Math.max(1,sampleLimit));
  let matched=0,title=0,units=0,component=0,meetings=0,enrollment=0;const missingSectionIds:string[]=[];
  for(const expected of sample){const actual=candidateById.get(expected.id);if(!actual){missingSectionIds.push(expected.id);continue;}matched++;if(actual.title===expected.title)title++;if(actual.unitsMin===expected.unitsMin&&actual.unitsMax===expected.unitsMax)units++;if(actual.component===expected.component)component++;if(stableMeetings(actual)===stableMeetings(expected))meetings++;if(actual.enrolled===expected.enrolled&&actual.capacity===expected.capacity&&actual.waitlisted===expected.waitlisted)enrollment++;}
  return {baseline:sample.length,candidate:candidate.length,matched,coverage:ratio(matched,sample.length),fieldAgreement:{title:ratio(title,matched),units:ratio(units,matched),component:ratio(component,matched),meetings:ratio(meetings,matched),enrollment:ratio(enrollment,matched)},missingSectionIds};
}
