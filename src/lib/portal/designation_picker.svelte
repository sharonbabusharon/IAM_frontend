<script>
  import { designations } from "./reference.js";
  export let selected = [];
  export let query = "";
  export let disabled = false;
  let open = false;
  $: options = $designations
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
    ><span class="picker_caption">Designation</span><input
      aria-label="Search designations"
      placeholder="Job title or designation"
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
      aria-label="Matching designations"
    >
      <small>Select one or more designations</small>{#each options as name}<label
          ><input
            type="checkbox"
            checked={selected.includes(name)}
            on:change={() => toggle(name)}
          />{name}</label
        >{:else}<p>
          No matching designation. Search your typed job title instead.
        </p>{/each}<button
        type="button"
        class="text_link"
        on:click={() => (open = false)}>Done</button
      >
    </div>{/if}
</div>
