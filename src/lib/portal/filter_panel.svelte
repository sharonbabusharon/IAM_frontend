<script>
  import Location_picker from "./location_picker.svelte";
  import { filter_groups, filter_error } from "./search.js";
  import { jobs } from "./data.js";
  export let filters;
  export let scope = "search";
  let designation_query = "";
  let skill_query = "";
  function toggle(key, value) {
    filters = {
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((item) => item !== value)
        : [...filters[key], value],
    };
  }
</script>

<div class="filter_panel">
  <label class="filter_checkbox"
    ><input type="checkbox" bind:checked={filters.easy} /><span
      >Easy apply only</span
    ></label
  >
  <label class="filter_checkbox"
    ><input type="checkbox" bind:checked={filters.worldwide} /><span
      >Worldwide remote</span
    ></label
  >
  <p class="filter_hint">
    Choose your filters, then search. Selections within a group match any
    option.
  </p>
  <details class="filter_disclosure">
    <summary>Locations <span>{filters.locations.length || ""}</span></summary>
    <Location_picker bind:selected={filters.locations} />
    <label class="field_label"
      >Distance from selected city<select
        class="field_input"
        bind:value={filters.radius}
        ><option value={0}>Exact locations</option
        >{#each [10, 25, 50, 100] as radius}<option value={radius}
            >Within {radius} km</option
          >{/each}</select
      ></label
    >
    <small>Radius search requires exactly one city.</small>
  </details>
  <details class="filter_disclosure" open>
    <summary>Compensation</summary>
    <label class="field_label"
      >Viewing currency<select
        class="field_input"
        bind:value={filters.currency}
        on:change={() => {
          filters.min_salary = 0;
          filters.max_salary = 0;
        }}
        ><option>INR</option><option>USD</option><option>GBP</option><option
          >EUR</option
        ></select
      ></label
    >
    <div class="filter_pair">
      <label class="field_label"
        >Minimum / year<input
          class="field_input"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
          bind:value={filters.min_salary}
        /></label
      ><label class="field_label"
        >Maximum / year<input
          class="field_input"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
          bind:value={filters.max_salary}
        /></label
      >
    </div>
    <small
      >0 means no salary limit. Matches overlapping ranges across currencies
      using sample exchange rates.</small
    >
  </details>
  <details class="filter_disclosure">
    <summary>Experience & interview rounds</summary>
    <div class="filter_pair">
      <label class="field_label"
        >Minimum years<input
          class="field_input"
          type="number"
          min="0"
          max="99"
          step="1"
          bind:value={filters.min_experience}
        /></label
      ><label class="field_label"
        >Maximum years<input
          class="field_input"
          type="number"
          min="0"
          max="99"
          step="1"
          placeholder="Any"
          bind:value={filters.max_experience}
        /></label
      >
    </div>
    <label class="field_label"
      >Interview rounds<input
        class="field_input"
        type="number"
        min="0"
        max="20"
        step="1"
        placeholder="Any"
        bind:value={filters.rounds}
      /></label
    >
    <label class="field_label"
      >Round count match<select
        class="field_input"
        bind:value={filters.round_match}
        ><option value="maximum">At most this many</option><option value="exact"
          >Exactly this many</option
        ></select
      ></label
    >
  </details>
  <details class="filter_disclosure">
    <summary>Posted date</summary><label class="field_label"
      >Posted within<select
        class="field_input"
        bind:value={filters.posted_within}
        >{#each [1, 3, 7, 9, 15, 30] as days}<option value={days}
            >{days === 1 ? "Last 24 hours" : `Last ${days} days`}</option
          >{/each}</select
      ></label
    ><small
      >Search shows jobs from the last 30 days and excludes your preview
      applications.</small
    >
  </details>
  {#each filter_groups.filter((group) => group.key !== "locations") as group}
    <details class="filter_disclosure" open={group.key === "modes"}>
      <summary
        >{group.title}<span>{filters[group.key].length || ""}</span></summary
      >
      {#if group.key === "designations"}<label class="field_label"
          >Find a designation<input
            class="field_input"
            type="search"
            bind:value={designation_query}
          /></label
        ><small>Select a role from the sample master list.</small>{/if}
      {#if group.key === "skills"}<label class="field_label"
          >Find a skill<input
            class="field_input"
            type="search"
            bind:value={skill_query}
          /></label
        >{/if}
      <fieldset class="filter_option_list">
        <legend class="visually_hidden">{group.title}</legend>
        {#each group.options.filter( (option) => (group.key === "designations" ? jobs
                  .find((job) => job.id === option)
                  .title.toLowerCase()
                  .includes(designation_query.toLowerCase()) : group.key === "skills" ? option
                    .toLowerCase()
                    .includes(skill_query.toLowerCase()) : true) ) as option}
          <label class="filter_checkbox"
            ><input
              type="checkbox"
              checked={filters[group.key].includes(option)}
              on:change={() => toggle(group.key, option)}
            /><span
              >{group.key === "designations"
                ? jobs.find((job) => job.id === option).title
                : option}</span
            ></label
          >
        {/each}
      </fieldset>
    </details>
  {/each}
  <details class="filter_disclosure">
    <summary>Match score</summary><label class="field_label"
      >Minimum match score<input
        type="range"
        min="0"
        max="100"
        value="0"
        disabled
        aria-describedby={`${scope}_match_score_note`}
      /></label
    ><small id={`${scope}_match_score_note`}
      >Available when you connect your AI provider and receive match scores. No
      scores are generated in this preview.</small
    >
  </details>
  {#if filter_error(filters)}<p class="filter_error" role="alert">
      {filter_error(filters)}
    </p>{/if}
</div>
