<script>
  import Heading from "$lib/portal/page_heading.svelte";
  import Empty from "$lib/portal/empty_state.svelte";
  import Modal from "$lib/portal/modal.svelte";
  export let data;
  let detail = null;
  // How each stage reads to the candidate (the hiring team's word in brackets).
  const stages = {
    new: ["Submitted", "neutral", "The hiring team hasn’t reviewed it yet."],
    shortlisted: ["Shortlisted", "green", "You’re on the shortlist. The team may get in touch."],
    contacted: ["Contacted", "green", "The hiring team has reached out. Check your email and phone."],
    rejected: ["Not moving forward", "neutral", "The team decided not to move forward this time."],
  };
  const status_note = { closed: "Role closed", expired: "Listing expired" };
  $: list = data.applications;
  const date = (iso) => new Date(iso).toLocaleDateString("en-IN", { dateStyle: "medium" });
</script>

<svelte:head><title>Your applications — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="EVERY NEXT STEP, IN ONE PLACE"
    title="You made"
    accent="the first move."
    description="Keep track of the roles you’ve applied for and what happens next."
  />
  {#if list.length}<section class="workspace_panel">
      <div class="panel_heading">
        <h2>Your applications</h2>
        <span class="workspace_badge">{list.length} {list.length === 1 ? "application" : "applications"}</span>
      </div>
      <div class="workspace_list">
        {#each list as a (a.id)}<div>
            <div class="list_body">
              <strong><a href={`/jobs/${a.job_id}`}>{a.job_title}</a></strong>
              <p>
                {a.company_name || "Confidential"} · Applied {date(a.submitted_at)}{#if a.match_pct != null}
                  · {a.match_pct}% skill match{/if}{#if status_note[a.job_status]} · {status_note[a.job_status]}{/if}
              </p>
            </div>
            {#if a.apply_type === "external"}<span class="workspace_badge neutral">On employer’s site</span
              >{:else}<span class={`workspace_badge ${stages[a.stage][1]}`}>{stages[a.stage][0]}</span
              >{/if}<button class="button button_outline button_small" on:click={() => (detail = a)}
              >View status</button
            >
          </div>{/each}
      </div>
    </section>{:else}<Empty
      title="Your next move starts here."
      text="Once you apply to a role, you can follow its progress from this page."
      ><a class="button button_dark" href="/jobs">Explore opportunities ↗</a></Empty
    >{/if}
</main>
{#if detail}<Modal title="Your application journey" on:close={() => (detail = null)}
    ><h3>{detail.job_title}</h3>
    <div class="workspace_list">
      <div>
        <span class="workspace_badge green">01</span>
        <div>
          <strong>Applied on {date(detail.submitted_at)}</strong>
          <p>
            {detail.apply_type === "external"
              ? "You applied on the employer’s own site, so updates come from them directly."
              : "Your profile was shared with the hiring team."}
          </p>
        </div>
      </div>
      {#if detail.apply_type !== "external"}<div>
          <span class={`workspace_badge ${detail.stage === "new" ? "neutral" : "green"}`}>02</span>
          <div>
            <strong>{stages[detail.stage][0]}</strong>
            <p>{stages[detail.stage][2]}</p>
          </div>
        </div>{/if}
    </div></Modal
  >{/if}
