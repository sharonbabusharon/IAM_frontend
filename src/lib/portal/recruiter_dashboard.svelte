<script>
  import { keep_active_visible } from "$lib/portal/keep_active_visible.js";
  import { page } from "$app/stores";
  import {
    recruitment_jobs,
    candidate_records,
    company_records,
    inr,
    initials,
    download_csv,
  } from "./workspace_state.js";
  import Heading from "./page_heading.svelte";
  import Notice from "./preview_notice.svelte";
  import Empty from "./empty_state.svelte";
  import Icon from "./icon.svelte";
  import Modal from "./modal.svelte";
  import { toast } from "./state.js";
  import { onMount as on_mount } from "svelte";
  import { jobs_api } from "./jobs_api.js";
  export let section = "overview";
  // Live: your posted jobs (last 60 days) and saved drafts.
  let live_jobs = [];
  let drafts = [];
  let jobs_error = "";
  const capital = (s) => s[0].toUpperCase() + s.slice(1);
  async function load_jobs() {
    const [mine, saved] = await Promise.all([jobs_api.mine(), jobs_api.drafts()]);
    jobs_error = mine.ok ? "" : mine.status === 401 ? "Sign in to see your jobs." : mine.error;
    live_jobs = mine.ok ? mine.data.map((j) => ({ ...j, status: capital(j.status) })) : [];
    drafts = saved.ok
      ? saved.data.map((d) => ({ id: d.id, draft: true, title: d.form.title || "Untitled draft", tier: d.form.tier || "Free",
          company_name: d.form.company_name || "", status: "Draft", applications: 0, views: 0 }))
      : [];
  }
  on_mount(load_jobs);
  let status = $page.url.searchParams.get("status") || "All";
  let query = "";
  let stage = "All";
  let selected_job = $page.url.searchParams.get("job") || "";
  let candidate = null;
  let closing = null;
  $: listed = [...drafts, ...live_jobs].filter(
    (j) =>
      (status === "All" || j.status === status) &&
      j.title.toLowerCase().includes(query.toLowerCase()),
  );
  $: applicants = $candidate_records.filter(
    (c) =>
      (stage === "All" || c.stage === stage) &&
      (!selected_job || c.job_id === selected_job) &&
      `${c.name} ${c.title} ${c.skills.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function set_stage(id, next) {
    candidate_records.update((items) =>
      items.map((c) => (c.id === id ? { ...c, stage: next } : c)),
    );
    toast("Candidate stage updated in this preview. No message sent.");
  }
  async function close_job() {
    const result = await jobs_api.close(closing.id);
    closing = null;
    if (!result.ok) return toast(result.error);
    toast("Applications closed.");
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
  /><Notice />
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
      ><span>COMPANY</span><a href="/company/forma/dashboard"
        ><Icon name="building" size={17} />Company dashboard</a
      ><a href="/company/forma/dashboard/wallet"
        ><Icon name="money" size={17} />Wallet & allowance</a
      >
    </aside>
    <div class="workspace_main">
      {#if section === "overview"}<div class="stat_grid">
          {#each [[live_jobs.filter((j) => j.status === "Active").length, "Active roles"], [drafts.length, "Drafts"], [$candidate_records.length, "Sample applicants"], [$candidate_records.filter((c) => c.stage === "Interview").length, "At interview"]] as [value, label], i}<div
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
              {#each $candidate_records.slice(0, 3) as person}<div>
                  <span class="person_initials">{initials(person.name)}</span>
                  <div class="list_body">
                    <strong>{person.name}</strong>
                    <p>
                      {person.title} · {person.experience} years · {person.location}
                    </p>
                  </div>
                  <span class="workspace_badge">{person.stage}</span><button
                    class="button button_outline button_small"
                    on:click={() => (candidate = person)}>Review</button
                  >
                </div>{/each}
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
            >{#each ["All", "Active", "Draft", "Closed", "Expired"] as value}<option
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
            placeholder="Name, role or skill"
            bind:value={query}
          /><select aria-label="Filter by job" bind:value={selected_job}
            ><option value="">All jobs</option
            >{#each $recruitment_jobs as job}<option value={job.id}
                >{job.title}</option
              >{/each}</select
          ><select aria-label="Application stage" bind:value={stage}
            >{#each ["All", "New", "Reviewing", "Interview", "Offer", "Hired", "Rejected"] as value}<option
                >{value}</option
              >{/each}</select
          ><button
            class="button button_outline"
            on:click={() =>
              download_csv(
                "sample-applicants.csv",
                ["Name", "Role", "Location", "Experience", "Notice", "Stage"],
                applicants.map((c) => [
                  c.name,
                  c.title,
                  c.location,
                  c.experience,
                  c.notice,
                  c.stage,
                ]),
              )}>Export CSV ↓</button
          >
        </div>
        <section class="workspace_panel">
          <div class="panel_heading">
            <h2>{applicants.length} people to get to know</h2>
            <span class="workspace_badge neutral">Sample applications</span>
          </div>
          {#if applicants.length}<div class="workspace_table_wrap">
              <table class="workspace_table">
                <thead
                  ><tr
                    ><th>Candidate</th><th>Experience / location</th><th
                      >Expected salary</th
                    ><th>Notice</th><th>Stage</th><th></th></tr
                  ></thead
                ><tbody
                  >{#each applicants as person}<tr
                      ><td data-label="Candidate"
                        ><div class="table_cell_value">
                          <div class="person_line">
                            <span class="person_initials"
                              >{initials(person.name)}</span
                            >
                            <div>
                              <strong>{person.name}</strong><small
                                >{person.title}</small
                              >
                            </div>
                          </div>
                        </div></td
                      ><td data-label="Experience / location"
                        ><div class="table_cell_value">
                          {person.experience} years<small
                            >{person.location}</small
                          >
                        </div></td
                      ><td data-label="Expected salary"
                        ><div class="table_cell_value">
                          {inr(person.expected)}<small>per year</small>
                        </div></td
                      ><td data-label="Notice"
                        ><div class="table_cell_value">{person.notice}</div></td
                      ><td data-label="Stage"
                        ><div class="table_cell_value">
                          <select
                            aria-label={`Stage for ${person.name}`}
                            value={person.stage}
                            on:change={(e) =>
                              set_stage(person.id, e.currentTarget.value)}
                            >{#each ["New", "Reviewing", "Interview", "Offer", "Hired", "Rejected"] as value}<option
                                >{value}</option
                              >{/each}</select
                          >
                        </div></td
                      ><td data-label="Actions"
                        ><div class="table_cell_value">
                          <button
                            class="text_action"
                            on:click={() => (candidate = person)}
                            >View dossier ↗</button
                          >
                        </div></td
                      ></tr
                    >{/each}</tbody
                >
              </table>
            </div>{:else}<Empty
              title="No applications in this view."
              text="Try another role, stage or search term."
            />{/if}
        </section>{/if}
    </div>
  </div>
</main>
{#if candidate}<Modal
    title={candidate.name}
    wide
    on:close={() => (candidate = null)}
    ><p class="workspace_preview">
      Sample candidate dossier · No real candidate data
    </p>
    <div class="workspace_grid">
      <div class="candidate_dossier">
        <h3>{candidate.title}</h3>
        <p>{candidate.location} · {candidate.experience} years of experience</p>
        <div class="filter_chips">
          {#each candidate.skills as skill}<span class="workspace_badge"
              >{skill}</span
            >{/each}
        </div>
        <h3 class="dossier_about">About</h3>
        <p>
          A sample profile for reviewing the applicant experience. Portfolio,
          verified career history and attached résumé will be supplied by the
          application API.
        </p>
        <div class="workspace_hint">
          Résumé access is limited to applications submitted to your jobs. This
          sample record has no attached file.
        </div>
      </div>
      <dl class="facts_list">
        <div>
          <dt>Applied</dt>
          <dd>{candidate.applied}</dd>
        </div>
        <div>
          <dt>Notice</dt>
          <dd>{candidate.notice}</dd>
        </div>
        <div>
          <dt>Expected salary</dt>
          <dd>{inr(candidate.expected)}/year</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{candidate.email}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>
            {$candidate_records.find((c) => c.id === candidate.id)?.stage}
          </dd>
        </div>
      </dl>
    </div>
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (candidate = null)}
        >Close</button
      ><button
        class="button button_dark"
        on:click={() => set_stage(candidate.id, "Reviewing")}
        >Mark as reviewing</button
      >
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
