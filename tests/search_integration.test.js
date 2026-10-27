// Live integration test for job search: browser-shaped requests go through the
// SvelteKit proxy (/framework_api/jobs/search) to the Go backend and Postgres.
// Every search parameter is checked against an independent oracle that
// filters the raw jobs table in JS.
//
// Needs the running stack: frontend (FRONTEND_URL, default :5174), backend
// (BACKEND_URL, default :8081) and the jportal-postgres / jportal-redis
// containers. Seeds its own it-* jobs, a test user and a planted session, and
// removes them afterwards.
//   node --test tests/search_integration.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { to_criteria } from "../src/lib/portal/jobs_api.js";
import { default_filters, filters_from_params } from "../src/lib/portal/search.js";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5174";
const BACKEND = process.env.BACKEND_URL || "http://localhost:8081";
const IAM_ID = "it-search-user";

function sql(text) {
  return execFileSync(
    "docker",
    ["exec", "-i", "jportal-postgres", "psql", "-U", "dbuser", "-d", "jportal", "-Atq", "-v", "ON_ERROR_STOP=1"],
    { input: text, encoding: "utf8" },
  ).trim();
}

// ---------- fixtures ----------

let user_id, session_id, rows, rates;

const fixture_jobs = (uid) => `
INSERT INTO jobs (id, title, company_id, company_name_text, tier, application, status, is_visible, posted_at,
  category, level, location_type, location_label, location_ids, salary_min, salary_max, currency,
  salary_min_inr, normalized_inr_amount, hide_salary, notice_periods, benefits, relocation,
  experience_years, interview_rounds, work_modes, work_types, skill_ids, designation_id, recruiter_id, share_hash)
VALUES
 -- hidden salary, External apply, Lead, unusual enums: must match filters but never leak amounts
 ('it-hidden', 'Staff Platform Engineer', 'arc', '', 'Premium', 'External', 'active', true, now() - interval '10 days',
  'Engineering', 'Lead', 'specific', 'Hyderabad, India', '{1269843}', 4000000, 5000000, 'INR',
  4000000, 5000000, true, '{Immediate}', '{"Stock options"}', 'Not supported',
  8, 6, '{On-site}', '{Part-time}', '{13,14}', 5, NULL, md5('it-hidden')),
 -- no company (falls back to typed name), LIKE wildcards in the title, owned by the test recruiter
 ('it-nocompany', 'Rust 100%_off Engineer', NULL, 'Indie Studio', 'Premium', 'Easy apply', 'active', true, now() - interval '20 days',
  'Engineering', 'Entry-level', 'specific', 'Pune, India', '{1259229}', 1000000, 2000000, 'INR',
  1000000, 2000000, false, '{"15 days"}', '{}', 'On their own',
  1, 1, '{Remote}', '{Freelance}', '{16}', NULL, '${uid}', md5('it-nocompany')),
 -- the test user applied: hidden from them, visible to anonymous
 ('it-applied', 'Applied Test Role', 'orbit', '', 'Premium', 'Easy apply', 'active', true, now() - interval '2 hours',
  'Product', 'Mid-level', 'specific', 'Mumbai, India', '{1275339}', 2000000, 3000000, 'INR',
  2000000, 3000000, false, '{"30 days"}', '{}', 'Supported locally',
  2, 2, '{Hybrid}', '{Full-time}', '{7}', 3, NULL, md5('it-applied')),
 -- never public
 ('it-closed', 'Closed Designer', 'forma', '', 'Premium', 'Easy apply', 'closed', true, now() - interval '1 day',
  'Design', 'Senior', 'specific', 'Bengaluru, India', '{1277333}', 100, 200, 'INR', 100, 200, false,
  '{}', '{}', '', 0, 0, '{Remote}', '{Full-time}', '{}', NULL, NULL, md5('it-closed')),
 ('it-invisible', 'Invisible Designer', 'forma', '', 'Premium', 'Easy apply', 'active', false, now() - interval '1 day',
  'Design', 'Senior', 'specific', 'Bengaluru, India', '{1277333}', 100, 200, 'INR', 100, 200, false,
  '{}', '{}', '', 0, 0, '{Remote}', '{Full-time}', '{}', NULL, NULL, md5('it-invisible')),
 ('it-old', 'Old Designer', 'forma', '', 'Premium', 'Easy apply', 'active', true, now() - interval '31 days',
  'Design', 'Senior', 'specific', 'Bengaluru, India', '{1277333}', 100, 200, 'INR', 100, 200, false,
  '{}', '{}', '', 0, 0, '{Remote}', '{Full-time}', '{}', NULL, NULL, md5('it-old')),
 ('it-free', 'Free Designer', NULL, 'Someone', 'Free', 'Easy apply', 'active', true, now() - interval '1 day',
  'Design', 'Senior', 'specific', 'Bengaluru, India', '{1277333}', 100, 200, 'INR', 100, 200, false,
  '{}', '{}', '', 0, 0, '{Remote}', '{Full-time}', '{}', NULL, NULL, md5('it-free'));
INSERT INTO applications (user_id, job_id) VALUES ('${uid}', 'it-applied');`;

