export type Priority = "morning" | "lunch" | "rating";
export type Variant = 0 | 1;

export type Course = {
  code: string; short: string; title: string; units: number; tags: string[];
  seats: number; total: number; instructor: string; rating: number;
  time: string; days: string; color: string; keywords: string[];
};

export type Block = {
  course: string; code: string; title: string; meta: string; day: number;
  start: number; span: number; color: string; time: string; dayName: string;
};

export type ScoreResult = {
  score: number; freeMornings: number; lunchDays: number; conflictCount: number;
  contributions: { base:number; rating:number; morning:number; lunch:number; conflicts:number };
};

export type RankedVariant = { variant: Variant; result: ScoreResult };

export const courses: Course[] = [
  {code:"COMPSCI 61B",short:"CS 61B",title:"Data Structures",units:4,tags:["Major","Technical"],seats:12,total:320,instructor:"Paul Hilfinger",rating:4.8,time:"10:00–11:00 AM",days:"MWF",color:"blue",keywords:["computer science","cs61b","programming","algorithms"]},
  {code:"DATA C100",short:"DATA C100",title:"Principles & Techniques of Data Science",units:4,tags:["Major","Data"],seats:4,total:840,instructor:"Joseph Gonzalez",rating:4.7,time:"2:00–3:30 PM",days:"TuTh",color:"coral",keywords:["machine learning","data100","python","statistics"]},
  {code:"STAT 134",short:"STAT 134",title:"Concepts of Probability",units:4,tags:["Major","Math"],seats:31,total:210,instructor:"Aditya Guntuboyina",rating:4.6,time:"9:30–11:00 AM",days:"TuTh",color:"violet",keywords:["probability","statistics","math"]},
  {code:"DES INV 25",short:"DES INV 25",title:"Designing for Human Behavior",units:3,tags:["Breadth","Design"],seats:8,total:60,instructor:"Eric Paulos",rating:4.9,time:"1:00–2:30 PM",days:"MW",color:"green",keywords:["design","human behavior","ux"]},
  {code:"ECON 100A",short:"ECON 100A",title:"Microeconomic Analysis",units:4,tags:["Breadth","Social"],seats:0,total:180,instructor:"Martha Olney",rating:4.5,time:"11:00–12:30 PM",days:"TuTh",color:"gold",keywords:["economics","microeconomics","social science"]},
  {code:"INFO 159",short:"INFO 159",title:"Natural Language Processing",units:4,tags:["Technical","Conflict demo"],seats:18,total:120,instructor:"David Bamman",rating:4.8,time:"9:30–11:00 AM",days:"TuTh",color:"teal",keywords:["nlp","language models","ai","conflict demo"]},
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
  {course:"INFO 159",code:"INFO 159",title:"Natural Language Processing",meta:"South Hall 202 · Bamman",day:1,start:.5,span:3,color:"teal",time:"9:30–11:00 AM",dayName:"Tuesday"},
  {course:"INFO 159",code:"INFO 159",title:"Natural Language Processing",meta:"South Hall 202 · Bamman",day:3,start:.5,span:3,color:"teal",time:"9:30–11:00 AM",dayName:"Thursday"},
];

export function blocksFor(selected:string[], variant:Variant):Block[] {
  return baseBlocks.filter(b=>selected.includes(b.course)).map(b=>{
    if(variant===0) return {...b};
    const start=b.course==="COMPSCI 61B"?b.start+2:b.course==="DATA C100"?b.start-2:b.course==="INFO 159"?6:b.start;
    const time=b.course==="COMPSCI 61B"?"11:00 AM–12:00 PM":b.course==="DATA C100"?"1:00–2:30 PM":b.course==="INFO 159"?"3:00–4:30 PM":b.time;
    return {...b,start,time};
  });
}

export function findConflicts(blocks:Block[]):Array<[Block,Block]> {
  const conflicts:Array<[Block,Block]>=[];
  blocks.forEach((block,index)=>blocks.slice(0,index).forEach(other=>{
    const overlap=Math.max(other.start,block.start)<Math.min(other.start+other.span/2,block.start+block.span/2);
    if(other.day===block.day&&other.course!==block.course&&overlap) conflicts.push([other,block]);
  }));
  return conflicts;
}

export function scoreSchedule(selected:string[], variant:Variant, priorities:Priority[]):ScoreResult {
  if(!selected.length) return {score:0,freeMornings:5,lunchDays:5,conflictCount:0,contributions:{base:0,rating:0,morning:0,lunch:0,conflicts:0}};
  const blocks=blocksFor(selected,variant);
  const chosen=courses.filter(c=>selected.includes(c.code));
  const average=chosen.reduce((sum,c)=>sum+c.rating,0)/chosen.length;
  const conflictCount=findConflicts(blocks).length;
  const freeMornings=5-new Set(blocks.filter(b=>b.start<3).map(b=>b.day)).size;
  const busyLunchDays=new Set(blocks.filter(b=>b.start<4&&b.start+b.span/2>3).map(b=>b.day)).size;
  const lunchDays=5-busyLunchDays;
  const contributions={base:70,rating:priorities.includes("rating")?Math.round(average*4):0,morning:priorities.includes("morning")?freeMornings*2:0,lunch:priorities.includes("lunch")?lunchDays:0,conflicts:conflictCount?-(conflictCount*15):0};
  const raw=Object.values(contributions).reduce((sum,value)=>sum+value,0);
  return {score:Math.max(0,Math.min(100,raw)),freeMornings,lunchDays,conflictCount,contributions};
}

export function rankVariants(selected:string[],priorities:Priority[]) {
  return ([0,1] as Variant[])
    .map(variant=>({variant,result:scoreSchedule(selected,variant,priorities)}))
    .sort((a,b)=>Number(a.result.conflictCount>0)-Number(b.result.conflictCount>0)||b.result.score-a.result.score||a.variant-b.variant);
}

export function bestFeasibleVariant(selected:string[],priorities:Priority[]):RankedVariant|null {
  return rankVariants(selected,priorities).find(candidate=>candidate.result.conflictCount===0)??null;
}

export function searchCourses(query:string,quickFilter:string,department:string,sort:string):Course[] {
  const normalized=query.toLowerCase().replace(/\s+/g,"").replace("compsci","cs");
  let list=courses.filter(course=>[course.code,course.short,course.title,course.instructor,...course.keywords].join(" ").toLowerCase().replace(/\s+/g,"").replace("compsci","cs").includes(normalized));
  if(quickFilter==="Open seats") list=list.filter(c=>c.seats>0);
  if(quickFilter==="Major req.") list=list.filter(c=>c.tags.includes("Major"));
  if(quickFilter==="Conflict demo") list=list.filter(c=>c.tags.includes("Conflict demo"));
  if(department!=="All departments") list=list.filter(c=>c.code.startsWith(department));
  if(sort==="Rating") list=[...list].sort((a,b)=>b.rating-a.rating);
  if(sort==="Availability") list=[...list].sort((a,b)=>b.seats-a.seats);
  if(sort==="Course code") list=[...list].sort((a,b)=>a.code.localeCompare(b.code));
  return list;
}
