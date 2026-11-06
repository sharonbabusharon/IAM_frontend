import { skill_match } from "./membership_rules.js";
import { get_company, companies } from "./data.js";
import {
  work_types,
  notice_periods,
  relocation_options,
  departments,
  benefit_options,
} from "./filter_options.js";
import { get } from "svelte/store";
import { to_inr } from "./currency.js";
import { location_index, location_label, rates as rates_store } from "./reference.js";

export const filter_groups = [
  {
    title: "Work arrangement",
    key: "modes",
    options: ["Remote", "Hybrid", "On-site"],
  },
  { title: "Department", key: "categories", options: departments },
  {
    title: "Experience level",
    key: "levels",
    options: ["Entry-level", "Mid-level", "Senior", "Lead", "Executive"],
  },
  { title: "Employment type", key: "types", options: work_types },
  { title: "Notice period", key: "notice", options: notice_periods },
  {
    title: "Relocation support",
    key: "relocation",
    options: relocation_options,
  },
  { title: "Listing tier", key: "tiers", options: ["Free", "Premium"] },
  {
    title: "Application method",
    key: "methods",
    options: ["Easy apply", "External", "Email"],
  },
  {
    title: "Industry",
    key: "industries",
    options: [...new Set(companies.map((company) => company.sector))],
  },
  {
    title: "Company size",
    key: "sizes",
    options: [
      "1–10 people",
      "11–50 people",
      "51–200 people",
      "201–500 people",
      "501–1000 people",
      "1000+ people",
    ],
  },
  { title: "Benefits", key: "benefits", options: benefit_options },
  {
    title: "Designation",
    key: "designations",
    // Any designation name from the shared taxonomy (sent to the API as term ids).
    valid: (value) => value.trim().length > 0 && value.length <= 80,
  },
  {
    title: "Skills",
    key: "skills",
    // Any skill name from the shared taxonomy (sent to the API as term ids).
    valid: (value) => value.trim().length > 0 && value.length <= 80,
  },
  {
    title: "Locations",
    key: "locations",
    // GeoNames city ids. Checked by shape, not against the loaded tree, so a
    // shared link still works before the reference data has loaded.
    valid: (value) => /^[1-9][0-9]{0,11}$/.test(value),
  },
];
const array_params = {
  modes: "mode",
  types: "type",
  categories: "category",
  levels: "level",
  notice: "notice",
  relocation: "relocation",
  tiers: "tier",
  methods: "method",
  industries: "industry",
  sizes: "size",
  benefits: "benefit",
  designations: "designation",
  skills: "skill",
  locations: "city",
};
const number_params = {
  min_salary: "minSalary",
  min_match: "match",
  min_experience: "minExperience",
  max_experience: "maxExperience",
  rounds: "rounds",
  posted_within: "posted",
  radius: "radius",
};
export function default_filters() {
  return {
    query: "",
    location: "",
    ...Object.fromEntries(Object.keys(array_params).map((key) => [key, []])),
    easy: false,
    saved: false,
    worldwide: false,
    sort: "newest",
    currency: "INR",
    min_salary: 0,
    min_match: 0,
    min_experience: 0,
    max_experience: "",
    rounds: "",
    round_match: "maximum",
    posted_within: 30,
    radius: 0,
    recruiter: "", // a recruiter's user id: their open roles (job page "See their roles")
  };
}
function numeric(value, fallback, max = 1e12) {
  const number = Number(value);
  return value !== "" && value != null && Number.isFinite(number) && number >= 0
    ? Math.min(number, max)
    : fallback;
}
export function filters_from_params(params) {
  const filters = default_filters();
  filters.query = (params.get("q") ?? "").slice(0, 200);
  filters.location = (params.get("location") ?? "").slice(0, 100);
  for (const group of filter_groups)
    filters[group.key] = [
      ...new Set(
        params
          .getAll(array_params[group.key])
          .filter((value) =>
            group.valid ? group.valid(value) : group.options.includes(value),
          ),
      ),
    ];
  for (const key of ["easy", "saved", "worldwide"])
    filters[key] = params.get(key) === "1";
  const recruiter = params.get("recruiter") ?? "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(recruiter)) filters.recruiter = recruiter;
  for (const [key, param] of Object.entries(number_params))
    filters[key] = numeric(
      params.get(param),
      filters[key],
      key.includes("experience") ? 99 : key === "rounds" ? 20 : 1e12,
    );
  for (const key of ["min_experience", "max_experience", "rounds"])
    if (filters[key] !== "") filters[key] = Math.floor(filters[key]);
  filters.posted_within = [1, 3, 7, 9, 15, 30].includes(filters.posted_within)
    ? filters.posted_within
    : 30;
  filters.radius = [0, 10, 25, 50, 100].includes(filters.radius)
    ? filters.radius
    : 0;
  // A known currency once rates have loaded; before that, any ISO-shaped
  // code, so a shared link keeps its currency.
  const known = get(rates_store);
  const currency = params.get("currency") ?? "";
  filters.currency = (Object.keys(known).length > 1 ? Object.hasOwn(known, currency) : /^[A-Z]{3}$/.test(currency))
    ? currency
    : "INR";
  filters.sort = ["newest", "salary", "title", "recommended", "match"].includes(
    params.get("sort"),
  )
    ? params.get("sort")
    : "newest";
  filters.min_match = [0, 50, 60, 70, 80, 90, 100].includes(filters.min_match)
    ? filters.min_match
    : 0;
  filters.round_match =
    params.get("roundMatch") === "exact" ? "exact" : "maximum";
  return filters;
}
export function filters_to_params(filters) {
  const params = new URLSearchParams();
  const defaults = default_filters();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  for (const [key, param] of Object.entries(array_params))
    (filters[key] ?? []).forEach((value) => params.append(param, value));
  for (const key of ["easy", "saved", "worldwide"])
    if (filters[key]) params.set(key, "1");
  if (filters.recruiter) params.set("recruiter", filters.recruiter);
  for (const [key, param] of Object.entries(number_params))
    if (
      filters[key] !== "" &&
      filters[key] != null &&
      filters[key] !== defaults[key]
    )
      params.set(param, String(filters[key]));
  for (const [key, param] of [
    ["sort", "sort"],
    ["currency", "currency"],
    ["round_match", "roundMatch"],
  ])
    if (filters[key] && filters[key] !== defaults[key])
      params.set(param, filters[key]);
  return params;
}
export function filter_error(filters) {
  if (
    filters.max_experience !== "" &&
    filters.max_experience != null &&
    filters.min_experience > filters.max_experience
  )
    return "Maximum experience must be at least the minimum experience.";
  if (filters.radius && filters.locations.length !== 1)
    return "Select one city to search within a radius.";
  return "";
}
function distance(a, b) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const delta =
    Math.sin(radians(b.lat - a.lat) / 2) ** 2 +
    Math.cos(radians(a.lat)) *
      Math.cos(radians(b.lat)) *
      Math.sin(radians(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(delta), Math.sqrt(1 - delta));
}
// Components pass { index: $location_index, rates: $rates } (last argument) so results
// recompute when the reference data loads; scripts and tests rely on the defaults.
export function filter_jobs(
  jobs,
  input,
  saved = [],
  applied = [],
  profile_skills = [],
  { index = get(location_index), rates = get(rates_store) } = {},
) {
  const filters = { ...default_filters(), ...input };
  if (filter_error(filters)) return [];
  const keywords = filters.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const location = filters.location.trim().toLowerCase();
  const result = jobs.filter((job) => {
    if (
      job.posted > Math.min(30, filters.posted_within) ||
      applied.includes(job.id) ||
      job.unlisted
    )
      return false;
    // Requirements: the search box matches designation/job title only,
    // never descriptions, companies or skills (skills have their own filter).
    const company = get_company(job.company);
    const title = job.title.toLowerCase();
    if (keywords.some((word) => !title.includes(word))) return false;
    if (
      location &&
      job.location_type !== "world_remote" &&
      !job.location.toLowerCase().includes(location) &&
      !(location === "remote" && job.mode === "Remote")
    )
      return false;
    if (filters.worldwide && job.location_type !== "world_remote") return false;
    for (const [key, values] of Object.entries({
      modes: [job.mode],
      types: [job.type],
      categories: [job.category],
      levels: [job.level],
      notice: job.notice_periods ?? [],
      relocation: [job.relocation],
      tiers: [job.tier],
      methods: [
        job.application === "Easy apply"
          ? "Easy apply"
          : job.application === "Email"
            ? "Email"
            : "External",
      ],
      industries: [company.sector],
      sizes: [company.size],
      benefits: job.benefits ?? [],
      designations: [job.title],
      skills: job.skills,
    })) {
      if (
        filters[key].length &&
        !filters[key].some((value) => values.includes(value))
      )
        return false;
    }
    if (filters.locations.length && job.location_type !== "world_remote") {
      const target = index.get(filters.locations[0]);
      if (
        !job.location_ids?.some((id) => {
          const city = index.get(id);
          return (
            filters.locations.includes(id) ||
            (filters.radius &&
              target?.lat != null &&
              city?.lat != null &&
              distance(target, city) <= filters.radius)
          );
        })
      )
        return false;
    }
    if (filters.easy && job.application !== "Easy apply") return false;
    if (filters.saved && !saved.includes(job.id)) return false;
    if (
      filters.min_experience &&
      !(job.experience_years >= filters.min_experience)
    )
      return false;
    if (
      filters.max_experience !== "" &&
      filters.max_experience != null &&
      !(job.experience_years <= filters.max_experience)
    )
      return false;
    if (
      filters.rounds !== "" &&
      filters.rounds != null &&
      !(filters.round_match === "exact"
        ? job.interview_rounds === Number(filters.rounds)
        : job.interview_rounds <= filters.rounds)
    )
      return false;
    // Hidden amounts are never shipped to the browser; salary matching for those jobs needs the API.
    if (filters.min_salary) {
      if (job.salary_hidden || job.salary_max == null) return false;
      if (
        to_inr(job.salary_max, job.currency, rates) <
        to_inr(filters.min_salary || 0, filters.currency, rates)
      )
        return false;
    }
    if (
      filters.min_match &&
      skill_match(job, profile_skills) < filters.min_match
    )
      return false;
    return true;
  });
  const recent = (a, b) => a.posted - b.posted || a.id.localeCompare(b.id);
  if (filters.sort === "match")
    result.sort(
      (a, b) =>
        skill_match(b, profile_skills) - skill_match(a, profile_skills) ||
        recent(a, b),
    );
  else if (filters.sort === "salary")
    result.sort(
      (a, b) =>
        (b.salary_hidden ? -1 : to_inr(b.salary_max ?? 0, b.currency, rates)) -
          (a.salary_hidden ? -1 : to_inr(a.salary_max ?? 0, a.currency, rates)) ||
        recent(a, b),
    );
  else if (filters.sort === "title")
    result.sort((a, b) => a.title.localeCompare(b.title));
  else if (filters.sort === "recommended")
    result.sort(
      (a, b) =>
        keywords.filter((word) => b.title.toLowerCase().includes(word)).length -
          keywords.filter((word) => a.title.toLowerCase().includes(word))
            .length || recent(a, b),
    );
  else result.sort(recent);
  return result;
}
export function active_filter_labels(filters) {
  const labels = filter_groups.flatMap((group) =>
    filters[group.key].map((value) => ({
      key: group.key,
      value,
      label:
        group.key === "locations"
          ? get(location_label)(value)
          : value,
    })),
  );
  for (const [key, label] of [
    ["query", filters.query],
    ["location", filters.location],
    ["worldwide", "Worldwide remote"],
    ["easy", "Easy apply"],
    [
      "min_salary",
      `From ${filters.min_salary?.toLocaleString()} ${filters.currency}`,
    ],
    ["min_match", `${filters.min_match}%+ skill match`],
    ["min_experience", `${filters.min_experience}+ years`],
    ["max_experience", `Up to ${filters.max_experience} years`],
    [
      "rounds",
      `${filters.round_match === "exact" ? "Exactly" : "Up to"} ${filters.rounds} rounds`,
    ],
    ["posted_within", `Last ${filters.posted_within} days`],
    ["radius", `Within ${filters.radius} km`],
    ["recruiter", "One recruiter’s roles"],
  ]) {
    if (
      (filters[key] ||
        (["max_experience", "rounds"].includes(key) && filters[key] === 0)) &&
      !(key === "posted_within" && filters[key] === 30)
    )
      labels.push({ key, value: null, label });
  }
  return labels;
}
