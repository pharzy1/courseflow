export type EnrollmentObservation={observedAt:string;enrolled:number;capacity:number;waitlisted:number};
export type EnrollmentInsights={availableSeats:number;enrolledDelta:number;waitlistDelta:number;velocityPerDay:number|null;estimatedDaysToFill:number|null;trend:"filling"|"steady"|"opening"|"collecting"};
export type EnrollmentHistory={section:{id:string;code:string;title:string;sectionNumber:string;term:string;component:string|null;instructors:string[]};observations:EnrollmentObservation[];insights:EnrollmentInsights;provenance:{sourceName:string;sourceUrl:string;official:boolean;latestObservedAt:string}};

export function calculateEnrollmentInsights(observations:EnrollmentObservation[]):EnrollmentInsights{
  if(observations.length===0)return{availableSeats:0,enrolledDelta:0,waitlistDelta:0,velocityPerDay:null,estimatedDaysToFill:null,trend:"collecting"};
  const first=observations[0],latest=observations.at(-1)!;
  const availableSeats=Math.max(0,latest.capacity-latest.enrolled);
  if(observations.length<2)return{availableSeats,enrolledDelta:0,waitlistDelta:0,velocityPerDay:null,estimatedDaysToFill:null,trend:"collecting"};
  const elapsedDays=(Date.parse(latest.observedAt)-Date.parse(first.observedAt))/86_400_000;
  const enrolledDelta=latest.enrolled-first.enrolled,waitlistDelta=latest.waitlisted-first.waitlisted;
  const velocityPerDay=elapsedDays>0?enrolledDelta/elapsedDays:null;
  const estimatedDaysToFill=velocityPerDay!==null&&velocityPerDay>0&&availableSeats>0?availableSeats/velocityPerDay:null;
  const trend=enrolledDelta>0?"filling":enrolledDelta<0?"opening":"steady";
  return{availableSeats,enrolledDelta,waitlistDelta,velocityPerDay,estimatedDaysToFill,trend};
}
