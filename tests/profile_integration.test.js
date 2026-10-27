// Live integration test for profiles: the /profile page and the browser API
// go through SvelteKit (/framework_api/profile/*) to the Go backend and
// Postgres. Needs the frontend (FRONTEND_URL, default :5174), the backend
// (BACKEND_URL, default :8081), and the jportal-postgres container with the
// GeoNames locations imported. Plants two test users with sessions and
// removes them afterwards.
//   node --test tests/profile_integration.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { to_store, to_document, regroup } from "../src/lib/portal/profile_api.js";

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

// A user plus a planted session. Requests only need session state, so the
// token ciphertext is a dummy; the access expiry is in the future.
function plant(name) {
  const user = sql(`INSERT INTO users (iam_user_id, email, name) VALUES ('it-profile-${name}-${tag}', '${name}@example.com', '${name} Tester') RETURNING id;`);
  const session = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${user}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  return { user, cookie: `jp_session=${session}` };
}

let asha, ravi;
before(() => {
  asha = plant("asha");
  ravi = plant("ravi");
});
after(() => {
  sql(`DELETE FROM users WHERE iam_user_id LIKE 'it-profile-%-${tag}';
       DELETE FROM skills WHERE name LIKE '%zz${tag}';
       DELETE FROM designations WHERE name LIKE '%zz${tag}';`);
});

async function http(path, { method = "GET", body, cookie, type = "application/json", origin = FRONTEND, base = FRONTEND } = {}) {
  for (let attempt = 0; ; attempt++) {
    const headers = { origin };
    if (cookie) headers.cookie = cookie;
    if (body !== undefined) headers["content-type"] = type;
    const res = await fetch(base + path, {
      method,
      headers,
      redirect: "manual",
      body: body === undefined || typeof body === "string" || body instanceof Uint8Array ? body : JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000)); // backend limiter: 100 rpm, burst 20
      continue;
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, json, text };
  }
}

const api = (path, opts) => http("/framework_api/profile" + path, opts);
const save = (who, store) => api("/me", { method: "PUT", body: to_document(store), cookie: who.cookie });

// What a user typically fills in on the page, as the store holds it.
function filled(starter, overrides = {}) {
  return {
    ...to_store(starter),
    slug: `asha-${tag}`,
    title: "Product Designer",
    location: "Bengaluru, India",
    website: "asha.design",
    about: "I design calm tools.",
    phone: "+91 98765 43210",
    gender: "Female",
    pronouns: "she/her",
    experience_years: "6", // inputs can hand back strings
    notice: "30 days",
    salary_currency: "USD",
    current_salary: 90000,
    expected_salary: 120000,
    work_types: ["Full-time", "Contract"],
    work_mode: "Remote",
    preferred_locations: ["1277333"],
    open_to_remote: true,
    relocation: "Supported locally",
    target_roles: [`Product Designer zz${tag}`, "Senior Product Designer"],
    skill_groups: [
      { name: "Design", skills: [`Figma zz${tag}`, "Accessibility"] },
      { name: "Research", skills: [`Interviews zz${tag}`] },
    ],
    social_links: [{ platform: "LinkedIn", url: "https://linkedin.com/in/asha" }],
    languages: [{ name: "English", proficiency: "Fluent" }],
    education: [{ institution: "NID", degree: "B.Des", field: "Communication", start: "2014", end: "2018" }],
    authorizations: [{ country: "India", type: "Citizen", from: "", until: "", indefinite: true }],
    experiences: [
      { company: "Forma", title: "Product Designer", type: "Full-time", start: "2023-03", end: "", current: true, promoted: false, description: "Design systems.", verification: "Unverified" },
      { company: "Tiny Studio", title: "Designer", type: "Contract", start: "2020-06", end: "2023-02", current: false, promoted: true, description: "", verification: "Unverified" },
    ],
    ...overrides,
  };
}

test("signed-out visitors are sent to sign in; the API needs a session", async () => {
  const page = await http("/profile");
  assert.equal(page.status, 303);
  assert.equal(page.headers.get("location"), "/login?next=%2Fprofile");
  assert.equal((await api("/me")).status, 401);
  assert.equal((await api("/me", { method: "PUT", body: {} })).status, 401);
});

test("before the first save you get an unsaved starter from your account", async () => {
  const res = await api("/me", { cookie: asha.cookie });
  assert.equal(res.status, 200);
  const p = res.json.data;
  assert.equal(p.saved, false);
  assert.equal(p.name, "asha Tester");
  assert.equal(p.email, "asha@example.com");
  assert.match(p.slug, /^asha-tester-[0-9a-f]{4}$/);
  for (const key of ["skills", "skill_groups", "experiences", "target_roles", "social_links", "education"])
    assert.ok(Array.isArray(p[key]), `${key} is an array`);
  assert.match(res.headers.get("cache-control"), /no-store/);

  const page = await http("/profile", { cookie: asha.cookie });
  assert.equal(page.status, 200);
  assert.ok(page.text.includes("asha Tester"), "server-rendered with the real name");
  assert.ok(!page.text.includes("Alex Morgan"), "no sample profile");
});

