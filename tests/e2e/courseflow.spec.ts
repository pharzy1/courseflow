import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async({page})=>{await page.goto("/demo");await page.evaluate(()=>localStorage.clear());await page.reload();});

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
  await page.goto("/");
  await expect(page.getByRole("link",{name:"Curated demo"})).toBeVisible();
  await expect(page.getByText("Data provenance")).toBeVisible();
  await expect(page.getByText("Course metadata: UC Berkeley Catalog",{exact:true})).toBeVisible();
  await expect(page.getByText("Sections/enrollment: BerkeleyTime fallback",{exact:true})).toBeVisible();
  await page.getByLabel("Search real catalog").fill("AHMA 298");
  await expect(page.getByText("AHMA 298 · 003")).toBeVisible();
  await expect(page.getByRole("link",{name:"Enrollment history for AHMA 298 section 003"})).toBeVisible();
  const course=page.getByRole("article").filter({hasText:"AHMA 298 · 003"});
  await expect(course.getByRole("button",{name:/Watch section/})).toBeVisible();
  await expect(course.getByText("Metadata fallback",{exact:true})).toBeVisible();
  await course.getByRole("button",{name:"Add to schedule pool"}).click();
  await expect(page.getByRole("heading",{name:"1 section · 1 course"})).toBeVisible();
  await expect(page.getByRole("button",{name:"Copy shareable schedule link"})).toBeVisible();
  await page.getByRole("button",{name:"Generate ranked schedules"}).click();
  await expect(page.getByRole("heading",{name:"1 ranked conflict-free option"})).toBeVisible();
  await expect(page.getByLabel("Weekly calendar")).toBeVisible();
  await page.getByText("Why this score?").click();
  await expect(page.getByText(/Total: \d+\/100/)).toBeVisible();
  await expect(page.getByRole("button",{name:"Export calendar (.ics)"})).toBeVisible();
});

test("historical grade explorer exposes filters, provenance, and an accessible table",async({page})=>{
  await page.route("**/api/grades/104426**",route=>route.fulfill({contentType:"application/json",body:JSON.stringify({course:{id:"104426",code:"COMPSCI 61B",title:"The Structure and Interpretation of Computer Programs"},term:"All terms",instructor:"All instructors",counts:{A:120,B:60,C:20},mean:3.45,median:"A",sampleSize:200,updatedAt:"2026-09-01T00:00:00.000Z",provenance:{sourceName:"BerkeleyTime public grade distributions",sourceUrl:"https://berkeleytime.com/api/graphql",official:false},options:{terms:[{value:"2026|Spring|1",label:"Spring 2026"}],instructors:[{value:"Hug|Joshua",label:"Joshua Hug"}]}})}));
  await page.goto("/grades/104426");
  await expect(page.getByRole("heading",{name:"The Structure and Interpretation of Computer Programs"})).toBeVisible();
  await expect(page.getByText("8,301 historical",{exact:false})).toHaveCount(0);
  await expect(page.getByText("200")).toBeVisible();
  await expect(page.getByText("No — transitional adapter")).toBeVisible();
  await page.getByText("View accessible grade table").click();
  await expect(page.getByRole("table")).toContainText("60.0%");
  const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(results.violations.filter(v=>["critical","serious"].includes(v.impact??""))).toEqual([]);
});

test("watchlist API protects account-scoped enrollment data",async({request})=>{
  const response=await request.get("/api/watchlists");
  expect(response.status()).toBe(401);
  expect((await request.put("/api/watchlists",{data:{emailEnabled:true,frequency:"immediate",quietStart:22,quietEnd:7,timezone:"America/Los_Angeles"}})).status()).toBe(401);
  expect((await request.post("/api/notifications/unsubscribe?token=tampered")).status()).toBe(400);
});

test("real-section cloud payloads are accepted only behind authentication",async({request})=>{
  const payload={kind:"real-sections",sectionIds:["sample-section"],savedAt:new Date().toISOString()};
  expect((await request.post("/api/plans",{data:{name:"Real plan",payload}})).status()).toBe(401);
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
