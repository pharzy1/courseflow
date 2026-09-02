"use client";
import { createContext,useContext,useEffect,useMemo,useState,type ReactNode } from "react";
import type { CatalogRecord } from "../lib/data/types";
import { formatMeeting,generateConflictFreeSchedules } from "../lib/real-schedule";

type StudioContextValue={selected:CatalogRecord[];toggle:(record:CatalogRecord)=>void};
const StudioContext=createContext<StudioContextValue|null>(null),storageKey="courseflow-real-section-pool-v1";
const useStudio=()=>{const value=useContext(StudioContext);if(!value)throw new Error("Schedule studio provider missing");return value;};

export function ScheduleStudioProvider({children}:{children:ReactNode}){
  const [selected,setSelected]=useState<CatalogRecord[]>([]);
  useEffect(()=>{const timer=window.setTimeout(()=>{try{const saved=JSON.parse(localStorage.getItem(storageKey)??"[]");if(Array.isArray(saved))setSelected(saved.slice(0,18));}catch{}},0);return()=>window.clearTimeout(timer);},[]);
  const toggle=(record:CatalogRecord)=>setSelected(current=>{const next=current.some(item=>item.id===record.id)?current.filter(item=>item.id!==record.id):current.length>=18?current:[...current,record];localStorage.setItem(storageKey,JSON.stringify(next));return next;});
  return <StudioContext.Provider value={{selected,toggle}}>{children}</StudioContext.Provider>;
}

export function SectionPoolButton({record}:{record:CatalogRecord}){const {selected,toggle}=useStudio(),active=selected.some(item=>item.id===record.id);return <button className={`pool-button ${active?"active":""}`} aria-pressed={active} onClick={()=>toggle(record)}>{active?"Remove from schedule pool":"Add to schedule pool"}</button>;}

export function ScheduleStudio(){
  const {selected,toggle}=useStudio(),[generated,setGenerated]=useState<ReturnType<typeof generateConflictFreeSchedules>>([]),[attempted,setAttempted]=useState(false),groups=useMemo(()=>{const result=new Map<string,CatalogRecord[]>();for(const item of selected)result.set(item.code,[...(result.get(item.code)??[]),item]);return result;},[selected]),comparisons=[...groups.entries()].filter(([,items])=>items.length>1);
  const generate=()=>{setGenerated(generateConflictFreeSchedules(selected));setAttempted(true);};
  if(!selected.length)return <section className="schedule-studio empty"><div><span className="kicker">REAL SCHEDULE STUDIO</span><h2>Build from actual sections.</h2><p>Add sections from the catalog to compare alternatives and generate conflict-free combinations.</p></div></section>;
  return <section className="schedule-studio" aria-labelledby="studio-title"><header><div><span className="kicker">REAL SCHEDULE STUDIO</span><h2 id="studio-title">{selected.length} section{selected.length===1?"":"s"} · {groups.size} course{groups.size===1?"":"s"}</h2><p>Select multiple sections for a course to let CourseFlow choose the strongest conflict-free combination.</p></div><button className="generate-real" onClick={generate}>Generate conflict-free schedules</button></header>
    <div className="pool-chips">{selected.map(section=><button key={section.id} onClick={()=>toggle(section)} aria-label={`Remove ${section.code} section ${section.sectionNumber}`}><b>{section.code}</b> · {section.sectionNumber}<span aria-hidden="true">×</span></button>)}</div>
    {comparisons.length?<section className="section-comparisons"><h3>Section comparison</h3>{comparisons.map(([code,items])=><div className="comparison-group" key={code}><b>{code}</b><div role="table" aria-label={`${code} section comparison`}>{items.map(item=><div role="row" key={item.id}><span role="cell">Section {item.sectionNumber}</span><span role="cell">{item.meetings.map(formatMeeting).join(" · ")||"Meeting TBA"}</span><span role="cell">{item.capacity-item.enrolled>0?`${item.capacity-item.enrolled} open`:"Full"}</span><span role="cell">{item.medianGrade?`${item.medianGrade} median`:"Grades collecting"}</span></div>)}</div></div>)}</section>:null}
    {attempted?<section className="generated-real" aria-live="polite"><h3>{generated.length?`${generated.length} best conflict-free option${generated.length===1?"":"s"}`:"No complete conflict-free combination"}</h3>{generated.length?<div>{generated.map((schedule,index)=><article key={schedule.id}><header><span>Option {index+1}</span><strong>{schedule.score}/100</strong></header><div>{schedule.sections.map(section=><div key={section.id}><b>{section.code} · {section.sectionNumber}</b><span>{section.meetings.map(formatMeeting).join(" · ")||"Meeting TBA"}</span></div>)}</div><footer>{schedule.openSeats} total open seats · {schedule.sections.length} courses · no detected overlaps</footer></article>)}</div>:<p>Remove one conflicting section or add another section alternative, then generate again.</p>}</section>:null}
    <p className="studio-disclosure">Schedule pool is stored on this device. Verify final meeting and enrollment details in Berkeley’s official Class Schedule before enrolling.</p>
  </section>;
}
