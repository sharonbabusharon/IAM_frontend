// Fixed reference data for Node tests and scripts: a slice of the published
// GeoNames tree (real ids) and the old preview rates, so expectations are stable.
export const test_locations = [
  { id: "1269750", parent_id: null, level: "country", name: "India", country_code: "IN" },
  { id: "1267701", parent_id: "1269750", level: "region", name: "Karnataka", country_code: "IN" },
  { id: "1264418", parent_id: "1269750", level: "region", name: "Maharashtra", country_code: "IN" },
  { id: "1254788", parent_id: "1269750", level: "region", name: "Telangana", country_code: "IN" },
  { id: "1277333", parent_id: "1267701", level: "city", name: "Bengaluru", country_code: "IN", lat: 12.97194, lng: 77.59369 },
  { id: "1275339", parent_id: "1264418", level: "city", name: "Mumbai", country_code: "IN", lat: 19.07283, lng: 72.88261 },
  { id: "1269843", parent_id: "1254788", level: "city", name: "Hyderabad", country_code: "IN", lat: 17.38405, lng: 78.45636 },
  { id: "2635167", parent_id: null, level: "country", name: "United Kingdom", country_code: "GB" },
  { id: "6269131", parent_id: "2635167", level: "region", name: "England", country_code: "GB" },
  { id: "2643743", parent_id: "6269131", level: "city", name: "London", country_code: "GB", lat: 51.50853, lng: -0.12574 },
  { id: "6252001", parent_id: null, level: "country", name: "United States", country_code: "US" },
  { id: "5128638", parent_id: "6252001", level: "region", name: "New York", country_code: "US" },
  { id: "5128581", parent_id: "5128638", level: "city", name: "New York City", country_code: "US", lat: 40.71427, lng: -74.00597 },
  { id: "3017382", parent_id: null, level: "country", name: "France", country_code: "FR" }, // no cities: pruned
];
export const test_rates = { INR: 1, USD: 85, GBP: 110, EUR: 95 };