function cleanup() {
  sql(`DELETE FROM jobs WHERE id LIKE 'it-%'; DELETE FROM users WHERE iam_user_id = '${IAM_ID}';`);
  if (session_id)
    execFileSync("docker", ["exec", "jportal-redis", "sh", "-c", `redis-cli -a "$REDIS_PASSWORD" --no-auth-warning DEL sess:${session_id} || redis-cli DEL sess:${session_id}`], { stdio: "ignore" });
}

before(() => {
  cleanup();
  user_id = sql(`INSERT INTO users (iam_user_id, email, name) VALUES ('${IAM_ID}', 'it@example.com', 'IT User') RETURNING id;`);
  sql(fixture_jobs(user_id));
  // Search only needs session state (Lookup), so dummy ciphertext is fine:
  // the access expiry is in the future, so no IAM refresh is attempted.
  session_id = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${user_id}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  rows = JSON.parse(sql(`SELECT json_agg(json_build_object(
      'id', j.id, 'title', j.title, 'status', j.status, 'is_visible', j.is_visible, 'tier', j.tier,
      'age_days', extract(epoch FROM now() - j.posted_at) / 86400, 'posted_at', j.posted_at,
      'location_label', j.location_label, 'location_type', j.location_type, 'location_ids', j.location_ids,
      'skill_ids', j.skill_ids, 'designation_id', j.designation_id, 'work_modes', j.work_modes, 'work_types', j.work_types,
      'company_slug', co.slug, 'sector', co.sector, 'size', co.size, 'recruiter_id', j.recruiter_id,
      'notice_periods', j.notice_periods, 'benefits', j.benefits, 'relocation', j.relocation,
      'category', j.category, 'level', j.level, 'application', j.application,
      'salary_min_inr', j.salary_min_inr, 'inr', j.normalized_inr_amount,
      'experience_years', j.experience_years, 'interview_rounds', j.interview_rounds, 'hide_salary', j.hide_salary,
      'applied', EXISTS (SELECT 1 FROM applications a WHERE a.job_id = j.id AND a.user_id = '${user_id}')))
    FROM jobs j LEFT JOIN companies co ON co.id = j.company_id;`));
  rates = Object.fromEntries(JSON.parse(sql(`SELECT json_agg(json_build_array(currency, rate_to_inr)) FROM exchange_rates;`)));
});

after(cleanup);

// ---------- oracle: the rules from the manual, written independently of the SQL ----------

const overlaps = (a, b) => a.some((v) => b.includes(v));
const anyOf = (list, value) => !list?.length || list.includes(value);

