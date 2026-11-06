<script>
  import { keep_active_visible } from "$lib/portal/keep_active_visible.js";
  import { page } from "$app/stores";
  import { initials, download_csv } from "./workspace_state.js";
  import Heading from "./page_heading.svelte";
  import Notice from "./preview_notice.svelte";
  import Empty from "./empty_state.svelte";
  import Icon from "./icon.svelte";
  import Modal from "./modal.svelte";
  import { toast } from "./state.js";
  import { onMount as on_mount } from "svelte";
  import { jobs_api } from "./jobs_api.js";
  import { pay_for_job } from "./payments.js";
  export let section = "overview";
  // Your first company (admins first, from the layout), as in the header.
  $: company = $page.data.companies?.[0];
  // Live: your posted jobs (last 60 days) and saved drafts.
  let live_jobs = [];
  let drafts = [];
  let jobs_error = "";
  const capital = (s) => s[0].toUpperCase() + s.slice(1);
  async function load_jobs() {
    const [mine, saved] = await Promise.all([jobs_api.mine(), jobs_api.drafts()]);
    jobs_error = mine.ok ? "" : mine.status === 401 ? "Sign in to see your jobs." : mine.error;
    live_jobs = mine.ok
      ? mine.data.map((j) => ({ ...j, status: j.status === "pending_payment" ? "Awaiting payment" : capital(j.status) }))
      : [];
    drafts = saved.ok
      ? saved.data.map((d) => ({ id: d.id, draft: true, title: d.form.title || "Untitled draft", tier: d.form.tier || "Free",
          company_name: d.form.company_name || "", status: "Draft", applications: 0, views: 0 }))
      : [];
  }
  on_mount(load_jobs);
  let status = $page.url.searchParams.get("status") || "All";
  let query = "";
  // Applicants (live): one job at a time, filtered and sorted by the API.
  const stage_labels = { new: "New", shortlisted: "Shortlisted", contacted: "Contacted", rejected: "Rejected" };
  let stage = "";
  let sort = "recent";
  let min_match = 0;
  let applicants = [];
  let applicants_loading = false;
  let applicants_error = "";
  let applicants_seq = 0;
  let selected_job = $page.url.searchParams.get("job") || "";
  let candidate = null;
  let closing = null;
  $: listed = [...drafts, ...live_jobs].filter(
    (j) =>
      (status === "All" || j.status === status) &&
      j.title.toLowerCase().includes(query.toLowerCase()),
  );
  $: if (section === "applicants" && !selected_job && live_jobs.length) selected_job = live_jobs[0].id;
  $: if (section === "applicants" && selected_job) load_applicants(selected_job, stage, sort, min_match);
  async function load_applicants(job, stage, sort, min_match) {
    const seq = ++applicants_seq;
    applicants_loading = true;
    const result = await jobs_api.applicants(job, { stage, sort, min_match });
    if (seq !== applicants_seq) return; // a newer request started meanwhile
    applicants_loading = false;
    applicants_error = result.ok ? "" : result.error;
    applicants = result.ok ? result.data : [];
  }
  $: shown = applicants.filter((a) =>
    `${a.dossier.name} ${a.dossier.location} ${a.dossier.skills.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  async function set_stage(applicant, next) {
    const result = await jobs_api.set_stage(applicant.id, next);
    if (!result.ok) return toast(result.error);
    applicants = applicants.map((a) => (a.id === applicant.id ? result.data : a));
    if (candidate?.id === applicant.id) candidate = result.data;
    toast(`${applicant.dossier.name} moved to ${stage_labels[next]}.`);
  }
  const money = (d, amount) =>
    amount
      ? new Intl.NumberFormat("en", { style: "currency", currency: d.salary_currency || "INR", maximumFractionDigits: 0 }).format(amount)
      : "—";
  $: total_applications = live_jobs.reduce((n, j) => n + (j.applications || 0), 0);
  async function close_job() {
    const result = await jobs_api.close(closing.id);
    closing = null;
    if (!result.ok) return toast(result.error);
    toast("Applications closed.");
    load_jobs();
  }
  // An out-of-pocket post whose fee wasn't paid yet: pay now (a new order).
  let paying = "";
  async function pay(job) {
    paying = job.id;
    const { outcome, error } = await pay_for_job(job.id);
    paying = "";
    if (outcome === "published") toast("Payment received. Your job is live.");
    else if (outcome === "pending") toast("Payment received. The job goes live once Razorpay confirms it.");
    else if (error) toast(error);
    load_jobs();
  }
  async function repost(job) {
    const result = await jobs_api.repost(job.id);
    if (!result.ok) return toast(result.error);
    toast("Reposted for another 30 days.");
    load_jobs();
  }
</script>

<svelte:head
  ><title
    >{section === "jobs"
      ? "Manage jobs"
      : section === "applicants"
        ? "Applicants"
        : "Hiring workspace"} — Referise</title
  ></svelte:head
>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="YOUR HIRING WORKSPACE"
    title={section === "applicants"
      ? "Potential,"
      : section === "jobs"
        ? "Every role."
        : "Find the people."}
    accent={section === "applicants"
      ? "meet possibility."
      : section === "jobs"
        ? "One clear view."
        : "Build something good."}
    description={section === "applicants"
      ? "Review the skills and experience behind every application."
      : section === "jobs"
        ? "Pick up a draft, follow an opening or bring a search to a close."
        : "Keep your roles, applications and next steps moving together."}
  /><Notice text="Jobs and applicants are live. Company wallet links are still a preview." />
  <div class="workspace_shell">
    <aside class="workspace_sidenav" use:keep_active_visible={section}>
      <span>HIRING</span
      >{#each [["overview", "Overview", "/recruiter", "grid"], ["jobs", "Manage jobs", "/recruiter/jobs", "briefcase"], ["applicants", "Applicants", "/recruiter/applicants", "users"]] as [key, label, href, icon]}<a
          {href}
          class:active={section === key}
          aria-current={section === key ? "page" : undefined}
          ><Icon name={icon} size={17} />{label}</a
        >{/each}<a href="/recruiter/post-job"
        ><Icon name="plus" size={17} />Post a job</a
      ><span>COMPANY</span>{#if company?.role === "admin"}<a href={`/company/${company.slug}/dashboard`}
          ><Icon name="building" size={17} />Company dashboard</a
        ><a href={`/company/${company.slug}/dashboard/wallet`}
          ><Icon name="money" size={17} />Wallet & allowance</a
        >{:else if company}<a href={`/company/${company.slug}`}
          ><Icon name="building" size={17} />My company</a
        >{:else}<a href="/company/create"><Icon name="building" size={17} />Create a company</a>{/if}
    </aside>
    <div class="workspace_main">
      {#if section === "overview"}<div class="stat_grid">
          {#each [[live_jobs.filter((j) => j.status === "Active").length, "Active roles"], [drafts.length, "Drafts"], [total_applications, "Applications"], [live_jobs.reduce((n, j) => n + (j.views || 0), 0), "Job views"]] as [value, label], i}<div
              class="stat_card"
              class:featured={i === 0}
            >
              <span>{label}</span><strong>{value}</strong><small
                >Your hiring snapshot</small
              >
            </div>{/each}
        </div>
        <div class="workspace_stack">
          <section class="workspace_panel">
            <div class="panel_heading">
              <h2>Move a good conversation forward.</h2>
              <a href="/recruiter/applicants">View applicants ↗</a>
            </div>
            <div class="workspace_list candidate_summary_list">
              {#each live_jobs.filter((j) => j.applications).slice(0, 4) as job}<div>
                  <div class="list_body">
                    <strong>{job.title}</strong>
                    <p>{job.applications} {job.applications === 1 ? "application" : "applications"} · {job.status}</p>
                  </div>
                  <a class="button button_outline button_small" href={`/recruiter/applicants?job=${job.id}`}>Review</a>
                </div>{:else}<p>No applications yet. They’ll appear here as candidates apply.</p>{/each}
            </div>
          </section>
          <section class="workspace_panel" style="background:#e6edcf">
            <span class="eyebrow_label">GOOD WORK DESERVES GOOD PEOPLE</span>
            <h2 style="margin-top:14px">
              Your next hire starts with a little clarity.
            </h2>
            <p>
              Share the work, the salary and what the interview journey looks
              like.
            </p>
            <a href="/recruiter/post-job" class="button button_dark"
              >Create a job post +</a
            >
          </section>
        </div>
      {:else if section === "jobs"}<div class="workspace_toolbar">
          <input
            aria-label="Search your jobs"
            placeholder="Search job title"
            bind:value={query}
          /><select aria-label="Job status" bind:value={status}
            >{#each ["All", "Active", "Awaiting payment", "Draft", "Closed", "Expired"] as value}<option
                >{value}</option
              >{/each}</select
          ><a class="button button_dark" href="/recruiter/post-job"
            >Post a job +</a
          >
        </div>
        {#if jobs_error}<p class="workspace_hint warning">{jobs_error}</p>{/if}
        <section class="workspace_panel">
          <div class="panel_heading">
            <h2>Your job posts</h2>
            <span class="workspace_badge neutral">{listed.length} roles</span>
          </div>
          {#if listed.length}<div class="workspace_table_wrap">
              <table class="workspace_table">
                <thead
                  ><tr
                    ><th>Role</th><th>Status</th><th>Applications</th><th
                      >Views</th
                    ><th>Actions</th></tr
                  ></thead
                ><tbody
                  >{#each listed as job}<tr
                      ><td data-label="Role"
                        ><div class="table_cell_value">
                          <strong>{job.title || "Untitled draft"}</strong><small
                            >{job.tier === "Premium" ? "Paid" : job.tier} · {job.company_name ||
                              "Confidential"}</small
                          >
                        </div></td
                      ><td data-label="Status"
                        ><div class="table_cell_value">
                          <span
                            class="workspace_badge"
                            class:neutral={job.status !== "Active"}
                            >{job.status}</span
                          >
                        </div></td
                      ><td data-label="Applications"
                        ><div class="table_cell_value">
                          <a href={`/recruiter/applicants?job=${job.id}`}
                            >{job.applications || 0} ↗</a
                          >
                        </div></td
                      ><td data-label="Views"
                        ><div class="table_cell_value">
                          {job.views || 0}
                        </div></td
                      ><td data-label="Actions"
                        ><div class="table_cell_value">
                          <a
                            class="text_action"
                            href={job.draft
                              ? `/recruiter/post-job?draft=${job.id}`
                              : `/recruiter/post-job?edit=${job.id}`}
                            >{job.draft ? "Continue" : "Edit"}</a
                          >{#if !job.draft}<a href={`/jobs/${job.id}`}>View</a>{/if}{#if job.status === "Active"}<button
                              class="text_action"
                              on:click={() => (closing = job)}>Close</button
                            >{:else if job.status === "Awaiting payment"}<button
                              class="text_action"
                              disabled={paying === job.id}
                              on:click={() => pay(job)}>{paying === job.id ? "Paying…" : "Pay to publish"}</button
                            >{:else if !job.draft}<button
                              class="text_action"
                              on:click={() => repost(job)}>Repost</button
                            >{/if}
                        </div></td
                      ></tr
                    >{/each}</tbody
                >
              </table>
            </div>{:else}<Empty
              title="Make room for your next hire."
              text="No posts match this view."
              ><a class="button button_dark" href="/recruiter/post-job"
                >Create a job</a
              ></Empty
            >{/if}
        </section>
      {:else}<div class="workspace_toolbar">
          <input
            aria-label="Search applicants"
            placeholder="Name, location or skill"
            bind:value={query}
          /><select aria-label="Job" bind:value={selected_job}
            >{#each live_jobs as job}<option value={job.id}>{job.title}</option
              >{:else}<option value="">No posted jobs</option>{/each}</select
          ><select aria-label="Application stage" bind:value={stage}
            ><option value="">All stages</option
            >{#each Object.entries(stage_labels) as [value, label]}<option {value}>{label}</option
              >{/each}</select
          ><select aria-label="Minimum skill match" bind:value={min_match}
            >{#each [[0, "Any match"], [50, "50%+ match"], [70, "70%+ match"]] as [value, label]}<option {value}
                >{label}</option
              >{/each}</select
          ><select aria-label="Sort applicants" bind:value={sort}
            ><option value="recent">Most recent</option><option value="match">Highest match</option></select
          ><button
            class="button button_outline"
            disabled={!shown.length}
            on:click={() =>
              download_csv(
                "applicants.csv",
                ["Name", "Email", "Phone", "Location", "Experience", "Notice", "Expected salary", "Match %", "Stage", "Applied"],
                shown.map((a) => [
                  a.dossier.name,
                  a.dossier.email,
                  a.dossier.phone,
                  a.dossier.location,
                  a.dossier.experience_years,
                  a.dossier.notice,
                  money(a.dossier, a.dossier.expected_salary),
                  a.match_pct,
                  stage_labels[a.stage],
                  a.submitted_at.slice(0, 10),
                ]),
              )}>Export CSV ↓</button
          >
        </div>
        {#if applicants_error}<p class="workspace_hint warning">{applicants_error}</p>{/if}
        <section class="workspace_panel">
          <div class="panel_heading">
            <h2>{shown.length} {shown.length === 1 ? "person" : "people"} to get to know</h2>
            {#if applicants_loading}<span class="workspace_badge neutral">Loading…</span>{/if}
          </div>
          {#if shown.length}<div class="workspace_table_wrap">
              <table class="workspace_table">
                <thead
                  ><tr
                    ><th>Candidate</th><th>Experience / location</th><th>Expected salary</th><th>Notice</th><th
                      >Stage</th
                    ><th></th></tr
                  ></thead
                ><tbody
                  >{#each shown as person (person.id)}<tr
                      ><td data-label="Candidate"
                        ><div class="table_cell_value">
                          <div class="person_line">
                            <span class="person_initials">{initials(person.dossier.name)}</span>
                            <div>
                              <strong>{person.dossier.name}</strong><small
                                >{person.match_pct}% skill match{person.match_pct >= 70 ? " · high fit" : ""}</small
                              >
                            </div>
                          </div>
                        </div></td
                      ><td data-label="Experience / location"
                        ><div class="table_cell_value">
                          {person.dossier.experience_years} years<small>{person.dossier.location || "—"}</small>
                        </div></td
                      ><td data-label="Expected salary"
                        ><div class="table_cell_value">
                          {money(person.dossier, person.dossier.expected_salary)}<small>per year</small>
                        </div></td
                      ><td data-label="Notice"
                        ><div class="table_cell_value">{person.dossier.notice || "—"}</div></td
                      ><td data-label="Stage"
                        ><div class="table_cell_value">
                          <select
                            aria-label={`Stage for ${person.dossier.name}`}
                            value={person.stage}
                            on:change={(e) => set_stage(person, e.currentTarget.value)}
                            >{#each Object.entries(stage_labels) as [value, label]}<option {value}>{label}</option
                              >{/each}</select
                          >
                        </div></td
                      ><td data-label="Actions"
                        ><div class="table_cell_value">
                          <button class="text_action" on:click={() => (candidate = person)}>View dossier ↗</button>
                        </div></td
                      ></tr
                    >{/each}</tbody
                >
              </table>
            </div>{:else if !applicants_loading}<Empty
              title={live_jobs.length ? "No applications in this view." : "Post a job to start receiving applications."}
              text={live_jobs.length
                ? "Try another role, stage or match. Applications made on an employer’s own site aren’t listed here."
                : "Easy Apply applications will appear here."}
            />{/if}
        </section>{/if}
    </div>
  </div>
</main>
{#if candidate}<Modal title={candidate.dossier.name} wide on:close={() => (candidate = null)}
    ><div class="workspace_grid">
      <div class="candidate_dossier">
        <h3>{candidate.match_pct}% skill match</h3>
        <p>
          {candidate.dossier.location || "Location not shared"} · {candidate.dossier.experience_years} years of experience
        </p>
        {#if candidate.matched_skills.length}<h3 class="dossier_about">Has the skills you asked for</h3>
          <div class="matching_skills expanded">
            {#each candidate.matched_skills as skill}<span class="matched">{skill}</span>{/each}
          </div>{/if}
        {#if candidate.unmatched_skills.length}<h3 class="dossier_about">Missing</h3>
          <div class="matching_skills expanded">
            {#each candidate.unmatched_skills as skill}<span class="missing">{skill}</span>{/each}
          </div>{/if}
        {#if candidate.dossier.skills.length}<h3 class="dossier_about">All skills</h3>
          <div class="filter_chips">
            {#each candidate.dossier.skills as skill}<span class="workspace_badge">{skill}</span>{/each}
          </div>{/if}
        {#if candidate.has_resume}<p class="dossier_about">
            <a class="text_action" href={`/recruiter/applications/${candidate.id}/resume`} target="_blank"
              rel="noopener noreferrer">View résumé ↗</a
            > · <a class="text_action" href={`/recruiter/applications/${candidate.id}/resume?mode=download`}
              >Download</a
            >
          </p>{/if}
        <div class="workspace_hint">
          A snapshot of the candidate’s profile when they applied.{candidate.has_resume
            ? " The résumé is their current one."
            : " No résumé uploaded."}
        </div>
      </div>
      <dl class="facts_list">
        {#each [["Applied", new Date(candidate.submitted_at).toLocaleDateString("en-IN", { dateStyle: "medium" })], ["Email", candidate.dossier.email || "—"], ["Phone", candidate.dossier.phone || "—"], ["Notice", candidate.dossier.notice || "—"], ["Expected salary", money(candidate.dossier, candidate.dossier.expected_salary) + " / year"], ["Current salary", candidate.dossier.current_salary == null ? "Kept private" : money(candidate.dossier, candidate.dossier.current_salary) + " / year"], ["Stage", stage_labels[candidate.stage]]] as [label, value]}<div>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>{/each}
      </dl>
    </div>
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (candidate = null)}>Close</button
      >{#each ["shortlisted", "contacted", "rejected"].filter((s) => s !== candidate.stage) as next}<button
          class={next === "rejected" ? "button button_outline" : "button button_dark"}
          on:click={() => set_stage(candidate, next)}
          >{next === "shortlisted" ? "Shortlist" : next === "contacted" ? "Mark contacted" : "Reject"}</button
        >{/each}
    </div></Modal
  >{/if}
{#if closing}<Modal title="Close this job?" on:close={() => (closing = null)}
    ><p>
      {closing.title} will stop accepting applications and leave search. You
      can repost it later for another 30 days.
    </p>
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (closing = null)}
        >Keep open</button
      ><button class="button button_dark" on:click={close_job}
        >Close job</button
      >
    </div></Modal
  >{/if}
