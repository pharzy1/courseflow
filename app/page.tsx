"use client";

import { useMemo, useState } from "react";

type Course = {
  code: string;
  title: string;
  units: number;
  tags: string[];
  seats: number;
  total: number;
  instructor: string;
  rating: number;
  time: string;
  days: string;
  color: string;
};

const courses: Course[] = [
  { code: "COMPSCI 61B", title: "Data Structures", units: 4, tags: ["Major", "Technical"], seats: 12, total: 320, instructor: "Paul Hilfinger", rating: 4.8, time: "10:00–11:00 AM", days: "MWF", color: "blue" },
  { code: "DATA C100", title: "Principles & Techniques of Data Science", units: 4, tags: ["Major", "Data"], seats: 4, total: 840, instructor: "Joseph Gonzalez", rating: 4.7, time: "2:00–3:30 PM", days: "TuTh", color: "coral" },
  { code: "STAT 134", title: "Concepts of Probability", units: 4, tags: ["Major", "Math"], seats: 31, total: 210, instructor: "Aditya Guntuboyina", rating: 4.6, time: "9:30–11:00 AM", days: "TuTh", color: "violet" },
  { code: "DES INV 25", title: "Designing for Human Behavior", units: 3, tags: ["Breadth", "Design"], seats: 8, total: 60, instructor: "Eric Paulos", rating: 4.9, time: "1:00–2:30 PM", days: "MW", color: "green" },
  { code: "ECON 100A", title: "Microeconomic Analysis", units: 4, tags: ["Breadth", "Social"], seats: 0, total: 180, instructor: "Martha Olney", rating: 4.5, time: "11:00–12:30 PM", days: "TuTh", color: "gold" },
];

