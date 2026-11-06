// Live integration test for the consent gate and account deletion: SvelteKit
// pages and server routes, the Go backend and Postgres. Needs the frontend
// (FRONTEND_URL, default :5174), the backend (BACKEND_URL, default :8081)
// started with LEGAL_DOCUMENTS set, and the jportal-postgres container.
//   node --test tests/account_integration.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5174";
const BACKEND = process.env.BACKEND_URL || "http://localhost:8081";
const tag = Math.random().toString(16).slice(2, 8);

function sql(text) {
  return execFileSync(
    "docker",
    ["exec", "-i", "jportal-postgres", "psql", "-U", "dbuser", "-d", "jportal", "-Atq", "-v", "ON_ERROR_STOP=1"],
    { input: text, encoding: "utf8" },
  ).trim();
}

// A user plus a planted session (dummy token ciphertext: nothing to revoke at IAM).
function plant(name) {
  const user = sql(`INSERT INTO users (iam_user_id, email, name) VALUES ('it-account-${name}-${tag}', '${name}@example.com', '${name} Tester') RETURNING id;`);
  const session = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${user}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  return { user, session, cookie: `jp_session=${session}` };
}

let mira;
before(() => {
  mira = plant("mira");
});
after(() => {
  sql(`DELETE FROM users WHERE iam_user_id LIKE 'it-account-%-${tag}' OR (status = 'deleted' AND id = '${mira.user}');
       SET session_replication_role = replica;
       DELETE FROM consents WHERE user_id = '${mira.user}';
       DELETE FROM account_events WHERE user_id = '${mira.user}';
       SET session_replication_role = DEFAULT;`);
});

async function http(path, { method = "GET", body, cookie, type, base = FRONTEND, origin = FRONTEND } = {}) {
  for (let attempt = 0; ; attempt++) {
    // Accept text/html like a browser, so form actions answer with pages and redirects.
    const headers = { origin, accept: "text/html" };
    if (cookie) headers.cookie = cookie;
    if (type) headers["content-type"] = type;
    const res = await fetch(base + path, { method, headers, redirect: "manual", body });
    if (res.status === 429 && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000)); // backend limiter
      continue;
    }
    const text = await res.text();
    // All SvelteKit traffic shares one backend rate-limit bucket, so after
    // another suite a page's own backend calls can be throttled: wait it out.
    if (text.includes("The service is unavailable") && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, json, text };
  }
}

test("until the documents are accepted, pages redirect and the API refuses", async () => {
  const page = await http("/profile?tab=preferences", { cookie: mira.cookie });
  assert.equal(page.status, 303);
  assert.equal(page.headers.get("location"), "/consent?next=%2Fprofile%3Ftab%3Dpreferences");
  // The documents themselves stay readable.
  assert.equal((await http("/terms", { cookie: mira.cookie })).status, 200);
  assert.equal((await http("/cookies", { cookie: mira.cookie })).status, 200);

  const api = await http("/api/v1/profile/me", { cookie: mira.cookie, base: BACKEND });
  assert.equal(api.status, 403);
  assert.deepEqual(api.json.data.required_documents.map((d) => d.doc_id), ["terms", "privacy", "cookies"]);

  const consent = await http("/consent?next=%2Fprofile", { cookie: mira.cookie });
  assert.equal(consent.status, 200);
  for (const name of ["accept_terms", "accept_privacy", "accept_cookies"]) assert.match(consent.text, new RegExp(`name="${name}"`));
});

test("accepting only some documents is refused; accepting all opens the app", async () => {
  const partial = await http("/consent?next=%2Fprofile", {
    method: "POST", cookie: mira.cookie, type: "application/x-www-form-urlencoded", body: "accept_terms=on",
  });
  assert.equal(partial.status, 400);
  assert.equal(sql(`SELECT COUNT(*) FROM consents WHERE user_id = '${mira.user}'`), "0");

  const all = await http("/consent?next=%2Fprofile", {
    method: "POST", cookie: mira.cookie, type: "application/x-www-form-urlencoded",
    body: "accept_terms=on&accept_privacy=on&accept_cookies=on",
  });
  assert.equal(all.status, 303);
  assert.equal(all.headers.get("location"), "/profile");
  assert.equal(sql(`SELECT string_agg(doc_id || '@' || doc_version || ':' || status, ',' ORDER BY doc_id) FROM consents WHERE user_id = '${mira.user}'`),
    "cookies@2026-11-02:accepted,privacy@2026-11-02:accepted,terms@2026-11-02:accepted");

  assert.equal((await http("/api/v1/consents/required", { cookie: mira.cookie, base: BACKEND })).json.data.length, 0);
  const profile = await http("/api/v1/profile/me", { cookie: mira.cookie, base: BACKEND });
  assert.equal(profile.status, 200);
  assert.notEqual((await http("/profile", { cookie: mira.cookie })).headers.get("location")?.startsWith("/consent"), true);

  // Consent records can't be edited, even by the app's database user.
  assert.throws(() => sql(`UPDATE consents SET status = 'withdrawn' WHERE user_id = '${mira.user}';`), /append-only/);
});

test("deleting the account anonymises it, ends every session and keeps the records", async () => {
  const second = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${mira.user}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  assert.equal((await http("/auth/account", { method: "DELETE", cookie: mira.cookie, origin: "https://evil.example" })).status, 403,
    "a cross-origin delete is refused");

  const res = await http("/auth/account", { method: "DELETE", cookie: mira.cookie });
  assert.equal(res.status, 200, res.text);
  assert.match(res.headers.get("set-cookie") ?? "", /jp_session=;/);

  assert.equal(sql(`SELECT name || '|' || email || '|' || status || '|' || iam_user_id FROM users WHERE id = '${mira.user}'`),
    `Deleted user||deleted|deleted:${mira.user}`);
  assert.equal(sql(`SELECT COUNT(*) FROM sessions WHERE user_id = '${mira.user}'`), "0");
  for (const cookie of [mira.cookie, `jp_session=${second}`])
    assert.equal((await http("/api/v1/auth/me", { cookie, base: BACKEND })).status, 401);
  assert.equal(sql(`SELECT COUNT(*) FROM consents WHERE user_id = '${mira.user}'`), "3");
  assert.equal(sql(`SELECT ecosystem_id FROM account_events WHERE user_id = '${mira.user}' AND kind = 'deleted'`), `it-account-mira-${tag}`);
});
