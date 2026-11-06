import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { default_profile, jobs } from "./data";
import { default_filters } from "./search.js";
import { jobs_api } from "./jobs_api.js";
export const search_filters = writable(default_filters());
export const viewing_currency = writable("INR");
export const saved_jobs = writable([]);
export const applications = writable([]);
export const application_snapshots = writable([]);
export const saved_searches = writable([]);
export const recent_titles = writable([]); // last few job-title searches (manual "Search jobs" §2.1)
export const profile = writable(structuredClone(default_profile));
export const notification = writable("");
let hydrated = false;
let timer;
// Same shape the job proxy accepts; the search API takes at most 200 job ids.
const job_id_pattern = /^[a-z0-9][a-z0-9-]{1,148}$/;
const max_saved = 200;
export function toast(message) {
  clearTimeout(timer);
  notification.set(message);
  timer = setTimeout(() => notification.set(""), 4200);
}
function read(key) {
  try {
    return JSON.parse(
      localStorage.getItem(`referise-preview:${key}`) ?? "null",
    );
  } catch {
    return null;
  }
}
function persist(key, value) {
  try {
    localStorage.setItem(`referise-preview:${key}`, JSON.stringify(value));
  } catch {
    toast(
      "Your browser could not save this change. It will last for this visit.",
    );
  }
}
export function hydrate_preview() {
  if (!browser || hydrated) return;
  hydrated = true;
  // Saved jobs are live job ids (uuids, or slugs for older jobs); applications
  // are still sample-only, so they keep only sample ids.
  const sample_ids = new Set(jobs.map((job) => job.id));
  const valid = {
    saved: (id) => job_id_pattern.test(id),
    applications: (id) => sample_ids.has(id),
  };
  for (const [key, store] of [
    ["saved", saved_jobs],
    ["applications", applications],
  ]) {
    const value = read(key);
    if (Array.isArray(value))
      store.set(
        [...new Set(value.filter((id) => typeof id === "string" && valid[key](id)))].slice(0, max_saved),
      );
    // Signed in, saved jobs live on the server: keep this browser's copy out of it.
    store.subscribe((next) => (key !== "saved" || !saved_on_server) && persist(key, next));
  }
  const saved = read("searches");
  if (Array.isArray(saved))
    saved_searches.set(
      saved.filter(
        (entry) =>
          entry &&
          typeof entry.name === "string" &&
          typeof entry.query === "string",
      ),
    );
  saved_searches.subscribe((next) => persist("searches", next));
  const recent = read("recent_titles");
  if (Array.isArray(recent)) recent_titles.set(recent.filter((t) => typeof t === "string").slice(0, 5));
  recent_titles.subscribe((next) => persist("recent_titles", next));
  try {
    localStorage.removeItem("referise-preview:profile"); // profiles are stored on the server now
  } catch {}
}
// Saved jobs, newest first. Signed in they live on the server (the layout
// calls use_server_saved / use_local_saved); signed out, in this browser.
let saved_on_server = false;
export const saved_applied = writable([]); // saved ids already applied to (signed in)
function from_server(list) {
  saved_jobs.set(list.map((s) => s.job_id));
  saved_applied.set(list.filter((s) => s.applied).map((s) => s.job_id));
}
export async function use_server_saved() {
  if (saved_on_server) return;
  saved_on_server = true;
  const local = get(saved_jobs);
  const result = await jobs_api.saved_jobs();
  if (!result.ok) {
    saved_on_server = false;
    return;
  }
  // Jobs saved while signed out move to the account (oldest first, so the
  // newest stays on top); closed or deleted ones are skipped.
  let list = result.data;
  const on_server = new Set(list.map((s) => s.job_id));
  for (const id of local.filter((id) => !on_server.has(id)).reverse()) {
    const saved = await jobs_api.save_job(id);
    if (saved.ok) list = saved.data;
  }
  persist("saved", []);
  from_server(list);
}
/** Re-reads the saved list (e.g. after a bulk apply marks some as applied). */
export async function refresh_saved() {
  if (!saved_on_server) return;
  const result = await jobs_api.saved_jobs();
  if (result.ok) from_server(result.data);
}
export function use_local_saved() {
  if (!saved_on_server) return;
  saved_on_server = false;
  saved_jobs.set([]);
  saved_applied.set([]);
}
async function save_change(before, request, message) {
  toast(message);
  if (!saved_on_server) return;
  const result = await request();
  if (result.ok) return from_server(result.data);
  saved_jobs.set(before);
  toast(result.error);
}
export function toggle_saved(id) {
  const before = get(saved_jobs);
  const was_saved = before.includes(id);
  saved_jobs.set(was_saved ? before.filter((item) => item !== id) : [id, ...before].slice(0, max_saved));
  return save_change(
    before,
    () => (was_saved ? jobs_api.unsave_job(id) : jobs_api.save_job(id)),
    was_saved ? "Job removed from your saved list." : "Job saved. Find it in Saved jobs.",
  );
}
export function unsave_jobs(ids) {
  const before = get(saved_jobs);
  saved_jobs.set(before.filter((id) => !ids.includes(id)));
  return save_change(before, () => jobs_api.unsave_jobs(ids), `${ids.length} ${ids.length === 1 ? "job" : "jobs"} removed.`);
}
/** Manual "Clear Applied Jobs" (signed in: applications live on the server). */
export function clear_applied_saved() {
  const before = get(saved_jobs);
  const applied = get(saved_applied);
  saved_jobs.set(before.filter((id) => !applied.includes(id)));
  return save_change(before, () => jobs_api.clear_applied(), "Applied jobs cleared from your list.");
}