function oracle(c, { signed_in = false } = {}) {
  const within = Math.min(c.posted_within_days || 30, 30);
  return rows.filter((j) => {
    if (j.status !== "active" || !j.is_visible || j.tier === "Free" || j.age_days > within) return false;
    if (signed_in && j.applied) return false;
    for (const w of (c.query ?? "").toLowerCase().split(/\s+/).filter(Boolean))
      if (!j.title.toLowerCase().includes(w)) return false;
    const loc = (c.location_text ?? "").trim();
    if (loc && (loc.toLowerCase() === "remote" ? !j.work_modes.includes("Remote") : !j.location_label.toLowerCase().includes(loc.toLowerCase())))
      return false;
    if (c.worldwide_remote && j.location_type !== "world_remote") return false;
    if (c.location_ids?.length && !overlaps(c.location_ids, j.location_ids)) return false;
    if (c.skills?.length && !overlaps(c.skills, j.skill_ids)) return false;
    if (c.designations?.length && !c.designations.includes(j.designation_id)) return false;
    if (c.work_modes?.length && !overlaps(c.work_modes, j.work_modes)) return false;
    if (c.work_types?.length && !overlaps(c.work_types, j.work_types)) return false;
    if (c.notice_periods?.length && !overlaps(c.notice_periods, j.notice_periods)) return false;
    if (c.benefits?.length && !overlaps(c.benefits, j.benefits)) return false;
    if (c.company && j.company_slug !== c.company) return false;
    if (c.recruiter_id && j.recruiter_id !== c.recruiter_id) return false;
    if (!anyOf(c.relocation, j.relocation) || !anyOf(c.categories, j.category) || !anyOf(c.levels, j.level)) return false;
    if (!anyOf(c.tiers, j.tier) || !anyOf(c.application_methods, j.application) || !anyOf(c.job_ids, j.id)) return false;
    if (!anyOf(c.industries, j.sector) || !anyOf(c.company_sizes, j.size)) return false;
    if (c.min_salary_inr > 0 && !(j.inr >= c.min_salary_inr)) return false;
    if (c.max_salary_inr > 0 && !((j.salary_min_inr ?? j.inr) <= c.max_salary_inr)) return false;
    if (c.min_experience != null && j.experience_years < c.min_experience) return false;
    if (c.max_experience != null && j.experience_years > c.max_experience) return false;
    if (c.interview_rounds != null)
      if (c.interview_rounds_exact ? j.interview_rounds !== c.interview_rounds : j.interview_rounds > c.interview_rounds) return false;
    return true;
  });
}

// ---------- HTTP ----------

async function http(url, { body, cookie, origin = FRONTEND, type = "application/json", method = "POST" } = {}) {
  for (let attempt = 0; ; attempt++) {
    const headers = { "content-type": type, origin };
    if (cookie) headers.cookie = cookie;
    const res = await fetch(url, { method, headers, body: typeof body === "string" ? body : JSON.stringify(body) });
    if (res.status === 429 && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000)); // backend limiter: 100 rpm, burst 20
      continue;
    }
    return { status: res.status, headers: res.headers, json: await res.json().catch(() => null) };
  }
}

// Through the SvelteKit proxy, the way the browser calls it.
const via_frontend = (criteria, { signed_in = false } = {}) =>
  http(`${FRONTEND}/framework_api/jobs/search`, { body: criteria, cookie: signed_in ? `jp_session=${session_id}` : undefined });

async function search_ids(criteria, opts) {
  const res = await via_frontend({ page_size: 50, ...criteria }, opts);
  assert.equal(res.status, 200, `search ${JSON.stringify(criteria)} → ${res.status} ${JSON.stringify(res.json)}`);
  assert.equal(res.json.ok, true);
  return res.json.data;
}

async function expect_match(criteria, opts = {}) {
  const data = await search_ids(criteria, opts);
  const got = data.jobs.map((j) => j.id).sort();
  const want = oracle(criteria, opts).map((j) => j.id).sort();
  assert.deepEqual(got, want, `criteria ${JSON.stringify(criteria)}`);
  assert.equal(data.total, want.length);
  return data;
}

