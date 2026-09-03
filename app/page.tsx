import Link from "next/link";

const journeys=[
  {number:"01",title:"Find the right classes",description:"Search Fall 2026 sections by subject, meeting time, seats, and historical grade context.",action:"Explore the catalog",href:"/catalog"},
  {number:"02",title:"Build a workable week",description:"Add sections to your pool, set hard constraints, and rank conflict-free schedules with an explanation.",action:"Start scheduling",href:"/catalog#schedule-builder"},
  {number:"03",title:"Plan beyond one term",description:"Map prerequisites and workload across semesters before a late discovery delays graduation.",action:"Open Degree Plan",href:"/roadmap"},
];

export default function WelcomePage(){
  return <main className="student-home">
    <section className="student-hero"><div><span className="home-eyebrow">BUILT FOR BERKELEY STUDENTS</span><h1>Plan your semester<br/><em>without the tab chaos.</em></h1><p>CourseFlow brings course discovery, schedule building, enrollment signals, and degree planning into one clear path.</p><div className="home-actions"><Link href="/catalog">Find courses</Link><Link href="/demo">Take the 2-minute tour</Link></div></div><aside aria-label="CourseFlow planning steps"><span>Your planning path</span><ol><li><b>Search</b><small>Find courses and sections</small></li><li><b>Build</b><small>Create a conflict-free week</small></li><li><b>Plan</b><small>Look ahead to graduation</small></li></ol></aside></section>
    <section className="journey-section" aria-labelledby="journey-title"><div className="section-heading"><span>START WITH YOUR GOAL</span><h2 id="journey-title">What do you need to do today?</h2><p>Each workspace has one job. Move between them anytime from the menu.</p></div><div className="journey-grid">{journeys.map(journey=><article key={journey.number}><span>{journey.number}</span><h3>{journey.title}</h3><p>{journey.description}</p><Link href={journey.href}>{journey.action} <span aria-hidden="true">→</span></Link></article>)}</div></section>
    <section className="student-assurance"><div><span>WHY COURSEFLOW</span><h2>Helpful signals,<br/>without hidden logic.</h2></div><div><article><b>Every score is explained</b><p>See how seats, time preferences, compactness, and historical signals affect a recommendation.</p></article><article><b>Every source is labeled</b><p>Know which information comes from Berkeley and which currently uses a transitional source.</p></article><article><b>Your plan stays yours</b><p>Browse publicly, save locally, or sign in when you want secure cross-device plans and alerts.</p></article></div></section>
    <footer className="student-footer"><div><b>CourseFlow</b><span>An independent student project for Berkeley planning.</span></div><nav aria-label="Footer navigation"><Link href="/catalog">Courses</Link><Link href="/roadmap">Degree Plan</Link><Link href="/status">Status</Link><a href="https://github.com/pharzy1/courseflow">GitHub</a></nav></footer>
  </main>;
}
