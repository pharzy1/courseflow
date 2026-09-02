"use client";
import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from "react";
import type { CatalogRecord } from "../lib/data/types";
import { formatMeeting,generateConflictFreeSchedules,timeMinutes,type GeneratedSchedule } from "../lib/real-schedule";
import { CloudPlanManager } from "./cloud-plan-manager";
import type { PlanPayload } from "../lib/plans";

type StudioContextValue={selected:CatalogRecord[];toggle:(record:CatalogRecord)=>void;replace:(records:CatalogRecord[])=>void};
const StudioContext=createContext<StudioContextValue|null>(null),storageKey="courseflow-real-section-pool-v1";
const useStudio=()=>{const value=useContext(StudioContext);if(!value)throw new Error("Schedule studio provider missing");return value;};

export function ScheduleStudioProvider({children}:{children:ReactNode}){
  const [selected,setSelected]=useState<CatalogRecord[]>([]);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)??"[]");if(Array.isArray(saved))setSelected(saved.slice(0,18));}catch{}},0);return()=>window.clearTimeout(timer);},[]);
  const toggle=(record:CatalogRecord)=>setSelected(current=>{const next=current.some(item=>item.id===record.id)?current.filter(item=>item.id!==record.id):current.length>=18?current:[...current,record];localStorage.setItem(storageKey,JSON.stringify(next));return next;});
  const replace=(records:CatalogRecord[])=>{const next=records.slice(0,18);setSelected(next);localStorage.setItem(storageKey,JSON.stringify(next));};
  return <StudioContext.Provider value={{selected,toggle,replace}}>{children}</StudioContext.Provider>;
}

export function SectionPoolButton({record}:{record:CatalogRecord}){const {selected,toggle}=useStudio(),active=selected.some(item=>item.id===record.id);return <button className={`pool-button ${active?"active":""}`} aria-pressed={active} onClick={()=>toggle(record)}>{active?"Remove from schedule pool":"Add to schedule pool"}</button>;}

const weekdays=["Monday","Tuesday","Wednesday","Thursday","Friday"];
function WeeklyOptionCalendar({schedule}:{schedule:GeneratedSchedule}){
  const blocks=schedule.sections.flatMap((section,sectionIndex)=>section.meetings.flatMap((meeting,meetingIndex)=>meeting.days.flatMap(day=>{
    const column=weekdays.indexOf(day),start=timeMinutes(meeting.startTime),end=timeMinutes(meeting.endTime);
    return column<0||start===null||end===null?[]:[{section,meeting,column,start,end,key:`${section.id}-${meetingIndex}-${day}`,tone:sectionIndex%6}];
  })));
  return <div className="real-week" aria-label="Weekly calendar">
    <div className="real-week-days"><span/>{weekdays.map(day=><b key={day}>{day.slice(0,3)}</b>)}</div>
    <div className="real-week-grid">
      <div className="real-week-times">{[8,10,12,14,16,18,20].map(hour=><span key={hour}>{hour>12?hour-12:hour} {hour>=12?"PM":"AM"}</span>)}</div>
      {weekdays.map((day,column)=><div className="real-day-column" key={day} style={{left:`${16.666+column*16.666}%`}}/>)}
      {blocks.map(block=><div className={`real-meeting tone-${block.tone}`} key={block.key} style={{left:`${16.666+block.column*16.666}%`,top:`${Math.max(0,(block.start-480)/720*100)}%`,height:`${Math.max(5,(block.end-block.start)/720*100)}%`}} title={formatMeeting(block.meeting)}><b>{block.section.code}</b><span>{block.section.sectionNumber}</span></div>)}
    </div>
  </div>;
}

