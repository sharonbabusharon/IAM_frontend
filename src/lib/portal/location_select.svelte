<script>
  // One city from the shared location tree (current or past work location).
  // The full tree picker is multi-select and heavy; this is a small typeahead.
  import { locations, location_index } from "./reference.js";
  export let value = ""; // GeoNames id, "" for none
  export let label = "Location";
  let query = "";
  let open = false;

  const name_of = (index, id) => {
    const parts = [];
    for (let node = index.get(id); node && parts.length < 3; node = index.get(node.parent_id))
      parts.push(node.name);
    return parts.join(", ");
  };
  $: chosen = value ? name_of($location_index, value) || value : "";
  $: needle = query.trim().toLowerCase();
  $: matches =
    needle.length < 2
      ? []
      : $locations
          .filter((l) => l.level === "city" && l.name.toLowerCase().startsWith(needle))
          .slice(0, 8);
  function pick(id) {
    value = id;
    query = "";
    open = false;
  }
</script>

<div
  class="predictive_picker"
  role="group"
  aria-label={label}
  on:focusout={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) open = false;
  }}
>
  <label class="field_label"
    >{label}<input
      class="field_input"
      placeholder={chosen || "Type a city"}
      bind:value={query}
      on:focus={() => (open = true)}
      on:input={() => (open = true)}
    /></label
  >
  {#if chosen}<small class="picker_summary"
      >{chosen}<button type="button" on:click={() => (value = "")}>Clear</button></small
    >{/if}
  {#if open && matches.length}<ul class="predictive_options" role="listbox">
      {#each matches as m}<li>
          <button type="button" class="text_link" on:click={() => pick(m.id)}
            >{name_of($location_index, m.id)}</button
          >
        </li>{/each}
    </ul>{/if}
</div>
