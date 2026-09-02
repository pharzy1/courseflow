import Link from "next/link";
import { GradeExplorer } from "../../../components/grade-explorer";

export default async function GradePage({params}:{params:Promise<{courseId:string}>}){const {courseId}=await params;return <main className="grade-page"><header className="catalog-top"><Link href="/" className="brand"><span className="brand-mark">CF</span><span>Course<span>Flow</span></span></Link><div><span className="provenance-pill">HISTORICAL GRADES</span><Link href="/catalog">Back to catalog</Link></div></header><GradeExplorer courseId={decodeURIComponent(courseId)}/></main>;}
