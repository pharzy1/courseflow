export type RoadmapStatus="completed"|"current"|"planned";
export type RoadmapItem={code:string;term:string;status:RoadmapStatus};
export type RoadmapPayload={items:RoadmapItem[];updatedAt:string};
export type PathCourse={code:string;title:string;units:number;workload:number;prerequisites:string[];area:string};
export const pathCourses:PathCourse[]=[
  {code:"COMPSCI 61A",title:"Structure and Interpretation of Computer Programs",units:4,workload:12,prerequisites:[],area:"Lower division"},
  {code:"COMPSCI 61B",title:"Data Structures",units:4,workload:13,prerequisites:["COMPSCI 61A"],area:"Lower division"},
  {code:"COMPSCI 70",title:"Discrete Mathematics and Probability",units:4,workload:15,prerequisites:["COMPSCI 61A"],area:"Lower division"},
  {code:"DATA C8",title:"Foundations of Data Science",units:4,workload:9,prerequisites:[],area:"Data foundation"},
  {code:"DATA C100",title:"Principles and Techniques of Data Science",units:4,workload:12,prerequisites:["DATA C8","COMPSCI 61A"],area:"Data core"},
  {code:"MATH 53",title:"Multivariable Calculus",units:4,workload:12,prerequisites:[],area:"Mathematics"},
  {code:"MATH 54",title:"Linear Algebra and Differential Equations",units:4,workload:12,prerequisites:[],area:"Mathematics"},
  {code:"STAT 134",title:"Concepts of Probability",units:4,workload:14,prerequisites:["MATH 53","MATH 54"],area:"Statistics"},
  {code:"COMPSCI 170",title:"Efficient Algorithms",units:4,workload:15,prerequisites:["COMPSCI 61B","COMPSCI 70"],area:"Upper division"},
  {code:"COMPSCI 189",title:"Introduction to Machine Learning",units:4,workload:17,prerequisites:["COMPSCI 70","DATA C100"],area:"Upper division"},
  {code:"INFO 159",title:"Natural Language Processing",units:4,workload:12,prerequisites:["COMPSCI 61B","DATA C100"],area:"Upper division"},
  {code:"DES INV 25",title:"Designing for Human Behavior",units:3,workload:7,prerequisites:[],area:"Breadth"},
];
const codeSet=new Set(pathCourses.map(course=>course.code));
export function parseRoadmap(value:unknown):RoadmapPayload{if(!value||typeof value!=="object")throw new Error("Invalid roadmap");const candidate=value as Partial<RoadmapPayload>;if(!Array.isArray(candidate.items)||candidate.items.length>100||!candidate.items.every(item=>item&&codeSet.has(item.code)&&typeof item.term==="string"&&item.term.length<=40&&["completed","current","planned"].includes(item.status)))throw new Error("Invalid roadmap items");return{items:candidate.items,updatedAt:typeof candidate.updatedAt==="string"&&!Number.isNaN(Date.parse(candidate.updatedAt))?candidate.updatedAt:new Date().toISOString()};}
export function roadmapAnalysis(items:RoadmapItem[]){const byCode=new Map(items.map(item=>[item.code,item])),completed=new Set(items.filter(item=>item.status==="completed").map(item=>item.code)),termOrder=[...new Set(items.map(item=>item.term))],warnings:string[]=[];for(const item of items.filter(item=>item.status!=="completed")){const course=pathCourses.find(candidate=>candidate.code===item.code)!;for(const prerequisite of course.prerequisites){const prior=byCode.get(prerequisite),satisfied=completed.has(prerequisite)||(prior&&termOrder.indexOf(prior.term)<termOrder.indexOf(item.term));if(!satisfied)warnings.push(`${item.code} requires ${prerequisite} in an earlier term.`);}}const unlocks=pathCourses.map(course=>({code:course.code,unlocks:pathCourses.filter(candidate=>candidate.prerequisites.includes(course.code)).map(candidate=>candidate.code)}));return{warnings,unlocks};}
