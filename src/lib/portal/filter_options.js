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