test("saving stores the whole profile against the shared reference data", async () => {
  const starter = (await api("/me", { cookie: asha.cookie })).json.data;
  const res = await save(asha, filled(starter));
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const p = res.json.data;
  assert.equal(p.saved, true);
  assert.equal(p.experience_years, 6);
  assert.equal(p.website, "asha.design");
  assert.equal(p.work_mode, "Remote");
  assert.deepEqual(p.skills, [`Figma zz${tag}`, "Accessibility", `Interviews zz${tag}`]);
  assert.deepEqual(p.skill_groups.map((g) => g.name), ["Design", "Research"]);
  assert.deepEqual(p.target_roles, [`Product Designer zz${tag}`, "Senior Product Designer"]);
  assert.ok(p.about_updated, "about timestamp set");
  assert.equal(p.experiences[0].company_slug, "forma", "registered company linked by name");
  assert.equal(p.experiences[1].company_slug, "", "unregistered company stays text");
  assert.equal(p.experiences[0].verification, "Unverified");
  assert.equal(p.experiences[1].end, "2023-02");

  // Rows point at the shared tables: new names became pending terms there.
  const row = JSON.parse(sql(`SELECT json_build_object(
      'skills', (SELECT json_agg(s.status ORDER BY ps.position) FROM profile_skills ps JOIN skills s ON s.id = ps.skill_id WHERE ps.user_id = '${asha.user}'),
      'roles', (SELECT json_agg(d.status) FROM profiles p, unnest(p.designation_ids) AS u(id) JOIN designations d ON d.id = u.id WHERE p.user_id = '${asha.user}'),
      'inr', (SELECT expected_salary_inr::float8 FROM profiles WHERE user_id = '${asha.user}'),
      'rate', (SELECT rate_to_inr::float8 FROM exchange_rates WHERE currency = 'USD'),
      'masters', to_regclass('master_skills'));`));
  assert.deepEqual(row.skills, ["pending", row.skills[1], "pending"]);
  assert.ok(row.roles.includes("pending"));
  assert.ok(Math.abs(row.inr - 120000 * row.rate) < 1, "expected salary normalised to INR");
  assert.equal(row.masters, null, "no duplicate master tables");

  // The page now renders the saved profile.
  const page = await http("/profile", { cookie: asha.cookie });
  assert.ok(page.text.includes("Product Designer") && page.text.includes("asha.design"));
});

test("editing keeps what you didn't touch, and skill edits keep their groups", async () => {
  const current = to_store((await api("/me", { cookie: asha.cookie })).json.data);
  const edited = { ...current, skill_groups: regroup(current.skill_groups, ["Accessibility", `Interviews zz${tag}`, "Prototyping"]) };
  const p = (await save(asha, edited)).json.data;
  assert.deepEqual(p.skill_groups, [
    { name: "Design", skills: ["Accessibility", "Prototyping"] },
    { name: "Research", skills: [`Interviews zz${tag}`] },
  ]);
  assert.equal(p.about_updated, current.about_updated, "about unchanged keeps its timestamp");
  assert.deepEqual(p.languages, current.languages);
});

test("invalid profiles are rejected with a readable 400", async () => {
  const base = to_store((await api("/me", { cookie: asha.cookie })).json.data);
  const bad = {
    "slug": { slug: "Bad Slug" },
    "reserved slug": { slug: "admin" },
    "html": { about: "<script>alert(1)</script>" },
    "name": { name: "A" },
    "email": { email: "nope" },
    "notice": { notice: "2 days" },
    "currency": { salary_currency: "ZZZ" },
    "location": { preferred_locations: ["999999999"] },
    "work type": { work_types: ["Nap"] },
    "work mode": { work_mode: "Moon" },
    "serving notice without a date": { is_serving_notice: true, last_working_date: "" },
    "experience dates": { experiences: [{ ...base.experiences[1], end: "2019-01" }] },
    "social link": { social_links: [{ platform: "Site", url: "javascript:alert(1)" }] },
    "skill name": { skill_groups: [{ name: "Core", skills: ["<b>bold</b>"] }] },
  };
  for (const [name, override] of Object.entries(bad)) {
    const res = await save(asha, { ...base, ...override });
    assert.equal(res.status, 400, `${name}: ${res.status} ${JSON.stringify(res.json)}`);
    assert.ok(res.json.error && !/sql|pq:|pgx|SQLSTATE/i.test(res.json.error), `${name}: ${res.json.error}`);
  }
  // Nothing above changed the stored profile.
  assert.equal((await api("/me", { cookie: asha.cookie })).json.data.slug, base.slug);
});

