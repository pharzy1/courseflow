import assert from "node:assert/strict";
import test from "node:test";
import { SnapshotCourseRepository } from "../../lib/data/snapshot";

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
