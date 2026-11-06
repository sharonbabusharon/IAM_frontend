<script context="module">
  let next_id = 0;
</script>

<script>
  // Searchable single-country picker (ARIA 1.2 combobox + listbox).
  // Countries come from the backend location reference data.
  // bind:value is the ISO code ("IN"); on:change gives the country or null.
  import { createEventDispatcher, tick } from "svelte";
  import { countries, filter_countries } from "./reference.js";

  export let value = "";
  export let label = "Country";
  export let placeholder = "Search country or code";
  export let required = false;
  export let disabled = false;

  const dispatch = createEventDispatcher();
  const id = "country_select_" + next_id++;
  let root, input, listbox;
  let query = "";
  let open = false;
  let active = -1;

  $: chosen = $countries.find((c) => c.code === value?.toUpperCase()) ?? null;
  $: matches = filter_countries($countries, query);
  $: if (active >= matches.length) active = matches.length - 1;

  function show() {
    if (disabled || open) return;
    open = true;
    active = Math.max(0, chosen ? matches.indexOf(chosen) : 0);
    reveal();
  }
  function close() {
    open = false;
    query = "";
    active = -1;
  }
  function pick(country) {
    value = country?.code ?? "";
    dispatch("change", country ?? null);
    close();
  }
  function clear() {
    pick(null);
    input.focus();
  }
  async function reveal() {
    await tick();
    listbox?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }
  function move(to) {
    if (!open) return show();
    active = Math.min(Math.max(to, 0), matches.length - 1);
    reveal();
  }

  function keydown(e) {
    const page = 8;
    const keys = {
      ArrowDown: () => (e.altKey ? show() : move(active + 1)),
      ArrowUp: () => move(active - 1),
      PageDown: () => move(active + page),
      PageUp: () => move(active - page),
      Home: () => open && move(0),
      End: () => open && move(matches.length - 1),
      Enter: () => open && matches[active] && pick(matches[active]),
      Escape: () => (open ? close() : value && pick(null)),
    };
    // Home/End move the caret when the list is closed.
    if (!keys[e.key] || (!open && ["Home", "End", "Enter"].includes(e.key))) return;
    e.preventDefault();
    keys[e.key]();
  }
</script>

<svelte:window
  on:pointerdown={(e) => open && !root.contains(e.target) && close()}
/>

<div
  class="country_select"
  class:open
  bind:this={root}
  on:focusout={(e) => !root.contains(e.relatedTarget) && close()}
>
  <label class="field_label" for={id}>{label}</label>
  <div class="country_control">
    {#if chosen && !query}<span class="country_flag" aria-hidden="true">{chosen.flag}</span>{/if}
    <input
      {id}
      bind:this={input}
      class="field_input"
      class:has_flag={chosen && !query}
      type="text"
      role="combobox"
      autocomplete="off"
      spellcheck="false"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={id + "_list"}
      aria-activedescendant={open && active >= 0 ? `${id}_${matches[active]?.code}` : undefined}
      placeholder={chosen ? `${chosen.name} (${chosen.code})` : placeholder}
      value={open ? query : chosen ? `${chosen.name} (${chosen.code})` : ""}
      required={required && !value}
      {disabled}
      on:input={(e) => {
        query = e.currentTarget.value;
        open = true;
        active = 0;
      }}
      on:focus={show}
      on:click={show}
      on:keydown={keydown}
    />
    {#if value && !disabled}<button
        type="button"
        class="country_clear"
        aria-label="Clear {label.toLowerCase()}"
        on:click={clear}>×</button
      >{/if}
  </div>
  {#if open}<ul id={id + "_list"} class="country_list" role="listbox" aria-label={label} bind:this={listbox}>
      {#each matches as country, index (country.code)}<li
          id="{id}_{country.code}"
          role="option"
          aria-selected={index === active}
          class:current={country.code === chosen?.code}
          on:pointerdown|preventDefault={() => pick(country)}
          on:pointermove={() => (active = index)}
        >
          <span class="country_flag" aria-hidden="true">{country.flag}</span>
          <span class="country_name">{country.name}</span>
          <span class="country_code">{country.code}</span>
        </li>{:else}<li class="country_empty" role="presentation">
          {$countries.length ? "No country matches “" + query.trim() + "”" : "Loading countries…"}
        </li>{/each}
    </ul>{/if}
</div>

<style>
  .country_select {
    position: relative;
  }
  .country_control {
    position: relative;
    margin-top: 6px;
  }
  .field_input {
    padding-right: 36px;
  }
  .field_input.has_flag {
    padding-left: 40px;
  }
  .country_control > .country_flag {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }
  .country_flag {
    font-family: "Twemoji Country Flags", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    font-size: 18px;
    line-height: 1;
  }
  .country_clear {
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--muted, #73756c);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
  }
  .country_clear:hover,
  .country_clear:focus-visible {
    background: var(--line, #e2e2d9);
    color: var(--ink, #292c27);
  }
  .country_list {
    position: absolute;
    z-index: 30;
    left: 0;
    right: 0;
    top: calc(100% + 4px);
    max-height: min(300px, 50vh);
    margin: 0;
    padding: 4px;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;
    background: var(--white, #fff);
    color: var(--ink, #292c27);
    border: 1px solid var(--line, #e2e2d9);
    border-radius: 8px;
    box-shadow: 0 12px 28px rgb(0 0 0 / 0.12);
  }
  [role="option"] {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
  }
  [role="option"][aria-selected="true"] {
    background: color-mix(in srgb, var(--accent, #af4d31) 12%, transparent);
  }
  [role="option"].current {
    font-weight: 600;
  }
  .country_name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .country_code {
    color: var(--muted, #73756c);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
  }
  .country_empty {
    padding: 10px;
    color: var(--muted, #73756c);
  }
  @media (max-width: 560px) {
    .country_list {
      max-height: 40vh;
    }
  }
</style>
