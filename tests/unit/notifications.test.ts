import assert from "node:assert/strict";import { after,describe,it } from "node:test";
import { createUnsubscribeToken,isQuietHour,normalizeNotificationSettings,verifyUnsubscribeToken } from "../../lib/notifications";
const originalSecret=process.env.COURSEFLOW_UNSUBSCRIBE_SECRET;process.env.COURSEFLOW_UNSUBSCRIBE_SECRET="test-only-courseflow-secret";after(()=>{if(originalSecret)process.env.COURSEFLOW_UNSUBSCRIBE_SECRET=originalSecret;else delete process.env.COURSEFLOW_UNSUBSCRIBE_SECRET;});
describe("notification safety",()=>{
  it("enforces overnight quiet hours in the selected timezone",()=>{const settings={quietStart:22,quietEnd:7,timezone:"America/Los_Angeles"};assert.equal(isQuietHour(new Date("2026-09-01T06:00:00Z"),settings),true);assert.equal(isQuietHour(new Date("2026-09-01T19:00:00Z"),settings),false);});
  it("validates preference bounds and timezones",()=>{assert.deepEqual(normalizeNotificationSettings({emailEnabled:true,frequency:"hourly",quietStart:21,quietEnd:8,timezone:"America/New_York"}),{emailEnabled:true,frequency:"hourly",quietStart:21,quietEnd:8,timezone:"America/New_York"});assert.throws(()=>normalizeNotificationSettings({quietStart:25,quietEnd:8}));});
  it("signs unsubscribe links and rejects tampering",()=>{const token=createUnsubscribeToken("clerk:user-123");assert.equal(verifyUnsubscribeToken(token),"clerk:user-123");assert.equal(verifyUnsubscribeToken(`${token}x`),null);});
});
