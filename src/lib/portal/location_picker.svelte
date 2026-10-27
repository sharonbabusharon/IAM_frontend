<script>
  import Location_node from "./location_node.svelte";
  import { leaves } from "./filter_options.js";
  import { location_tree, reference_status } from "./reference.js";
  export let selected = [];
  export let query = "";
  export let searchable = true;
  export let allow_worldwide = false;
  export let worldwide = false;
  export let disabled_worldwide = false;
  let expanded = [];
  // ~38k places: fully expanding everything would freeze the page, so
  // expand-all and auto-expand only apply while the view is small enough.
  const max_open_leaves = 400;

  $: needle = query.trim().toLowerCase();
  $: visible = needle.length >= 2 ? match($location_tree, needle) : $location_tree;
  $: visible_leaves = needle.length >= 2 ? leaves(visible).length : Infinity;
  $: if (needle.length >= 2 && visible_leaves <= max_open_leaves)
    expanded = branches(visible);

  // Keeps nodes whose name matches (with their whole subtree) and the
  // ancestors of matching nodes.
  function match(nodes, needle) {
    return nodes.flatMap((node) => {
      if (node.name.toLowerCase().includes(needle)) return [node];
      const children = node.children ? match(node.children, needle) : [];
      return children.length ? [{ ...node, children }] : [];
    });
  }
  function branches(nodes) {
    return nodes.flatMap((n) => (n.children ? [n.id, ...branches(n.children)] : []));
  }
</script>

<div class="location_picker">
  {#if allow_worldwide}<label class="filter_checkbox"
      ><input
        type="checkbox"
        bind:checked={worldwide}
        disabled={disabled_worldwide}
      />Worldwide remote{disabled_worldwide ? " · Premium" : ""}</label
    >{/if}
  {#if searchable}<input
      class="field_input"
      type="search"
      placeholder="Search a country, state or city"
      aria-label="Search locations"
      bind:value={query}
    />{/if}
  <div class="location_actions">
    <button
      type="button"
      on:click={() =>
        (expanded =
          visible_leaves <= max_open_leaves
            ? branches(visible)
            : visible.map((country) => country.id))}>Expand all</button
    ><button type="button" on:click={() => (expanded = [])}>Collapse all</button
    >
  </div>
  {#if $reference_status === "error" && !$location_tree.length}<p
      class="workspace_hint warning"
    >
      Locations couldn’t be loaded. Check your connection and reload.
    </p>{:else if !$location_tree.length}<p class="workspace_hint">
      Loading locations…
    </p>{:else if needle.length >= 2 && !visible.length}<p
      class="workspace_hint"
    >
      No places match “{query.trim()}”.
    </p>{/if}
  <ul>
    {#each visible as node (node.id)}<Location_node
        {node}
        bind:selected
        bind:expanded
      />{/each}
  </ul>
  <small
    >{selected.length}
    {selected.length === 1 ? "city" : "cities"} selected{#if needle.length >= 2 && visible_leaves > max_open_leaves}
      · Keep typing to narrow {visible_leaves.toLocaleString()} matches{/if}</small
  >
</div>
