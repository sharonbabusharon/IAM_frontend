import { get_company, jobs as sample_jobs, companies } from "./data.js";
import {
  work_types,
  notice_periods,
  relocation_options,
  departments,
  benefit_options,
  cities,
  location_name,
} from "./filter_options.js";
import { preview_rates, to_inr } from "./currency.js";

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
    options: sample_jobs.map((job) => job.id),
  },
  {
    title: "Skills",
    key: "skills",
    options: [...new Set(sample_jobs.flatMap((job) => job.skills))],
  },
  {
    title: "Locations",
    key: "locations",
    options: cities.map((city) => city.id),
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
  max_salary: "maxSalary",
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
    max_salary: 0,
    min_experience: 0,
    max_experience: "",
    rounds: "",
    round_match: "maximum",
    posted_within: 30,
    radius: 0,
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
          .filter((value) => group.options.includes(value)),
      ),
    ];
  for (const key of ["easy", "saved", "worldwide"])
    filters[key] = params.get(key) === "1";
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
  filters.currency = Object.hasOwn(preview_rates, params.get("currency"))
    ? params.get("currency")
    : "INR";
  filters.sort = ["newest", "salary", "title", "recommended"].includes(
    params.get("sort"),
  )
    ? params.get("sort")
    : "newest";
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
  if (filters.max_salary > 0 && filters.min_salary > filters.max_salary)
    return "Maximum salary must be at least the minimum salary.";
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
export function filter_jobs(jobs, input, saved = [], applied = []) {
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
    const company = get_company(job.company);
    const haystack = [job.title, company.name, job.category, ...job.skills]
      .join(" ")
      .toLowerCase();
    if (keywords.some((word) => !haystack.includes(word))) return false;
    if (
      location &&
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
      designations: [job.designation_id ?? job.id],
      skills: job.skills,
    })) {
      if (
        filters[key].length &&
        !filters[key].some((value) => values.includes(value))
      )
        return false;
    }
    if (filters.locations.length) {
      const target = cities.find((city) => city.id === filters.locations[0]);
      if (
        !job.location_ids?.some(
          (id) =>
            filters.locations.includes(id) ||
            (filters.radius &&
              target &&
              cities.some(
                (city) =>
                  city.id === id && distance(target, city) <= filters.radius,
              )),
        )
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
    if (filters.min_salary || filters.max_salary) {
      if (job.salary_hidden || job.salary_max == null) return false;
      if (
        to_inr(job.salary_max, job.currency) <
        to_inr(filters.min_salary || 0, filters.currency)
      )
        return false;
      if (
        filters.max_salary &&
        to_inr(job.salary_min ?? 0, job.currency) >
          to_inr(filters.max_salary, filters.currency)
      )
        return false;
    }
    return true;
  });
  const recent = (a, b) => a.posted - b.posted || a.id.localeCompare(b.id);
  if (filters.sort === "salary")
    result.sort(
      (a, b) =>
        (b.salary_hidden ? -1 : to_inr(b.salary_max ?? 0, b.currency)) -
          (a.salary_hidden ? -1 : to_inr(a.salary_max ?? 0, a.currency)) ||
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
          ? location_name(value)
          : group.key === "designations"
            ? (sample_jobs.find((job) => job.id === value)?.title ?? value)
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
    [
      "max_salary",
      `Up to ${filters.max_salary?.toLocaleString()} ${filters.currency}`,
    ],
    ["min_experience", `${filters.min_experience}+ years`],
    ["max_experience", `Up to ${filters.max_experience} years`],
    [
      "rounds",
      `${filters.round_match === "exact" ? "Exactly" : "Up to"} ${filters.rounds} rounds`,
    ],
    ["posted_within", `Last ${filters.posted_within} days`],
    ["radius", `Within ${filters.radius} km`],
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
