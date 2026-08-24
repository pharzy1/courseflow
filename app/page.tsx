"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Course = { code:string; short:string; title:string; units:number; tags:string[]; seats:number; total:number; instructor:string; rating:number; time:string; days:string; color:string; keywords:string[] };
type Block = { course:string; code:string; title:string; meta:string; day:number; start:number; span:number; color:string; time:string; dayName:string };
type Priority = "morning" | "lunch" | "rating";

const courses: Course[] = [
  { code:"COMPSCI 61B", short:"CS 61B", title:"Data Structures", units:4, tags:["Major","Technical"], seats:12, total:320, instructor:"Paul Hilfinger", rating:4.8, time:"10:00–11:00 AM", days:"MWF", color:"blue", keywords:["computer science","cs61b","programming","algorithms"] },
  { code:"DATA C100", short:"DATA C100", title:"Principles & Techniques of Data Science", units:4, tags:["Major","Data"], seats:4, total:840, instructor:"Joseph Gonzalez", rating:4.7, time:"2:00–3:30 PM", days:"TuTh", color:"coral", keywords:["machine learning","data100","python","statistics"] },
  { code:"STAT 134", short:"STAT 134", title:"Concepts of Probability", units:4, tags:["Major","Math"], seats:31, total:210, instructor:"Aditya Guntuboyina", rating:4.6, time:"9:30–11:00 AM", days:"TuTh", color:"violet", keywords:["probability","statistics","math"] },
  { code:"DES INV 25", short:"DES INV 25", title:"Designing for Human Behavior", units:3, tags:["Breadth","Design"], seats:8, total:60, instructor:"Eric Paulos", rating:4.9, time:"1:00–2:30 PM", days:"MW", color:"green", keywords:["design","human behavior","ux"] },
  { code:"ECON 100A", short:"ECON 100A", title:"Microeconomic Analysis", units:4, tags:["Breadth","Social"], seats:0, total:180, instructor:"Martha Olney", rating:4.5, time:"11:00–12:30 PM", days:"TuTh", color:"gold", keywords:["economics","microeconomics","social science"] },
];

