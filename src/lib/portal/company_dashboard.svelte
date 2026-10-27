<script>
  import { keep_active_visible } from "$lib/portal/keep_active_visible.js";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount as on_mount } from "svelte";
  import { companies_api, role_labels } from "./companies_api.js";
  import {
    team_members,
    recruitment_jobs,
    wallet_transactions,
    inr,
    initials,
    download_csv,
  } from "./workspace_state.js";
  import { toast } from "./state.js";
  import Heading from "./page_heading.svelte";
  import Notice from "./preview_notice.svelte";
  import Empty from "./empty_state.svelte";
  import Icon from "./icon.svelte";
  import Modal from "./modal.svelte";
  export let section = "overview";
  let member_status = "current";
  let member_query = "";
  let editing_member = null;
  let role = "employee";
  let action_error = "";
  let topup = false;
  let amount = 5000;
  let payment_review = false;
  let offboard_member = null;
  let leaving = false;
  let date_range = "7";
  // Live: the company, its overview counts and its members (admins only).
  let company = null;
  let stats = null;
  let access = "loading"; // loading | admin | denied | missing | error
  let live_members = [];
  let members_loading = false;
  $: base = `/company/${$page.params.slug}/dashboard`;
  on_mount(load);
  async function load() {
    const found = await companies_api.get($page.params.slug);
    if (!found.ok) {
      access = found.status === 404 ? "missing" : "error";
      return;
    }
    company = found.data;
    if (company.viewer_role !== "admin") {
      access = "denied";
      return;
    }
    const overview = await companies_api.dashboard(company.slug);
    if (!overview.ok) {
      access = overview.status === 403 ? "denied" : "error";
      return;
    }
    stats = overview.data;
    access = "admin";
  }
  $: if (access === "admin" && section === "employees") load_members(member_status);
  async function load_members(status) {
    members_loading = true;
    const result = await companies_api.members(company.slug, status);
    members_loading = false;
    if (result.ok) live_members = result.data;
    else toast(result.error);
  }
  $: shown_members = live_members.filter((m) =>
    `${m.name} ${m.title} ${m.email}`.toLowerCase().includes(member_query.toLowerCase()),
  );
  async function after_change(message) {
    toast(message);
    await Promise.all([load_members(member_status), refresh_stats()]);
  }
  async function refresh_stats() {
    const overview = await companies_api.dashboard(company.slug);
    if (overview.ok) stats = overview.data;
  }
  async function decide(member, approve) {
    const result = await companies_api.decide(company.slug, member.user_id, approve);
    if (!result.ok) return toast(result.error);
    after_change(approve ? `${member.name} is now part of your team.` : "Request declined.");
  }
  async function save_role() {
    const result = await companies_api.set_role(company.slug, editing_member.user_id, role);
    if (!result.ok) {
      action_error = result.error;
      return;
    }
    const name = editing_member.name;
    editing_member = null;
    after_change(`${name} is now ${role_labels[role]}.`);
  }
  async function confirm_offboard() {
    const result = await companies_api.offboard(company.slug, offboard_member.user_id);
    if (!result.ok) {
      action_error = result.error;
      return;
    }
    const name = offboard_member.name;
    offboard_member = null;
    after_change(`${name} moved to past employees.`);
  }
  async function leave() {
    const result = await companies_api.leave(company.slug);
    if (!result.ok) {
      action_error = result.error;
      return;
    }
    leaving = false;
    toast(`You have left ${company.name}.`);
    goto("/companies");
  }
  // Sample data for the preview sections (wallet, analytics, workforce)
  // until the payments section builds them.
  $: members = $team_members.filter((m) => m.company === $page.params.slug);
  $: current = members.filter((m) => m.status === "Current");
  $: pending = members.filter((m) => m.status === "Pending");
  $: filtered_members = members.filter(
    (m) =>
      m.status === member_tab &&
      `${m.name} ${m.title}`.toLowerCase().includes(member_query.toLowerCase()),
  );
  $: company_jobs = $recruitment_jobs.filter(
    (j) => j.company === $page.params.slug,
  );
  $: ledger = $page.params.slug === "forma" ? $wallet_transactions : [];
  $: wallet = ledger.reduce((sum, t) => sum + t.amount, 0);
  $: spent = -ledger
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0);
  $: allocated = current.reduce(
    (sum, m) => sum + Math.max(0, m.limit - m.spent),
    0,
  );
  $: admins = current.filter((m) => m.role === "Company Admin");
  $: tabs = [
    ["overview", "Overview", "grid", base],
    ["employees", "Employees", "users", `${base}/employees`],
    ["analytics", "Analytics", "chart", `${base}/analytics`],
    ["hierarchy", "Workforce", "building", `${base}/hierarchy`],
    ["wallet", "Wallet & billing", "money", `${base}/wallet`],
  ];
  function export_ledger() {
    download_csv(
      "referise-preview-transactions.csv",
      ["Date", "Action", "By", "Amount (INR)", "Reference"],
      ledger.map((t) => [t.date, t.type, t.by, t.amount, t.reference]),
    );
  }