export function ScheduleStudio({accountsEnabled=false}:{accountsEnabled?:boolean}){
  const {selected,toggle,replace}=useStudio(),[generated,setGenerated]=useState<ReturnType<typeof generateConflictFreeSchedules>>([]),[attempted,setAttempted]=useState(false),[open,setOpen]=useState(true),groups=useMemo(()=>{const result=new Map<string,CatalogRecord[]>();for(const item of selected)result.set(item.code,[...(result.get(item.code)??[]),item]);return result;},[selected]),comparisons=[...groups.entries()].filter(([,items])=>items.length>1);
  const generate=()=>{setGenerated(generateConflictFreeSchedules(selected));setAttempted(true);};
  const current:PlanPayload={kind:"real-sections",sectionIds:selected.map(section=>section.id),savedAt:new Date().toISOString()};
  const restore=async(payload:PlanPayload)=>{if(payload.kind!=="real-sections")return;const params=new URLSearchParams({term:"Fall 2026"});payload.sectionIds.forEach(id=>params.append("id",id));const response=await fetch(`/api/catalog?${params}`,{cache:"no-store"});if(!response.ok)throw new Error("Catalog unavailable");const data=await response.json() as {records:CatalogRecord[]};if(data.records.length!==payload.sectionIds.length)throw new Error("Some saved sections are no longer available");const byId=new Map(data.records.map(record=>[record.id,record]));replace(payload.sectionIds.map(id=>byId.get(id)).filter((record):record is CatalogRecord=>Boolean(record)));setGenerated([]);setAttempted(false);setOpen(true);};
  const cloud=<CloudPlanManager configured={accountsEnabled} current={current} onRestore={restore} planKind="real-sections" placement="real-plans"/>;
  if(!selected.length)return <>{cloud}<section className="schedule-studio empty"><div><span className="kicker">REAL SCHEDULE STUDIO</span><h2>Build from actual sections.</h2><p>Add sections from the catalog to compare alternatives and generate conflict-free combinations. Signed-in plans can be restored from Cloud plans.</p></div></section></>;
  if(!open)return <>{cloud}<button className="studio-launcher" onClick={()=>setOpen(true)} aria-label={`Open schedule studio with ${selected.length} selected sections`}><b>{selected.length}</b><span>Open schedule studio</span></button></>;
  return <>{cloud}<section className="schedule-studio drawer" aria-labelledby="studio-title"><header><div><span className="kicker">REAL SCHEDULE STUDIO</span><h2 id="studio-title">{selected.length} section{selected.length===1?"":"s"} · {groups.size} course{groups.size===1?"":"s"}</h2><p>Select multiple sections for a course to let CourseFlow choose the strongest conflict-free combination.</p></div><div className="studio-actions"><button className="minimize-studio" onClick={()=>setOpen(false)} aria-label="Minimize schedule studio">Minimize</button><button className="generate-real" onClick={generate}>Generate conflict-free schedules</button></div></header>
    <div className="pool-chips">{selected.map(section=><button key={section.id} onClick={()=>toggle(section)} aria-label={`Remove ${section.code} section ${section.sectionNumber}`}><b>{section.code}</b> · {section.sectionNumber}<span aria-hidden="true">×</span></button>)}</div>
    {comparisons.length?<section className="section-comparisons"><h3>Section comparison</h3>{comparisons.map(([code,items])=><div className="comparison-group" key={code}><b>{code}</b><div role="table" aria-label={`${code} section comparison`}>{items.map(item=><div role="row" key={item.id}><span role="cell">Section {item.sectionNumber}</span><span role="cell">{item.meetings.map(formatMeeting).join(" · ")||"Meeting TBA"}</span><span role="cell">{item.capacity-item.enrolled>0?`${item.capacity-item.enrolled} open`:"Full"}</span><span role="cell">{item.medianGrade?`${item.medianGrade} median`:"Grades collecting"}</span></div>)}</div></div>)}</section>:null}
    {attempted?<section className="generated-real" aria-live="polite"><h3>{generated.length?`${generated.length} best conflict-free option${generated.length===1?"":"s"}`:"No complete conflict-free combination"}</h3>{generated.length?<div>{generated.map((schedule,index)=><article key={schedule.id}><header><span>Option {index+1}</span><strong>{schedule.score}/100</strong></header><WeeklyOptionCalendar schedule={schedule}/><div>{schedule.sections.map(section=><div key={section.id}><b>{section.code} · {section.sectionNumber}</b><span>{section.meetings.map(formatMeeting).join(" · ")||"Meeting TBA"}</span></div>)}</div><footer>{schedule.openSeats} total open seats · {schedule.sections.length} courses · no detected overlaps</footer></article>)}</div>:<p>Remove one conflicting section or add another section alternative, then generate again.</p>}</section>:null}
    <p className="studio-disclosure">Schedule pool is stored on this device. Verify final meeting and enrollment details in Berkeley’s official Class Schedule before enrolling.</p>
  </section></>;
}
