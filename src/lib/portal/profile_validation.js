const text = (value) => typeof value === "string";
const shape = (item, fields) =>
  item && fields.every(([key, type]) => typeof item[key] === type);
const arrays = {
  skills: text,
  work_types: text,
  preferred_locations: text,
  target_roles: text,
  social_links: (item) =>
    shape(item, [
      ["platform", "string"],
      ["url", "string"],
    ]) && /^https?:\/\//i.test(item.url),
  languages: (item) =>
    shape(item, [
      ["name", "string"],
      ["proficiency", "string"],
    ]),
  experiences: (item) =>
    shape(item, [
      ["company", "string"],
      ["title", "string"],
      ["type", "string"],
      ["start", "string"],
      ["end", "string"],
      ["current", "boolean"],
      ["promoted", "boolean"],
      ["description", "string"],
      ["verification", "string"],
    ]),
  authorizations: (item) =>
    shape(item, [
      ["country", "string"],
      ["type", "string"],
      ["from", "string"],
      ["until", "string"],
      ["indefinite", "boolean"],
    ]),
  education: (item) =>
    shape(item, [
      ["institution", "string"],
      ["degree", "string"],
      ["field", "string"],
      ["start", "string"],
      ["end", "string"],
    ]),
};
export function restore_profile(stored, defaults) {
  const next = structuredClone(defaults);
  if (!stored || typeof stored !== "object" || Array.isArray(stored))
    return next;
  const old_keys = {
    salary_private: "salaryPrivate",
    resume_private: "resumePrivate",
    work_mode: "workMode",
  };
  for (const key of Object.keys(defaults)) {
    const value = stored[key] ?? stored[old_keys[key]];
    if (arrays[key]) {
      if (Array.isArray(value) && value.every(arrays[key]))
        next[key] = structuredClone(value);
    } else if (typeof defaults[key] === "number") {
      if (Number.isFinite(value) && value >= 0) next[key] = value;
    } else if (typeof value === typeof defaults[key]) next[key] = value;
  }
  if (!["INR", "USD", "GBP", "EUR"].includes(next.salary_currency))
    next.salary_currency = "INR";
  if (stored.experience_years == null && typeof stored.experience === "string")
    next.experience_years = Math.max(
      0,
      Math.min(99, parseFloat(stored.experience) || 0),
    );
  if (next.notice === "Immediately") next.notice = "Immediate";
  return next;
}
export function profile_error(profile) {
  if (
    profile.name.trim().length < 2 ||
    profile.name.length > 100 ||
    !profile.title.trim()
  )
    return "Add a name between 2 and 100 characters and a professional title.";
  if (
    !/^[a-z0-9-]{3,50}$/.test(profile.slug) ||
    ["admin", "api", "jobs", "profile", "login", "signup", "support"].includes(
      profile.slug,
    )
  )
    return "Choose a valid, non-reserved profile handle.";
  if (profile.social_links.some((link) => !/^https?:\/\//i.test(link.url)))
    return "Social links must start with https:// or http://.";
  if (
    profile.experiences.some(
      (entry) => !entry.current && entry.end < entry.start,
    )
  )
    return "An experience cannot end before it starts.";
  if (
    profile.authorizations.some(
      (entry) => !entry.indefinite && entry.until < entry.from,
    )
  )
    return "Authorization expiry cannot be before its start date.";
  if (profile.is_serving_notice && !profile.last_working_date)
    return "Add your last working date.";
  return "";
}
