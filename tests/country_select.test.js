import { test } from "node:test";
import assert from "node:assert/strict";
import { get } from "svelte/store";
import { countries, filter_countries, flag_emoji, set_reference } from "../src/lib/portal/reference.js";

set_reference({
  locations: [
    { id: "1", level: "country", name: "Sweden", country_code: "SE" },
    { id: "2", level: "country", name: "Åland Islands", country_code: "ax" },
    { id: "3", level: "country", name: "India", country_code: "IN" },
    { id: "4", level: "city", name: "Indore", country_code: "IN", parent_id: "3" },
    { id: "5", level: "country", name: "Nowhere", country_code: "" },
  ],
});

test("countries: only valid countries, A-Z, upper-case codes, flags", () => {
  const list = get(countries);
  assert.deepEqual(list.map((c) => c.code), ["AX", "IN", "SE"]);
  assert.equal(list[1].flag, "🇮🇳");
  assert.equal(flag_emoji("se"), "🇸🇪");
});

test("search matches name substrings without accents, and code prefixes", () => {
  const list = get(countries);
  const codes = (q) => filter_countries(list, q).map((c) => c.code);
  assert.deepEqual(codes(""), ["AX", "IN", "SE"]);
  assert.deepEqual(codes("aland"), ["AX"]);
  assert.deepEqual(codes(" DIA "), ["IN"]);
  assert.deepEqual(codes("s"), ["AX", "SE"]); // "Åland Islands" contains s; SE starts with s
  assert.deepEqual(codes("zz"), []);
});
