import { mkdir,writeFile } from "node:fs/promises";
import { syncCatalog } from "../lib/data/catalog-sync";

const result=await syncCatalog({writeDatabase:Boolean(process.env.DATABASE_URL)});
await mkdir("data",{recursive:true});
await writeFile("data/catalog.snapshot.json",JSON.stringify({generatedAt:result.generatedAt,totalAvailable:result.sourceRows,distinctSections:result.distinctSections,records:result.records},null,2)+"\n");
console.log(`Wrote ${result.distinctSections} distinct sections from ${result.sourceRows} source rows (${result.pages} pages, ${result.durationMs} ms)`);
