import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let localDatabase:ReturnType<typeof drizzle>|null=null;
if(process.env.COURSEFLOW_DATABASE_DRIVER==="postgres-js"){
  const runtimeImport=new Function("specifier","return import(specifier)") as (specifier:string)=>Promise<Record<string,unknown>>,drizzleModule=await runtimeImport("drizzle-orm/postgres-js"),postgresModule=await runtimeImport("postgres"),drizzlePostgres=drizzleModule.drizzle as typeof drizzle,postgres=postgresModule.default as (url:string,options:{max:number})=>unknown;
  localDatabase=drizzlePostgres(postgres(process.env.DATABASE_URL!,{max:4}) as never,{schema}) as unknown as ReturnType<typeof drizzle>;
}

export function getDb(connectionString=process.env.DATABASE_URL){
  if(!connectionString) throw new Error("DATABASE_URL is required when COURSEFLOW_DATA_MODE=neon");
  if(process.env.COURSEFLOW_DATABASE_DRIVER==="postgres-js"){if(!localDatabase)throw new Error("Local PostgreSQL driver failed to initialize");return localDatabase;}
  return drizzle(neon(connectionString),{schema});
}