// ---------- one test per parameter ----------

const cases = {
  "no filters (baseline public rules)": [{}],
  query: [{ query: "designer" }, { query: "SENIOR designer" }, { query: "  engineer  " }, { query: "100%_off" }, { query: "%" }, { query: "_" }, { query: "nothing-like-this" }],
  location_text: [{ location_text: "Bengaluru" }, { location_text: "london" }, { location_text: "remote" }, { location_text: "100%" }],
  worldwide_remote: [{ worldwide_remote: true }],
  location_ids: [{ location_ids: ["1277333"] }, { location_ids: ["1277333", "2643743"] }, { location_ids: ["0"] }],
  skills: [{ skills: [2] }, { skills: [13, 16] }, { skills: [999999] }],
  designations: [{ designations: [1] }, { designations: [1, 5, 3] }],
  company: [{ company: "arc" }, { company: "orbit" }, { company: "no-such-company" }],
  recruiter_id: [() => ({ recruiter_id: user_id }), { recruiter_id: "00000000-0000-0000-0000-000000000000" }],
  salary: [{ min_salary_inr: 3000000 }, { max_salary_inr: 2000000 }, { min_salary_inr: 2000000, max_salary_inr: 5000000 }, { min_salary_inr: 4900000 }],
  notice_periods: [{ notice_periods: ["Immediate"] }, { notice_periods: ["90 days", "15 days"] }],
  relocation: [{ relocation: ["On their own"] }, { relocation: ["Not supported", "Supported locally"] }],
  work_modes: [{ work_modes: ["Hybrid"] }, { work_modes: ["Remote", "On-site"] }],
  work_types: [{ work_types: ["Contract"] }, { work_types: ["Part-time", "Freelance"] }],
  categories: [{ categories: ["Design"] }, { categories: ["Engineering", "Data"] }],
  levels: [{ levels: ["Senior", "Lead"] }],
  tiers: [{ tiers: ["Premium"] }, { tiers: ["Free"] }],
  application_methods: [{ application_methods: ["External"] }, { application_methods: ["Easy apply"] }],
  industries: [{ industries: ["Developer tools"] }, { industries: ["Climate technology", "Financial technology"] }],
  company_sizes: [{ company_sizes: ["51–200 people"] }],
  benefits: [{ benefits: ["Stock options"] }, { benefits: ["Flexible hours", "Paid leave"] }],
  job_ids: [{ job_ids: ["ux-researcher", "it-closed", "it-free", "nope"] }],
  experience: [{ min_experience: 5 }, { max_experience: 3 }, { min_experience: 3, max_experience: 5 }, { min_experience: 0, max_experience: 0 }],
  interview_rounds: [{ interview_rounds: 3 }, { interview_rounds: 3, interview_rounds_exact: true }, { interview_rounds: 6, interview_rounds_exact: true }],
  posted_within_days: [1, 3, 7, 9, 15, 30].map((d) => ({ posted_within_days: d })),
  "AND across categories": [
    { categories: ["Design"], work_modes: ["Remote"] },
    { query: "engineer", min_salary_inr: 3000000, application_methods: ["External"] },
    { location_ids: ["1277333", "1275339"], levels: ["Mid-level"], posted_within_days: 3 },
  ],
};

for (const [name, list] of Object.entries(cases)) {
  test(`search by ${name}`, async () => {
    for (const c of list) await expect_match(typeof c === "function" ? c() : c);
  });
}

test("fixtures exercise the rules (oracle is not vacuous)", () => {
  const ids = oracle({}).map((j) => j.id);
  for (const id of ["it-hidden", "it-nocompany", "it-applied"]) assert.ok(ids.includes(id), id);
  for (const id of ["it-closed", "it-invisible", "it-old", "it-free"]) assert.ok(!ids.includes(id), id);
  assert.ok(oracle({ query: "100%_off" }).length === 1 && oracle({ query: "%" }).length === 1);
});

