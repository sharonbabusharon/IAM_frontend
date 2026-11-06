const text = (value) => typeof value === "string";
const shape = (item, fields) =>
  item && fields.every(([key, type]) => typeof item[key] === type);
const arrays = {
  skill_groups: (item) =>
    item &&
    typeof item.name === "string" &&
    Array.isArray(item.skills) &&
    item.skills.every(text),
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
      ["read", "boolean"],
      ["write", "boolean"],
      ["speak", "boolean"],
    ]),
  experiences: (item) =>
    shape(item, [
      ["company", "string"],
      ["type", "string"],
      ["start", "string"],
      ["end", "string"],
      ["current", "boolean"],
      ["verification", "string"],
    ]) &&
    Array.isArray(item.roles) &&
    item.roles.every(
      (role) =>
        shape(role, [
          ["title", "string"],
          ["start", "string"],
          ["end", "string"],
          ["promoted", "boolean"],
          ["responsibilities", "string"],
        ]) && Array.isArray(role.achievements),
    ),
  authorizations: (item) =>
    shape(item, [
      ["country", "string"],
      ["type", "string"],
      ["from", "string"],
      ["until", "string"],
      ["indefinite", "boolean"],
    ]),
  projects: (item) =>
    shape(item, [
      ["title", "string"],
      ["description", "string"],
      ["url", "string"],
    ]) &&
    Array.isArray(item.tags) &&
    item.tags.every(text),
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
  const old_keys = { work_mode: "workMode" };
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
    ["expected_salary", "current_salary", "hourly_rate"].some(
      (key) =>
        profile[key] !== undefined &&
        (!Number.isFinite(Number(profile[key])) || Number(profile[key]) < 0),
    )
  )
    return "Compensation must be a positive amount or zero.";
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
  for (const entry of profile.experiences) {
    if (!entry.roles?.length) return `Add at least one role at ${entry.company || "each company"}.`;
    for (const role of entry.roles) {
      if (!role.title.trim()) return `Give each role at ${entry.company || "this company"} a title.`;
      if (!role.start || role.start < entry.start)
        return `Each role at ${entry.company || "this company"} must start within the employment period.`;
      const end = role.end || (entry.current ? "" : entry.end);
      if (end && (end < role.start || (!entry.current && end > entry.end)))
        return `Each role at ${entry.company || "this company"} must end within the employment period.`;
    }
  }
  if (
    profile.authorizations.some(
      (entry) => !entry.indefinite && entry.until < entry.from,
    )
  )
    return "Authorization expiry cannot be before its start date.";
  if (profile.availability === "Serving notice" && !profile.last_working_date)
    return "Add your last working date.";
  if (profile.availability === "Available from date" && !profile.available_from)
    return "Add the date you're available from.";
  if (
    profile.notice_unit &&
    (!Number.isInteger(Number(profile.notice_value)) ||
      Number(profile.notice_value) < 0 ||
      Number(profile.notice_value) * { days: 1, weeks: 7, months: 30 }[profile.notice_unit] > 365)
  )
    return "A notice period is 0 to 365 days, 52 weeks or 12 months.";
  return "";
}
