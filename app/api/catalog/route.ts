import { getCourseRepository } from "../../../lib/data";

export async function GET(request:Request){
  const url=new URL(request.url),params=url.searchParams;
  try{
    const page=await getCourseRepository().searchCatalog({term:params.get("term")??"Fall 2026",search:params.get("search")??undefined,department:params.get("department")??undefined,openOnly:params.get("open")==="true",level:params.get("level")??undefined,unitsMin:params.has("unitsMin")?Number(params.get("unitsMin")):undefined,unitsMax:params.has("unitsMax")?Number(params.get("unitsMax")):undefined,limit:params.has("limit")?Number(params.get("limit")):undefined,offset:params.has("offset")?Number(params.get("offset")):undefined});
    return Response.json(page,{headers:{"cache-control":"public, max-age=60, stale-while-revalidate=300"}});
  }catch(error){return Response.json({error:"Catalog unavailable",detail:error instanceof Error?error.message:"Unknown error"},{status:503});}
}
