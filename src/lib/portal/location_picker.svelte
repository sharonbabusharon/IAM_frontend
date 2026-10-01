<script>
  import Location_node from "./location_node.svelte";
  import { location_tree } from "./filter_options.js";
  export let selected = [];
  let expanded = [];
</script>

<div class="location_picker">
  <div class="location_actions">
    <button
      type="button"
      on:click={() =>
        (expanded = location_tree.flatMap((country) => [
          country.id,
          ...country.children.map((region) => region.id),
        ]))}>Expand all</button
    ><button type="button" on:click={() => (expanded = [])}>Collapse all</button
    >
  </div>
  <ul>
    {#each location_tree as node}<Location_node
        {node}
        bind:selected
        bind:expanded
      />{/each}
  </ul>
  <small
    >Sample locations · {selected.length}
    {selected.length === 1 ? "city" : "cities"} selected</small
  >
</div>
