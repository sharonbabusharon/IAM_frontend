// Browser client for your profile (through the SvelteKit proxy, which adds the
// session). Calls resolve to { ok, status, data, error }.
import { image_url } from "./companies_api.js";

const base = "/framework_api/profile";

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
    if (result.error) result.error = result.error[0].toUpperCase() + result.error.slice(1);
    return result;
  } catch {
    return { ok: false, status: 0, data: null, error: "You seem to be offline. Try again." };
  }
}

export const profile_api = {
  save: (store) => call("/me", { method: "PUT", body: to_document(store) }),
  // data_url: the cropped photo (data:image/jpeg;base64,...)
  upload_photo: async (data_url) => call("/me/photo", { method: "PUT", image: await (await fetch(data_url)).blob() }),
  request_verification: (index) => call(`/me/experiences/${index}/verification`, { method: "POST" }),
};

const amount = (value) => Math.max(0, Number(value) || 0);

/** Backend profile -> the store shape, plus the display strings the page shows. */
export function to_store(doc) {
  return {
    ...doc,
    photo: image_url(doc.photo),
    about_updated: doc.about_updated ?? "",
    experience: `${doc.experience_years || 0} years`,
    roles: doc.target_roles.join(", "),
    expected: doc.expected_salary
      ? new Intl.NumberFormat("en", { style: "currency", currency: doc.salary_currency, maximumFractionDigits: 0 })
          .format(doc.expected_salary) + " / year"
      : "",
  };
}

/** Store -> the document PUT /profile/me takes (read-only and display fields dropped). */
export function to_document(store) {
  const { photo, about_updated, saved, experience, roles, expected, skills, ...doc } = store;
  return {
    ...doc,
    experience_years: Math.round(amount(doc.experience_years)),
    current_salary: amount(doc.current_salary),
    expected_salary: amount(doc.expected_salary),
    hourly_rate: amount(doc.hourly_rate),
    skill_groups: doc.skill_groups?.length ? doc.skill_groups : skills?.length ? [{ name: "Core skills", skills }] : [],
  };
}

/**
 * Applies a flat skill list (the comma-separated editor) to the groups: skills
 * keep their group, new ones join the first group, removed ones drop out.
 */
export function regroup(groups, skills) {
  const wanted = new Set(skills);
  const next = (groups.length ? groups : [{ name: "Core skills", skills: [] }]).map((g) => ({
    name: g.name,
    skills: g.skills.filter((s) => wanted.has(s)),
  }));
  const placed = new Set(next.flatMap((g) => g.skills));
  next[0].skills.push(...skills.filter((s) => !placed.has(s)));
  return next.filter((g) => g.skills.length);
}
