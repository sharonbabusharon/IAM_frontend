import test from "node:test";
import assert from "node:assert/strict";
import { default_membership_settings, premium_quote, purchase_preview, is_premium, free_remaining, skill_match, allowed_filters } from "../src/lib/portal/membership_rules.js";
import { default_filters, filters_from_params, filter_jobs } from "../src/lib/portal/search.js";
import { jobs } from "../src/lib/portal/data.js";
import { jobs_by_poster } from "../src/lib/portal/posted_jobs.js";
import { new_job_form, job_form_error, normalise_job_post } from "../src/lib/portal/job_post_rules.js";
const settings = default_membership_settings;
test("premium quotes combine complete months and remaining days at configured prices", () => {
  assert.equal(premium_quote(2).price, 40);
  assert.equal(premium_quote(30).price, 400);
  assert.equal(premium_quote(62).price, 840);
  assert.equal(premium_quote(2, {...settings, day_price:15, credit_price:2}).credits,15);
  for (const days of [0,-1,1.5,Infinity,3651]) assert.equal(premium_quote(days),null);
});
test("credit purchases debit once and extend existing premium without losing remaining time", () => {
  const now = Date.UTC(2026,9,20);
  const account = {credits:100, premium_until:now+86400000};
  const next = purchase_preview(account,2,settings,now);
  assert.equal(next.credits,60);
  assert.equal(next.premium_until,now+3*86400000);
  assert.equal(account.credits,100);
  assert.equal(purchase_preview({...account,credits:39},2,settings,now),null);
  assert.equal(is_premium(next,next.premium_until),false);
});
test("free application allowance resets at the UTC day boundary and never goes negative", () => {
  const account = {application_days:["2026-10-20","2026-10-20","2026-10-19"]};
  assert.equal(free_remaining(account,{...settings,daily_free:2},Date.UTC(2026,9,20,23)),0);
  assert.equal(free_remaining(account,{...settings,daily_free:2},Date.UTC(2026,9,21)),2);
});
test("URL filters cannot bypass locally configured premium restrictions", () => {
  const input=filters_from_params(new URLSearchParams("match=70&sort=match&mode=Remote&minSalary=90000"));
  const policy={...settings,premium_filters:["min_match","sort_match","modes","min_salary"]};
  const free=allowed_filters(input,default_filters(),policy,false);
  assert.equal(free.min_match,0);assert.equal(free.sort,"newest");assert.deepEqual(free.modes,[]);assert.equal(free.min_salary,0);
  assert.deepEqual(allowed_filters(input,default_filters(),policy,true),input);
});
test("skill match is case insensitive and match filtering uses the displayed threshold", () => {
  const data=[{...jobs[0],id:"a",skills:["Figma","SQL"]},{...jobs[0],id:"b",skills:["figma"]},{...jobs[0],id:"c",skills:["Go"]}];
  assert.equal(skill_match(data[0],["FIGMA"]),50);
  assert.equal(skill_match({...data[0],skills:["Figma","figma"]},["figma"]),100);
  assert.deepEqual(filter_jobs(data,{...default_filters(),min_match:50,sort:"match"},[],[],["Figma"]).map(j=>j.id),["b","a"]);
  assert.equal(skill_match({skills:[]},["Figma"]),0);
});
test("worldwide remote jobs satisfy both city and free-text geography without relaxing other criteria", () => {
  const worldwide=jobs.find(j=>j.location_type === "world_remote" && !j.unlisted);
  assert.ok(worldwide);
  assert.equal(filter_jobs([worldwide],{...default_filters(),locations:["1277333"],location:"Bengaluru"}).length,1);
  assert.equal(filter_jobs([worldwide],{...default_filters(),locations:["1277333"],modes:["On-site"]}).length,0);
});
test("job posting accepts worldwide remote only with a remote workplace", () => {
  const form={...new_job_form(),title:"Designer",skills:["Figma"],worldwide:true,modes:["Remote"],types:["Full-time"],salary_max:100000,description:"Design useful products"};
  assert.equal(job_form_error(form),"");
  assert.equal(normalise_job_post(form).location_type,"world_remote");
  assert.match(job_form_error({...form,modes:["Hybrid"]}),/remote-only/);
});
test("public poster queries exclude drafts, closed roles and direct-link listings", () => {
  const records=[{id:1,poster_id:"alex",status:"Active"},{id:2,poster_id:"alex",status:"Active",unlisted:true},{id:3,poster_id:"alex",status:"Draft"},{id:4,poster_id:"sam",status:"Active"},{id:5,poster_id:"alex",status:"Closed"}];
  assert.deepEqual(jobs_by_poster(records,"alex",true).map(j=>j.id),[1]);
  assert.deepEqual(jobs_by_poster(records,"alex").map(j=>j.id),[1,2]);
});
