import type { CatalogRecord } from "../types";

export interface BerkeleyCatalogSource{fetchCatalog(term:string):Promise<CatalogRecord[]>;}
export class SpoccCatalogSource implements BerkeleyCatalogSource{
  constructor(private endpoint=process.env.BERKELEY_SPOCC_API_URL){}
  async fetchCatalog():Promise<CatalogRecord[]>{
    if(!this.endpoint)throw new Error("BERKELEY_SPOCC_API_URL is not configured; use the versioned snapshot adapter until an official endpoint is approved.");
    const response=await fetch(this.endpoint,{headers:{accept:"application/json"}});
    if(!response.ok)throw new Error(`SPoCC returned ${response.status}`);
    throw new Error("SPoCC response mapping is intentionally disabled until the selected official endpoint contract is recorded in docs/DATA_SOURCES.md.");
  }
}
