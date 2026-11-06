export const work_types = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Consultant",
  "Gig",
  "Advisory",
  "Board member",
  "Volunteering",
  "Others",
];
export const notice_periods = [
  "Immediate",
  "15 days",
  "30 days",
  "45 days",
  "60 days",
  "90 days",
  "More than 90 days",
];
// Profile choices (backend domain/profiles: Availabilities, TravelOptions, SalaryPeriods).
export const availability_options = [
  "Available immediately",
  "Currently employed",
  "Serving notice",
  "Available from date",
  "Not available",
];
export const travel_options = [
  "No travel",
  "Occasional travel",
  "Up to 25%",
  "Up to 50%",
  "Up to 75%",
  "Up to 100%",
];
export const salary_periods = ["year", "month", "hour"];
export const visibility_labels = {
  all: "Visible to all",
  applied: "Applied jobs only",
  hidden: "Hidden from all",
};
export const relocation_options = [
  "On their own",
  "Supported locally",
  "Supported internationally",
  "Not supported",
];
export const departments = [
  "Design",
  "Engineering",
  "Product",
  "Marketing",
  "Data",
  "Operations",
];
export const benefit_options = [
  "Health insurance",
  "Flexible hours",
  "Learning budget",
  "Paid leave",
];
// The location tree, labels and coordinates come from the published
// GeoNames data: see reference.js (location_tree, location_label, location_index).
import { get } from "svelte/store";
import { location_label } from "./reference.js";
// One-off label lookup; components should use $location_label so names
// update once the reference data loads.
export const location_name = (id) => get(location_label)(id);
export function leaves(nodes) {
  return nodes.flatMap((node) =>
    node.children ? leaves(node.children) : [node],
  );
}
// Company sizes, as the company API stores them (directory, form, landing).
export const company_sizes = ["1–10 people", "11–50 people", "51–200 people", "201–500 people", "501–1,000 people", "1,001–5,000 people", "5,000+ people"];