test("signed-in candidate never sees jobs they applied to", async () => {
  const anon = await search_ids({});
  const me = await search_ids({}, { signed_in: true });
  assert.ok(anon.jobs.some((j) => j.id === "it-applied"));
  assert.ok(!me.jobs.some((j) => j.id === "it-applied"));
  await expect_match({ query: "applied" }, { signed_in: true });
});

test("hidden salary still matches filters but the amounts never leave the backend", async () => {
  const data = await expect_match({ min_salary_inr: 4900000 });
  const job = data.jobs.find((j) => j.id === "it-hidden");
  assert.ok(job, "hidden-salary job matches a salary filter");
  assert.equal(job.salary_hidden, true);
  for (const field of ["salary_min", "salary_max", "currency", "normalized_inr_amount"]) assert.equal(job[field], null, field);
  assert.ok(!JSON.stringify(data).includes("5000000"), "hidden amount leaked");
});

test("unlinked job falls back to the typed company name", async () => {
  const { jobs } = await search_ids({ job_ids: ["it-nocompany"] });
  assert.equal(jobs[0].company_name, "Indie Studio");
  assert.equal(jobs[0].company, null);
  assert.equal(jobs[0].company_slug, null);
});

test("sorts: newest, salary, title", async () => {
  const by = (sort) => search_ids({ sort }).then((d) => d.jobs.map((j) => rows.find((r) => r.id === j.id)));
  const newest = await by("newest");
  for (let i = 1; i < newest.length; i++) assert.ok(newest[i - 1].age_days <= newest[i].age_days, "newest first");
  const salary = await by("salary");
  for (let i = 1; i < salary.length; i++) assert.ok((salary[i - 1].inr ?? -1) >= (salary[i].inr ?? -1), "highest INR first");
  const title = await by("title");
  const collator = new Intl.Collator("en", { sensitivity: "base" });
  for (let i = 1; i < title.length; i++) assert.ok(collator.compare(title[i - 1].title, title[i].title) <= 0, "A→Z");
  // Default sort is newest.
  assert.deepEqual((await search_ids({})).jobs.map((j) => j.id), newest.map((j) => j.id));
});

test("pagination: pages are disjoint, cover everything, and page_size is capped", async () => {
  const all = (await search_ids({ sort: "title" })).jobs.map((j) => j.id);
  const paged = [];
  for (let page = 1; page <= Math.ceil(all.length / 4); page++) {
    const data = await search_ids({ sort: "title", page, page_size: 4 });
    assert.equal(data.page, page);
    assert.equal(data.page_size, 4);
    assert.equal(data.total, all.length);
    paged.push(...data.jobs.map((j) => j.id));
  }
  assert.deepEqual(paged, all);
  const capped = await search_ids({ page_size: 500 });
  assert.equal(capped.page_size, 50);
  const defaults = (await via_frontend({})).json.data;
  assert.equal(defaults.page, 1);
  assert.equal(defaults.page_size, 20);
  const past_end = await search_ids({ page: 999 });
  assert.equal(past_end.jobs.length, 0);
});

test("invalid criteria are rejected with 400 (never silently widened)", async () => {
  const bad = [
    { work_modes: ["Moon"] }, { work_types: ["Nap"] }, { notice_periods: ["2 days"] }, { relocation: ["Mars"] },
    { tiers: ["Gold"] }, { application_methods: ["Fax"] }, { sort: "match" }, { posted_within_days: 5 },
    { min_salary_inr: 5, max_salary_inr: 1 }, { min_salary_inr: -1 }, { min_experience: 5, max_experience: 1 },
    { min_experience: 100 }, { interview_rounds: -1 }, { page: 1001 }, { company: "Bad Slug!" },
    { recruiter_id: "not-a-uuid" }, { query: "x".repeat(201) }, { location_text: "x".repeat(101) },
    { location_ids: Array.from({ length: 201 }, (_, i) => String(i)) }, { skills: Array.from({ length: 201 }, (_, i) => i) },
  ];
  for (const c of bad) {
    const res = await via_frontend(c);
    assert.equal(res.status, 400, JSON.stringify(c));
    assert.equal(res.json.ok, false);
    assert.ok(res.json.error && !/sql|pq:|pgx|stack/i.test(res.json.error), `no internals: ${res.json.error}`);
  }
  const wrong_type = await via_frontend({ skills: ["Figma"] }); // names instead of ids
  assert.equal(wrong_type.status, 400);
});

