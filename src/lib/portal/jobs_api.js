// Browser client for job search and recruiting (through the SvelteKit
// proxies, which add the session). Calls resolve to { ok, status, data, error }.
import { to_inr } from "./currency.js";

async function call(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(path, options);
    const result = await response.json().catch(() => null);
    if (!result) return { ok: false, status: response.status, data: null, error: "Something went wrong. Try again." };
    if (result.error) result.error = result.error[0].toUpperCase() + result.error.slice(1);
    return result;
  } catch {
    return { ok: false, status: 0, data: null, error: "You seem to be offline. Try again." };
  }
}

const enc = encodeURIComponent;

export const jobs_api = {
  search: (criteria) => call("/framework_api/jobs/search", { method: "POST", body: criteria }),
  get: (id) => call(`/framework_api/jobs/${enc(id)}`),
  outbound: (id) => call(`/framework_api/jobs/${enc(id)}/outbound`, { method: "POST" }),
  companies: () => call("/framework_api/recruiter/companies"),
  mine: (status = "") => call(`/framework_api/recruiter/jobs${status ? `?status=${enc(status)}` : ""}`),
  post: (input) => call("/framework_api/recruiter/jobs", { method: "POST", body: input }),
  edit: (id, input) => call(`/framework_api/recruiter/jobs/${enc(id)}`, { method: "PUT", body: input }),
  close: (id) => call(`/framework_api/recruiter/jobs/${enc(id)}/close`, { method: "POST" }),
  repost: (id) => call(`/framework_api/recruiter/jobs/${enc(id)}/repost`, { method: "POST" }),
  drafts: () => call("/framework_api/recruiter/drafts"),
  save_draft: (id, form) =>
    call(`/framework_api/recruiter/drafts${id ? `/${enc(id)}` : ""}`, { method: id ? "PUT" : "POST", body: { form } }),
  delete_draft: (id) => call(`/framework_api/recruiter/drafts/${enc(id)}`, { method: "DELETE" }),
};

const day = 24 * 60 * 60 * 1000;

/**
 * Backend job -> the card shape the portal components use (shared with the
 * sample fixtures). label(id) names a location id; pass $location_label.
 */
export function to_card(job, label = (id) => id) {
  const places = job.location_ids ?? [];
  const location =
    job.location_type === "world_remote"
      ? "Worldwide"
      : job.location ||
        (places.length ? label(places[0]) + (places.length > 1 ? ` (+${places.length - 1})` : "") : "");
  return {
    ...job,
    live: true,
    company: job.company_slug ?? job.company ?? "",
    mode: (job.work_modes ?? []).join(" · "),
    type: (job.work_types ?? []).join(" · "),
    location,
    posted: Math.max(0, Math.floor((Date.now() - new Date(job.posted_at).getTime()) / day)),
    summary: job.summary || "",
    level: job.level || "",
    category: job.category || "",
    unlisted: job.tier === "Free",
  };
}

/**
 * Search-page filters -> the backend's consolidated search payload (manual
 * "Filters": one request when the user presses Search). Salaries convert to
 * the INR baseline with the published rates; skill names map to term ids.
 */
export function to_criteria(filters, { rates, skill_ids = {}, designation_ids = {}, saved = [], page = 1, page_size = 20 }) {
  const number = (v) => (v === "" || v == null ? null : Number(v));
  return {
    query: filters.query,
    location_text: filters.location,
    skills: filters.skills.map((name) => skill_ids[name]).filter(Boolean),
    designations: filters.designations.map((name) => designation_ids[name]).filter(Boolean),
    location_ids: filters.locations,
    worldwide_remote: filters.worldwide,
    min_salary_inr: to_inr(filters.min_salary || 0, filters.currency, rates),
    max_salary_inr: to_inr(filters.max_salary || 0, filters.currency, rates),
    notice_periods: filters.notice,
    relocation: filters.relocation,
    work_modes: filters.modes,
    work_types: filters.types,
    tiers: filters.tiers,
    categories: filters.categories,
    levels: filters.levels,
    industries: filters.industries,
    company_sizes: filters.sizes,
    benefits: filters.benefits,
    application_methods: filters.easy ? ["Easy apply"] : filters.methods,
    job_ids: filters.saved ? (saved.length ? saved : ["-"]) : [],
    min_experience: filters.min_experience ? Number(filters.min_experience) : null,
    max_experience: number(filters.max_experience),
    interview_rounds: number(filters.rounds),
    interview_rounds_exact: filters.round_match === "exact",
    posted_within_days: filters.posted_within,
    sort: ["newest", "salary", "title"].includes(filters.sort) ? filters.sort : "newest",
    page,
    page_size,
  };
}
