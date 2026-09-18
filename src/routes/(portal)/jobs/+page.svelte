<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import Filter_panel from "$lib/portal/filter_panel.svelte";
  import { jobs } from "$lib/portal/data";
  import {
    filters_from_params,
    filters_to_params,
    default_filters,
    filter_jobs,
  } from "$lib/portal/search";
  import { saved_jobs, saved_searches, toast } from "$lib/portal/state";
  import type { search_filters } from "$lib/portal/types";
  let filters = filters_from_params($page.url.searchParams);
  let previous_search = $page.url.search;
  let view = "list";
  let current_page = 1;
  let show_filters = false;
  let save_dialog = false;
  let search_name = "";
  const page_size = 6;
  $: if ($page.url.search !== previous_search) {
    filters = filters_from_params($page.url.searchParams);
    previous_search = $page.url.search;
    current_page = 1;
  }
  $: results = filter_jobs(jobs, filters, $saved_jobs);
  $: page_count = Math.max(1, Math.ceil(results.length / page_size));
  $: if (current_page > page_count) current_page = page_count;
  $: visible_jobs = results.slice(
    (current_page - 1) * page_size,
    current_page * page_size,
  );
  $: active_filters = [
    ...filters.modes.map((value) => ({ key: "modes", value })),
    ...filters.categories.map((value) => ({ key: "categories", value })),
    ...filters.levels.map((value) => ({ key: "levels", value })),
    ...filters.types.map((value) => ({ key: "types", value })),
  ];
  $: filter_count =
    active_filters.length +
    Number(filters.easy) +
    Number(Boolean(filters.currency)) +
    Number(filters.min_salary > 0);
  function sync() {
    current_page = 1;
    const params = filters_to_params(filters);
    goto(`/jobs${params.size ? `?${params}` : ""}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    });
  }
  function clear() {
    filters = { ...default_filters(), saved: filters.saved };
    sync();
  }
  function remove(key: string, value: string) {
    const array_key = key as "modes" | "types" | "categories" | "levels";
    filters = {
      ...filters,
      [array_key]: filters[array_key].filter((item) => item !== value),
    };
    sync();
  }
  function open_save() {
    search_name =
      filters.query ||
      filters.categories.join(", ") ||
      (filters.modes.length
        ? `${filters.modes.join(" / ")} opportunities`
        : "My next chapter");
    save_dialog = true;
  }
  function save_search() {
    if (!search_name.trim()) return;
    const query = filters_to_params({ ...filters, saved: false }).toString();
    saved_searches.update((value) =>
      [
        { name: search_name.trim(), query },
        ...value.filter((item) => item.query !== query),
      ].slice(0, 5),
    );
    save_dialog = false;
    toast("Search saved. Pick up where you left off anytime.");
  }
  function change_page(next: number) {
    current_page = next;
    document
      .getElementById("results-heading")
      ?.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
  }
</script>

<svelte:head
  ><title
    >{filters.saved ? "Saved opportunities" : "Find your next chapter"} — Referise</title
  ><meta
    name="description"
    content="Explore roles by skills, location, salary, and how you want to work. Find your next opportunity with Referise."
  /></svelte:head
>
<main id="main-content" class="search_page">
  <section class="search_intro">
    <div class="portal_container">
      <div class="search_intro_heading">
        <div>
          <span class="eyebrow_label"
            >{filters.saved
              ? "THE POSSIBILITIES YOU’RE KEEPING CLOSE"
              : "GOOD WORK IS OUT THERE"}</span
          >
          <h1>
            {filters.saved ? "Your next chapter, " : "Find your kind of "}<em
              >{filters.saved ? "on the shortlist." : "possibility."}</em
            >
          </h1>
          <p>
            {filters.saved
              ? "A little space for the opportunities that caught your eye."
              : "Meaningful roles. Thoughtful teams. A clearer way forward."}
          </p>
        </div>
        <span class="search_header_art" aria-hidden="true">✳</span>
      </div>
      <form class="results_search" on:submit|preventDefault={sync}>
        <label
          ><Icon name="search" size={19} /><input
            aria-label="Search job title, skill, or company"
            bind:value={filters.query}
            placeholder="Job title, skill, or company"
          /></label
        ><label
          ><Icon name="location" size={18} /><input
            aria-label="Search location"
            bind:value={filters.location}
            placeholder="City, country, or remote"
          /></label
        ><button type="submit" class="button button_terracotta"
          >Find opportunities <Icon name="arrow-right" size={17} /></button
        >
      </form>
    </div>
  </section>
  <div class="portal_container search_workspace">
    <aside class="search_sidebar">
      <div class="filter_title">
        <h2>Make it yours</h2>
        <button on:click={clear}>Reset all</button>
      </div>
      <Filter_panel bind:filters on:change={sync} />
      <div class="sidebar_note">
        <Icon name="heart" size={20} />
        <h3>There’s no single right path.</h3>
        <p>
          Look for work that fits your skills, your life, and where you want to
          go next.
        </p>
      </div>
    </aside>
    <section class="search_results" aria-label="Job results">
      {#if $saved_searches.length}<div class="saved_search_row">
          <span><Icon name="bookmark" size={13} />Your searches</span
          >{#each $saved_searches as item}<a href={`/jobs?${item.query}`}
              >{item.name}<Icon name="arrow-up-right" size={11} /></a
            >{/each}
        </div>{/if}
      <div class="results_topline">
        <div>
          <span class="eyebrow_label">YOUR NEXT MOVE</span>
          <h2 id="results-heading">
            {results.length}
            {results.length === 1 ? "opportunity" : "opportunities"}<span>
              worth a look</span
            >
          </h2>
        </div>
        <button
          class="button button_outline button_small save_search_button"
          on:click={open_save}
          ><Icon name="bookmark" size={14} />Save search</button
        >
      </div>
      <div class="results_controls">
        <div class="results_quick_filters">
          <button
            class="mobile_filter_button button button_outline button_small"
            on:click={() => (show_filters = true)}
            ><Icon name="filter" size={15} />Filters{#if filter_count}<span
                >{filter_count}</span
              >{/if}</button
          ><button
            class:active={filters.saved}
            class="quick_filter"
            aria-pressed={filters.saved}
            on:click={() => {
              filters.saved = !filters.saved;
              sync();
            }}
            ><Icon name="bookmark" size={13} />Saved ({$saved_jobs.length})</button
          ><span class="sample_results_label">Sample opportunities</span>
        </div>
        <div class="results_display_controls">
          <label class="sort_control"
            ><span>Sort by</span><select
              aria-label="Sort opportunities"
              bind:value={filters.sort}
              on:change={sync}
              ><option value="recommended">Recommended</option><option
                value="newest">Newest first</option
              ><option value="title">Job title A–Z</option></select
            ></label
          >
          <div class="view_switch" aria-label="Results layout">
            <button
              class:active={view === "list"}
              aria-label="List view"
              aria-pressed={view === "list"}
              on:click={() => (view = "list")}
              ><Icon name="list" size={17} /></button
            ><button
              class:active={view === "grid"}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              on:click={() => (view = "grid")}
              ><Icon name="grid" size={15} /></button
            >
          </div>
        </div>
      </div>
      {#if active_filters.length || filters.easy || filters.currency || filters.query || filters.location}<div
          class="active_filter_row"
        >
          {#if filters.query}<button
              on:click={() => {
                filters.query = "";
                sync();
              }}>“{filters.query}”<Icon name="close" size={11} /></button
            >{/if}{#if filters.location}<button
              on:click={() => {
                filters.location = "";
                sync();
              }}>{filters.location}<Icon name="close" size={11} /></button
            >{/if}{#each active_filters as filter}<button
              on:click={() => remove(filter.key, filter.value)}
              >{filter.value}<Icon name="close" size={11} /></button
            >{/each}{#if filters.easy}<button
              on:click={() => {
                filters.easy = false;
                sync();
              }}>Easy apply<Icon name="close" size={11} /></button
            >{/if}{#if filters.currency}<button
              on:click={() => {
                filters.currency = "";
                filters.min_salary = 0;
                sync();
              }}
              >{filters.currency}{filters.min_salary
                ? ` · ${filters.min_salary.toLocaleString()}+`
                : ""}<Icon name="close" size={11} /></button
            >{/if}<button class="clear_filter_link" on:click={clear}
            >Clear all</button
          >
        </div>{/if}
      <div aria-live="polite" class="visually_hidden">
        {results.length} jobs match your search.
      </div>
      {#if visible_jobs.length}<div
          class="results_jobs"
          class:list_view={view === "list"}
          class:grid_view={view === "grid"}
        >
          {#each visible_jobs as job (job.id)}<Job_card {job} />{/each}
        </div>
        <div class="pagination">
          <span
            >Showing {(current_page - 1) * page_size + 1}–{Math.min(
              current_page * page_size,
              results.length,
            )} of {results.length} opportunities</span
          >
          <div>
            <button
              class="icon_button"
              aria-label="Previous page"
              disabled={current_page === 1}
              on:click={() => change_page(current_page - 1)}
              ><Icon name="arrow-left" size={15} /></button
            >{#each Array(page_count) as _, i}<button
                class="page_number"
                class:active={current_page === i + 1}
                aria-label={`Page ${i + 1}`}
                aria-current={current_page === i + 1 ? "page" : undefined}
                on:click={() => change_page(i + 1)}>{i + 1}</button
              >{/each}<button
              class="icon_button"
              aria-label="Next page"
              disabled={current_page === page_count}
              on:click={() => change_page(current_page + 1)}
              ><Icon name="arrow-right" size={15} /></button
            >
          </div>
        </div>
      {:else}<div class="empty_state">
          <span class="empty_icon"
            ><Icon
              name={filters.saved ? "bookmark" : "search"}
              size={30}
            /></span
          >
          <h3>
            {filters.saved
              ? "A little room for your next move."
              : "The right fit might be one filter away."}
          </h3>
          <p>
            {filters.saved
              ? $saved_jobs.length
                ? "Your saved roles don’t match these filters. Try a wider search."
                : "Save the roles that catch your eye. They’ll be waiting here when you’re ready."
              : "We couldn’t find an opportunity with this combination. Try another keyword, location, or a broader set of filters."}
          </p>
          <button
            class="button button_dark"
            on:click={() => {
              if (!$saved_jobs.length) filters.saved = false;
              clear();
            }}
            >{filters.saved && !$saved_jobs.length
              ? "Explore opportunities"
              : "Reset filters"}<Icon name="arrow-right" size={16} /></button
          >
        </div>{/if}
      <div class="search_bottom_note">
        <Icon name="shield" size={17} />
        <p>
          Your skills tell the story. Explore roles that give your potential a
          fair chance.
        </p>
      </div>
    </section>
  </div>
</main>
{#if show_filters}<Modal
    title="Make your search yours"
    on:close={() => (show_filters = false)}
    ><Filter_panel bind:filters on:change={sync} />
    <div class="drawer_footer">
      <button class="button button_outline" on:click={clear}>Reset all</button
      ><button class="button button_dark" on:click={() => (show_filters = false)}
        >Show {results.length} opportunities <Icon
          name="arrow-right"
          size={15}
        /></button
      >
    </div></Modal
  >{/if}
{#if save_dialog}<Modal
    title="A search worth keeping"
    on:close={() => (save_dialog = false)}
    ><form on:submit|preventDefault={save_search}>
      <p class="modal_description">
        Save these filters so you can pick up where you left off.
      </p>
      <label class="field_label"
        >Give your search a name<input
          class="field_input"
          required
          maxlength="45"
          bind:value={search_name}
          placeholder="My next chapter"
        /></label
      >
      <p class="form_helper">
        Saved in this browser. You can keep up to five searches.
      </p>
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (save_dialog = false)}>Cancel</button
        ><button class="button button_dark" type="submit"
          >Save search <Icon name="bookmark" size={15} /></button
        >
      </div>
    </form></Modal
  >{/if}
