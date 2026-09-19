import { get_company } from "./data";
export function default_filters() {
  return {
    query: "",
    location: "",
    modes: [],
    types: [],
    categories: [],
    levels: [],
    easy: false,
    saved: false,
    sort: "recommended",
    currency: "",
    min_salary: 0,
  };
}
export function filters_from_params(params) {
  return {
    query: params.get("q") ?? "",
    location: params.get("location") ?? "",
    modes: params.getAll("mode"),
    types: params.getAll("type"),
    categories: params.getAll("category"),
    levels: params.getAll("level"),
    easy: params.get("easy") === "1",
    saved: params.get("saved") === "1",
    sort: params.get("sort") ?? "recommended",
    currency: params.get("currency") ?? "",
    min_salary: Math.max(0, Number(params.get("minSalary")) || 0),
  };
}
export function filters_to_params(filters) {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.location.trim()) params.set("location", filters.location.trim());
  for (const [key, values] of [
    ["mode", filters.modes],
    ["type", filters.types],
    ["category", filters.categories],
    ["level", filters.levels],
  ])
    values.forEach((value) => params.append(key, value));
  if (filters.easy) params.set("easy", "1");
  if (filters.saved) params.set("saved", "1");
  if (filters.sort !== "recommended") params.set("sort", filters.sort);
  if (filters.currency) params.set("currency", filters.currency);
  if (filters.currency && filters.min_salary > 0)
    params.set("minSalary", String(filters.min_salary));
  return params;
}
export function filter_jobs(jobs, filters, saved) {
  const query = filters.query.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  const keywords = query ? query.split(/\s+/) : [];
  const result = jobs.filter((job) => {
    const haystack = [
      job.title,
      get_company(job.company).name,
      job.category,
      ...job.skills,
    ]
      .join(" ")
      .toLowerCase();
    if (keywords.some((word) => !haystack.includes(word))) return false;
    const matches_location = job.location.toLowerCase().includes(location);
    const matches_remote = location === "remote" && job.mode === "Remote";
    if (location && !matches_location && !matches_remote) return false;
    if (filters.modes.length && !filters.modes.includes(job.mode)) return false;
    if (filters.types.length && !filters.types.includes(job.type)) return false;
    if (filters.categories.length && !filters.categories.includes(job.category))
      return false;
    if (filters.levels.length && !filters.levels.includes(job.level))
      return false;
    if (filters.easy && job.application !== "Easy apply") return false;
    if (filters.saved && !saved.includes(job.id)) return false;
    if (filters.currency) {
      if (job.currency !== filters.currency) return false;
      if (filters.min_salary > job.salary_max) return false;
    }
    return true;
  });
  if (filters.sort === "newest") result.sort((a, b) => a.posted - b.posted);
  if (filters.sort === "title")
    result.sort((a, b) => a.title.localeCompare(b.title));
  return result;
}
