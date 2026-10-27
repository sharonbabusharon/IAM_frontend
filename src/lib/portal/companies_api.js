// Browser client for the company API (through the SvelteKit proxy, which
// adds the session). Every call resolves to { ok, status, data, error }.
const base = "/framework_api/companies";

async function call(path, { method = "GET", body, image } = {}) {
  const options = { method, headers: {} };
  if (image) {
    options.headers["Content-Type"] = image.type;
    options.body = image;
  } else if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(base + path, options);
    const result = await response.json().catch(() => null);
    if (!result) return { ok: false, status: response.status, data: null, error: "Something went wrong. Try again." };
    // Backend messages are sentence fragments ("name must be..."); show them as sentences.
    if (result.error) result.error = result.error[0].toUpperCase() + result.error.slice(1);
    return result;
  } catch {
    return { ok: false, status: 0, data: null, error: "You seem to be offline. Try again." };
  }
}

const enc = encodeURIComponent;

export const companies_api = {
  search: (criteria) => call("/search", { method: "POST", body: criteria }),
  slug_available: (slug) => call(`/slug-availability?slug=${enc(slug)}`),
  create: (input) => call("", { method: "POST", body: input }),
  get: (slug) => call(`/${enc(slug)}`),
  update: (slug, input) => call(`/${enc(slug)}`, { method: "PUT", body: input }),
  remove: (slug) => call(`/${enc(slug)}`, { method: "DELETE" }),
  // data_url: the cropped image from Image_field (data:image/jpeg;base64,...)
  upload_image: async (slug, kind, data_url) =>
    call(`/${enc(slug)}/${kind}`, { method: "PUT", image: await (await fetch(data_url)).blob() }),
  dashboard: (slug) => call(`/${enc(slug)}/dashboard`),
  members: (slug, status) => call(`/${enc(slug)}/members?status=${enc(status)}`),
  decide: (slug, user_id, approve) =>
    call(`/${enc(slug)}/members/${user_id}/${approve ? "approve" : "reject"}`, { method: "POST" }),
  set_role: (slug, user_id, role) => call(`/${enc(slug)}/members/${user_id}`, { method: "PATCH", body: { role } }),
  offboard: (slug, user_id) => call(`/${enc(slug)}/members/${user_id}/offboard`, { method: "POST" }),
  leave: (slug) => call(`/${enc(slug)}/leave`, { method: "POST" }),
};

/** Backend file URLs (/api/v1/files/...) are served by the frontend at /files/... */
export const image_url = (url) => (url ? url.replace(/^\/api\/v1\//, "/") : "");

export const role_labels = { admin: "Company admin", hr: "HR / Recruiter", employee: "Employee" };
