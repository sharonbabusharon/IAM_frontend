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
  planted.push(user);
  accept(user);
  return { user, cookie: `jp_session=${session}` };
}

// The consent gate: planted users accept the backend's current documents
// (read once in before()), so these tests reach the profile routes.
const planted = [];
let documents = [];
function accept(user) {
  for (const d of documents)
    sql(`INSERT INTO consents (user_id, ecosystem_id, doc_id, doc_version, status)
      SELECT id, iam_user_id, '${d.doc_id}', '${d.version}', 'accepted' FROM users WHERE id = '${user}';`);
}

let asha, ravi;
before(async () => {
  asha = plant("asha");
  ravi = plant("ravi");
  const required = await (await fetch(`${BACKEND}/api/v1/consents/required`, { headers: { cookie: asha.cookie } })).json();
  documents = required.data ?? [];
  for (const who of [asha, ravi]) accept(who.user);
});
after(() => {
  const ids = planted.map((id) => `'${id}'`).join(",");
  sql(`SET session_replication_role = replica;
       DELETE FROM consents WHERE user_id IN (${ids});
       DELETE FROM account_events WHERE user_id IN (${ids});
       SET session_replication_role = DEFAULT;
       DELETE FROM users WHERE iam_user_id LIKE 'it-profile-%-${tag}';
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
    location: "typed text, replaced by the location's label",
    current_company: "Forma",
    current_location_id: "1277333",
    current_work_arrangement: "Hybrid",
    current_work_type: "Full-time",
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
    languages: [
      { name: "English", read: true, write: true, speak: true },
      { name: "Tamil", read: false, write: false, speak: true },
    ],
    education: [
      { institution: "NID", degree: "B.Des", field: "Communication", start: "2014", end: "2018",
        grade: "8.9 CGPA", honors: "Gold medal", description: "Studio work.", achievements: ["Best thesis"] },
    ],
    authorizations: [{ country: "India", type: "Citizen", from: "", until: "", indefinite: true }],
    experiences: [
      { company: "Forma", type: "Full-time", work_arrangement: "Hybrid", location_id: "1277333", location: "",
        start: "2023-03", end: "", current: true, verification: "Unverified",
        roles: [
          { title: "Designer", start: "2023-03", end: "2024-01", promoted: false, responsibilities: "Design systems.", achievements: ["Shipped v1"] },
          { title: "Product Designer", start: "2024-02", end: "", promoted: true, responsibilities: "", achievements: [] },
        ] },
      { company: "Tiny Studio", type: "Contract", work_arrangement: "", location_id: "", location: "",
        start: "2020-06", end: "2023-02", current: false, verification: "Unverified",
        roles: [{ title: "Designer", start: "2020-06", end: "2023-02", promoted: false, responsibilities: "", achievements: [] }] },
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
  assert.match(p.slug, /^asha-tester(-\d+)?$/, "handle from the name, -2, -3... when taken");
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
  // Current status, the company → roles timeline and the details lists.
  assert.equal(p.current_company, "Forma");
  assert.equal(p.current_location_id, "1277333");
  assert.equal(p.current_work_arrangement, "Hybrid");
  assert.equal(p.current_work_type, "Full-time");
  assert.match(p.location, /^Bengaluru, /, "label from the location tree, not the typed text");
  assert.match(p.experiences[0].location, /^Bengaluru, /);
  assert.deepEqual(p.experiences[0].roles.map((r) => [r.title, r.promoted]), [["Designer", false], ["Product Designer", true]]);
  assert.deepEqual(p.experiences[0].roles[0].achievements, ["Shipped v1"]);
  assert.equal(p.experiences[0].title, undefined, "no flat fields come back");
  assert.deepEqual(p.languages[1], { name: "Tamil", read: false, write: false, speak: true });
  assert.equal(p.education[0].grade, "8.9 CGPA");
  assert.deepEqual(p.education[0].achievements, ["Best thesis"]);

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
    "no roles": { experiences: [{ ...base.experiences[1], roles: [] }] },
    "role outside employment": {
      experiences: [{ ...base.experiences[1], roles: [{ ...base.experiences[1].roles[0], end: "2024-01" }] }],
    },
    "current location": { current_location_id: "999999999" },
    "work arrangement": { current_work_arrangement: "Moon" },
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

test("profile handles are unique, and can be checked before saving", async () => {
  const check = async (who, slug) => api(`/me/slug-availability?slug=${slug}`, { cookie: who.cookie });
  assert.equal((await check(ravi, `asha-${tag}`)).json.data.available, false, "someone else's");
  assert.equal((await check(asha, `asha-${tag}`)).json.data.available, true, "your own");
  assert.equal((await check(ravi, `free-${tag}`)).json.data.available, true);
  assert.equal((await check(ravi, "admin")).status, 400, "reserved");
  assert.equal((await api(`/me/slug-availability?slug=x`)).status, 401);

  const starter = (await api("/me", { cookie: ravi.cookie })).json.data;
  const res = await save(ravi, filled(starter, { name: "Ravi Tester", experiences: [] }));
  assert.equal(res.status, 409);
  assert.equal((await save(ravi, filled(starter, { slug: `ravi-${tag}`, experiences: [] }))).status, 200);
});

test("an older client's flat experience and language proficiency still save", async () => {
  const current = to_store((await api("/me", { cookie: ravi.cookie })).json.data);
  const res = await save(ravi, {
    ...current,
    experiences: [{ company: "Old Co", title: "Analyst", type: "Full-time", start: "2019-01", end: "2020-01",
      current: false, promoted: true, description: "Reports.", verification: "Unverified" }],
    languages: [{ name: "Hindi", proficiency: "Fluent" }],
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const p = res.json.data;
  assert.deepEqual(p.experiences[0].roles, [
    { title: "Analyst", start: "2019-01", end: "2020-01", promoted: true, responsibilities: "Reports.", achievements: [] },
  ]);
  assert.deepEqual(p.languages, [{ name: "Hindi", read: true, write: true, speak: true }]);
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

test("editing a verified experience sends it back for review without ending the membership", async () => {
  // The company approves (the admin's approve route, done in SQL here).
  sql(`UPDATE company_members SET status = 'current' WHERE company_id = 'forma' AND user_id = '${asha.user}';
       UPDATE profile_experiences SET verification = 'verified' WHERE company_id = 'forma' AND user_id = '${asha.user}';`);
  let current = to_store((await api("/me", { cookie: asha.cookie })).json.data);
  assert.equal(current.experiences[0].verification, "Verified");

  // Saving it unchanged keeps the tick; editing it puts it back in the queue.
  let res = await save(asha, current);
  assert.equal(res.json.data.experiences[0].verification, "Verified");
  current.experiences[0].roles[1].achievements = ["Led research ops"]; // an edit inside a role
  res = await save(asha, current);
  assert.equal(res.status, 200, JSON.stringify(res.json));
  assert.equal(res.json.data.experiences[0].verification, "Pending");
  assert.equal(sql(`SELECT status FROM company_members WHERE company_id = 'forma' AND user_id = '${asha.user}'`), "current");

  // Pending already: asking again changes nothing.
  const again = await api("/me/experiences/0/verification", { method: "POST", cookie: asha.cookie });
  assert.equal(again.json.data.experiences[0].verification, "Pending");
});

test("privacy, salary period, availability and travel round-trip and shape the public view", async () => {
  const current = to_store((await api("/me", { cookie: asha.cookie })).json.data);
  const res = await save(asha, {
    ...current,
    visible: true,
    expected_salary_visibility: "all",
    current_salary_visibility: "applied",
    contact_visibility: "applied",
    expected_salary_period: "month",
    availability: "Available from date",
    available_from: "2027-01-15",
    last_working_date: "2026-12-01", // dropped: not serving notice
    notice_unit: "weeks",
    notice_value: 6,
    travel: "Up to 25%",
  });
  assert.equal(res.status, 200, JSON.stringify(res.json));
  const p = res.json.data;
  assert.equal(p.expected_salary_period, "month");
  assert.equal(p.available_from, "2027-01-15");
  assert.equal(p.last_working_date, "");
  assert.equal(p.notice, "45 days", "6 weeks lands in the 45-day filter bucket");
  assert.equal(p.travel, "Up to 25%");
  assert.equal(to_store(p).expected, "$120,000 / month");
  // Recruiters filter on a yearly INR figure.
  const inr = Number(sql(`SELECT expected_salary_inr / (120000 * 12) FROM profiles WHERE user_id = '${asha.user}'`));
  assert.equal(Number(sql(`SELECT rate_to_inr FROM exchange_rates WHERE currency = 'USD'`)).toFixed(4), inr.toFixed(4));

  const pub = (await http(`/api/v1/profiles/asha-${tag}`, { base: BACKEND })).json.data;
  assert.equal(pub.expected_salary, 120000, "visible to all");
  assert.equal(pub.current_salary, 0, "applied jobs only");
  assert.equal(pub.email, "", "applied jobs only");

  const bad = await save(asha, { ...current, contact_visibility: "hidden" });
  assert.equal(bad.status, 400, "contact can't be hidden from all");
  assert.match(bad.json.error, /contact_visibility/);
  // Leave the private defaults for the tests that follow.
  assert.equal((await save(asha, current)).status, 200);
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
  await save(asha, { ...current, contact_visibility: "all", visible: true });
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
