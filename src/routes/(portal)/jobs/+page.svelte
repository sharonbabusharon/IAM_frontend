<script>
  import Designation_picker from "$lib/portal/designation_picker.svelte";
  import Location_search from "$lib/portal/location_search.svelte";
  import { allowed_filters } from "$lib/portal/membership_rules.js";
  import {
    membership_settings,
    premium_active,
  } from "$lib/portal/membership_state.js";
  $: locked = (key) =>
    !$premium_active && $membership_settings.premium_filters.includes(key);
  $: effective_filters = allowed_filters(
    applied_filters,
    default_filters(),
    $membership_settings,
    $premium_active,
  );
  import { page } from "$app/stores";
  import { goto, afterNavigate as after_navigate } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import Filter_panel from "$lib/portal/filter_panel.svelte";
  import { browser } from "$app/environment";
  import {
    filters_from_params,
    filters_to_params,
    default_filters,
    filter_error,
    active_filter_labels,
  } from "$lib/portal/search";
  import { jobs_api, to_card, to_criteria } from "$lib/portal/jobs_api.js";
  import {
    saved_jobs,
    saved_searches,
    applications,
    search_filters,
    viewing_currency,
    toast,
  } from "$lib/portal/state";
  import { location_label, rates, skills as skill_terms, designations as designation_terms } from "$lib/portal/reference.js";
  after_navigate(() => {
    const current = filters_from_params($page.url.searchParams);
    search_filters.set(current);
    viewing_currency.set(current.currency);
  });
  let filters = filters_from_params($page.url.searchParams);
  let applied_filters = structuredClone(filters);
  let previous_search = $page.url.search;
  let view = "grid";
  let current_page = 1;
  let show_filters = false;
  let save_dialog = false;
  let search_name = "";
  const page_size = 6;
  $: if ($page.url.search !== previous_search) {
    filters = filters_from_params($page.url.searchParams);
    applied_filters = structuredClone(filters);
    previous_search = $page.url.search;
    current_page = 1;
  }
  // Results come from the backend: one request per applied search or page
  // (manual "Filters"); jobs you applied to are excluded server-side.
  let total = 0;
  let page_jobs = [];
  let searching = true;
  let search_error = "";
  let search_seq = 0;
  $: skill_ids = Object.fromEntries($skill_terms.map((t) => [t.name, t.id]));
  $: designation_ids = Object.fromEntries($designation_terms.map((t) => [t.name, t.id]));
  $: if (browser) run_search(effective_filters, current_page, $rates, skill_ids, designation_ids, effective_filters.saved ? $saved_jobs : []);
  async function run_search(f, page, rates, ids, designation_ids, saved) {
    const seq = ++search_seq;
    searching = true;
    const result = await jobs_api.search(to_criteria(f, { rates, skill_ids: ids, designation_ids, saved, page, page_size }));
    if (seq !== search_seq) return; // a newer search started meanwhile
    searching = false;
    search_error = result.ok ? "" : result.error;
    total = result.ok ? result.data.total : 0;
    page_jobs = result.ok ? result.data.jobs.map((j) => to_card(j, $location_label)) : [];
  }
  $: pending =
    filters_to_params(filters).toString() !==
    filters_to_params(applied_filters).toString();
  $: page_count = Math.max(1, Math.ceil(total / page_size));
  $: visible_jobs = page_jobs;
  $: active_filters = active_filter_labels(effective_filters);
  $: filter_count = active_filters.length;
  function sync() {
    if (filters.locations.length || filters.worldwide) filters.location = "";
    const error = filter_error(filters);
    if (error) {
      toast(error);
      return;
    }
    filters = allowed_filters(
      filters_from_params(filters_to_params(filters)),
      default_filters(),
      $membership_settings,
      $premium_active,
    );
    applied_filters = structuredClone(filters);
    search_filters.set(structuredClone(filters));
    viewing_currency.set(filters.currency);
    show_filters = false;
    current_page = 1;
    const params = filters_to_params(filters);
    goto(`/jobs${params.size ? `?${params}` : ""}`, {
      replaceState: false,
      noScroll: true,
      keepFocus: true,
    });
  }
  function clear() {
    filters = { ...default_filters(), saved: filters.saved };
    sync();
  }
  function remove(key, value) {
    filters = {
      ...filters,
      [key]:
        value === null
          ? default_filters()[key]
          : filters[key].filter((item) => item !== value),
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
    const query = filters_to_params({
      ...applied_filters,
      saved: false,
    }).toString();
    saved_searches.update((value) =>
      [
        { name: search_name.trim(), query },
        ...value.filter((item) => item.query !== query),
      ].slice(0, 5),
    );
    save_dialog = false;
    toast("Search saved. Pick up where you left off anytime.");
  }
  function change_page(next) {
    current_page = next;
    document.getElementById("results-heading")?.scrollIntoView({
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
        <div class="discovery_art" aria-hidden="true">
          <span class="discovery_arch"></span><Companion
            kind="blue"
            size={150}
          /><span class="discovery_ticket"
            >GOOD WORK<br /><strong>YOUR WAY. ↗</strong></span
          ><span class="discovery_spark">✳</span>
        </div>
      </div>
      <form class="results_search" on:submit|preventDefault={sync}>
        <Designation_picker
          bind:selected={filters.designations}
          bind:query={filters.query}
          disabled={locked("designations") || locked("query")}
        /><Location_search
          bind:selected={filters.locations}
          bind:query={filters.location}
          bind:worldwide={filters.worldwide}
          disabled={locked("locations")}
          disabled_worldwide={locked("worldwide")}
        />
        <button type="submit" class="button button_terracotta"
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
      <form on:submit|preventDefault={sync}>
        <Filter_panel bind:filters />
        <div class="filter_submit">
          <button type="submit" class="button button_dark button_full"
            >Search opportunities</button
          >
          <p aria-live="polite">
            {pending
              ? "You have unapplied changes."
              : "Your filters are up to date."}
          </p>
        </div>
      </form>
      <div class="sidebar_note">
        <Companion kind="sage" size={90} />
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
            {total}
            {total === 1 ? "opportunity" : "opportunities"}<span>
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
            disabled={locked("saved")}
            class="quick_filter"
            aria-pressed={filters.saved}
            on:click={() => {
              filters.saved = !filters.saved;
              sync();
            }}
            ><Icon name="bookmark" size={13} />Saved ({$saved_jobs.length})</button
          ><span class="sample_results_label"
            >{searching ? "Searching…" : search_error}</span
          >
        </div>
        <div class="results_display_controls">
          <label class="sort_control"
            ><span>Sort by</span><select
              aria-label="Sort opportunities"
              bind:value={filters.sort}
              on:change={sync}
              ><option value="salary">Highest salary</option><option
                value="newest">Newest first</option
              ><option value="match" disabled={locked("sort_match")}
                >Highest skill match{locked("sort_match")
                  ? " · Premium"
                  : ""}</option
              ></select
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
      {#if pending}<p class="pending_filters" role="status">
          Filters changed. Select “Search opportunities” to update results.
        </p>{/if}
      {#if active_filters.length}<div class="active_filter_row">
          {#each active_filters as filter}<button
              on:click={() => remove(filter.key, filter.value)}
              >{filter.label}<Icon name="close" size={11} /></button
            >{/each}<button class="clear_filter_link" on:click={clear}
            >Clear all</button
          >
        </div>{/if}
      <div aria-live="polite" class="visually_hidden">
        {total} jobs match your search.
      </div>
      {#if visible_jobs.length}<div
          class="results_jobs"
          class:list_view={view === "list"}
          class:grid_view={view === "grid"}
        >
          {#each visible_jobs as job (job.id)}<Job_card
              {job}
              currency={applied_filters.currency}
            />{/each}
        </div>
        <div class="pagination">
          <span
            >Showing {(current_page - 1) * page_size + 1}–{Math.min(
              current_page * page_size,
              total,
            )} of {total} opportunities</span
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
    ><form on:submit|preventDefault={sync}>
      <Filter_panel bind:filters scope="mobile" />
      <div class="drawer_footer">
        <button type="button" class="button button_outline" on:click={clear}
          >Reset all</button
        ><button class="button button_dark" type="submit"
          >Search opportunities <Icon name="arrow-right" size={15} /></button
        >
      </div>
    </form></Modal
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
