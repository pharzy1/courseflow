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
  for(const code of ["COMPSCI 61B","DATA C100","DES INV 25"]) await page.getByLabel(`Remove ${code}`).click();
  await page.getByLabel("Add INFO 159").click();
  await expect(page.getByRole("alert")).toContainText("STAT 134 overlaps INFO 159");
  await page.getByRole("button",{name:"Rank A vs. B"}).click();
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("accessibility: core page has no serious axe violations",async({page})=>{
  const results=await new AxeBuilder({page}).exclude(".calendar").withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();
  expect(results.violations.filter(v=>["critical","serious"].includes(v.impact??""))).toEqual([]);
});
