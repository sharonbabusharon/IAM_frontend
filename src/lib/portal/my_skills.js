// The signed-in candidate's profile skills, kept on this device and checked
// against the server with a signature (manual: "Lightweight Profile Skills
// Synchronization Pipeline"). Match scores and the job page's skill chips
// read from here, so they reflect the real profile on every page.
import { writable, derived, get } from "svelte/store";
import { profile_api } from "./profile_api.js";

const storage_key = "referise:my_skills";
/** @returns {{ signature: string, skills: { id: number, name: string }[] }} */
const empty = () => ({ signature: "", skills: [] });

export const my_skills = writable(empty());
export const my_skill_names = derived(my_skills, ($s) => $s.skills.map((s) => s.name));
export const my_skill_ids = derived(my_skills, ($s) => new Set($s.skills.map((s) => s.id)));

let hydrated = false;
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const saved = JSON.parse(localStorage.getItem(storage_key) ?? "null");
    if (saved && typeof saved.signature === "string" && Array.isArray(saved.skills)) my_skills.set(saved);
  } catch {}
  my_skills.subscribe((value) => {
    try {
      localStorage.setItem(storage_key, JSON.stringify(value));
    } catch {}
  });
}

function apply(set) {
  if (set?.changed) my_skills.set({ signature: set.signature, skills: set.skills ?? [] });
}

/** Sends the local signature; the server answers with the list only when it differs. */
export async function sync_my_skills() {
  hydrate();
  const result = await profile_api.skills(get(my_skills).signature);
  if (result.ok) apply(result.data);
  else if (result.status === 401) clear_my_skills();
}

export function clear_my_skills() {
  hydrate();
  my_skills.set(empty());
}

/**
 * One-click add/remove from a job page: patches the local store at once,
 * then saves; the server's answer replaces the patch, a failure undoes it.
 * Resolves to an error message, or "" on success.
 */
export async function toggle_my_skill(id, name) {
  hydrate();
  const before = get(my_skills);
  const owned = before.skills.some((s) => s.id === id);
  my_skills.set({
    signature: "",
    skills: owned ? before.skills.filter((s) => s.id !== id) : [...before.skills, { id, name }],
  });
  const result = await (owned ? profile_api.remove_skill(id) : profile_api.add_skill(id));
  if (result.ok) {
    apply(result.data);
    return "";
  }
  my_skills.set(before);
  return result.status === 404 && !owned
    ? "Save your profile first, then add skills from job pages."
    : result.error;
}
