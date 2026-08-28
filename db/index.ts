import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb(connectionString=process.env.DATABASE_URL){
  if(!connectionString) throw new Error("DATABASE_URL is required when COURSEFLOW_DATA_MODE=neon");
  return drizzle(neon(connectionString),{schema});
}