</script>

<svelte:head
  ><title>{company?.name || "Company"} · {section} — Referise</title
  ></svelte:head
>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow={`${company?.name || "YOUR COMPANY"} / WORKSPACE`}
    title={section === "overview"
      ? "A little clarity."
      : section === "employees"
        ? "Good people."
        : section === "analytics"
          ? "See the bigger"
          : section === "hierarchy"
            ? "Every person."
            : "Make every"}
    accent={section === "overview"
      ? "A stronger team."
      : section === "employees"
        ? "All together."
        : section === "analytics"
          ? "picture."
          : section === "hierarchy"
            ? "A place to grow."
            : "hire count."}
    description={section === "overview"
      ? "Your people, hiring and company budget, in one considered space."
      : section === "employees"
        ? "Review employment claims, manage your team and keep budgets clear."
        : section === "analytics"
          ? "Understand how people discover your company and move through hiring."
          : section === "hierarchy"
            ? "A simple view of your organisation and the people behind the work."
            : "Keep track of company credits, recruiter allowances and every transaction."}
    companion="sage"
  />
  <Notice
    text="Overview and employees are live. Wallet, analytics and workforce still show sample data."
  />
  <div class="workspace_shell">
    <aside class="workspace_sidenav" use:keep_active_visible={section}>
      <span>COMPANY WORKSPACE</span>{#each tabs as [key, label, icon, href]}<a
          {href}
          class:active={section === key}
          aria-current={section === key ? "page" : undefined}
          ><Icon name={icon} size={17} />{label}</a
        >{/each}<span>MAKE YOUR NEXT MOVE</span><a
        href={`/company/${$page.params.slug}`}
        ><Icon name="eye" size={17} />Public company page</a
      ><a href={`/company/${$page.params.slug}/edit`}
        ><Icon name="edit" size={17} />Edit company</a
      ><a href="/recruiter"
        ><Icon name="briefcase" size={17} />Hiring workspace</a
      >
    </aside>
    <div class="workspace_main">
      <div class="panel_heading workspace_role_switch">
        <span class="workspace_badge"
          >{company?.name || "Company not found"}</span
        >
      </div>
      {#if access === "loading"}<p class="workspace_hint">Loading…</p>
      {:else if access === "missing"}<Empty
          title="Company not found."
          text="Choose a company from the directory."
          ><a class="button button_dark" href="/companies">Explore companies</a></Empty
        >
      {:else if access === "error"}<Empty
          title="This page couldn’t load."
          text="Check your connection and try again."
        />
      {:else if access === "denied"}<Empty
          title="This space belongs to company admins."
          text="Ask an admin of this company to give you admin access."
        />
      {:else if section === "overview"}
        <div class="stat_grid">
          {#each [[stats.active_jobs, "Active jobs", `${stats.total_jobs} total posts`], [stats.employees, "Current team", `${stats.pending_requests} pending claims`], [stats.applications, "Applications", "Across your jobs"], [`${stats.admins} / ${stats.hr}`, "Admins / recruiters", "Equal admin rights"]] as [value, label, note], i}<div
              class="stat_card"
              class:featured={i === 0}
            >
              <span>{label}</span><strong>{value}</strong><small>{note}</small>
            </div>{/each}
        </div>
        <div class="workspace_stack">
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>A few things to move forward.</h2>
              <span class="workspace_badge neutral">TODAY’S FOCUS</span>
            </div>
            <div class="workspace_list">
              <a href={`${base}/employees`}
                ><span class="person_initials"
                  ><Icon name="shield" size={20} /></span
                >
                <div class="list_body">
                  <strong>{stats.pending_requests} employment claims to review</strong>
                  <p>Help your team’s experience get recognised.</p>
                </div>
                <Icon name="arrow-right" /></a
              ><a href="/recruiter/post-job"
                ><span class="person_initials"
                  ><Icon name="plus" size={20} /></span
                >
                <div class="list_body">
                  <strong>Make room for your next great hire</strong>
                  <p>Create a clear, thoughtful job post.</p>
                </div>
                <Icon name="arrow-right" /></a
              ><a href={`${base}/wallet`}
                ><span class="person_initials"
                  ><Icon name="money" size={20} /></span
                >
                <div class="list_body">
                  <strong>Wallet & recruiter budgets</strong>
                  <p>Sample preview until payments are connected.</p>
                </div>
                <Icon name="arrow-right" /></a
              >
            </div>
          </section>
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>Hiring at a glance</h2>
              <a href="/recruiter/jobs">Manage jobs ↗</a>
            </div>
            <div class="stat_grid">
              {#each [[stats.total_jobs, "Total posts"], [stats.active_jobs, "Active"], [stats.closed_jobs, "Closed or expired"], [stats.applications, "Applications"]] as [value, label]}<div
                  class="stat_card"
                >
                  <span>{label}</span><strong>{value}</strong>
                </div>{/each}
            </div>
            <p class="work_note">
              {stats.admins} company admins · {stats.hr} recruiters
            </p>
          </section>
        </div>
      {:else if section === "employees"}
        <nav class="workspace_tabs" aria-label="Employee status">
          {#each [["current", "Current"], ["pending", "Requests"], ["past", "Past"], ["rejected", "Declined"]] as [status, label]}<button
              class:active={member_status === status}
              on:click={() => (member_status = status)}
              >{label}{status === "pending" && stats.pending_requests
                ? ` (${stats.pending_requests})`
                : ""}</button
            >{/each}
        </nav>
        <div class="workspace_toolbar">
          <input
            aria-label="Search team"
            placeholder="Search name, title or email"
            bind:value={member_query}
          />
        </div>
        <section class="workspace_panel">
          <div class="panel_heading">
            <h2>
              {member_status === "pending"
                ? "Employment requests"
                : member_status === "current"
                  ? "Current team"
                  : member_status === "past"
                    ? "Past employees"
                    : "Declined requests"}
            </h2>
            <span class="workspace_badge neutral"
              >{shown_members.length} people</span
            >
          </div>
          {#if members_loading && !live_members.length}<p>Loading…</p>
          {:else if shown_members.length}<div class="workspace_table_wrap">
              <table class="workspace_table">
                <thead
                  ><tr
                    ><th>Person</th><th
                      >{member_status === "pending" ? "Claimed start" : "Access"}</th
                    ><th>Actions</th></tr
                  ></thead
                ><tbody
                  >{#each shown_members as member (member.user_id)}<tr
                      ><td data-label="Person"
                        ><div class="table_cell_value">
                          <div class="person_line">
                            <span class="person_initials"
                              >{initials(member.name || member.email)}</span
                            >
                            <div>
                              <strong>{member.name || member.email}</strong
                              ><small>{member.title}</small><small
                                >{member.email}</small
                              >
                            </div>
                          </div>
                        </div></td
                      ><td
                        data-label={member_status === "pending" ? "Claimed start" : "Access"}
                        ><div class="table_cell_value">
                          {member_status === "pending"
                            ? member.started_on || "Not given"
                            : role_labels[member.role]}
                        </div></td
                      ><td data-label="Actions"
                        ><div class="table_cell_value">
                          {#if member_status === "pending"}<button
                              class="text_action"
                              on:click={() => decide(member, true)}>Approve</button
                            ><button
                              class="text_action"
                              on:click={() => decide(member, false)}>Decline</button
                            >{:else if member_status === "current"}<button
                              class="text_action"
                              on:click={() => {
                                editing_member = member;
                                role = member.role;
                                action_error = "";
                              }}>Change role</button
                            ><button
                              class="text_action"
                              on:click={() => {
                                offboard_member = member;
                                action_error = "";
                              }}>Mark as past</button
                            >{:else}<span class="work_note">No access</span>{/if}
                        </div></td
                      ></tr
                    >{/each}</tbody
                >
              </table>
            </div>{:else}<Empty
              title="You’re all caught up."
              text="No people in this view."
            />{/if}
          <p class="work_note">
            People join by adding this company to the career timeline on their
            profile; you approve them here. Approved members can be made HR or
            admins. Every admin has the same rights.
          </p>
          <button
            class="button button_outline button_small"
            on:click={() => ((leaving = true), (action_error = ""))}
            >Leave this company</button
          >
        </section>
      {:else if section === "wallet"}
        <div class="stat_grid">
          {#each [[inr(wallet), "Wallet balance"], [inr(spent), "Spent this month"], [inr(allocated), "Remaining allocations"], [inr(Math.max(0, wallet - allocated)), "Unallocated balance"]] as [value, label], i}<div
              class="stat_card"
              class:featured={i === 0}
            >
              <span>{label}</span><strong>{value}</strong><small
                >INR · Sample balance</small
              >
            </div>{/each}
        </div>
        <div class="workspace_stack">
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>Your company wallet</h2>
              <button
                class="button button_dark"
                on:click={() => {
                  topup = true;
                  payment_review = false;
                }}>Top up wallet +</button
              >
            </div>
            <p class="workspace_hint warning">
              Deposited funds are non-refundable and cannot be withdrawn or
              transferred out. Payments are not connected in this preview.
            </p>
          </section>
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>Transaction history</h2>
              <button
                class="button button_outline button_small"
                on:click={export_ledger}>Export CSV ↓</button
              >
            </div>
            <div class="workspace_table_wrap">
              <table class="workspace_table">
                <thead
                  ><tr
                    ><th>Date / reference</th><th>Activity</th><th
                      >Performed by</th
                    ><th>Amount (INR)</th></tr
                  ></thead
                ><tbody
                  >{#each ledger as t}<tr
                      ><td data-label="Date / reference"
                        ><div class="table_cell_value">
                          {t.date}<small>{t.reference}</small>
                        </div></td
                      ><td data-label="Activity"
                        ><div class="table_cell_value">{t.type}</div></td
                      ><td data-label="Performed by"
                        ><div class="table_cell_value">{t.by}</div></td
                      ><td data-label="Amount (INR)"
                        ><div class="table_cell_value">
                          {t.amount > 0 ? "+" : ""}{inr(t.amount)}
                        </div></td
                      ></tr
                    >{/each}</tbody
                >
              </table>
            </div>
          </section>
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>Recruiter spending limits</h2>
              <a href={`${base}/employees`}>Manage team ↗</a>
            </div>
            <div class="workspace_list">
              {#each current.filter((m) => m.role === "HR / Recruiter") as member}<div
                >
                  <span class="person_initials">{initials(member.name)}</span>
                  <div class="list_body">
                    <strong>{member.name}</strong>
                    <p>
                      {inr(member.spent)} of {inr(member.limit)} · {member.cap_type}
                    </p>
                    <div class="budget_meter">
                      <span
                        style:width={`${member.limit ? Math.min(100, (member.spent / member.limit) * 100) : 0}%`}
                      ></span>
                    </div>
                  </div>
                  <button
                    class="button button_outline button_small"
                    on:click={() =>
                      toast("Spending limits arrive with company payments.")}
                    >Modify limit</button
                  >
                </div>{/each}
            </div>
          </section>
        </div>
      {:else if section === "analytics"}
        <div class="workspace_toolbar">
          <span>Company engagement</span><select
            aria-label="Analytics period"
            bind:value={date_range}
            ><option value="7">Last 7 days</option><option value="30"
              >Last 30 days</option
            ></select
          ><button
            class="button button_outline"
            on:click={() =>
              download_csv(
                "company-preview-analytics.csv",
                ["Period", "Views", "Applications"],
                [
                  [
                    "Sample " + date_range + " days",
                    date_range === "7" ? 482 : 1840,
                    date_range === "7" ? 36 : 128,
                  ],
                ],
              )}>Export summary ↓</button
          >
        </div>
        <div class="stat_grid">
          {#each [[date_range === "7" ? "482" : "1,840", "Company views"], [date_range === "7" ? "186" : "723", "Job views"], [date_range === "7" ? "36" : "128", "Applications"], [date_range === "7" ? "18" : "65", "New followers"]] as [value, label]}<div
              class="stat_card"
            >
              <span>{label}</span><strong>{value}</strong><small
                >Illustrative activity</small
              >
            </div>{/each}
        </div>
        <section class="workspace_panel">
          <div class="panel_heading">
            <h2>A week of new possibilities.</h2>
            <span class="workspace_badge neutral">Sample company views</span>
          </div>
          <div
            class="workspace_chart"
            role="img"
            aria-label="Sample company views: Monday 48, Tuesday 62, Wednesday 51, Thursday 89, Friday 104, Saturday 72, Sunday 56"
          >
            {#each [["Mon", 48], ["Tue", 62], ["Wed", 51], ["Thu", 89], ["Fri", 104], ["Sat", 72], ["Sun", 56]] as [day, value]}<div
              >
                <strong>{value}</strong><i
                  style:height={`${(value / 110) * 140}px`}
                ></i><span>{day}</span>
              </div>{/each}
          </div>
          <p class="work_note">
            Chart shows a sample week. Period cards illustrate the selected
            reporting range.
          </p>
        </section>
      {:else if section === "hierarchy"}<section class="workspace_panel">
          <div class="panel_heading">
            <h2>People make the difference.</h2>
            <span class="workspace_badge neutral">Organisational view</span>
          </div>
          <p>
            Departments group the workforce. Company admins share equal platform
            permissions.
          </p>
          <div class="org_tree">
            <div class="org_root">
              <h3>{company.name}</h3>
              <p>{current.length} current team members</p>
              <span class="workspace_badge">{admins.length} company admins</span
              >
            </div>
            <div class="org_branches">
              {#each [...new Set(current.map((m) => m.department))] as department}<div
                >
                  <h3>{department}</h3>
                  {#each current.filter((m) => m.department === department) as member}<p
                    >
                      <strong>{member.name}</strong><br />{member.title}
                    </p>{:else}<p>No linked members yet</p>{/each}
                </div>{/each}
            </div>
          </div>
          <p class="workspace_hint">
            Reporting lines have not been specified in the requirements. This
            view groups approved team members by department without introducing
            extra admin levels.
          </p>
        </section>{/if}
    </div>
  </div>
</main>
{#if editing_member}<Modal
    title={`Change ${editing_member.name || editing_member.email}’s access`}
    on:close={() => (editing_member = null)}
    ><form class="workspace_form" on:submit|preventDefault={save_role}>
      <label class="field_label"
        >Access role<select class="field_input" bind:value={role}
          >{#each Object.entries(role_labels) as [value, label]}<option {value}
              >{label}</option
            >{/each}</select
        ></label
      >
      <p class="form_helper">
        HR / recruiters post jobs and review applicants. Admins manage the page,
        the team and (soon) the wallet. A company always keeps at least one admin.
      </p>
      {#if action_error}<p role="alert" class="filter_error">{action_error}</p>{/if}
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (editing_member = null)}>Cancel</button
        ><button class="button button_dark">Save</button>
      </div>
    </form></Modal
  >{/if}
{#if offboard_member}<Modal
    title="Move to past employees?"
    on:close={() => (offboard_member = null)}
    ><p>
      {offboard_member.name || offboard_member.email} will lose access to post
      jobs for {company.name}.
    </p>
    {#if action_error}<p class="filter_error" role="alert">{action_error}</p>{/if}
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (offboard_member = null)}
        >Keep member</button
      ><button class="button button_dark" on:click={confirm_offboard}>Confirm</button>
    </div></Modal
  >{/if}
{#if leaving}<Modal title="Leave this company?" on:close={() => (leaving = false)}
    ><p>You will lose access to {company.name}’s workspace.</p>
    {#if action_error}<p class="filter_error" role="alert">{action_error}</p>{/if}
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (leaving = false)}>Stay</button
      ><button class="button button_dark" on:click={leave}>Leave company</button>
    </div></Modal
  >{/if}
{#if topup}<Modal title="Top up company wallet" on:close={() => (topup = false)}
    >{#if payment_review}<div class="workspace_hint">
        <h3>{inr(amount)} top-up review</h3>
        <p>
          The payment gateway will open here when connected. No payment has been
          taken and the sample balance has not changed.
        </p>
      </div>
      <div class="form_actions">
        <button class="button button_dark" on:click={() => (topup = false)}
          >Back to wallet</button
        >
      </div>{:else}<form
        class="workspace_form"
        on:submit|preventDefault={() => (payment_review = true)}
      >
        <label class="field_label"
          >Amount (INR)<input
            class="field_input"
            type="number"
            required
            min="1"
            max="10000000"
            step="1"
            bind:value={amount}
          /></label
        >
        <p class="workspace_hint warning">
          Wallet deposits are non-refundable. Funds cannot be withdrawn or
          transferred.
        </p>
        <button class="button button_dark">Review top-up</button>
      </form>{/if}</Modal
  >{/if}
