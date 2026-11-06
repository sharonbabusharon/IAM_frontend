<script>
  import { designations } from "./reference.js";
  export let selected = [];
  export let query = "";
  export let disabled = false;
  // Also the skills filter: pass the skills store and its wording.
  export let terms = designations;
  export let caption = "Designation";
  export let placeholder = "Job title or designation";
  export let noun = "designation";
  export let empty = "No matching designation. Search your typed job title instead.";
  let open = false;
  $: options = $terms
    .map((term) => term.name)
    .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50);
  function toggle(id) {
    selected = selected.includes(id)
      ? selected.filter((v) => v !== id)
      : [...selected, id];
    query = "";
  }
</script>
<svelte:window  on:keydown={(e) => {
    if (e.key === "Escape") open = false;
  }} />


<div
  class="predictive_picker"
  role="group"
  aria-label="Search options"
  on:focusout={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) open = false;
  }}

>
  <label
    ><span class="picker_caption">{caption}</span><input
      aria-label={`Search ${noun}s`}
      {placeholder}
      bind:value={query}
      {disabled}
      on:focus={() => (open = true)}
      on:input={() => (open = true)}
    /></label
  >
  {#if selected.length}<div class="picker_selections">
      {#each selected as id}<button
          type="button"
          {disabled}
          aria-label={`Remove ${id}`}
          on:click={() => toggle(id)}
          >{id} ×</button
        >{/each}
    </div>{/if}
  {#if open && !disabled}<div
      class="predictive_options"
      role="group"
      aria-label={`Matching ${noun}s`}
    >
      <small>Select one or more {noun}s</small>{#each options as name}<label
          ><input
            type="checkbox"
            checked={selected.includes(name)}
            on:change={() => toggle(name)}
          />{name}</label
        >{:else}<p>{empty}</p>{/each}<button
        type="button"
        class="text_link"
        on:click={() => (open = false)}>Done</button
      >
    </div>{/if}
</div>
