import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { my_skills, my_skill_ids, sync_my_skills, toggle_my_skill } from "../src/lib/portal/my_skills.js";

// The backend answers through the proxy as { ok, status, data, error }.
let calls = [];
let reply;
globalThis.fetch = async (url, options = {}) => {
  calls.push({ url, method: options.method ?? "GET" });
  return { status: reply.status, json: async () => reply };
};
const set_of = (...skills) => ({ ok: true, status: 200, data: { changed: true, signature: "s" + skills.length, skills } });

test("sync sends the signature and keeps local skills when it matches", async () => {
  reply = set_of({ id: 1, name: "Go" });
  await sync_my_skills();
  assert.deepEqual(get(my_skills), { signature: "s1", skills: [{ id: 1, name: "Go" }] });

  reply = { ok: true, status: 200, data: { changed: false, signature: "s1" } };
  calls = [];
  await sync_my_skills();
  assert.match(calls[0].url, /\/me\/skills\?signature=s1$/);
  assert.equal(get(my_skills).skills.length, 1);
});

test("toggle adds, removes, and undoes a failed save", async () => {
  reply = set_of({ id: 1, name: "Go" }, { id: 2, name: "SQL" });
  assert.equal(await toggle_my_skill(2, "SQL"), "");
  assert.equal(calls.at(-1).method, "POST");
  assert.ok(get(my_skill_ids).has(2));

  reply = set_of({ id: 1, name: "Go" });
  assert.equal(await toggle_my_skill(2, "SQL"), "");
  assert.equal(calls.at(-1).method, "DELETE");
  assert.ok(!get(my_skill_ids).has(2));

  reply = { ok: false, status: 404, data: null, error: "Save your profile first" };
  assert.match(await toggle_my_skill(3, "Rust"), /Save your profile first/);
  assert.deepEqual([...get(my_skill_ids)], [1]);
});
