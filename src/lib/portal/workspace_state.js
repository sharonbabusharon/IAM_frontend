import { writable, derived } from "svelte/store";
import { browser } from "$app/environment";
import { companies, jobs } from "./data.js";
import { toast } from "./state.js";

export function company_defaults(company) {
  return {
    ...company,
    website: "",
    address: "",
    domains: company.sector,
    branches: [],
    headquarters:
      {
        forma: ["1277333"],
        layers: ["2643743"],
        orbit: ["1275339"],
        monograph: ["5128581"],
        arc: ["1269843"],
      }[company.id] || [],
    linkedin: "",
    social: "",
    products: [
      {
        name: `${company.name} Workspace`,
        description: "A shared home for projects, people and the work ahead.",
        url: "",
      },
    ],
    benefits: [
      {
        title: "Flexible working",
        description: "Space to do your best work, wherever the day takes you.",
        icon: "laptop",
      },
      {
        title: "Learning budget",
        description: "Make time for new skills and a fresh perspective.",
        icon: "spark",
      },
      {
        title: "Health & wellbeing",
        description: "Support for your health and life outside work.",
        icon: "heart",
      },
    ],
  };
}
export const company_records = writable(companies.map(company_defaults));
export const followed_companies = writable([]);
export const recruitment_jobs = writable(
  jobs
    .filter((job) => job.company === "forma")
    .map((job, i) => ({
      ...job,
      poster_id: "preview-alex",
      status: i === 1 ? "Closed" : "Active",
      applicants: i === 1 ? 12 : 24,
      views: i === 1 ? 93 : 186,
    })),
);
export const closed_job_ids = derived(recruitment_jobs, (items) =>
  items.filter((j) => j.status === "Closed").map((j) => j.id),
);
export const team_members = writable([
  {
    id: "maya",
    name: "Maya Chen",
    email: "maya@example.com",
    title: "People & operations lead",
    role: "Company Admin",
    status: "Current",
    company: "forma",
    department: "People",
    limit: 0,
    spent: 0,
    cap_type: "Monthly",
    since: "2022-03",
  },
  {
    id: "arun",
    name: "Arun Shah",
    email: "arun@example.com",
    title: "Technical recruiter",
    role: "HR / Recruiter",
    status: "Current",
    company: "forma",
    department: "People",
    limit: 50000,
    spent: 15000,
    cap_type: "Monthly",
    since: "2023-06",
  },
  {
    id: "leah",
    name: "Leah Park",
    email: "leah@example.com",
    title: "Engineering lead",
    role: "Employee",
    status: "Current",
    company: "forma",
    department: "Engineering",
    limit: 0,
    spent: 0,
    cap_type: "Monthly",
    since: "2022-10",
  },
  {
    id: "dev",
    name: "Dev Rao",
    email: "dev@example.com",
    title: "Product designer",
    role: "Employee",
    status: "Pending",
    company: "forma",
    department: "Design",
    limit: 0,
    spent: 0,
    cap_type: "Monthly",
    since: "2024-04",
  },
  {
    id: "nina",
    name: "Nina Patel",
    email: "nina@example.com",
    title: "Recruiter",
    role: "HR / Recruiter",
    status: "Past",
    company: "forma",
    department: "People",
    limit: 0,
    spent: 10000,
    cap_type: "Monthly",
    since: "2021-09",
  },
]);
export const candidate_records = writable([
  {
    id: "riley",
    name: "Riley Morgan",
    title: "Product designer",
    job_id: "senior-product-designer",
    location: "Bengaluru, India",
    experience: 5,
    notice: "30 days",
    expected: 3200000,
    skills: ["Figma", "Product design", "Design systems"],
    stage: "New",
    applied: "2026-10-07",
    email: "riley@example.com",
  },
  {
    id: "sam",
    name: "Sam Rivera",
    title: "Senior product designer",
    job_id: "senior-product-designer",
    location: "Mumbai, India",
    experience: 7,
    notice: "Immediate",
    expected: 3800000,
    skills: ["Figma", "Research", "Prototyping"],
    stage: "Reviewing",
    applied: "2026-10-06",
    email: "sam@example.com",
  },
  {
    id: "jules",
    name: "Jules Kim",
    title: "Product designer",
    job_id: "senior-product-designer",
    location: "Bengaluru, India",
    experience: 6,
    notice: "60 days",
    expected: 3500000,
    skills: ["Product design", "Design systems"],
    stage: "Interview",
    applied: "2026-10-05",
    email: "jules@example.com",
  },
]);
export const wallet_transactions = writable([
  {
    id: "tx1",
    date: "2026-10-07",
    type: "Job post deduction",
    by: "Arun Shah",
    amount: -5000,
    reference: "REF-1003",
  },
  {
    id: "tx2",
    date: "2026-10-05",
    type: "Job post deduction",
    by: "Arun Shah",
    amount: -10000,
    reference: "REF-1002",
  },
  {
    id: "tx3",
    date: "2026-10-01",
    type: "Wallet top-up",
    by: "Maya Chen",
    amount: 140000,
    reference: "REF-1001",
  },
]);
export const preview_role = writable("Company Admin");
let hydrated = false;
export function hydrate_workspace() {
  if (!browser || hydrated) return;
  hydrated = true;
  for (const [key, store] of Object.entries({
    companies: company_records,
    follows: followed_companies,
    recruitment: recruitment_jobs,
    team: team_members,
    candidates: candidate_records,
    ledger: wallet_transactions,
  })) {
    try {
      const value = JSON.parse(
        localStorage.getItem(`referise-workspace-v1:${key}`) || "null",
      );
      if (Array.isArray(value))
        store.set(
          key === "recruitment"
            ? value.map((item) => ({
                ...item,
                poster_id: item.poster_id || "preview-alex",
              }))
            : value,
        );
    } catch {
      /* Use the sample state if browser storage is unavailable. */
    }
    store.subscribe((value) => {
      try {
        localStorage.setItem(
          `referise-workspace-v1:${key}`,
          JSON.stringify(value),
        );
      } catch {
        toast(
          "This change lasts for this visit. Browser storage is unavailable.",
        );
      }
    });
  }
}
export const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
export const inr = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
export function download_csv(filename, columns, rows) {
  const cell = (value) =>
    '"' +
    String(value ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replaceAll('"', '""') +
    '"';
  const url = URL.createObjectURL(
    new Blob(
      [[columns, ...rows].map((row) => row.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    ),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
