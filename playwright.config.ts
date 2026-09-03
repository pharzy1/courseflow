import { defineConfig, devices } from "@playwright/test";

const externalBaseURL=process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:true,
  retries:process.env.CI?2:0,
  reporter:process.env.CI?[["github"],["html",{open:"never"}]]:"list",
  use:{baseURL:externalBaseURL??"http://127.0.0.1:3000",trace:"on-first-retry",screenshot:"only-on-failure"},
  webServer:externalBaseURL?undefined:{command:"pnpm exec vinext start",url:"http://127.0.0.1:3000",reuseExistingServer:!process.env.CI,timeout:120_000},
  projects:[
    {name:"desktop",use:{...devices["Desktop Chrome"],viewport:{width:1440,height:900}}},
    {name:"tablet",use:{...devices["Desktop Chrome"],viewport:{width:768,height:1024},hasTouch:true}},
    {name:"mobile",use:{...devices["Desktop Chrome"],viewport:{width:390,height:844},isMobile:true,hasTouch:true}},
  ],
});
