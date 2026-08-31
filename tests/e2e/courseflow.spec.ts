import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async({page})=>{await page.goto("/");await page.evaluate(()=>localStorage.clear());await page.reload();});

test("search, selection, scoring, and persistence work end to end",async({page})=>{
  const search=page.getByLabel("Search courses");
  await search.fill("machine learning");
  await expect(page.getByText("1 RESULT")).toBeVisible();
  await expect(page.getByText("Principles & Techniques of Data Science")).toBeVisible();
  await search.fill("");
  await page.getByLabel("Add ECON 100A").click();
  await expect(page.locator('section[aria-label="Schedule studio"]').getByText(/5 courses · 19 units/)).toBeVisible();
  await page.getByRole("button",{name:"Rank A vs. B"}).click();
  await expect(page.getByRole("status")).toContainText(/ranks highest/);
  await page.getByRole("button",{name:"Save on device"}).click();
  await page.reload();
  await expect(page.locator('section[aria-label="Schedule studio"]').getByText(/5 courses · 19 units/)).toBeVisible();
});

test("conflict fixture is detected and alternative generation resolves it",async({page})=>{
  await page.getByLabel("Add INFO 159").click();
  await expect(page.getByRole("alert")).toContainText("STAT 134 overlaps INFO 159");
  await page.getByRole("button",{name:"Rank A vs. B"}).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Conflict-free Schedule B ranks highest");
  await expect(page.getByRole("button",{name:/INFO 159.*3:00–4:30 PM/})).toHaveCount(2);
});

test("accessibility: core page has no serious axe violations",async({page})=>{
  const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(results.violations.filter(v=>["critical","serious"].includes(v.impact??""))).toEqual([]);
});

test("course intelligence connects discovery, comparison, and semester health",async({page})=>{
  if((page.viewportSize()?.width??1000)<=760) await page.getByRole("button",{name:"Toggle navigation"}).click();
  await page.getByRole("button",{name:"Intelligence"}).click();
  await expect(page.getByRole("heading",{name:"One decision, every signal."})).toBeVisible();
  await page.getByLabel("Explore course intelligence").selectOption("INFO 159");
  await expect(page.locator(".prereq-flow")).toContainText("COMPSCI 61B");
  await expect(page.getByRole("region",{name:"Course comparison"})).toContainText("Decision fit");
  await expect(page.getByText("46 hours outside class")).toBeVisible();
});

test("real-data catalog exposes provenance and filters the snapshot",async({page})=>{
  await page.goto("/catalog");
  await expect(page.getByText("Data provenance")).toBeVisible();
  await expect(page.getByText("Source: BerkeleyTime public GraphQL",{exact:true})).toBeVisible();
  await page.getByLabel("Search real catalog").fill("AHMA 298");
  await expect(page.getByText("AHMA 298 · 003")).toBeVisible();
  await expect(page.getByRole("link",{name:"View enrollment history for AHMA 298 section 003"})).toBeVisible();
  await expect(page.getByRole("article").filter({hasText:"AHMA 298 · 003"}).getByRole("button",{name:/Watch section/})).toBeVisible();
  await expect(page.getByText("Official: No · transitional adapter")).toBeVisible();
});

test("watchlist API protects account-scoped enrollment data",async({request})=>{
  const response=await request.get("/api/watchlists");
  expect(response.status()).toBe(401);
});

test("degree pathfinder explains unlocks and invalid sequences",async({page})=>{
  await page.goto("/roadmap");
  await expect(page.getByRole("heading",{name:"Plan the path, not just the term."})).toBeVisible();
  await page.getByLabel("Focus course").selectOption("INFO 159");
  await expect(page.getByText("Requires",{exact:true})).toBeVisible();
  await page.getByRole("combobox",{name:"Term"}).selectOption("Fall 2026");
  await expect(page.getByText("INFO 159 requires COMPSCI 61B in an earlier term.")).toBeVisible();
  await expect(page.getByText("Planning aid—not an official degree audit.")).toBeVisible();
});

test("roadmap API protects student degree data",async({request})=>{
  expect((await request.get("/api/roadmap")).status()).toBe(401);
});

test("engineering status exposes truthful operational checks",async({page,request})=>{
  const response=await request.get("/api/health");
  expect(response.ok()).toBe(true);
  const health=await response.json();
  expect(["operational","degraded"]).toContain(health.status);
  await page.goto("/status");
  await expect(page.getByRole("heading",{name:"Trust, made observable."})).toBeVisible();
  await expect(page.getByRole("heading",{name:"Production readiness"})).toBeVisible();
  await expect(page.getByText("These checks are derived from live infrastructure—not static marketing claims.")).toBeVisible();
});
