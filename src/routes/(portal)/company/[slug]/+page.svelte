<script>
  import { keep_active_visible } from "$lib/portal/keep_active_visible.js";
  import { page } from "$app/stores";
  import { followed_companies } from "$lib/portal/workspace_state.js";
  import { browser } from "$app/environment";
  import { jobs_api, to_card, to_criteria } from "$lib/portal/jobs_api.js";
  import {
    location_label,
    rates,
    currency_options,
  } from "$lib/portal/reference.js";
  import { image_url } from "$lib/portal/companies_api.js";
  import { render_markdown } from "$lib/portal/markdown.js";
  import { default_filters } from "$lib/portal/search.js";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import Empty from "$lib/portal/empty_state.svelte";
  export let data;
  $: company = data.company;
  const social_labels = { linkedin: "LinkedIn", x: "X / Twitter", github: "GitHub / tech blog", glassdoor: "Glassdoor / Crunchbase" };
  $: tab = ["overview", "jobs", "culture", "products", "team"].includes(
    $page.url.searchParams.get("tab"),
  )
    ? $page.url.searchParams.get("tab")
    : "overview";
  let filters = default_filters();
  let applied_filters = default_filters();
  // Manual "Company jobs": the platform search, locked to this company.
  let results = [];
  let any_jobs = false;
  let loading = false;
  $: if (browser && company && tab === "jobs") load_jobs(applied_filters, $rates);
  async function load_jobs(filters, rates) {
    loading = true;
    const result = await jobs_api.search({
      ...to_criteria(filters, { rates, page_size: 50 }),
      company: company.slug,
    });
    loading = false;
    results = result.ok ? result.data.jobs.map((j) => to_card(j, $location_label)) : [];
    if (results.length) any_jobs = true;
  }
  function follow() {
    followed_companies.update((v) =>
      v.includes(company.id)
        ? v.filter((id) => id !== company.id)
        : [...v, company.id],
    );
  }
</script>

<svelte:head
  ><title>{company?.name || "Company not found"} — Referise</title></svelte:head