const baseBlocks: Block[] = [
  {course:"COMPSCI 61B",code:"CS 61B",title:"Data Structures",meta:"Wheeler 150 · Hilfinger",day:0,start:1,span:2,color:"blue",time:"10:00–11:00 AM",dayName:"Monday"},
  {course:"COMPSCI 61B",code:"CS 61B",title:"Data Structures",meta:"Wheeler 150 · Hilfinger",day:2,start:1,span:2,color:"blue",time:"10:00–11:00 AM",dayName:"Wednesday"},
  {course:"COMPSCI 61B",code:"CS 61B",title:"Data Structures",meta:"Wheeler 150 · Hilfinger",day:4,start:1,span:2,color:"blue",time:"10:00–11:00 AM",dayName:"Friday"},
  {course:"STAT 134",code:"STAT 134",title:"Probability",meta:"Evans 10 · Guntuboyina",day:1,start:.5,span:3,color:"violet",time:"9:30–11:00 AM",dayName:"Tuesday"},
  {course:"STAT 134",code:"STAT 134",title:"Probability",meta:"Evans 10 · Guntuboyina",day:3,start:.5,span:3,color:"violet",time:"9:30–11:00 AM",dayName:"Thursday"},
  {course:"DES INV 25",code:"DES INV 25",title:"Human Behavior",meta:"Jacobs 310 · Paulos",day:0,start:4,span:3,color:"green",time:"1:00–2:30 PM",dayName:"Monday"},
  {course:"DES INV 25",code:"DES INV 25",title:"Human Behavior",meta:"Jacobs 310 · Paulos",day:2,start:4,span:3,color:"green",time:"1:00–2:30 PM",dayName:"Wednesday"},
  {course:"DATA C100",code:"DATA C100",title:"Data Science",meta:"Dwinelle 155 · Gonzalez",day:1,start:6,span:3,color:"coral",time:"2:00–3:30 PM",dayName:"Tuesday"},
  {course:"DATA C100",code:"DATA C100",title:"Data Science",meta:"Dwinelle 155 · Gonzalez",day:3,start:6,span:3,color:"coral",time:"2:00–3:30 PM",dayName:"Thursday"},
  {course:"ECON 100A",code:"ECON 100A",title:"Microeconomics",meta:"VLSB 2050 · Olney",day:1,start:2,span:3,color:"gold",time:"11:00 AM–12:30 PM",dayName:"Tuesday"},
  {course:"ECON 100A",code:"ECON 100A",title:"Microeconomics",meta:"VLSB 2050 · Olney",day:3,start:2,span:3,color:"gold",time:"11:00 AM–12:30 PM",dayName:"Thursday"},
];

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
  const [variant,setVariant]=useState(0);
  const [explain,setExplain]=useState(false);
  const [toast,setToast]=useState("");
  const catalogRef=useRef<HTMLElement>(null), plannerRef=useRef<HTMLElement>(null), roadmapRef=useRef<HTMLElement>(null);

  useEffect(()=>{ try { const raw=localStorage.getItem("courseflow-schedule"); if(raw){ const saved=JSON.parse(raw); if(Array.isArray(saved.selected)) setSelected(saved.selected); if(Array.isArray(saved.priorities)) setPriorities(saved.priorities); if(Number.isInteger(saved.variant)) setVariant(saved.variant); } } catch {} setHydrated(true); },[]);
  const selectedCourses=useMemo(()=>courses.filter(c=>selected.includes(c.code)),[selected]);
  const units=selectedCourses.reduce((sum,c)=>sum+c.units,0);
  const avgRating=selectedCourses.length ? selectedCourses.reduce((s,c)=>s+c.rating,0)/selectedCourses.length : 0;
  const blocks=useMemo(()=>baseBlocks.filter(b=>selected.includes(b.course)).map(b=>{
    if(variant===0) return b;
    const nextStart=b.course==="COMPSCI 61B"?b.start+2:b.course==="DATA C100"?b.start-2:b.start;
    const nextTime=b.course==="COMPSCI 61B"?"11:00 AM–12:00 PM":b.course==="DATA C100"?"1:00–2:30 PM":b.time;
    return {...b,start:nextStart,time:nextTime};
  }),[selected,variant]);
  const conflicts=useMemo(()=>blocks.filter((b,i)=>blocks.some((o,j)=>j<i&&o.day===b.day&&Math.max(o.start,b.start)<Math.min(o.start+o.span/2,b.start+b.span/2))).length,[blocks]);
  const freeMornings=5-new Set(blocks.filter(b=>b.start<3).map(b=>b.day)).size;
  const score=selected.length ? Math.max(45,Math.min(99,Math.round(70+avgRating*4+freeMornings*2-conflicts*15+(variant?3:0)))) : null;

  const normalized=query.toLowerCase().replace(/\s+/g,"").replace("compsci","cs");
  const filtered=useMemo(()=>{
    let list=courses.filter(c=>{ const hay=[c.code,c.short,c.title,c.instructor,...c.keywords].join(" ").toLowerCase().replace(/\s+/g,"").replace("compsci","cs"); return !normalized||hay.includes(normalized); });
    if(quickFilter==="Open seats") list=list.filter(c=>c.seats>0);
    if(quickFilter==="Major req.") list=list.filter(c=>c.tags.includes("Major"));
    if(department!=="All departments") list=list.filter(c=>c.code.startsWith(department));
    if(sort==="Rating") list=[...list].sort((a,b)=>b.rating-a.rating);
    if(sort==="Availability") list=[...list].sort((a,b)=>b.seats-a.seats);
    if(sort==="Course code") list=[...list].sort((a,b)=>a.code.localeCompare(b.code));
    return list;
  },[normalized,quickFilter,department,sort]);

  const toggleCourse=(code:string)=>{setSelected(old=>old.includes(code)?old.filter(x=>x!==code):[...old,code]);setVariant(0);};
  const togglePriority=(p:Priority)=>setPriorities(old=>old.includes(p)?old.filter(x=>x!==p):[...old,p]);
  const navigate=(tab:string)=>{ setActiveTab(tab); setMobileNav(false); const ref=tab==="Discover"?catalogRef:tab==="My schedule"?plannerRef:roadmapRef; ref.current?.scrollIntoView({behavior:"smooth",block:"start"}); };
  const save=()=>{localStorage.setItem("courseflow-schedule",JSON.stringify({selected,priorities,variant}));setToast("Saved on this device · reload to verify");setTimeout(()=>setToast(""),2600);};
  const generate=()=>{if(!selected.length)return;setVariant(v=>v===0?1:0);setToast(`Generated Schedule ${variant===0?"B":"A"} from ${selected.length} selected courses`);setTimeout(()=>setToast(""),2600);};

  return <main>
    <header className="topbar">
      <button className="brand" onClick={()=>navigate("Discover")} aria-label="CourseFlow home"><span className="brand-mark">CF</span><span>Course<span>Flow</span></span></button>
      <nav aria-label="Primary navigation" className={mobileNav?"open":""}>{["Discover","My schedule","Roadmap"].map(tab=><button key={tab} aria-current={activeTab===tab?"page":undefined} className={activeTab===tab?"active":""} onClick={()=>navigate(tab)}>{tab}{tab==="My schedule"&&<i>{selected.length}</i>}</button>)}</nav>
      <button className="mobile-menu" aria-label="Toggle navigation" aria-expanded={mobileNav} onClick={()=>setMobileNav(!mobileNav)}>Menu</button>
      <div className="term"><span>Fall 2026</span><b>PA</b></div>
    </header>

    <section className="hero" id="top"><div><div className="eyebrow"><span>INTERACTIVE DEMO</span> Curated sample catalog · device-local saving</div><h1>Your semester,<br/><em>without the guesswork.</em></h1><p>Build and compare conflict-free schedules around what matters to you—not just what fits.</p></div><div className="hero-stat"><strong>{selected.length}</strong><span>courses in your plan</span><small>{units} units selected</small></div></section>

    <section className="workspace">
      <aside className="catalog" ref={catalogRef} id="discover">
        <div className="catalog-head"><div><span className="kicker">COURSE EXPLORER</span><h2>Find your classes</h2></div><button className="filter-button" aria-expanded={filterOpen} aria-controls="advanced-filters" onClick={()=>setFilterOpen(!filterOpen)}>≡ <span>Filters</span></button></div>
        <label className="search"><span aria-hidden="true">⌕</span><span className="sr-only">Search courses</span><input aria-label="Search courses" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Course, topic, or professor"/><kbd aria-hidden="true">⌘ K</kbd></label>
        {filterOpen&&<div className="advanced-filters" id="advanced-filters"><label>Department<select value={department} onChange={e=>setDepartment(e.target.value)}><option>All departments</option><option>COMPSCI</option><option>DATA</option><option>STAT</option><option>DES INV</option><option>ECON</option></select></label><p>Showing a curated five-course prototype catalog.</p></div>}
        <div className="quick-filters" aria-label="Quick filters">{["All courses","Open seats","Major req."].map(f=><button key={f} aria-pressed={quickFilter===f} className={quickFilter===f?"selected":""} onClick={()=>setQuickFilter(f)}>{f}</button>)}</div>
        <div className="results-label" aria-live="polite"><span>{filtered.length} {filtered.length===1?"RESULT":"RESULTS"}</span><label><span className="sr-only">Sort courses</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Best match</option><option>Rating</option><option>Availability</option><option>Course code</option></select></label></div>
        <div className="course-list">{filtered.length===0?<div className="empty-results"><b>No courses found</b><span>Try a course code like “CS 61B” or clear your filters.</span><button onClick={()=>{setQuery("");setQuickFilter("All courses");setDepartment("All departments");}}>Clear search and filters</button></div>:filtered.map(course=>{const picked=selected.includes(course.code);return <article className={`course-card ${picked?"picked":""}`} key={course.code}><div className={`course-stripe ${course.color}`}/><div className="course-body"><div className="course-title"><div><span className="code">{course.code}</span><span className="units">{course.units} units</span><h3>{course.title}</h3></div><button onClick={()=>toggleCourse(course.code)} aria-pressed={picked} aria-label={`${picked?"Remove":"Add"} ${course.code}`}>{picked?"✓":"+"}</button></div><div className="tags">{course.tags.map(t=><span key={t}>{t}</span>)}</div><div className="course-meta"><span>◷ {course.days} · {course.time}</span><span>★ {course.rating} · {course.instructor}</span></div><div className={`seats ${course.seats===0?"closed":course.seats<10?"low":""}`}><i/><span>{course.seats===0?"Waitlist only":`${course.seats} seats open`}</span><small>{course.seats}/{course.total}</small></div></div></article>})}</div>
      </aside>

      <section className="planner" ref={plannerRef} id="schedule" aria-label="Schedule studio">
        <div className="planner-head"><div><span className="kicker">SCHEDULE STUDIO</span><h2>Fall 2026</h2><p>{selected.length} {selected.length===1?"course":"courses"} · {units} units · Schedule {variant?"B":"A"}</p></div><div className="planner-actions"><button className="icon-button" aria-pressed={compact} onClick={()=>setCompact(!compact)}><span aria-hidden="true">{compact?"↗":"↙"}</span><span className="sr-only">{compact?"Expand":"Compact"} schedule</span></button><button className="save-button" disabled={!hydrated} onClick={save}>Save on device</button></div></div>
        {!selected.length?<div className="empty-schedule"><span>＋</span><h3>Start with a course</h3><p>Add classes from the explorer to calculate units, conflicts, and fit.</p><button onClick={()=>navigate("Discover")}>Browse courses</button></div>:<>
          <div className="score-card"><div className="score"><strong>{score}</strong><span>/100</span></div><div className="score-copy"><b>{conflicts?"Needs attention":variant?"Optimized alternative":"Strong fit"}</b><span>Calculated from the current schedule</span></div><div className="score-metrics"><span><i className={conflicts?"red-dot":"green-dot"}/>{conflicts?`${conflicts} conflict${conflicts>1?"s":""}`:"No conflicts"}</span><span><i className="blue-dot"/>{freeMornings} free mornings</span><span><i className="gold-dot"/>{avgRating.toFixed(1)} avg. instructor</span></div><button className="why" aria-expanded={explain} aria-controls="score-explanation" onClick={()=>setExplain(!explain)}>Why this score? {explain?"↑":"↓"}</button></div>
          {explain&&<div className="score-explanation" id="score-explanation"><div><b>Base feasibility</b><span>70 points</span></div><div><b>Instructor quality</b><span>+{Math.round(avgRating*4)}</span></div><div><b>Free mornings</b><span>+{freeMornings*2}</span></div><div><b>Conflicts</b><span>−{conflicts*15}</span></div><p>Scores are computed locally from the visible sample data and selected priorities.</p></div>}
          <div className={`calendar ${compact?"compact":""}`} role="region" aria-label={`Weekly calendar for Schedule ${variant?"B":"A"}`}><div className="days"><span/><b>MON</b><b>TUE</b><b>WED</b><b>THU</b><b>FRI</b></div><div className="calendar-body"><div className="times">{["9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM"].map(t=><span key={t}>{t}</span>)}</div><div className="grid-lines">{Array.from({length:9}).map((_,i)=><i key={i}/>)}</div>{blocks.map((b,i)=><button key={`${b.course}-${b.day}`} className={`class-block ${b.color}`} style={{left:`calc(${b.day} * 20% + 5px)`,top:`${b.start*42+4}px`,height:`${b.span*21-6}px`}} aria-label={`${b.code}, ${b.title}, ${b.dayName} ${b.time}, ${b.meta}`}><b>{b.code}</b><span>{b.title}</span><small>{b.meta}</small></button>)}</div></div>
          <details className="accessible-agenda"><summary>Schedule details</summary><ul>{blocks.map((b,i)=><li key={i}><b>{b.dayName}, {b.time}</b><span>{b.code} · {b.title}</span><small>{b.meta}</small></li>)}</ul></details>
          <div className="preferences"><div><span className="kicker">YOUR PRIORITIES</span><h3>What makes a good schedule?</h3></div><div className="pref-chips">{(Object.keys(priorityLabels) as Priority[]).map(p=><button key={p} aria-pressed={priorities.includes(p)} className={priorities.includes(p)?"selected":""} onClick={()=>togglePriority(p)}>{p==="morning"?"☀":p==="lunch"?"▤":"★"} {priorityLabels[p]}</button>)}</div><button className="generate" disabled={!selected.length} onClick={generate}>Generate Schedule {variant?"A":"B"}<span>→</span></button></div>
        </>}
      </section>
    </section>

    <section className="roadmap" ref={roadmapRef} id="roadmap"><div><span className="kicker">DEGREE ROADMAP</span><h2>From today to graduation</h2><p>See how this semester supports a four-term plan. This preview uses your current selection—no degree audit is claimed.</p></div><div className="term-grid">{[{name:"Fall 2026",state:"Current",count:selected.length,units},{name:"Spring 2027",state:"Planned",count:4,units:16},{name:"Fall 2027",state:"Open",count:0,units:0}].map((t,i)=><article key={t.name} className={i===0?"current":""}><span>{t.state}</span><h3>{t.name}</h3><b>{t.count} courses · {t.units} units</b><div className="progress"><i style={{width:`${Math.min(100,t.units/16*100)}%`}}/></div></article>)}</div></section>
    <footer><div><b>Built for Berkeley students.</b><span>Interactive prototype · deterministic schedule ranking · device-local persistence</span></div><div className="tech"><span>React</span><span>TypeScript</span><span>Accessible UI</span><span>Responsive</span></div><p>Course and enrollment data are illustrative sample data. CourseFlow is an independent student project and is not affiliated with UC Berkeley.</p></footer>
    <div className="toast-region" role="status" aria-live="polite">{toast&&<div className="toast">{toast}</div>}</div>
  </main>;
}
