<script>
  import Location_picker from "./location_picker.svelte";
  export let selected = [];
  export let worldwide = false;
  export let disabled = false;
  export let disabled_worldwide = false;
  let open = false;
  export let query = "";
  export let label = "Location";
  export let allow_worldwide = true;
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
    >{#if label}<span class="picker_caption">{label}</span>{/if}<input
      aria-label={label || "Search locations"}
      placeholder={worldwide
        ? "Worldwide remote"
        : selected.length
          ? `${selected.length} cities selected`
          : "Country, state or city"}
      {disabled}
      bind:value={query}
      on:focus={() => (open = true)}
      on:input={() => (open = true)}
    /></label
  >
  {#if selected.length || worldwide}<small class="picker_summary"
      >{worldwide
        ? "Worldwide remote"
        : `${selected.length} cities selected`}{#if selected.length && worldwide}
        · {selected.length} cities{/if}<button
        type="button"
        {disabled}
        on:click={() => {
          selected = [];
          worldwide = false;
          query = "";
        }}>Clear</button
      ></small
    >{/if}
  {#if open && !disabled}<div class="predictive_options">
      <Location_picker
        bind:selected
        bind:worldwide
        bind:query
        searchable={false}
        {disabled_worldwide}
        {allow_worldwide}
      /><button type="button" class="text_link" on:click={() => (open = false)}
        >Done</button
      >
    </div>{/if}
</div>
