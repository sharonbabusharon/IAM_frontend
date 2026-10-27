<script>
  import Premium_settings from "./premium_settings.svelte";
  import { onMount as on_mount } from "svelte";
  import { keep_active_visible } from "$lib/portal/keep_active_visible.js";
  import { toast } from "./state.js";
  import { rates, currency_options, sync_reference } from "./reference.js";
  import Heading from "./page_heading.svelte";
  import Notice from "./preview_notice.svelte";
  import Modal from "./modal.svelte";

  const api = "/framework_api/admin/reference";
  let tab = "taxonomy";

  // ---- Skills & designations (live) ----
  let kind = "skill";
  let status = "pending";
  let page = 1;
  const page_size = 25;
  let terms = [];
  let total = 0;
  let loading = false;
  let access_error = "";
  let selected = [];
  let merge_master = null;
  let merging = false;
  let editing = null;
  let edit_name = "";
  let manifest = {};

  async function call(path, options = {}) {
    const response = await fetch(api + path, {
      ...options,
      headers: options.body ? { "Content-Type": "application/json" } : {},
    });
    const body = await response.json().catch(() => null);
    if (response.status === 401 || response.status === 403)
      access_error = "Platform administrator access is required.";
    if (!response.ok) throw new Error(body?.error || "Something went wrong. Try again.");
    return body?.data;
  }

  async function load_terms() {
    loading = true;
    try {
      const query = new URLSearchParams({ page, page_size });
      if (status) query.set("status", status);
      const data = await call(`/taxonomy/${kind}?${query}`);
      terms = data.terms;
      total = data.total;
      selected = selected.filter((id) => terms.some((t) => t.id === id));
    } catch (error) {
      if (!access_error) toast(error.message);
    } finally {
      loading = false;
    }
  }

  async function load_manifest() {
    const response = await fetch("/reference/manifest").catch(() => null);
    manifest = response?.ok ? await response.json() : {};
  }

  async function act(message, path, options) {
    try {
      await call(path, options);
      toast(message);
      await Promise.all([load_terms(), load_manifest()]);
      sync_reference();
    } catch (error) {
      toast(error.message);
    }
  }

  const approve = (term) =>
    act(`“${term.name}” verified.`, `/taxonomy/${kind}/${term.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "verified" }),
    });
  let deleting = null;
  async function confirm_delete() {
    const term = deleting;
    deleting = null;
    await act(`“${term.name}” deleted.`, `/taxonomy/${kind}/${term.id}`, { method: "DELETE" });
  }
  async function save_edit() {
    const term = editing;
    editing = null;
    await act(`Renamed to “${edit_name.trim()}”.`, `/taxonomy/${kind}/${term.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: edit_name }),
    });
  }
  async function complete_merge() {
    const sources = selected.filter((id) => id !== merge_master);
    merging = false;
    await act(`${sources.length} variant(s) merged.`, `/taxonomy/${kind}/merge`, {
      method: "POST",
      body: JSON.stringify({ source_ids: sources, master_id: merge_master }),
    });
    selected = [];
  }

  // ---- Exchange rates (live) ----
  let currency_query = "";
  let settings = null;
  $: shown_currencies = $currency_options.filter((c) =>
    c.toLowerCase().includes(currency_query.trim().toLowerCase()),
  );
  async function refresh_rates() {
    try {
      await call("/fx/refresh", { method: "POST" });
      toast("Refresh started. New rates publish in a few seconds.");
      setTimeout(() => load_manifest().then(sync_reference), 8000);
    } catch (error) {
      toast(error.message);
    }
  }
  async function save_schedule() {
    try {
      settings = await call("/settings", { method: "PUT", body: JSON.stringify(settings) });
      toast("Exchange-rate update time saved.");
    } catch (error) {
      toast(error.message);
    }
  }
  const when = (iso) =>
    iso
      ? new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST"
      : "Not published yet";

  on_mount(() => {
    load_terms();
    load_manifest();
    call("/settings").then((data) => (settings = data)).catch(() => {});
  });

  // ---- Moderation (sample data; no moderation API yet) ----
  let report_status = "Open";
  const reports = [
    {
      id: "r1",
      title: "Sample listing contains an outdated application link",
      type: "Job listing",
      date: "2026-10-08",
    },
    {
      id: "r2",
      title: "Sample company profile needs an ownership review",
      type: "Company",
      date: "2026-10-07",
    },
  ];
  let resolved = [];
</script>

