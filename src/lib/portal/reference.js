// Reference data from the findJobs backend: skills, designations, the
// location tree and exchange rates (manual: "Skills and Designations",
// "Locations", "Salary"). The backend publishes immutable, versioned JSON
// files plus a manifest; the browser keeps the last copy of each in IndexedDB,
// so autocomplete, the location tree and currency conversion work from memory,
// and only changed files are downloaded.
//
// No SvelteKit imports: Node tests and scripts import this module and seed it
// with set_reference().
import { writable, derived } from "svelte/store";

export const skills = writable([]); // [{ id, name, verified }]
export const designations = writable([]); // [{ id, name, verified }]
export const locations = writable([]); // flat [{ id, parent_id, level, name, country_code, lat?, lng? }]
export const rates = writable({ INR: 1 }); // INR per one unit of each currency
export const reference_status = writable("idle"); // idle | loading | ready | error

/** id -> location, for labels and radius search. */
export const location_index = derived(
  locations,
  (list) => new Map(list.map((l) => [l.id, l])),
);

/** Country -> region -> city tree; cities are the selectable leaves. */
export const location_tree = derived(locations, build_location_tree);

/** Store of a function: $location_label(id) -> "Bengaluru" (falls back to the id). */
export const location_label = derived(
  location_index,
  (index) => (id) => index.get(id)?.name ?? id,
);

/** Currencies offered in pickers: common ones first, then the rest A-Z. */
export const currency_options = derived(rates, (r) => {
  const common = ["INR", "USD", "EUR", "GBP", "AED", "SGD"].filter((c) => r[c]);
  return [...common, ...Object.keys(r).filter((c) => !common.includes(c)).sort()];
});

export function build_location_tree(list) {
  const nodes = new Map(
    list.map((l) => [l.id, { id: l.id, name: l.name, level: l.level, country_code: l.country_code, children: [] }]),
  );
  const roots = [];
  for (const l of list) {
    const node = nodes.get(l.id);
    const parent = l.parent_id && nodes.get(l.parent_id);
    if (parent) parent.children.push(node);
    else if (l.level === "country") roots.push(node);
  }
  // Cities are leaves; drop countries/regions with no cities, since only
  // city ids are sent to search (manual "Locations": flatten leaf cities).
  const prune = (node) => {
    if (node.level === "city") return delete node.children, true;
    node.children = node.children.filter(prune);
    return node.children.length > 0;
  };
  const by_name = (a, b) => a.name.localeCompare(b.name);
  const sort = (node) => node.children && (node.children.sort(by_name), node.children.forEach(sort));
  const tree = roots.filter(prune).sort(by_name);
  tree.forEach(sort);
  return tree;
}

/** For Node tests and scripts: install fixed reference data. */
export function set_reference(data) {
  if (data.skills) skills.set(data.skills);
  if (data.designations) designations.set(data.designations);
  if (data.locations) locations.set(data.locations);
  if (data.rates) rates.set(data.rates);
  reference_status.set("ready");
}

// ---- Browser sync -------------------------------------------------------

const kinds = ["skills", "designations", "locations", "rates"];
const stores = { skills, designations, locations, rates };
const file_pattern = /^(skills|designations|locations|rates)-\d{8}T\d{6}Z-[0-9a-f]{8}\.json$/;

// Shape checks before anything reaches the UI: a bad or tampered file is
// rejected and the previous copy stays in use.
const valid = {
  skills: (d) => Array.isArray(d) && d.every((t) => Number.isInteger(t.id) && typeof t.name === "string"),
  designations: (d) => valid.skills(d),
  locations: (d) =>
    Array.isArray(d) &&
    d.every((l) => typeof l.id === "string" && typeof l.name === "string" && ["country", "region", "city"].includes(l.level)),
  rates: (d) =>
    d && d.base === "INR" && d.rates && d.rates.INR === 1 &&
    Object.entries(d.rates).every(([c, v]) => /^[A-Z]{3}$/.test(c) && Number.isFinite(v) && v > 0),
};
const unwrap = { rates: (d) => d.rates };

let sync_promise = null;

/** Load cached copies, then fetch whatever the manifest says changed. Safe to call repeatedly. */
export function sync_reference() {
  if (typeof window === "undefined") return Promise.resolve();
  sync_promise ??= run_sync().finally(() => {
    // Allow a later re-sync (e.g. next navigation after an error).
    setTimeout(() => (sync_promise = null), 60_000);
  });
  return sync_promise;
}

async function run_sync() {
  reference_status.set("loading");
  const db = await open_db().catch(() => null); // private mode etc.: memory only
  const cached = {};
  for (const kind of kinds) {
    cached[kind] = db ? await idb(db, "readonly", (s) => s.get(kind)).catch(() => null) : null;
    if (cached[kind] && valid[kind](cached[kind].data)) apply(kind, cached[kind].data);
  }
  try {
    const response = await fetch("/reference/manifest");
    if (!response.ok) throw new Error("manifest " + response.status);
    const manifest = await response.json();
    for (const kind of kinds) {
      const entry = manifest[kind];
      if (!entry || !file_pattern.test(entry.file) || cached[kind]?.file === entry.file) continue;
      const file = await fetch("/reference/" + entry.file);
      if (!file.ok) throw new Error(entry.file + " " + file.status);
      const data = await file.json();
      if (!valid[kind](data)) throw new Error(entry.file + " has an unexpected shape");
      apply(kind, data);
      // One record per kind, replaced in a single transaction (manual: atomic overwrite).
      if (db) await idb(db, "readwrite", (s) => s.put({ kind, file: entry.file, data })).catch(() => {});
    }
    reference_status.set("ready");
  } catch {
    // Offline or backend down: keep whatever was cached.
    reference_status.set(kinds.some((k) => cached[k]) ? "ready" : "error");
  }
}

function apply(kind, data) {
  stores[kind].set(unwrap[kind] ? unwrap[kind](data) : data);
}

function open_db() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("referise-reference", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("assets", { keyPath: "kind" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idb(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const request = operation(db.transaction("assets", mode).objectStore("assets"));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
