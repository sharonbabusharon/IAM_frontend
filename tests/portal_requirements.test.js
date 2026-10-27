import test from "node:test";
import assert from "node:assert/strict";
import { jobs, default_profile, salary } from "../src/lib/portal/data.js";
import {
  default_filters,
  filters_from_params,
  filters_to_params,
  filter_jobs,
  filter_error,
  active_filter_labels,
} from "../src/lib/portal/search.js";
import { converted_salary, to_inr } from "../src/lib/portal/currency.js";
import {
  restore_profile,
  profile_error,
} from "../src/lib/portal/profile_validation.js";
import { get } from "svelte/store";
import { leaves } from "../src/lib/portal/filter_options.js";
import {
  set_reference,
  location_tree,
  build_location_tree,
} from "../src/lib/portal/reference.js";
import { test_locations, test_rates } from "./fixtures/reference.js";

set_reference({ locations: test_locations, rates: test_rates });

const search = (filters, data = jobs, applied = []) =>
  filter_jobs(data, { ...default_filters(), ...filters }, [], applied);
test("every new filter survives a shareable URL round trip", () => {
  const filters = {
    ...default_filters(),
    query: "design",
    location: "India",
    modes: ["Remote", "Hybrid"],
    types: ["Gig", "Volunteering"],
    categories: ["Design"],
    levels: ["Senior"],
    notice: ["45 days", "More than 90 days"],
    relocation: ["Supported locally"],
    tiers: ["Premium"],
    methods: ["External"],
    industries: ["Developer tools"],
    sizes: ["51–200 people"],
    benefits: ["Paid leave"],
    designations: [jobs[0].title],
    skills: ["Figma"],
    locations: ["1277333"],
    easy: true,
    saved: true,
    worldwide: true,
    sort: "salary",
    currency: "USD",
    min_salary: 30000,
    min_match: 70,
    min_experience: 2,
    max_experience: 8,
    rounds: 0,
    round_match: "exact",
    posted_within: 9,
    radius: 25,
  };
  assert.deepEqual(filters_from_params(filters_to_params(filters)), filters);
});
test("malformed and obsolete URL options cannot inject invalid state", () => {
  const filters = filters_from_params(
    new URLSearchParams(
      "minSalary=Infinity&maxSalary=-1&rounds=no&currency=BAD&mode=Fake&mode=Remote&mode=Remote&maxExperience=4.7&sort=bogus&posted=100&radius=15",
    ),
  );
  assert.equal(filters.min_salary, 0);
  assert.equal(filters.max_salary, undefined);
  assert.equal(filters.rounds, "");
  assert.equal(filters.currency, "INR");
  assert.deepEqual(filters.modes, ["Remote"]);
  assert.equal(filters.max_experience, 4);
  assert.equal(filters.sort, "newest");
  assert.equal(filters.posted_within, 30);
  assert.equal(filters.radius, 0);
});
test("filter categories use AND, selections within each category use OR", () => {
  const results = search({
    modes: ["Remote", "Hybrid"],
    categories: ["Design", "Engineering"],
    tiers: ["Premium"],
  });
  assert.ok(results.length > 1);
  assert.ok(
    results.every(
      (job) =>
        ["Remote", "Hybrid"].includes(job.mode) &&
        ["Design", "Engineering"].includes(job.category) &&
        job.tier === "Premium",
    ),
  );
  assert.ok(search({ categories: ["Design"], types: ["Gig"] }).length === 0);
});
test("worldwide remote does not include geographically restricted remote jobs", () => {
  const remote = search({ modes: ["Remote"] });
  const worldwide = search({ worldwide: true });
  assert.ok(remote.length > worldwide.length);
  assert.ok(worldwide.every((job) => job.location === "Worldwide"));
});
test("city trees flatten to leaves and radius requires a single city", () => {
  assert.deepEqual(
    leaves([get(location_tree)[0]]).map((city) => city.id),
    ["1277333", "1275339", "1269843"],
  );
  assert.equal(
    search({ locations: ["1277333", "1275339"] }).length,
    jobs.filter(
      (job) =>
        !job.unlisted &&
        (["Bengaluru, India", "Mumbai, India"].includes(job.location) ||
          job.location_type === "world_remote"),
    ).length,
  );
  assert.ok(filter_error({ ...default_filters(), radius: 25 }));
  assert.deepEqual(
    search({ locations: ["1277333"], radius: 25 }),
    search({ locations: ["1277333"] }),
  );
});
test("salary ranges compare INR-normalized values, not currency labels", () => {
  const data = [
    {
      ...jobs[0],
      id: "inr",
      salary_min: 8500000,
      salary_max: 10200000,
      currency: "INR",
    },
    {
      ...jobs[0],
      id: "usd",
      salary_min: 100000,
      salary_max: 120000,
      currency: "USD",
    },
  ];
  assert.equal(search({ currency: "USD", min_salary: 110000 }, data).length, 2);
  assert.equal(
    search({ currency: "INR", min_salary: 11000000 }, data).length,
    0,
  );
  assert.equal(to_inr(100000, "USD"), 8500000);
  assert.equal(
    filters_from_params(new URLSearchParams("maxSalary=200")).max_salary,
    undefined,
  );
});
test("hidden salary amounts never render or participate in client salary matching", () => {
  const hidden = {
    ...jobs[0],
    salary_hidden: true,
    salary_min: undefined,
    salary_max: undefined,
  };
  assert.equal(salary(hidden), "Competitive");
  assert.equal(converted_salary(hidden, "USD"), "Competitive");
  assert.equal(search({}, [hidden]).length, 1);
  assert.equal(search({ min_salary: 1 }, [hidden]).length, 0);
});
test("zero experience and zero interview rounds remain meaningful filters", () => {
  assert.ok(
    search({ max_experience: 0 }).every((job) => job.experience_years === 0),
  );
  const zero_rounds = { ...jobs[0], interview_rounds: 0 };
  assert.equal(
    search({ rounds: 0, round_match: "exact" }, [zero_rounds]).length,
    1,
  );
  assert.equal(search({ rounds: 0, round_match: "exact" }).length, 0);
  assert.ok(
    active_filter_labels({ ...default_filters(), max_experience: 0, rounds: 0 })
      .length === 2,
  );
});
test("notice, relocation and exact versus maximum interview filters work", () => {
  const results = search({
    notice: ["45 days", "90 days"],
    relocation: ["Supported locally"],
    rounds: 4,
  });
  assert.ok(results.length);
  assert.ok(
    results.every(
      (job) =>
        job.notice_periods.includes("45 days") &&
        job.relocation === "Supported locally" &&
        job.interview_rounds <= 4,
    ),
  );
  assert.ok(
    search({ rounds: 3, round_match: "exact" }).every(
      (job) => job.interview_rounds === 3,
    ),
  );
});
test("public search excludes expired, unlisted and previously applied jobs", () => {
  const data = [
    jobs[0],
    { ...jobs[1], posted: 31 },
    { ...jobs[2], unlisted: true },
    { ...jobs[0], id: "another-public-job" },
  ];
  assert.deepEqual(
    search({}, data, [jobs[0].id]).map((job) => job.id),
    ["another-public-job"],
  );
  assert.ok(search({ posted_within: 1 }).every((job) => job.posted <= 1));
});
test("highest salary sort uses a common currency and puts undisclosed amounts last", () => {
  const result = search({ sort: "salary" }, [
    ...jobs,
    { ...jobs[0], id: "hidden", salary_hidden: true },
  ]);
  assert.equal(result.at(-1).id, "hidden");
  assert.ok(
    result
      .slice(0, -2)
      .every(
        (job, index) =>
          to_inr(job.salary_max, job.currency) >=
          to_inr(result[index + 1].salary_max, result[index + 1].currency),
      ),
  );
});
test("listing tier and application destination remain separate", () => {
  const external = { ...jobs[0], application: "External" };
  assert.equal(
    search({ methods: ["External"], tiers: ["Premium"] }, [external]).length,
    1,
  );
  assert.equal(search({ easy: true }, [external]).length, 0);
});
test("editing a draft does not change applied filters", () => {
  const applied = default_filters();
  const draft = structuredClone(applied);
  const before = filter_jobs(jobs, applied);
  draft.modes.push("Remote");
  draft.min_salary = 100000000;
  assert.deepEqual(filter_jobs(jobs, applied), before);
  assert.equal(filter_jobs(jobs, draft).length, 0);
});
test("profile migration retains existing privacy and rejects malformed nested data", () => {
  const restored = restore_profile(
    {
      name: "Test Person",
      salaryPrivate: true,
      resumePrivate: true,
      skills: ["Figma"],
      languages: [null],
      social_links: [{ platform: "Portfolio", url: "javascript:alert(1)" }],
      current_salary: null,
      notice: "Immediately",
    },
    default_profile,
  );
  assert.equal(restored.name, "Test Person");
  assert.equal(restored.salary_private, true);
  assert.equal(restored.resume_private, true);
  assert.equal(restored.contact_private, true);
  assert.deepEqual(restored.languages, default_profile.languages);
  assert.deepEqual(restored.social_links, []);
  assert.equal(restored.current_salary, default_profile.current_salary);
  assert.equal(restored.notice, "Immediate");
  restored.experiences[0].title = "Changed";
  assert.notEqual(default_profile.experiences[0].title, "Changed");
});
test("profile validation catches reserved handles, date inversions and missing availability", () => {
  assert.equal(profile_error(default_profile), "");
  assert.match(profile_error({ ...default_profile, slug: "admin" }), /handle/);
  assert.match(
    profile_error({ ...default_profile, is_serving_notice: true }),
    /working date/,
  );
  const draft = structuredClone(default_profile);
  draft.experiences[0].current = false;
  draft.experiences[0].end = "2020-01";
  assert.match(profile_error(draft), /before/);
});