<svelte:head><title>Platform admin — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="PLATFORM OPERATIONS"
    title="Keep the details"
    accent="in good hands."
    description="Review the shared data and support a clearer experience for everyone."
    companion="blue"
  /><Notice
    text="Skills, designations and exchange rates are live. Moderation is still a sample preview."
  />
  {#if access_error}<p class="workspace_hint warning">{access_error}</p>{/if}
  <nav
    class="workspace_tabs"
    use:keep_active_visible={tab}
    aria-label="Platform administration"
  >
    {#each [["membership", "Membership & filters"], ["taxonomy", "Skills & designations"], ["reports", "Moderation"], ["currency", "Exchange rates"], ["identity", "Identity & access"]] as [key, label]}<button
        class:active={tab === key}
        on:click={() => (tab = key)}>{label}</button
      >{/each}
  </nav>
  {#if tab === "membership"}<Premium_settings
    />{:else if tab === "taxonomy"}<div class="stat_grid">
      <div class="stat_card featured">
        <span>{status ? status[0].toUpperCase() + status.slice(1) : "All"} {kind === "skill" ? "skills" : "designations"}</span><strong
          >{total}</strong
        ><small>In this view</small>
      </div>
      <div class="stat_card">
        <span>Published file</span><strong
          >{manifest[kind === "skill" ? "skills" : "designations"] ? "Live" : "—"}</strong
        ><small>{when(manifest[kind === "skill" ? "skills" : "designations"]?.updated_at)}</small>
      </div>
      <div class="stat_card">
        <span>Next step</span><strong>Review</strong><small
          >Verify, rename, merge or delete</small
        >
      </div>
    </div>
    <section class="workspace_panel">
      <div class="panel_heading">
        <h2>Make shared terms consistent.</h2>
        <button
          class="button button_dark button_small"
          disabled={selected.length < 2}
          on:click={() => {
            merging = true;
            merge_master = selected[0];
          }}>Merge selected ({selected.length})</button
        >
      </div>
      <div class="inline_fields">
        <label class="field_label"
          >Type<select
            class="field_input"
            bind:value={kind}
            on:change={() => ((page = 1), (selected = []), load_terms())}
            ><option value="skill">Skills</option><option value="designation"
              >Designations</option
            ></select
          ></label
        ><label class="field_label"
          >Status<select
            class="field_input"
            bind:value={status}
            on:change={() => ((page = 1), (selected = []), load_terms())}
            ><option value="pending">Pending review</option><option
              value="verified">Verified</option
            ><option value="">All (except merged)</option></select
          ></label
        >
      </div>
      <div class="workspace_table_wrap">
        <table class="workspace_table">
          <thead
            ><tr
              ><th>Select</th><th>Term</th><th>Added</th><th>Status</th><th
                >Actions</th
              ></tr
            ></thead
          ><tbody
            >{#each terms as term (term.id)}<tr
                ><td data-label="Select"
                  ><div class="table_cell_value">
                    <input
                      type="checkbox"
                      aria-label={`Select ${term.name}`}
                      value={term.id}
                      bind:group={selected}
                    />
                  </div></td
                ><td data-label="Term"
                  ><div class="table_cell_value"><strong>{term.name}</strong></div></td
                ><td data-label="Added"
                  ><div class="table_cell_value">
                    {new Date(term.created_at).toLocaleDateString("en-IN")}
                  </div></td
                ><td data-label="Status"
                  ><div class="table_cell_value">
                    <span class="workspace_badge">{term.status}</span>
                  </div></td
                ><td data-label="Actions"
                  ><div class="table_cell_value">
                    {#if term.status === "pending"}<button
                        class="text_action"
                        on:click={() => approve(term)}>Verify</button
                      >{/if}<button
                      class="text_action"
                      on:click={() => {
                        editing = term;
                        edit_name = term.name;
                      }}>Rename</button
                    ><button class="text_action" on:click={() => (deleting = term)}
                      >Delete</button
                    >
                  </div></td
                ></tr
              >{:else}<tr
                ><td colspan="5"
                  >{loading ? "Loading…" : "Nothing to review here."}</td
                ></tr
              >{/each}</tbody
          >
        </table>
      </div>
      {#if total > page_size}<div class="workspace_actions">
          <button
            class="button button_outline button_small"
            disabled={page === 1}
            on:click={() => ((page -= 1), load_terms())}>Previous</button
          ><span>Page {page} of {Math.ceil(total / page_size)}</span><button
            class="button button_outline button_small"
            disabled={page * page_size >= total}
            on:click={() => ((page += 1), load_terms())}>Next</button
          >
        </div>{/if}
      <p class="work_note">
        Changes republish the shared list, and every browser picks it up on its
        next visit. Usage counts arrive once jobs store term ids.
      </p>
    </section>
  {:else if tab === "reports"}<section class="workspace_panel">
      <div class="panel_heading">
        <h2>Reports to review</h2>
        <select
          class="field_input"
          style="width:auto"
          aria-label="Report status"
          bind:value={report_status}
          ><option>Open</option><option>Resolved</option></select
        >
      </div>
      <div class="workspace_list">
        {#each reports.filter( (r) => (report_status === "Resolved" ? resolved.includes(r.id) : !resolved.includes(r.id)) ) as report}<div
          >
            <div class="list_body">
              <span class="workspace_badge neutral">{report.type}</span>
              <h3 style="margin-top:10px">{report.title}</h3>
              <p>{report.date} · Sample report</p>
            </div>
            <button
              class="button button_outline button_small"
              on:click={() =>
                (resolved = resolved.includes(report.id)
                  ? resolved.filter((id) => id !== report.id)
                  : [...resolved, report.id])}
              >{resolved.includes(report.id)
                ? "Reopen"
                : "Mark resolved"}</button
            >
          </div>{:else}<p>No reports in this view.</p>{/each}
      </div>
    </section>
  {:else if tab === "currency"}<div class="workspace_grid">
      <section class="workspace_panel">
        <div class="panel_heading">
          <h2>Exchange rates</h2>
          <button class="button button_dark button_small" on:click={refresh_rates}
            >Refresh now</button
          >
        </div>
        <p>
          INR is the baseline. Rates come from ExchangeRate-API · last published
          {when(manifest.rates?.updated_at)}.
        </p>
        <input
          class="field_input"
          type="search"
          placeholder="Find a currency code"
          aria-label="Find a currency"
          bind:value={currency_query}
        />
        <div class="workspace_table_wrap">
          <table class="workspace_table">
            <thead><tr><th>Currency</th><th>INR per unit</th></tr></thead><tbody
              >{#each shown_currencies.slice(0, 30) as currency}<tr
                  ><td data-label="Currency"
                    ><div class="table_cell_value">{currency}</div></td
                  ><td data-label="INR per unit"
                    ><div class="table_cell_value">
                      {$rates[currency].toLocaleString("en-IN", { maximumFractionDigits: 4 })}
                    </div></td
                  ></tr
                >{:else}<tr><td colspan="2">No currencies match.</td></tr
                >{/each}</tbody
            >
          </table>
        </div>
        {#if shown_currencies.length > 30}<p class="form_helper">
            Showing 30 of {shown_currencies.length}. Type a code to find another.
          </p>{/if}
      </section>
      <form class="workspace_panel workspace_form" on:submit|preventDefault={save_schedule}>
        <h2>Daily update time</h2>
        {#if settings}<label class="field_label"
            >Run time · IST<input
              class="field_input"
              type="time"
              required
              bind:value={settings.fx_refresh_time}
            /></label
          >
          <p>
            After three failed attempts, the last valid rates stay in use and the
            failure is logged.
          </p>
          <button class="button button_dark">Save time</button>{:else}<p>
            Loading settings…
          </p>{/if}
      </form>
    </div>
  {:else}<section class="workspace_panel">
      <h2>Identity & account administration</h2>
      <p>
        User accounts and authentication providers are managed through the
        existing IAM screens. Those screens require their normal administrator
        access.
      </p>
      <div class="workspace_actions">
        <a class="button button_dark" href="/admin/users">Manage users ↗</a><a
          class="button button_outline"
          href="/admin/providers">Authentication providers ↗</a
        >
      </div>
    </section>{/if}
</main>
{#if merging}<Modal title="Merge term variants" on:close={() => (merging = false)}
    ><form class="workspace_form" on:submit|preventDefault={complete_merge}>
      <p>
        Choose the version to keep. The others become its aliases, so typing
        them later still finds it.
      </p>
      {#each terms.filter((t) => selected.includes(t.id)) as term}<label
          class="filter_checkbox"
          ><input
            type="radio"
            name="merge_master"
            value={term.id}
            bind:group={merge_master}
          />{term.name}</label
        >{/each}
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (merging = false)}>Cancel</button
        ><button class="button button_dark">Merge</button>
      </div>
    </form></Modal
  >{/if}
{#if deleting}<Modal title="Delete shared term" on:close={() => (deleting = null)}
    ><form class="workspace_form" on:submit|preventDefault={confirm_delete}>
      <p>
        Delete “{deleting.name}” and its merged variants? It disappears from
        autocomplete; profiles and jobs keep their text.
      </p>
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (deleting = null)}>Cancel</button
        ><button class="button button_dark">Delete</button>
      </div>
    </form></Modal
  >{/if}
{#if editing}<Modal title="Rename shared term" on:close={() => (editing = null)}
    ><form class="workspace_form" on:submit|preventDefault={save_edit}>
      <label class="field_label"
        >Term name<input
          class="field_input"
          required
          maxlength="80"
          bind:value={edit_name}
        /></label
      ><button class="button button_dark">Save</button>
    </form></Modal
  >{/if}