test("profile handles are unique", async () => {
  const starter = (await api("/me", { cookie: ravi.cookie })).json.data;
  const res = await save(ravi, filled(starter, { name: "Ravi Tester", experiences: [] }));
  assert.equal(res.status, 409);
  assert.equal((await save(ravi, filled(starter, { slug: `ravi-${tag}`, experiences: [] }))).status, 200);
});

test("company verification goes to the company's member requests", async () => {
  const ok = await api("/me/experiences/0/verification", { method: "POST", cookie: asha.cookie });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal(ok.json.data.experiences[0].verification, "Pending");
  assert.equal(sql(`SELECT status || ':' || title FROM company_members WHERE company_id = 'forma' AND user_id = '${asha.user}'`), "pending:Product Designer");

  const unregistered = await api("/me/experiences/1/verification", { method: "POST", cookie: asha.cookie });
  assert.equal(unregistered.status, 400);
  assert.match(unregistered.json.error, /isn't on Referise/);
  assert.equal((await api("/me/experiences/9/verification", { method: "POST", cookie: asha.cookie })).status, 404);
  assert.equal((await api("/me/experiences/x/verification", { method: "POST", cookie: asha.cookie })).status, 404, "proxy allowlist");
});

test("photo upload: real images only, served from /files", async () => {
  // 1x1 PNG.
  const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), (c) => c.charCodeAt(0));
  const res = await api("/me/photo", { method: "PUT", body: png, type: "image/png", cookie: asha.cookie });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const url = res.json.data.photo;
  assert.match(url, /^\/api\/v1\/files\/img\/[0-9a-f-]+\.png$/);
  // The file route reports a rate-limited backend (429) as 502; this test's
  // traffic shares one limiter bucket behind SvelteKit, so wait it out.
  let file;
  for (let attempt = 0; attempt < 30; attempt++) {
    file = await fetch(FRONTEND + to_store(res.json.data).photo);
    if (file.status !== 502) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  assert.equal(file.status, 200);
  assert.equal(file.headers.get("content-type"), "image/png");

  assert.equal((await api("/me/photo", { method: "PUT", body: png, type: "image/jpeg", cookie: asha.cookie })).status, 400, "declared type must match");
  assert.equal((await api("/me/photo", { method: "PUT", body: "<svg/>", type: "image/svg+xml", cookie: asha.cookie })).status, 415);
  // A user without a saved profile can't upload yet.
  const fresh = plant("fresh");
  assert.equal((await api("/me/photo", { method: "PUT", body: png, type: "image/png", cookie: fresh.cookie })).status, 404);
});

test("public profile hides private details; private profiles are 404", async () => {
  const slug = `asha-${tag}`;
  const pub = await http(`/api/v1/profiles/${slug}`, { base: BACKEND });
  assert.equal(pub.status, 200);
  const p = pub.json.data;
  assert.equal(p.email, "", "contact private by default");
  assert.equal(p.phone, "");
  assert.equal(p.current_salary, 0);
  assert.equal(p.expected_salary, 0);
  assert.equal(p.name, "asha Tester");

  const current = to_store((await api("/me", { cookie: asha.cookie })).json.data);
  await save(asha, { ...current, contact_private: false, visible: true });
  assert.equal((await http(`/api/v1/profiles/${slug}`, { base: BACKEND })).json.data.email, "asha@example.com");
  await save(asha, { ...current, visible: false });
  assert.equal((await http(`/api/v1/profiles/${slug}`, { base: BACKEND })).status, 404);
  assert.equal((await http(`/api/v1/profiles/nobody-${tag}`, { base: BACKEND })).status, 404);
});

test("proxy: same-origin only, allowlisted paths, JSON bodies", async () => {
  assert.equal((await api("/me", { method: "PUT", body: {}, cookie: asha.cookie, origin: "https://evil.example" })).status, 403);
  assert.equal((await api("/someone-else", { cookie: asha.cookie })).status, 404);
  assert.equal((await api("/me", { method: "DELETE", cookie: asha.cookie })).status, 404);
  assert.equal((await api("/me", { method: "PUT", body: "name=x", type: "application/x-www-form-urlencoded", cookie: asha.cookie })).status, 415);
  assert.equal((await api("/me", { method: "PUT", body: "{bad", cookie: asha.cookie })).status, 400);
});
