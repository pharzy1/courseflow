import assert from "node:assert/strict";
import test from "node:test";
import { SnapshotCourseRepository } from "../../lib/data/snapshot";
import { catalogFreshness } from "../../lib/data/types";
import { POST as refreshCatalog } from "../../app/api/ops/catalog-refresh/route";

test("real snapshot exposes provenance and supports catalog filters",async()=>{
  const repository=new SnapshotCourseRepository();
  const page=await repository.searchCatalog({term:"Fall 2026",limit:10});
  assert.ok(page.total>0);
  assert.ok(page.facets.departments.length>20);
  assert.equal(page.records.every(record=>record.provenance.sourceUrl.startsWith("https://")&&record.provenance.retrievedAt.length>10),true);
  const department=page.records[0].department;
  const filtered=await repository.searchCatalog({term:"Fall 2026",department,limit:100});
  assert.equal(filtered.records.every(record=>record.department===department),true);
});

test("complete Fall 2026 snapshot exposes every distinct source section",async()=>{
  const repository=new SnapshotCourseRepository();
  const page=await repository.searchCatalog({term:"Fall 2026",limit:1});
  assert.equal(page.total,5928);
});

test("snapshot pagination is bounded and anonymous-safe",async()=>{
  const repository=new SnapshotCourseRepository();
  const page=await repository.searchCatalog({term:"Fall 2026",limit:1000,offset:0});
  assert.ok(page.records.length<=100);
  assert.equal(page.mode,"snapshot");
});

test("catalog freshness is derived from the recorded source timestamp",()=>{
  const now=Date.parse("2026-08-31T12:00:00.000Z");
  assert.equal(catalogFreshness("2026-08-31T11:45:00.000Z",now),"live");
  assert.equal(catalogFreshness("2026-08-31T11:00:00.000Z",now),"aging");
  assert.equal(catalogFreshness("2026-08-31T08:00:00.000Z",now),"stale");
});

test("production refresh worker rejects unauthenticated requests",async()=>{
  const response=await refreshCatalog(new Request("https://courseflow.test/api/ops/catalog-refresh",{method:"POST"}));
  assert.equal(response.status,401);
});
