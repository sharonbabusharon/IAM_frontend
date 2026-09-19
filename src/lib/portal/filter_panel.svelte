<script>
  import { createEventDispatcher as create_event_dispatcher } from "svelte";
  import Icon from "./icon.svelte";
  export let filters;
  const dispatch = create_event_dispatcher();
  const groups = [
    {
      title: "Work arrangement",
      key: "modes",
      options: ["Remote", "Hybrid", "On-site"],
    },
    {
      title: "Field of work",
      key: "categories",
      options: [
        "Design",
        "Engineering",
        "Product",
        "Marketing",
        "Data",
        "Operations",
      ],
    },
    {
      title: "Experience level",
      key: "levels",
      options: ["Entry-level", "Mid-level", "Senior"],
    },
    {
      title: "Employment type",
      key: "types",
      options: ["Full-time", "Part-time", "Contract", "Internship"],
    },
  ];
  function toggle(key, value) {
    filters = {
      ...filters,
      [key]: filters[key].includes(value)
        ? filters[key].filter((item) => item !== value)
        : [...filters[key], value],
    };
    dispatch("change");
  }
</script>

<div class="filter_panel">
  <label class="easy_toggle"
    ><span><Icon name="spark" size={15} />Easy apply only</span><input
      type="checkbox"
      bind:checked={filters.easy}
      on:change={() => dispatch("change")}
    /><span class="toggle_track" aria-hidden="true"></span></label
  >
  {#each groups as group}<fieldset class="filter_group">
      <legend>{group.title}</legend>{#each group.options as option}<label
          class="filter_checkbox"
          ><input
            type="checkbox"
            checked={filters[group.key].includes(option)}
            on:change={() => toggle(group.key, option)}
          /><span>{option}</span></label
        >{/each}
    </fieldset>{/each}
  <fieldset class="filter_group salary_filter">
    <legend>Compensation</legend><label class="field_label"
      >Salary currency<select
        class="field_input"
        bind:value={filters.currency}
        on:change={() => {
          filters.min_salary = 0;
          dispatch("change");
        }}
        ><option value="">Any currency</option><option value="INR"
          >INR · Indian rupee</option
        ><option value="USD">USD · US dollar</option><option value="GBP"
          >GBP · British pound</option
        ></select
      ></label
    ><label class="field_label"
      >Minimum annual salary<select
        class="field_input"
        disabled={!filters.currency}
        bind:value={filters.min_salary}
        on:change={() => dispatch("change")}
        ><option value={0}>Any salary</option
        >{#each filters.currency === "INR" ? [1000000, 2000000, 3000000, 4000000] : [40000, 60000, 80000, 100000] as amount}<option
            value={amount}
            >{filters.currency === "INR"
              ? `₹${amount / 100000} lakh+`
              : `${filters.currency === "GBP" ? "£" : "$"}${amount / 1000}k+`}</option
          >{/each}</select
      ></label
    >
    <p>Matches roles whose salary range reaches your minimum.</p>
  </fieldset>
</div>
