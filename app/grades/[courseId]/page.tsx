import { GradeExplorer } from "../../../components/grade-explorer";

export default async function GradePage({params}:{params:Promise<{courseId:string}>}){const {courseId}=await params;return <main className="grade-page"><GradeExplorer courseId={decodeURIComponent(courseId)}/></main>;}