test("proxy: JSON-only, same-origin, POST-only, no-store, same answer as the backend", async () => {
  const url = `${FRONTEND}/framework_api/jobs/search`;
  assert.equal((await http(url, { body: "query=x", type: "application/x-www-form-urlencoded" })).status, 415);
  assert.equal((await http(url, { body: "{not json" })).status, 400);
  assert.equal((await http(url, { body: {}, origin: "https://evil.example" })).status, 403);
  assert.equal((await http(url, { method: "GET", body: undefined })).status, 404);
  const ok = await via_frontend({ query: "designer" });
  assert.match(ok.headers.get("cache-control"), /no-store/);

  const direct = await http(`${BACKEND}/api/v1/jobs/search`, { body: { query: "designer" } });
  assert.equal(direct.status, 200);
  assert.match(direct.headers.get("cache-control"), /private/);
  assert.deepEqual(ok.json.data, direct.json.data);
  // Backend answers 415 to non-JSON bodies itself too.
  assert.equal((await http(`${BACKEND}/api/v1/jobs/search`, { body: "x", type: "text/plain" })).status, 415);
});

test("search page filters → to_criteria() → proxy → backend", async () => {
  const filters = {
    ...default_filters(),
    query: "engineer",
    modes: ["Remote", "On-site"],
    categories: ["Engineering"],
    currency: "USD",
    min_salary: 10000, // USD, converted to INR with the published rates
    max_experience: "8",
    rounds: "6",
    posted_within: 30,
    sort: "salary",
  };
  const criteria = to_criteria(filters, { rates, page_size: 50 });
  assert.equal(criteria.min_salary_inr, 10000 * rates.USD);
  const data = await expect_match(criteria);
  assert.ok(data.jobs.length > 0);

  // Easy-apply toggle and skills by name.
  const easy = to_criteria({ ...default_filters(), easy: true, skills: ["Go", "Unknown"] }, { rates, skill_ids: { Go: 13 } });
  assert.deepEqual(easy.application_methods, ["Easy apply"]);
  assert.deepEqual(easy.skills, [13]);
  await expect_match(easy);

  // Saved-only with nothing saved must return nothing, not everything.
  const none = to_criteria({ ...default_filters(), saved: true }, { rates, saved: [] });
  assert.equal((await search_ids(none)).total, 0);
});

test("search page designation and tier filters reach the backend", async () => {
  // Designations travel in the URL as names (like skills) and map to term ids.
  const terms = JSON.parse(sql(`SELECT json_object_agg(name, id) FROM designations;`));
  const params = new URLSearchParams([["designation", "Senior Product Designer"], ["designation", "Senior Backend Engineer"], ["tier", "Premium"]]);
  const filters = filters_from_params(params);
  const criteria = to_criteria(filters, { rates, designation_ids: terms, page_size: 50 });
  assert.deepEqual(criteria.designations, [terms["Senior Product Designer"], terms["Senior Backend Engineer"]]);
  assert.deepEqual(criteria.tiers, ["Premium"]);
  const data = await expect_match(criteria);
  assert.ok(data.jobs.length >= 2 && data.jobs.length < oracle({}).length, "designation filter narrows the search");

  // Free is unlisted: a Free-tier search returns nothing rather than everything.
  assert.equal((await search_ids(to_criteria({ ...default_filters(), tiers: ["Free"] }, { rates }))).total, 0);
});