>
<main id="main-content" class="workspace portal_container">
  {#if company}<div class="company_cover">
      {#if company.banner_url}<img
          class="company_cover_image"
          src={image_url(company.banner_url)}
          alt={`${company.name} cover`}
        />{:else}<h2>Different people.<br />Shared possibilities.</h2>
        <span class="company_cover_arch" aria-hidden="true"></span>
        <Companion kind="sage" size={205} />{/if}
    </div>
    <div class="company_identity_panel">
      <div class="person_line">
        <Company_logo id={company.id} src={image_url(company.logo_url)} size={64} />
        <div>
          <h1>{company.name}</h1>
          <p>{company.tagline}</p>
          <div class="company_meta">
            <span class="workspace_badge">{company.industries[0]}</span>
            <span class="workspace_badge neutral"
              >{$location_label(company.hq_location_id)}</span
            >
          </div>
        </div>
      </div>
      <div class="workspace_actions">
        <button
          class="button button_dark"
          aria-pressed={$followed_companies.includes(company.id)}
          on:click={follow}
          >{$followed_companies.includes(company.id)
            ? "Following ✓"
            : "Follow company +"}</button
        >{#if company.website}<a
            class="button button_outline"
            href={company.website}
            target="_blank"
            rel="noreferrer">Website ↗</a
          >{/if}
      </div>
    </div>
    <nav
      class="workspace_tabs company_page_tabs"
      use:keep_active_visible={tab}
      aria-label="Company sections"
    >
      {#each [["overview", "Overview"], ["jobs", "Jobs"], ["culture", "Culture & benefits"], ["products", "Products"], ["team", "Team"]] as [key, label]}<a
          class:active={tab === key}
          aria-current={tab === key ? "page" : undefined}
          href={`?tab=${key}`}>{label}</a
        >{/each}{#if company.viewer_role === "admin"}<a
          href={`/company/${company.slug}/dashboard`}>Manage company ↗</a
        >{/if}
    </nav>
    {#if tab === "jobs"}<form
        class="workspace_toolbar"
        on:submit|preventDefault={() =>
          (applied_filters = structuredClone(filters))}
      >
        <input
          aria-label="Search company jobs"
          placeholder={`Search roles at ${company.name}`}
          bind:value={filters.query}
        /><select
          aria-label="Workplace"
          value={filters.modes[0] || ""}
          on:change={(e) =>
            (filters.modes = e.currentTarget.value
              ? [e.currentTarget.value]
              : [])}
          ><option value="">Any workplace</option><option>Remote</option><option
            >Hybrid</option
          ><option>On-site</option></select
        ><select
          aria-label="Job type"
          value={filters.types[0] || ""}
          on:change={(e) =>
            (filters.types = e.currentTarget.value
              ? [e.currentTarget.value]
              : [])}
          ><option value="">Any job type</option><option>Full-time</option
          ><option>Part-time</option><option>Contract</option><option
            >Internship</option
          ></select
        ><select aria-label="Sort company jobs" bind:value={filters.sort}
          ><option value="newest">Most recent</option><option value="salary"
            >Highest salary</option
          ></select
        ><button class="button button_dark">Search</button>
        <details class="company_job_options filter_disclosure">
          <summary>Location, experience & salary</summary>
          <div class="form_grid workspace_form">
            <label class="field_label"
              >Location<input
                class="field_input"
                bind:value={filters.location}
                placeholder="City or country"
              /></label
            ><label class="field_label"
              >Experience (years)<input
                class="field_input"
                type="number"
                min="0"
                max="99"
                step="1"
                bind:value={filters.min_experience}
              /></label
            ><label class="field_label"
              >Currency<select class="field_input" bind:value={filters.currency}
                >{#each $currency_options as code}<option>{code}</option
                  >{/each}</select
              ></label
            ><label class="field_label"
              >Minimum annual salary<input
                class="field_input"
                type="number"
                min="0"
                bind:value={filters.min_salary}
              /></label
            >
          </div>
          <p class="work_note">Apply these options with Search.</p>
        </details>
      </form>
      <p class="work_note">
        {loading ? "Loading…" : `Showing ${results.length} open ${results.length === 1 ? "position" : "positions"} at ${company.name}`}
      </p>
      {#if results.length}<div class="results_jobs grid_view">
          {#each results as job}<Job_card {job} />{/each}
        </div>{:else}<Empty
          title={any_jobs ? "No open jobs match your selected filters." : `${company.name} is not currently hiring.`}
          text={any_jobs ? "Try a broader search within this company." : "Check back later for new openings!"}
          ><button
            class="button button_outline"
            on:click={() => {
              filters = default_filters();
              applied_filters = default_filters();
            }}>Clear filters</button
          ></Empty
        >{/if}
    {:else if tab === "team"}<div class="workspace_panel">
        <h2>The people behind {company.name}</h2>
        <Empty
          title="Meet the team, soon."
          text="Public team profiles have not been added yet."
        />
      </div>
    {:else}<div class="workspace_grid">
        <div class="workspace_stack">
          {#if tab === "overview"}<section class="workspace_panel">
              <span class="eyebrow_label">A LITTLE ABOUT US</span>
              <h2 style="margin-top:12px">{company.tagline}</h2>
              <!-- render_markdown escapes all HTML before formatting -->
              <div>{@html render_markdown(company.about)}</div>
            </section>{/if}
          {#if tab === "overview" || tab === "products"}<section
              class="workspace_panel"
            >
              <div class="panel_heading">
                <h2>What we’re building</h2>
                <span class="workspace_badge neutral">Products & services</span>
              </div>
              {#each company.products || [] as product}<div
                  class="workspace_hint"
                >
                  <h3>{product.name}</h3>
                  <p>{product.about}</p>
                  {#if product.url}<a
                      href={product.url}
                      target="_blank"
                      rel="noreferrer">Explore product ↗</a
                    >{/if}
                </div>{:else}<p>No products added yet.</p>{/each}
            </section>{/if}
          {#if tab === "overview" || tab === "culture"}<section
              class="workspace_panel"
            >
              <h2>Room to do your best work.</h2>
              <div class="workspace_list company_benefits">
                {#each company.benefits || [] as benefit}<div>
                    <span class="person_initials">✳</span>
                    <div>
                      <strong>{benefit.title}</strong>
                      <p>{benefit.details}</p>
                    </div>
                  </div>{:else}<p>Benefits have not been added yet.</p>{/each}
              </div>
            </section>{/if}
          {#if tab === "overview"}<section class="workspace_panel">
              <h2>Where we work</h2>
              <div class="workspace_hint">
                <strong>{$location_label(company.hq_location_id)}</strong>
                <p>{company.hq_address || "Headquarters"}</p>
              </div>
              {#if company.branch_location_ids.length}<p>
                  Other offices: {company.branch_location_ids
                    .map($location_label)
                    .join(", ")}
                </p>{/if}
            </section>{/if}
        </div>
        <aside class="workspace_stack">
          <section class="workspace_panel">
            <h2>Company at a glance</h2>
            <dl class="facts_list">
              {#each [["Industry", company.industries.join(", ")], ["Team size", company.size], ["Headquarters", $location_label(company.hq_location_id)], ["Founded", company.founded_year || "Not provided"]] as [label, value]}<div
                >
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>{/each}
            </dl>
          </section>
          <section class="workspace_panel" style="background:#e6edcf">
            <span class="eyebrow_label">YOUR NEXT CHAPTER</span>
            <h2 style="margin-top:15px">
              Could this be<br />your kind of team?
            </h2>
            <p>Explore the roles and get a feel for the work.</p>
            <a class="button button_dark" href="?tab=jobs"
              >View company jobs ↗</a
            >
          </section>
          {#if Object.keys(company.social).length}<section
              class="workspace_panel"
            >
              <h2>Around the web</h2>
              {#each Object.entries(company.social) as [platform, link]}<p>
                  <a href={link} target="_blank" rel="noreferrer noopener"
                    >{social_labels[platform] || platform} ↗</a
                  >
                </p>{/each}
            </section>{/if}
        </aside>
      </div>{/if}
  {:else}<Empty
      title="We couldn’t find this company."
      text="Explore the directory to find the right team."
      ><a href="/companies" class="button button_dark">Explore companies</a
      ></Empty
    >{/if}
</main>
