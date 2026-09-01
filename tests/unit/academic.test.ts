import assert from "node:assert/strict";
import { describe,it } from "node:test";
import { csProgramSource,csRequirements,verifyAcademicCatalogHtml } from "../../lib/academic";

describe("official academic catalog adapter",()=>{
  it("pins the canonical Berkeley CS B.A. requirements source",()=>{
    assert.equal(csProgramSource,"https://undergraduate.catalog.berkeley.edu/programs/A5201U/requirements-krhha");
    assert.equal(csRequirements.some(group=>group.courses.includes("COMPSCI 61A")),true);
    assert.equal(csRequirements.some(group=>group.courses.includes("DATA C100")),true);
  });

  it("rejects pages that no longer contain the expected requirement structure",()=>{
    assert.equal(verifyAcademicCatalogHtml("Computer Science Lower Division Upper Division"),true);
    assert.equal(verifyAcademicCatalogHtml("Computer Science catalog temporarily unavailable"),false);
  });
});
