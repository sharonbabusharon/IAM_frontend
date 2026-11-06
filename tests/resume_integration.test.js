// Live integration test for résumés: upload, privacy-gated streaming, the
// recruiter's applicant route, analytics counts and removal, all through
// SvelteKit to the Go backend. Needs the frontend (FRONTEND_URL, default
// :5174), the backend (BACKEND_URL, default :8081) and the jportal-postgres
// and jportal-redis containers. Plants two users and removes them afterwards.
//   node --test tests/resume_integration.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { to_store, to_document, resume_types } from "../src/lib/portal/profile_api.js";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5174";
const BACKEND = process.env.BACKEND_URL || "http://localhost:8081";
const tag = Math.random().toString(16).slice(2, 8);
const pdf = new TextEncoder().encode("%PDF-1.4\n% résumé test " + tag + "\n%%EOF\n");

const docker = (args, input) => execFileSync("docker", args, { input, encoding: "utf8" }).trim();
const sql = (text) =>
  docker(["exec", "-i", "jportal-postgres", "psql", "-U", "dbuser", "-d", "jportal", "-Atq", "-v", "ON_ERROR_STOP=1"], text);

const planted = [];
let documents = [];
function accept(user) {
  for (const d of documents)
    sql(`INSERT INTO consents (user_id, ecosystem_id, doc_id, doc_version, status)
      SELECT id, iam_user_id, '${d.doc_id}', '${d.version}', 'accepted' FROM users WHERE id = '${user}';`);
}
function plant(name) {
  const user = sql(`INSERT INTO users (iam_user_id, email, name) VALUES ('it-resume-${name}-${tag}', '${name}@example.com', '${name} Tester') RETURNING id;`);
  const session = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${user}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  planted.push(user);
  return { user, cookie: `jp_session=${session}` };
}

