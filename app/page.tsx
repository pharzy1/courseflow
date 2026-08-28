"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bestFeasibleVariant, blocksFor, courses, findConflicts, scoreSchedule, searchCourses, type Block, type Priority, type Variant } from "../lib/courseflow";
type SavedSchedule = { selected:string[]; priorities:Priority[]; variant:Variant; savedAt:string };

const initial = ["COMPSCI 61B","DATA C100","STAT 134","DES INV 25"];
const priorityLabels: Record<Priority,string> = { morning:"No classes before 9", lunch:"Protect lunch break", rating:"Highly rated instructors" };

export default function Home() {
  const [query,setQuery]=useState("");
  const [selected,setSelected]=useState<string[]>(initial);
  const [hydrated,setHydrated]=useState(false);
  const [activeTab,setActiveTab]=useState("Discover");
  const [mobileNav,setMobileNav]=useState(false);
  const [compact,setCompact]=useState(false);
  const [filterOpen,setFilterOpen]=useState(false);
  const [quickFilter,setQuickFilter]=useState("All courses");
  const [sort,setSort]=useState("Best match");
  const [department,setDepartment]=useState("All departments");
  const [priorities,setPriorities]=useState<Priority[]>(["morning","lunch","rating"]);
  const [variant,setVariant]=useState<Variant>(0);
  const [explain,setExplain]=useState(false);
  const [toast,setToast]=useState("");
  const [savedSchedule,setSavedSchedule]=useState<SavedSchedule|null>(null);
  const [selectedEvent,setSelectedEvent]=useState<Block|null>(null);
  const catalogRef=useRef<HTMLElement>(null), plannerRef=useRef<HTMLElement>(null), roadmapRef=useRef<HTMLElement>(null);

  useEffect(()=>{ queueMicrotask(()=>{ try { const raw=localStorage.getItem("courseflow-schedule"); if(raw){ const saved=JSON.parse(raw) as SavedSchedule; if(Array.isArray(saved.selected)) setSelected(saved.selected); if(Array.isArray(saved.priorities)) setPriorities(saved.priorities); if(Number.isInteger(saved.variant)) setVariant(saved.variant); setSavedSchedule(saved); } } catch {} setHydrated(true); }); },[]);
  const selectedCourses=useMemo(()=>courses.filter(c=>selected.includes(c.code)),[selected]);
  const units=selectedCourses.reduce((sum,c)=>sum+c.units,0);
  const avgRating=selectedCourses.length ? selectedCourses.reduce((s,c)=>s+c.rating,0)/selectedCourses.length : 0;
  const blocks=useMemo(()=>blocksFor(selected,variant),[selected,variant]);
  const conflictPairs=useMemo(()=>findConflicts(blocks),[blocks]);
  const conflicts=conflictPairs.length;
  const scoreResult=selected.length?scoreSchedule(selected,variant,priorities):null;
  const score=scoreResult?.score??null;
  const freeMornings=scoreResult?.freeMornings??0;

  const filtered=useMemo(()=>searchCourses(query,quickFilter,department,sort),[query,quickFilter,department,sort]);

  const toggleCourse=(code:string)=>{setSelected(old=>old.includes(code)?old.filter(x=>x!==code):[...old,code]);setVariant(0);};
  const togglePriority=(p:Priority)=>setPriorities(old=>old.includes(p)?old.filter(x=>x!==p):[...old,p]);
  const navigate=(tab:string)=>{ setActiveTab(tab); setMobileNav(false); const ref=tab==="Discover"?catalogRef:tab==="My schedule"?plannerRef:roadmapRef; ref.current?.scrollIntoView({behavior:"smooth",block:"start"}); };
  const save=()=>{const snapshot={selected,priorities,variant,savedAt:new Date().toISOString()};localStorage.setItem("courseflow-schedule",JSON.stringify(snapshot));setSavedSchedule(snapshot);setToast("Saved on this device · reload to verify");setTimeout(()=>setToast(""),2600);};
  const restore=()=>{if(!savedSchedule||!window.confirm("Replace unsaved changes with your last saved schedule?"))return;setSelected(savedSchedule.selected);setPriorities(savedSchedule.priorities);setVariant(savedSchedule.variant);setToast("Last saved schedule restored");setTimeout(()=>setToast(""),2600);};
  const generate=()=>{if(!selected.length)return;const best=bestFeasibleVariant(selected,priorities);if(!best){setToast("No conflict-free alternative was found for this course selection.");setTimeout(()=>setToast(""),4000);return;}setVariant(best.variant);setToast(`Conflict-free Schedule ${best.variant?"B":"A"} ranks highest for your active priorities (${best.result.score}/100)`);setTimeout(()=>setToast(""),3000);};
  const isDirty=!!savedSchedule&&(JSON.stringify(selected)!==JSON.stringify(savedSchedule.selected)||JSON.stringify(priorities)!==JSON.stringify(savedSchedule.priorities)||variant!==savedSchedule.variant);

  return <main>
    <header className="topbar">
      <button className="brand" onClick={()=>navigate("Discover")} aria-label="CourseFlow home"><span className="brand-mark">CF</span><span>Course<span>Flow</span></span></button>
      <nav aria-label="Primary navigation" className={mobileNav?"open":""}>{["Discover","My schedule","Roadmap"].map(tab=><button key={tab} aria-current={activeTab===tab?"location":undefined} className={activeTab===tab?"active":""} onClick={()=>navigate(tab)}>{tab}{tab==="My schedule"&&<i>{selected.length}</i>}</button>)}</nav>
      <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={()=>setMobileNav(!mobileNav)}>Menu</button>
      <div className="term"><span>Fall 2026</span><b>PA</b></div>
    </header>

    <section className="hero" id="top"><div><div className="eyebrow"><span>INTERACTIVE DEMO</span> Curated sample catalog · device-local saving</div><h1>Your semester,<br/><em>without the guesswork.</em></h1><p>Build and compare conflict-free schedules around what matters to you—not just what fits.</p></div><div className="hero-stat"><strong>{selected.length}</strong><span>courses in your plan</span><small>{units} units selected</small></div></section>

    <section className="workspace">
      <aside className="catalog" ref={catalogRef} id="discover">
        <div className="catalog-head"><div><span className="kicker">COURSE EXPLORER</span><h2>Find your classes</h2></div><button className="filter-button" aria-expanded={filterOpen} aria-controls="advanced-filters" onClick={()=>setFilterOpen(!filterOpen)}>≡ <span>Filters</span></button></div>
        <label className="search"><span aria-hidden="true">⌕</span><span className="sr-only">Search courses</span><input aria-label="Search courses" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Course, topic, or professor"/><kbd aria-hidden="true">⌘ K</kbd></label>
        {filterOpen&&<div className="advanced-filters" id="advanced-filters"><label>Department<select value={department} onChange={e=>setDepartment(e.target.value)}><option>All departments</option><option>COMPSCI</option><option>DATA</option><option>STAT</option><option>DES INV</option><option>ECON</option><option>INFO</option></select></label><p>Six illustrative courses include one deliberate conflict fixture.</p></div>}
        <div className="quick-filters" aria-label="Quick filters">{["All courses","Open seats","Major req.","Conflict demo"].map(f=><button key={f} aria-pressed={quickFilter===f} className={quickFilter===f?"selected":""} onClick={()=>setQuickFilter(f)}>{f}</button>)}</div>
        <div className="results-label" aria-live="polite"><span>{filtered.length} {filtered.length===1?"RESULT":"RESULTS"}</span><label><span className="sr-only">Sort courses</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Best match</option><option>Rating</option><option>Availability</option><option>Course code</option></select></label></div>
        <div className="course-list">{filtered.length===0?<div className="empty-results"><b>No courses found</b><span>Try a course code like “CS 61B” or clear your filters.</span><button onClick={()=>{setQuery("");setQuickFilter("All courses");setDepartment("All departments");}}>Clear search and filters</button></div>:filtered.map(course=>{const picked=selected.includes(course.code);return <article className={`course-card ${picked?"picked":""}`} key={course.code}><div className={`course-stripe ${course.color}`}/><div className="course-body"><div className="course-title"><div><span className="code">{course.code}</span><span className="units">{course.units} units</span><h3>{course.title}</h3></div><button onClick={()=>toggleCourse(course.code)} aria-pressed={picked} aria-label={`${picked?"Remove":"Add"} ${course.code}`}>{picked?"✓":"+"}</button></div><div className="tags">{course.tags.map(t=><span key={t}>{t}</span>)}</div><div className="course-meta"><span>◷ {course.days} · {course.time}</span><span>★ {course.rating} · {course.instructor}</span></div><div className={`seats ${course.seats===0?"closed":course.seats<10?"low":""}`}><i/><span>{course.seats===0?"Waitlist only":`${course.seats} seats open`}</span><small>{course.seats}/{course.total}</small></div></div></article>})}</div>
      </aside>

      <section className="planner" ref={plannerRef} id="schedule" aria-label="Schedule studio">
        <div className="planner-head"><div><span className="kicker">SCHEDULE STUDIO</span><h2>Fall 2026</h2><p>{selected.length} {selected.length===1?"course":"courses"} · {units} units · Schedule {variant?"B":"A"}</p></div><div className="planner-actions"><button className="icon-button" aria-pressed={compact} onClick={()=>setCompact(!compact)}><span aria-hidden="true">{compact?"↗":"↙"}</span><span className="sr-only">{compact?"Expand":"Compact"} schedule</span></button>{savedSchedule&&<button className="restore-button" disabled={!isDirty} onClick={restore}>Restore saved</button>}<button className="save-button" disabled={!hydrated} onClick={save}>Save on device</button></div></div>
        {!selected.length?<div className="empty-schedule"><span>＋</span><h3>Start with a course</h3><p>Add classes from the explorer to calculate units, conflicts, and fit.</p><button onClick={()=>navigate("Discover")}>Browse courses</button></div>:<>
          <div className="score-card"><div className="score"><strong>{score}</strong><span>/100</span></div><div className="score-copy"><b>{conflicts?"Needs attention":"Preference fit"}</b><span>Calculated from the current schedule</span></div><div className="score-metrics"><span><i className={conflicts?"red-dot":"green-dot"}/>{conflicts?`${conflicts} overlap${conflicts>1?"s":""}`:"No conflicts"}</span><span><i className="blue-dot"/>{freeMornings} free mornings</span><span><i className="gold-dot"/>{avgRating.toFixed(1)} avg. instructor</span></div><button className="why" aria-expanded={explain} aria-controls="score-explanation" onClick={()=>setExplain(!explain)}>Why this score? {explain?"↑":"↓"}</button></div>
          {conflictPairs.length>0&&<div className="conflict-alert" role="alert"><b>Schedule conflict detected</b>{conflictPairs.map(([a,b])=><span key={`${a.course}-${b.course}-${a.day}`}>{a.dayName}: {a.code} overlaps {b.code}</span>)}</div>}
          {explain&&scoreResult&&<div className="score-explanation" id="score-explanation"><div><b>Base feasibility</b><span>{scoreResult.contributions.base}</span></div>{priorities.includes("rating")&&<div><b>Instructor priority</b><span>+{scoreResult.contributions.rating}</span></div>}{priorities.includes("morning")&&<div><b>Free-morning priority</b><span>+{scoreResult.contributions.morning}</span></div>}{priorities.includes("lunch")&&<div><b>Lunch-break priority</b><span>+{scoreResult.contributions.lunch}</span></div>}<div><b>Conflict penalty</b><span>{scoreResult.contributions.conflicts}</span></div><p><b>Total: {scoreResult.score}/100.</b> Only active priorities contribute; Generate compares both visible schedule variants using this same calculation.</p></div>}
          <p className="scroll-hint">Swipe or scroll horizontally to see Wednesday–Friday →</p>
          <div className={`calendar ${compact?"compact":""}`} role="region" aria-label={`Weekly calendar for Schedule ${variant?"B":"A"}`}><div className="days"><span/><b>MON</b><b>TUE</b><b>WED</b><b>THU</b><b>FRI</b></div><div className="calendar-body"><div className="times">{["9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM"].map(t=><span key={t}>{t}</span>)}</div><div className="grid-lines">{Array.from({length:9}).map((_,i)=><i key={i}/>)}</div>{blocks.map(b=><button key={`${b.course}-${b.day}`} className={`class-block ${b.color}`} style={{left:`calc(${b.day} * 20% + 5px)`,top:`${b.start*42+4}px`,height:`${Math.max(44,b.span*21-6)}px`}} aria-pressed={selectedEvent?.course===b.course&&selectedEvent?.day===b.day} aria-label={`${b.code}, ${b.title}, ${b.dayName} ${b.time}, ${b.meta}`} onClick={()=>setSelectedEvent(b)}><b>{b.code}</b><span>{b.title}</span><small>{b.meta}</small></button>)}</div></div>
          <section className="event-detail" aria-live="polite" aria-label="Selected class details">{selectedEvent?<><div className={`event-color ${selectedEvent.color}`}/><div><span className="kicker">SELECTED MEETING</span><h3>{selectedEvent.code} · {selectedEvent.title}</h3><p>{selectedEvent.dayName}, {selectedEvent.time} · {selectedEvent.meta}</p><small>{courses.find(c=>c.code===selectedEvent.course)?.units} units · {courses.find(c=>c.code===selectedEvent.course)?.seats||0} seats open</small></div><button onClick={()=>setSelectedEvent(null)} aria-label="Close class details">×</button></>:<p>Select any calendar event to inspect its complete meeting details.</p>}</section>
          <details className="accessible-agenda"><summary>All schedule meetings</summary><ul>{blocks.map((b,i)=><li key={i}><b>{b.dayName}, {b.time}</b><span>{b.code} · {b.title}</span><small>{b.meta}</small></li>)}</ul></details>
          <div className="preferences"><div><span className="kicker">YOUR PRIORITIES</span><h3>What makes a good schedule?</h3></div><div className="pref-chips">{(Object.keys(priorityLabels) as Priority[]).map(p=><button key={p} aria-pressed={priorities.includes(p)} className={priorities.includes(p)?"selected":""} onClick={()=>togglePriority(p)}>{p==="morning"?"☀":p==="lunch"?"▤":"★"} {priorityLabels[p]}</button>)}</div><button className="generate" disabled={!selected.length} onClick={generate}>Rank A vs. B<span>→</span></button></div>
        </>}
      </section>
    </section>

    <section className="roadmap" ref={roadmapRef} id="roadmap"><div><span className="kicker">DEGREE ROADMAP</span><h2>From today to graduation</h2><p>See how this semester supports a four-term plan. This preview uses your current selection—no degree audit is claimed.</p></div><div className="term-grid">{[{name:"Fall 2026",state:"Current",count:selected.length,units},{name:"Spring 2027",state:"Planned",count:4,units:16},{name:"Fall 2027",state:"Open",count:0,units:0}].map((t,i)=><article key={t.name} className={i===0?"current":""}><span>{t.state}</span><h3>{t.name}</h3><b>{t.count} courses · {t.units} units</b><div className="progress"><i style={{width:`${Math.min(100,t.units/16*100)}%`}}/></div></article>)}</div></section>
    <section className="engineering-proof" aria-labelledby="engineering-title"><div><span className="kicker">ENGINEERING EVIDENCE</span><h2 id="engineering-title">Built to be inspected.</h2><p>The ranking engine is separated from the interface and verified through unit, accessibility, and browser-level tests on every change.</p></div><div className="proof-grid"><article><b>Deterministic engine</b><span>Pure TypeScript functions for search, conflicts, scoring, and ranking.</span></article><article><b>Regression coverage</b><span>Node tests plus Playwright and axe checks across core workflows.</span></article><article><b>Continuous integration</b><span>GitHub Actions builds and tests every pushed commit.</span></article></div><div className="proof-actions"><a href="https://github.com/pharzy1/courseflow" target="_blank" rel="noreferrer">View source on GitHub ↗</a><a href="https://github.com/pharzy1/courseflow/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noreferrer">Read architecture ↗</a></div></section>
    <footer><div><b>Built for Berkeley students.</b><span>Interactive prototype · deterministic schedule ranking · device-local persistence</span></div><div className="tech"><span>React</span><span>TypeScript</span><span>Playwright</span><span>axe</span></div><p>Course and enrollment data are illustrative sample data. CourseFlow is an independent student project and is not affiliated with UC Berkeley.</p></footer>
    <div className="toast-region" role="status" aria-live="polite">{toast&&<div className="toast">{toast}</div>}</div>
  </main>;
}
