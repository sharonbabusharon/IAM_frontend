// Live integration test for company product images and company search by
// city, through SvelteKit (/framework_api/companies/*) to the Go backend.
// Needs the frontend (FRONTEND_URL, default :5174), the backend
// (BACKEND_URL, default :8081) and jportal-postgres with GeoNames imported.
// Plants a user with a session and removes it (and its company) afterwards.
//   node --test tests/company_extras_integration.test.js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const FRONTEND = process.env.FRONTEND_URL || "http://localhost:5174";
const BACKEND = process.env.BACKEND_URL || "http://localhost:8081";
const tag = Math.random().toString(16).slice(2, 8);
const slug = `extras-${tag}`;
const BENGALURU = "1277333";
const MUMBAI = "1275339";

function sql(text) {
  return execFileSync(
    "docker",
    ["exec", "-i", "jportal-postgres", "psql", "-U", "dbuser", "-d", "jportal", "-Atq", "-v", "ON_ERROR_STOP=1"],
    { input: text, encoding: "utf8" },
  ).trim();
}

let user, cookie;
before(async () => {
  user = sql(`INSERT INTO users (iam_user_id, email, name) VALUES ('it-extras-${tag}', 'extras@example.com', 'Extras Tester') RETURNING id;`);
  const session = sql(`INSERT INTO sessions (user_id, expires_at, access_expires_at, refresh_token_enc, access_token_enc, key_id)
    VALUES ('${user}', now() + interval '1 hour', now() + interval '1 hour', '\\x00', '\\x00', 'it') RETURNING id;`);
  cookie = `jp_session=${session}`;
  const required = await (await fetch(`${BACKEND}/api/v1/consents/required`, { headers: { cookie } })).json();
  for (const d of required.data ?? [])
    sql(`INSERT INTO consents (user_id, ecosystem_id, doc_id, doc_version, status)
      SELECT id, iam_user_id, '${d.doc_id}', '${d.version}', 'accepted' FROM users WHERE id = '${user}';`);
});
after(() => {
  sql(`DELETE FROM companies WHERE slug = '${slug}';
       SET session_replication_role = replica;
       DELETE FROM consents WHERE user_id = '${user}';
       DELETE FROM account_events WHERE user_id = '${user}';
       SET session_replication_role = DEFAULT;
       DELETE FROM users WHERE id = '${user}';`);
});

async function http(path, { method = "GET", body, type = "application/json", origin = FRONTEND, auth = true } = {}) {
  for (let attempt = 0; ; attempt++) {
    const headers = { origin };
    if (auth) headers.cookie = cookie;
    if (body !== undefined) headers["content-type"] = type;
    const res = await fetch(FRONTEND + path, {
      method,
      headers,
      redirect: "manual",
      body: body === undefined || body instanceof Uint8Array || typeof body === "string" ? body : JSON.stringify(body),
    });
    if ((res.status === 429 || res.status === 502) && attempt < 30) {
      await new Promise((r) => setTimeout(r, 1000)); // the shared backend rate-limit bucket
      continue;
    }
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return { status: res.status, headers: res.headers, json };
  }
}
const api = (path, opts) => http("/framework_api/companies" + path, opts);
const png = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="),
  (c) => c.charCodeAt(0),
);
const company = (products) => ({
  name: `Extras ${tag}`,
  slug,
  size: "11–50 people",
  industries: ["Testing"],
  website: "https://extras.example",
  hq_location_id: BENGALURU,
  branch_location_ids: [MUMBAI],
  products,
  benefits: [],
});

let image;
test("a product card's image uploads, is served, and follows the card", async () => {
  const created = await api("", {
    method: "POST",
    body: company([
      { name: "Probe", about: "Finds bugs.", url: "", image_url: null },
      { name: "Lens", about: "Sees them.", url: "", image_url: null },
    ]),
  });
  assert.equal(created.status, 201, JSON.stringify(created.json));

  const up = await api(`/${slug}/products/0/image`, { method: "PUT", body: png, type: "image/png" });
  assert.equal(up.status, 200, JSON.stringify(up.json));
  image = up.json.data.products[0].image_url;
  assert.match(image, /^\/api\/v1\/files\/img\/[0-9a-f-]+\.png$/);
  assert.equal(up.json.data.products[1].image_url, null);
  const file = await http(image.replace(/^\/api\/v1\//, "/"), { auth: false });
  assert.equal(file.status, 200);

  // Reordered and sent back: the image moves with its card.
  const [probe, lens] = up.json.data.products;
  const moved = await api(`/${slug}`, { method: "PUT", body: company([lens, probe]) });
  assert.equal(moved.status, 200, JSON.stringify(moved.json));
  assert.deepEqual(moved.json.data.products.map((p) => [p.name, p.image_url]), [["Lens", null], ["Probe", image]]);

  // Claiming an image the company never had stores nothing.
  const stolen = await api(`/${slug}`, {
    method: "PUT",
    body: company([{ ...lens, image_url: "/api/v1/files/img/someone-else.png" }, probe]),
  });
  assert.equal(stolen.json.data.products[0].image_url, null);
  assert.equal(stolen.json.data.products[1].image_url, image);
});

test("product image uploads are checked", async () => {
  assert.equal((await api(`/${slug}/products/9/image`, { method: "PUT", body: png, type: "image/png" })).status, 404);
  assert.equal((await api(`/${slug}/products/0/image`, { method: "PUT", body: "<svg/>", type: "image/svg+xml" })).status, 415);
  assert.equal((await api(`/${slug}/products/0/image`, { method: "PUT", body: png, type: "image/jpeg" })).status, 400, "declared type must match");
  assert.equal((await api(`/${slug}/products/x/image`, { method: "PUT", body: png, type: "image/png" })).status, 404, "proxy allowlist");
  assert.equal(
    (await api(`/${slug}/products/0/image`, { method: "PUT", body: png, type: "image/png", origin: "https://evil.example" })).status,
    403,
  );
  assert.equal((await api(`/${slug}/products/0/image`, { method: "PUT", body: png, type: "image/png", auth: false })).status, 401);
});

test("dropping or deleting a product image removes the file", async () => {
  const current = (await api(`/${slug}`)).json.data;
  const dropped = await api(`/${slug}`, {
    method: "PUT",
    body: company(current.products.map((p) => ({ ...p, image_url: null }))),
  });
  assert.equal(dropped.status, 200);
  assert.ok(dropped.json.data.products.every((p) => p.image_url === null));
  assert.equal((await http(image.replace(/^\/api\/v1\//, "/"), { auth: false })).status, 404, "file deleted");

  const again = await api(`/${slug}/products/1/image`, { method: "PUT", body: png, type: "image/png" });
  const url = again.json.data.products[1].image_url;
  const removed = await api(`/${slug}/products/1/image`, { method: "DELETE" });
  assert.equal(removed.status, 200);
  assert.equal(removed.json.data.products[1].image_url, null);
  assert.equal((await http(url.replace(/^\/api\/v1\//, "/"), { auth: false })).status, 404);
});

test("company search by city matches the HQ or any branch", async () => {
  const search = async (location_ids) =>
    (await api("/search", { method: "POST", body: { query: `Extras ${tag}`, location_ids } })).json.data.total;
  assert.equal(await search([BENGALURU]), 1, "HQ");
  assert.equal(await search([MUMBAI]), 1, "branch");
  assert.equal(await search(["2643743"]), 0, "London");
  assert.equal(await search([]), 1, "no city filter");
  assert.equal((await api("/search", { method: "POST", body: { location_ids: ["Mumbai"] } })).status, 400);
});
