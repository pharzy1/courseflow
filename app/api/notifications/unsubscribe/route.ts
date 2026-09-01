import { unsubscribeUser } from "../../../../lib/watchlists";
import { verifyUnsubscribeToken } from "../../../../lib/notifications";
export async function POST(request:Request){const token=new URL(request.url).searchParams.get("token")??"",userId=verifyUnsubscribeToken(token);if(!userId)return Response.json({error:"Invalid or expired unsubscribe link"},{status:400,headers:{"cache-control":"no-store"}});await unsubscribeUser(userId);return Response.json({ok:true},{headers:{"cache-control":"no-store"}});}