test("free fixture jobs are accessible by direct link but excluded from public discovery", () => {
  assert.ok(jobs.some((job) => job.tier === "Free"));
  assert.ok(search({}).every((job) => job.tier !== "Free"));
});

test("location tree: countries without cities are pruned, children sorted", () => {
  const tree = build_location_tree(test_locations);
  assert.deepEqual(tree.map((c) => c.name), ["India", "United Kingdom", "United States"]);
  assert.deepEqual(tree[0].children.map((r) => r.name), ["Karnataka", "Maharashtra", "Telangana"]);
  assert.equal(tree[0].children[0].children[0].children, undefined); // cities are leaves
});
test("shared links keep GeoNames city ids and drop anything else", () => {
  const filters = filters_from_params(
    new URLSearchParams("city=1277333&city=in-blr&city=1%20OR%201&currency=EUR"),
  );
  assert.deepEqual(filters.locations, ["1277333"]);
  assert.equal(filters.currency, "EUR");
  assert.equal(
    active_filter_labels(filters).find((l) => l.key === "locations").label,
    "Bengaluru",
  );
});
test("salaries show in the original currency until rates are known", () => {
  const job = { salary_min: 100, salary_max: 200, currency: "USD", salary_hidden: false };
  assert.match(converted_salary(job, "JPY", { INR: 1, USD: 85 }), /^\$100–\$200/);
  assert.match(converted_salary(job, "INR", { INR: 1, USD: 85 }), /₹8,500–₹17,000/);
});