const blocks = [
  { code: "CS 61B", title: "Data Structures", meta: "Wheeler 150 · Hilfinger", day: 0, start: 1, span: 2, color: "blue" },
  { code: "CS 61B", title: "Data Structures", meta: "Wheeler 150 · Hilfinger", day: 2, start: 1, span: 2, color: "blue" },
  { code: "CS 61B", title: "Data Structures", meta: "Wheeler 150 · Hilfinger", day: 4, start: 1, span: 2, color: "blue" },
  { code: "STAT 134", title: "Probability", meta: "Evans 10 · Guntuboyina", day: 1, start: .5, span: 3, color: "violet" },
  { code: "STAT 134", title: "Probability", meta: "Evans 10 · Guntuboyina", day: 3, start: .5, span: 3, color: "violet" },
  { code: "DES INV 25", title: "Human Behavior", meta: "Jacobs 310 · Paulos", day: 0, start: 4, span: 3, color: "green" },
  { code: "DES INV 25", title: "Human Behavior", meta: "Jacobs 310 · Paulos", day: 2, start: 4, span: 3, color: "green" },
  { code: "DATA C100", title: "Data Science", meta: "Dwinelle 155 · Gonzalez", day: 1, start: 6, span: 3, color: "coral" },
  { code: "DATA C100", title: "Data Science", meta: "Dwinelle 155 · Gonzalez", day: 3, start: 6, span: 3, color: "coral" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(["COMPSCI 61B", "DATA C100", "STAT 134", "DES INV 25"]);
  const [activeTab, setActiveTab] = useState("Discover");
  const [compact, setCompact] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [saved, setSaved] = useState(false);

  const filtered = useMemo(() => courses.filter((c) => `${c.code} ${c.title}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const toggleCourse = (code: string) => setSelected((old) => old.includes(code) ? old.filter((x) => x !== code) : [...old, code]);

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="CourseFlow home"><span className="brand-mark">CF</span><span>Course<span>Flow</span></span></a>
        <nav aria-label="Primary navigation">
          {["Discover", "My schedule", "Roadmap"].map((tab) => <button key={tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>{tab}{tab === "My schedule" && <i>{selected.length}</i>}</button>)}
        </nav>
        <div className="term"><span>Fall 2026</span><b>PA</b></div>
      </header>

      <section className="hero" id="top">
        <div>
          <div className="eyebrow"><span>LIVE</span> 2,841 sections indexed · updated 4 min ago</div>
          <h1>Your semester,<br/><em>without the guesswork.</em></h1>
          <p>Build a conflict-free Berkeley schedule around what matters to you—not just what fits.</p>
        </div>
        <div className="hero-stat"><strong>4.8 hrs</strong><span>average time saved</span><small>across 286 beta schedules</small></div>
      </section>

      <section className="workspace">
        <aside className="catalog">
          <div className="catalog-head">
            <div><span className="kicker">COURSE EXPLORER</span><h2>Find your classes</h2></div>
            <button className="filter-button" aria-label="Open filters">⌘ <span>Filters</span></button>
          </div>
          <label className="search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by course, topic, or professor"/><kbd>⌘ K</kbd></label>
          <div className="quick-filters"><button className="selected">All courses</button><button>Open seats</button><button>Major req.</button><button>≤ 4 units</button></div>
          <div className="results-label"><span>{filtered.length * 63 + 2} RESULTS</span><button>Sort: Best match⌄</button></div>
          <div className="course-list">
            {filtered.map((course) => {
              const isSelected = selected.includes(course.code);
              return <article className={`course-card ${isSelected ? "picked" : ""}`} key={course.code}>
                <div className={`course-stripe ${course.color}`}/>
                <div className="course-body">
                  <div className="course-title"><div><span className="code">{course.code}</span><span className="units">{course.units} units</span><h3>{course.title}</h3></div><button onClick={() => toggleCourse(course.code)} aria-label={`${isSelected ? "Remove" : "Add"} ${course.code}`}>{isSelected ? "✓" : "+"}</button></div>
                  <div className="tags">{course.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="course-meta"><span>◷ {course.days} · {course.time}</span><span>★ {course.rating} · {course.instructor}</span></div>
                  <div className={`seats ${course.seats === 0 ? "closed" : course.seats < 10 ? "low" : ""}`}><i/><span>{course.seats === 0 ? "Waitlist only" : `${course.seats} seats open`}</span><small>{course.seats}/{course.total}</small></div>
                </div>
              </article>;
            })}
          </div>
        </aside>

        <section className="planner">
          <div className="planner-head">
            <div><span className="kicker">SCHEDULE STUDIO</span><h2>Fall 2026</h2><p>{selected.length} courses · 15 units · Schedule A</p></div>
            <div className="planner-actions"><button className="icon-button" onClick={() => setCompact(!compact)} title="Toggle compact schedule">{compact ? "↗" : "↙"}</button><button className="save-button" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 1800); }}>{saved ? "✓ Saved" : "Save schedule"}</button></div>
          </div>

          <div className="score-card">
            <div className="score"><strong>{generated ? 97 : 94}</strong><span>/100</span></div>
            <div className="score-copy"><b>{generated ? "Optimized for you" : "Excellent fit"}</b><span>Based on your preferences</span></div>
            <div className="score-metrics"><span><i className="green-dot"/>No conflicts</span><span><i className="blue-dot"/>2 free mornings</span><span><i className="gold-dot"/>4.7 avg. instructor</span></div>
            <button className="why">Why this score? ↗</button>
          </div>

          <div className={`calendar ${compact ? "compact" : ""}`}>
            <div className="days"><span/><b>MON</b><b>TUE</b><b>WED</b><b>THU</b><b>FRI</b></div>
            <div className="calendar-body">
              <div className="times">{["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM"].map((t) => <span key={t}>{t}</span>)}</div>
              <div className="grid-lines">{Array.from({length: 9}).map((_, i) => <i key={i}/>)}</div>
              {blocks.filter((b) => selected.some((s) => s.includes(b.code.split(" ")[1]) || b.code.includes(s.split(" ")[1]))).map((b, i) => <div key={i} className={`class-block ${b.color}`} style={{left: `calc(${b.day} * 20% + 5px)`, top: `${b.start * 42 + 4}px`, height: `${b.span * 21 - 6}px`}}><b>{b.code}</b><span>{b.title}</span><small>{b.meta}</small></div>)}
            </div>
          </div>

          <div className="preferences">
            <div><span className="kicker">YOUR PRIORITIES</span><h3>What makes a good schedule?</h3></div>
            <div className="pref-chips"><button>☀ No classes before 9</button><button>▤ Lunch break</button><button>◉ Highly rated instructors</button></div>
            <button className="generate" onClick={() => setGenerated(true)}>{generated ? "✓ Best of 48 schedules" : "Generate better schedules"}<span>→</span></button>
          </div>
        </section>
      </section>

      <footer><div><b>Built for Berkeley students.</b><span>Constraint-based scheduling · live enrollment signals · explainable rankings</span></div><div className="tech"><span>React</span><span>TypeScript</span><span>FastAPI</span><span>PostgreSQL</span><span>Redis</span></div><p>CourseFlow is an independent student project and is not affiliated with UC Berkeley.</p></footer>
      {saved && <div className="toast">Schedule saved to your planner</div>}
    </main>
  );
}
