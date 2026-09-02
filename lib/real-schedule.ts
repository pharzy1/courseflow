import type { CatalogRecord,Meeting } from "./data/types";

export type GeneratedSchedule={id:string;sections:CatalogRecord[];score:number;openSeats:number;earliestStart:number|null};

export function timeMinutes(value:string|null){if(!value)return null;const match=value.match(/^(\d{1,2}):(\d{2})/);if(!match)return null;const result=Number(match[1])*60+Number(match[2]);return result===0?null:result;}

export function meetingsConflict(left:Meeting,right:Meeting){
  if(!left.days.some(day=>right.days.includes(day)))return false;
  const leftStart=timeMinutes(left.startTime),leftEnd=timeMinutes(left.endTime),rightStart=timeMinutes(right.startTime),rightEnd=timeMinutes(right.endTime);
  return leftStart!==null&&leftEnd!==null&&rightStart!==null&&rightEnd!==null&&leftStart<rightEnd&&rightStart<leftEnd;
}

export function sectionsConflict(left:CatalogRecord,right:CatalogRecord){return left.meetings.some(a=>right.meetings.some(b=>meetingsConflict(a,b)));}

export function generateConflictFreeSchedules(pool:CatalogRecord[],limit=5):GeneratedSchedule[]{
  const grouped=new Map<string,CatalogRecord[]>();for(const section of pool)grouped.set(section.code,[...(grouped.get(section.code)??[]),section]);
  const groups=[...grouped.values()].slice(0,8),combinations:CatalogRecord[][]=[];
  const visit=(index:number,current:CatalogRecord[])=>{if(combinations.length>=5000)return;if(index===groups.length){if(current.length)combinations.push([...current]);return;}for(const section of groups[index])if(!current.some(chosen=>sectionsConflict(chosen,section))){current.push(section);visit(index+1,current);current.pop();}};
  visit(0,[]);
  return combinations.map((sections,index)=>{const starts=sections.flatMap(section=>section.meetings.map(meeting=>timeMinutes(meeting.startTime))).filter((value):value is number=>value!==null),openSeats=sections.reduce((total,section)=>total+Math.max(0,section.capacity-section.enrolled),0),earliestStart=starts.length?Math.min(...starts):null,score=Math.max(0,Math.min(100,70+Math.min(20,openSeats)+(earliestStart===null?0:Math.min(10,Math.max(0,(earliestStart-8*60)/60)))));return{id:`schedule-${index}`,sections,score:Math.round(score),openSeats,earliestStart};}).sort((a,b)=>b.score-a.score||b.openSeats-a.openSeats).slice(0,limit);
}

export function formatMeeting(meeting:Meeting){
  const time=(value:string|null)=>{const total=timeMinutes(value);if(total===null)return "time TBA";const hour=Math.floor(total/60),minute=total%60;return `${hour%12||12}:${String(minute).padStart(2,"0")} ${hour>=12?"PM":"AM"}`;};
  return `${meeting.days.length?meeting.days.map(day=>day.slice(0,3)).join("/"):"Days TBA"} · ${time(meeting.startTime)}–${time(meeting.endTime)}${meeting.location?` · ${meeting.location}`:""}`;
}
