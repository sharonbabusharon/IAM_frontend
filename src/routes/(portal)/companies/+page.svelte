<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Heading from "$lib/portal/page_heading.svelte";
  import Empty from "$lib/portal/empty_state.svelte";
  import Icon from "$lib/portal/icon.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import { location_label, location_tree } from "$lib/portal/reference.js";
  import { companies_api, image_url } from "$lib/portal/companies_api.js";
  const sizes = ["1–10 people", "11–50 people", "51–200 people", "201–500 people", "501–1,000 people", "1,001–5,000 people", "5,000+ people"];
  const page_size = 20;
  let query = "";
  let country = "";
  let size = "";
  let result = null;
  let error = "";
  let loading = false;
  let current_page = 1;
  // Search state lives in the URL, so a search can be shared or revisited.
  $: params = $page.url.searchParams;
  $: if (browser) run(params.get("q") || "", params.get("country") || "", params.get("size") || "", Number(params.get("page")) || 1);
  async function run(q, c, s, p) {
    query = q;
    country = c;
    size = s;
    current_page = p;
    loading = true;
    const response = await companies_api.search({
      query: q,
      countries: c ? [c] : [],
      sizes: s ? [s] : [],
      page: p,
      page_size,
    });
    loading = false;
    error = response.ok ? "" : response.error;
    result = response.ok ? response.data : null;
  }
  function search(p = 1) {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (country) next.set("country", country);
    if (size) next.set("size", size);
    if (p > 1) next.set("page", String(p));
    goto(`?${next}`, { keepFocus: true, noScroll: p === 1 });
  }
</script>

<svelte:head><title>Explore companies — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="FIND YOUR PEOPLE"
    title="Good things happen"
    accent="with the right team."
    description="Get to know the people, purpose and culture behind a company."
    companion="sage"
  />
  <form class="workspace_toolbar" on:submit|preventDefault={() => search()}>
    <input
      aria-label="Company name"
      placeholder="Company name"
      maxlength="100"
      bind:value={query}
    /><select aria-label="Headquarters country" bind:value={country}
      ><option value="">Any country</option>{#each $location_tree as c (c.id)}<option
          value={c.country_code}>{c.name}</option
        >{/each}</select
    ><select aria-label="Company size" bind:value={size}
      ><option value="">Any size</option>{#each sizes as s}<option>{s}</option
        >{/each}</select
    ><button class="button button_dark"
      >Find companies <Icon name="arrow-right" size={16} /></button
    >
  </form>
  <div class="panel_heading">
    <h2>
      {#if loading && !result}Searching…{:else if result}{result.total}
        {result.total === 1 ? "team" : "teams"} to explore{/if}
    </h2>
    <a href="/company/create">Create your company page ↗</a>
  </div>
  {#if error}<p class="workspace_hint warning" role="alert">{error}</p>{/if}
  {#if result?.companies.length}<div class="workspace_tiles">
      {#each result.companies as company (company.id)}<a
          class="directory_card"
          href={`/company/${company.slug}`}
          ><Company_logo id={company.id} src={image_url(company.logo_url)} size={48} />
          <div>
            <h2>{company.name}</h2>
            <p>{company.tagline}</p>
          </div>
          <span class="workspace_badge">{company.industries[0] ?? ""}</span>
          <div class="card_bottom">
            <span
              >{company.hq_location_id ? $location_label(company.hq_location_id) : ""}
              · {company.size}</span
            ><Icon name="arrow-up-right" size={20} />
          </div></a
        >{/each}
    </div>
    {#if result.total > page_size}<div class="workspace_actions">
        <button
          class="button button_outline button_small"
          disabled={current_page === 1}
          on:click={() => search(current_page - 1)}>Previous</button
        ><span>Page {current_page} of {Math.ceil(result.total / page_size)}</span
        ><button
          class="button button_outline button_small"
          disabled={current_page * page_size >= result.total}
          on:click={() => search(current_page + 1)}>Next</button
        >
      </div>{/if}
  {:else if result}<Empty
      title="A team worth finding."
      text="No companies match this search. Try a different name, country or size."
      ><button
        class="button button_dark"
        on:click={() => {
          query = "";
          country = "";
          size = "";
          search();
        }}>Clear search</button
      ></Empty
    >{/if}
</main>
