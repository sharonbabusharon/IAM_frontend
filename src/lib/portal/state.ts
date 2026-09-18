import { writable, get } from "svelte/store";
import { browser } from "$app/environment";
import { default_profile, jobs } from "./data";
import type { profile_data } from "./types";

export const saved_jobs = writable<string[]>([]);
export const applications = writable<string[]>([]);
export const saved_searches = writable<{ name: string; query: string }[]>([]);
export const profile = writable<profile_data>({
  ...default_profile,
  skills: [...default_profile.skills],
});
export const notification = writable("");
let hydrated = false;
let timer: ReturnType<typeof setTimeout>;

export function toast(message: string) {
  clearTimeout(timer);
  notification.set(message);
  timer = setTimeout(() => notification.set(""), 4200);
}
function read(key: string): unknown {
  try {
    return JSON.parse(
      localStorage.getItem(`referise-preview:${key}`) ?? "null",
    );
  } catch {
    return null;
  }
}
function persist(key: string, value: unknown) {
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
  const valid_ids = new Set(jobs.map((job) => job.id));
  for (const [key, store] of [
    ["saved", saved_jobs],
    ["applications", applications],
  ] as const) {
    const value = read(key);
    if (Array.isArray(value))
      store.set(
        value.filter((id) => typeof id === "string" && valid_ids.has(id)),
      );
    store.subscribe((next) => persist(key, next));
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
  const stored = read("profile");
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    // Keep preferences saved before the field names changed.
    const old_keys: Record<string, string> = {
      salary_private: "salaryPrivate",
      resume_private: "resumePrivate",
      work_mode: "workMode",
    };
    const stored_profile = stored as Record<string, unknown>;
    const next = { ...default_profile, skills: [...default_profile.skills] };
    for (const key of Object.keys(default_profile) as (keyof profile_data)[]) {
      const value = stored_profile[key] ?? stored_profile[old_keys[key]];
      if (
        key === "skills" &&
        Array.isArray(value) &&
        value.every((item) => typeof item === "string")
      )
        next.skills = value;
      else if (typeof value === typeof default_profile[key] && key !== "skills")
        Object.assign(next, { [key]: value });
    }
    profile.set(next);
  }
  profile.subscribe((next) => persist("profile", next));
}
export function toggle_saved(id: string) {
  const was_saved = get(saved_jobs).includes(id);
  saved_jobs.update((value) =>
    was_saved ? value.filter((item) => item !== id) : [...value, id],
  );
  toast(
    was_saved
      ? "Job removed from your saved list."
      : "Job saved. Find it in Saved jobs.",
  );
}