async function http(path, { method = "GET", body, cookie, type } = {}) {
  for (let attempt = 0; ; attempt++) {
    const headers = { origin: FRONTEND };
    if (cookie) headers.cookie = cookie;
    if (type) headers["content-type"] = type;
    const res = await fetch(FRONTEND + path, { method, headers, redirect: "manual", body });
    if (res.status === 429 && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    const bytes = new Uint8Array(await res.arrayBuffer());
    let json = null;
    try {
      json = JSON.parse(new TextDecoder().decode(bytes));
    } catch {}
    return { status: res.status, headers: res.headers, json, bytes };
  }
}
const api = (path, opts) => http("/framework_api/profile" + path, opts);

let asha, ravi, slug, job, application;
before(async () => {
  asha = plant("asha");
  ravi = plant("ravi");
  const required = await (await fetch(`${BACKEND}/api/v1/consents/required`, { headers: { cookie: asha.cookie } })).json();
  documents = required.data ?? [];
  for (const who of [asha, ravi]) accept(who.user);
  slug = `cv-${tag}`;
  const starter = (await api("/me", { cookie: asha.cookie })).json.data;
  const saved = await api("/me", {
    method: "PUT",
    cookie: asha.cookie,
    type: "application/json",
    body: JSON.stringify(to_document({ ...to_store(starter), slug, title: "Designer" })),
  });
  assert.equal(saved.status, 200, JSON.stringify(saved.json));
  assert.equal(saved.json.data.resume_visibility, "applied");
  job = `it-cv-${tag}`;
  sql(`INSERT INTO jobs (id, title, tier, application, share_hash, recruiter_id)
    VALUES ('${job}', 'CV job', 'Premium', 'Easy apply', '${job}', '${ravi.user}');`);
});
after(() => {
  const ids = planted.map((id) => `'${id}'`).join(",");
  sql(`DELETE FROM applications WHERE job_id = '${job}';
       DELETE FROM jobs WHERE id = '${job}';
       SET session_replication_role = replica;
       DELETE FROM consents WHERE user_id IN (${ids});
       DELETE FROM account_events WHERE user_id IN (${ids});
       SET session_replication_role = DEFAULT;
       DELETE FROM users WHERE iam_user_id LIKE 'it-resume-%-${tag}';`);
});

const resume = (who, query = "") => http(`/profiles/${slug}/resume${query}`, { cookie: who?.cookie });

test("upload checks the type and the bytes", async () => {
  const wrong_type = await api("/me/resume", { method: "PUT", cookie: asha.cookie, type: "text/plain", body: pdf });
  assert.equal(wrong_type.status, 415);
  const fake = await api("/me/resume", {
    method: "PUT",
    cookie: asha.cookie,
    type: resume_types[0],
    body: new TextEncoder().encode("<html><script>"),
  });
  assert.equal(fake.status, 400);
  const ok = await api("/me/resume", { method: "PUT", cookie: asha.cookie, type: resume_types[0], body: pdf });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal(ok.json.data.resume.format, "pdf");
});

test("Applied Jobs Only: the owner, then the job's recruiter", async () => {
  const own = await resume(asha);
  assert.equal(own.status, 200);
  assert.equal(own.headers.get("content-type"), "application/pdf");
  assert.match(own.headers.get("content-disposition"), new RegExp(`^inline; filename="${slug}-resume.pdf"`));
  assert.equal(own.headers.get("cache-control"), "private, no-store");
  assert.deepEqual(own.bytes, pdf);
  assert.equal((await resume(null)).status, 404);
  assert.equal((await resume(ravi)).status, 404);

  application = sql(`INSERT INTO applications (user_id, job_id, apply_type, calculated_match_score_pct, dossier)
    VALUES ('${asha.user}', '${job}', 'platform', 0, '{}') RETURNING id;`);
  assert.equal((await resume(ravi)).status, 200);
  const list = await http(`/framework_api/recruiter/jobs/${job}/applications`, { cookie: ravi.cookie });
  assert.equal(list.status, 200, JSON.stringify(list.json));
  assert.equal(list.json.data[0].has_resume, true);
  const by_app = await http(`/recruiter/applications/${application}/resume?mode=download`, { cookie: ravi.cookie });
  assert.equal(by_app.status, 200);
  assert.match(by_app.headers.get("content-disposition"), /^attachment/);
  assert.deepEqual(by_app.bytes, pdf);
  assert.equal((await http(`/recruiter/applications/${application}/resume`, { cookie: asha.cookie })).status, 200); // the owner
  assert.equal((await http(`/recruiter/applications/${application}/resume`)).status, 401); // signed out
});

test("Visible to All opens it to everyone; reads are counted", async () => {
  const mine = (await api("/me", { cookie: asha.cookie })).json.data;
  const saved = await api("/me", {
    method: "PUT",
    cookie: asha.cookie,
    type: "application/json",
    body: JSON.stringify(to_document({ ...to_store(mine), resume_visibility: "all" })),
  });
  assert.equal(saved.status, 200);
  const public_profile = await http(`/profiles/${slug}`);
  assert.equal(public_profile.status, 200);
  const anon = await resume(null, "?mode=download");
  assert.equal(anon.status, 200);
  assert.match(anon.headers.get("content-disposition"), /^attachment/);

  // Counted so far: ravi's inline view (1 view), ravi's download and the
  // anonymous one (2 downloads). The owner's own reads never count.
  const day = new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
  const redis = (kind) =>
    Number(docker(["exec", "jportal-redis", "redis-cli", "--no-auth-warning", "HGET", `pviews:${day}`, `${asha.user}|${kind}|direct`]) || 0);
  const stored = (kind) =>
    Number(sql(`SELECT COALESCE(SUM(count), 0) FROM profile_events WHERE user_id = '${asha.user}' AND kind = '${kind}';`));
  assert.equal(redis("resume_view") + stored("resume_view"), 1);
  assert.equal(redis("resume_download") + stored("resume_download"), 2);
});

test("removing the résumé ends access", async () => {
  const removed = await api("/me/resume", { method: "DELETE", cookie: asha.cookie });
  assert.equal(removed.status, 200);
  assert.equal(removed.json.data.resume, null);
  assert.equal((await resume(asha)).status, 404);
  assert.equal((await api("/me/resume", { method: "DELETE", cookie: asha.cookie })).status, 200);
});
