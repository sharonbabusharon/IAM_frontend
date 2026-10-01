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
export const location_tree = [
  {
    id: "in",
    name: "India",
    children: [
      {
        id: "in-ka",
        name: "Karnataka",
        children: [
          { id: "in-blr", name: "Bengaluru", lat: 12.972, lng: 77.595 },
        ],
      },
      {
        id: "in-mh",
        name: "Maharashtra",
        children: [{ id: "in-bom", name: "Mumbai", lat: 19.076, lng: 72.878 }],
      },
      {
        id: "in-ts",
        name: "Telangana",
        children: [
          { id: "in-hyd", name: "Hyderabad", lat: 17.385, lng: 78.487 },
        ],
      },
    ],
  },
  {
    id: "gb",
    name: "United Kingdom",
    children: [
      {
        id: "gb-eng",
        name: "England",
        children: [{ id: "gb-lon", name: "London", lat: 51.507, lng: -0.128 }],
      },
    ],
  },
  {
    id: "us",
    name: "United States",
    children: [
      {
        id: "us-ny",
        name: "New York",
        children: [
          { id: "us-nyc", name: "New York City", lat: 40.713, lng: -74.006 },
        ],
      },
    ],
  },
];
export function leaves(nodes) {
  return nodes.flatMap((node) =>
    node.children ? leaves(node.children) : [node],
  );
}
export const cities = leaves(location_tree);
export function location_name(id) {
  return cities.find((city) => city.id === id)?.name ?? id;
}
