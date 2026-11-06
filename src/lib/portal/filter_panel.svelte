<script>
  import {
    membership_settings,
    premium_active,
    membership_open,
  } from "./membership_state.js";
  import { currency_options } from "./reference.js";
  import { notice_periods } from "./filter_options.js";
  import { skills as skill_terms } from "./reference.js";
  import { my_skill_names } from "./my_skills.js";
  import Designation_picker from "./designation_picker.svelte";
  import { page } from "$app/stores";
  $: signed_in = !!$page.data.user;
  let skill_query = "";
  // Manual "Search jobs" §2A: [Import Profile Skills] adds the profile's skills.
  const import_skills = () =>
    (filters = { ...filters, skills: [...new Set([...filters.skills, ...$my_skill_names])] });
  export let filters;
  export let scope = "search";
  $: locked = (key) =>
    !$premium_active && $membership_settings.premium_filters.includes(key);
  function toggle(key, value) {
    filters = {
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((v) => v !== value)
        : [...filters[key], value],
    };
  }
</script>

<div class="filter_panel compact_filters refined_filters" data-scope={scope}>
  {#each [{ key: "modes", title: "Workplace", options: ["Remote", "Hybrid", "On-site"] }, { key: "types", title: "Job type", options: ["Full-time", "Part-time", "Contract", "Gig", "Volunteering", "Advisory", "Others"] }] as group}
    <fieldset disabled={locked(group.key)}>
      <legend>{group.title}{locked(group.key) ? " · Premium" : ""}</legend>
      <div class="filter_chips">
        {#each group.options as option}<label
            class:chosen={filters[group.key].includes(option)}
            ><input
              type="checkbox"
              checked={filters[group.key].includes(option)}
              on:change={() => toggle(group.key, option)}
            />{option}</label
          >{/each}
      </div>
    </fieldset>{/each}
  <div class="filter_pair">
    <label class="field_label"
      >Experience (years){locked("min_experience") ? " · Premium" : ""}<input
        class="field_input"
        type="number"
        min="0"
        max="99"
        step="1"
        disabled={locked("min_experience")}
        bind:value={filters.min_experience}
      /></label
    ><label class="field_label"
      >Posted within{locked("posted_within") ? " · Premium" : ""}<select
        class="field_input"
        disabled={locked("posted_within")}
        bind:value={filters.posted_within}
        >{#each [1, 3, 7, 9, 15, 30] as days}<option value={days}
            >{days === 1 ? "24 hours" : `${days} days`}</option
          >{/each}</select
      ></label
    >
  </div>
  <fieldset disabled={locked("min_salary")}>
    <legend
      >Minimum annual salary{locked("min_salary") ? " · Premium" : ""}</legend
    >
    <div class="salary_filter_row">
      <label class="field_label"
        ><span>Currency</span><select
          class="field_input"
          aria-label="Preferred currency"
          bind:value={filters.currency}
          on:change={() => (filters.min_salary = 0)}
          >{#each $currency_options.includes(filters.currency) ? $currency_options : [filters.currency, ...$currency_options] as code}<option
              >{code}</option
            >{/each}</select
        ></label
      ><label class="field_label"
        ><span>Minimum / year</span><input
          class="field_input"
          type="number"
          min="0"
          placeholder="Minimum"
          aria-label="Minimum annual salary"
          bind:value={filters.min_salary}
        /></label
      >
    </div>
    <small>0 means any salary. Converted at daily exchange rates.</small>
  </fieldset>
  <fieldset disabled={locked("skills")} class="skills_filter">
    <legend>Skills{locked("skills") ? " · Premium" : ""}</legend>
    <Designation_picker
      bind:selected={filters.skills}
      bind:query={skill_query}
      terms={skill_terms}
      caption="Skill"
      placeholder="Add a skill"
      noun="skill"
      empty="No matching skill."
      disabled={locked("skills")}
    />
    {#if signed_in}<button
        type="button"
        class="text_link"
        disabled={!$my_skill_names.length}
        title={$my_skill_names.length ? "" : "Add skills to your profile first."}
        on:click={import_skills}>Import profile skills</button
      >{/if}
  </fieldset>
  <fieldset disabled={locked("min_match") || !signed_in}>
    <legend>Minimum skill match{locked("min_match") ? " · Premium" : ""}</legend
    ><select
      class="field_input"
      aria-label="Minimum skill match"
      bind:value={filters.min_match}
      ><option value={0}>Any match</option
      >{#each [100, 90, 80, 70, 60, 50] as score}<option value={score}
          >{score}% or more</option
        >{/each}</select
    ><small
      >{signed_in
        ? "Based on the skills on your profile; applies to the jobs on each results page."
        : "Sign in to filter by your skill match."}</small
    >
  </fieldset>
  {#if !$premium_active && $membership_settings.premium_filters.length}<button
      type="button"
      class="premium_filter_link"
      on:click={() => membership_open.set(true)}>Explore premium options</button
    >{/if}
  <details class="filter_disclosure">
    <summary>More filters</summary>
    {#each [{ key: "notice", title: "Notice period", options: notice_periods }, { key: "relocation", title: "Relocation", options: ["On their own", "Supported locally", "Supported internationally"] }] as group}<fieldset
        disabled={locked(group.key)}
      >
        <legend>{group.title}{locked(group.key) ? " · Premium" : ""}</legend>
        <div class="filter_chips">
          {#each group.options as option}<label
              ><input
                type="checkbox"
                checked={filters[group.key].includes(option)}
                on:change={() => toggle(group.key, option)}
              />{option}</label
            >{/each}
        </div>
      </fieldset>{/each}
    <label class="field_label"
      >Maximum interview rounds{locked("rounds") ? " · Premium" : ""}<input
        class="field_input"
        type="number"
        min="0"
        max="20"
        step="1"
        placeholder="Any"
        disabled={locked("rounds")}
        bind:value={filters.rounds}
      /></label
    >
    <label class="field_label"
      >Listing category{locked("tiers") || locked("methods")
        ? " · Premium"
        : ""}<select
        class="field_input"
        disabled={locked("tiers") || locked("methods")}
        value={filters.methods.includes("External")
          ? "External"
          : filters.tiers.includes("Premium")
            ? "Premium"
            : ""}
        on:change={(e) => {
          const v = e.currentTarget.value;
          filters = {
            ...filters,
            tiers: v === "Premium" ? ["Premium"] : [],
            methods: v === "External" ? ["External"] : [],
          };
        }}
        ><option value="">All searchable listings</option><option
          >Premium</option
        ><option>External</option></select
      ><small>Free listings are shared by direct link.</small></label
    >
  </details>
</div>
