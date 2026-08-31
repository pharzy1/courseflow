import { createClerkClient } from "@clerk/backend";
import { clerk,clerkSetup } from "@clerk/testing/playwright";
import { expect,test } from "@playwright/test";

const secretKey=process.env.CLERK_SECRET_KEY;
const publishableKey=process.env.CLERK_PUBLISHABLE_KEY;
const canRun=Boolean(secretKey&&publishableKey&&process.env.PLAYWRIGHT_BASE_URL);
const clerkClient=secretKey?createClerkClient({secretKey}):null;
const stamp=`${Date.now()}-${Math.random().toString(36).slice(2)}`;
const emails=[`courseflow-a+${stamp}@example.com`,`courseflow-b+${stamp}@example.com`];
const createdUserIds:string[]=[];

test.describe("authenticated cloud plan lifecycle",()=>{
  test.describe.configure({mode:"serial"});
  test.skip(!canRun,"Requires Clerk production keys and PLAYWRIGHT_BASE_URL");

  test.beforeAll(async()=>{
    await clerkSetup();
    for(const email of emails){
      const user=await clerkClient!.users.createUser({emailAddress:[email],skipPasswordRequirement:true,skipLegalChecks:true});
      createdUserIds.push(user.id);
    }
  });

  test.afterAll(async()=>{
    await Promise.all(createdUserIds.map(id=>clerkClient!.users.deleteUser(id).catch(()=>undefined)));
  });

  test("same account restores a plan while another account is isolated",async({browser},testInfo)=>{
    test.skip(testInfo.project.name!=="desktop","Authenticated lifecycle runs once on desktop");
    const ownerContext=await browser.newContext(),ownerPage=await ownerContext.newPage();
    await ownerPage.goto("/");
    await clerk.signIn({page:ownerPage,emailAddress:emails[0]});
    await ownerPage.reload();
    await expect(ownerPage.getByText("Cloud sync on")).toBeVisible();
    await ownerPage.getByRole("button",{name:"Cloud plans"}).click();
    const planName=`Cross-device ${stamp}`;
    await ownerPage.getByLabel("Plan name").fill(planName);
    await ownerPage.getByRole("button",{name:"Save current as new"}).click();
    await expect(ownerPage.getByRole("status")).toContainText("Plan saved to your account");
    const ownerPlans=await ownerPage.request.get("/api/plans");
    expect(ownerPlans.status()).toBe(200);
    const ownerBody=await ownerPlans.json() as {plans:Array<{id:string;name:string}>};
    const plan=ownerBody.plans.find(item=>item.name===planName);
    expect(plan).toBeTruthy();
    await ownerContext.close();

    const restoredContext=await browser.newContext(),restoredPage=await restoredContext.newPage();
    await restoredPage.goto("/");
    await clerk.signIn({page:restoredPage,emailAddress:emails[0]});
    await restoredPage.reload();
    await restoredPage.getByRole("button",{name:"Cloud plans"}).click();
    await expect(restoredPage.getByText(planName,{exact:true})).toBeVisible();
    await restoredPage.getByRole("button",{name:"Restore",exact:true}).click();
    await expect(restoredPage.getByText(`${planName} restored.`,{exact:true})).toBeVisible();
    await restoredContext.close();

    const intruderContext=await browser.newContext(),intruderPage=await intruderContext.newPage();
    await intruderPage.goto("/");
    await clerk.signIn({page:intruderPage,emailAddress:emails[1]});
    const intruderPlans=await intruderPage.request.get("/api/plans");
    expect((await intruderPlans.json() as {plans:Array<{id:string}>}).plans).toEqual([]);
    const forbiddenMutation=await intruderPage.request.patch(`/api/plans/${plan!.id}`,{data:{name:"Stolen"}});
    expect(forbiddenMutation.status()).toBe(404);
    await intruderContext.close();
  });
});
