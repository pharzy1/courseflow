import type { CatalogIngestionAdapter,SourceCatalogPage } from "./catalog-source";

const operationId="1ca3cf6917e03729d6cddb6fdb92a508daa862d82c0ff3c29c06686bb8339cd8";

export class BerkeleyTimeCatalogAdapter implements CatalogIngestionAdapter{
  readonly descriptor={id:"berkeleytime-public-graphql",name:"BerkeleyTime public GraphQL catalog",url:process.env.BERKELEYTIME_GRAPHQL_URL??"https://berkeleytime.com/api/graphql",official:false,license:null,kind:"transitional" as const};
  async fetchPage({year,semester,page,pageSize,timeoutMs}:{year:number;semester:string;page:number;pageSize:number;timeoutMs:number}):Promise<SourceCatalogPage>{
    let lastError:unknown;
    for(let attempt=1;attempt<=3;attempt++)try{
      const response=await fetch(this.descriptor.url,{method:"POST",signal:AbortSignal.timeout(timeoutMs),headers:{accept:"application/json","content-type":"application/json","user-agent":"CourseFlow/1.0 (+https://github.com/pharzy1/courseflow)"},body:JSON.stringify({id:operationId,variables:{year,semester,sortBy:"RELEVANCE",sortOrder:"ASC",page,pageSize,semanticSearch:false}})});
      if(!response.ok)throw new Error(`Catalog source returned ${response.status}: ${(await response.text()).slice(0,500)}`);
      const payload=await response.json() as {data?:{catalogSearch?:SourceCatalogPage};errors?:unknown};
      if(!payload.data?.catalogSearch)throw new Error(`Catalog response invalid: ${JSON.stringify(payload.errors)}`);
      return payload.data.catalogSearch;
    }catch(error){lastError=error;if(attempt<3)await new Promise(resolve=>setTimeout(resolve,attempt*750));}
    throw lastError instanceof Error?lastError:new Error(`Catalog page ${page} failed`);
  }
}
