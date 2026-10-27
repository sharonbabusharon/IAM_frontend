<script>
  import { goto, invalidateAll as invalidate_all } from "$app/navigation";
  import { page } from "$app/stores";
  import Icon from "$lib/portal/icon.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import { saved_jobs, toggle_saved, toast, viewing_currency } from "$lib/portal/state";
  import { converted_salary } from "$lib/portal/currency.js";
  import { rates, location_label, currency_options } from "$lib/portal/reference.js";
  import { render_markdown } from "$lib/portal/markdown.js";
  import { jobs_api, to_card } from "$lib/portal/jobs_api.js";
  import { image_url } from "$lib/portal/companies_api.js";
  export let data;
  $: job = to_card(data.job, $location_label);
  $: company = data.job.company; // linked paid jobs only (manual: none for free/unlinked)
  $: company_name = company?.name || data.job.company_name || "Confidential";
  $: open = data.job.status === "active";
  $: applied_at = data.job.applied_at ? new Date(data.job.applied_at) : null;
  $: places = data.job.location_ids.map($location_label);
  $: share_url = data.job.share_hash
    ? `${$page.url.origin}/jobs/share/${data.job.share_hash}`
    : `${$page.url.origin}/jobs/${job.id}`;
  let report_dialog = false;
  let report_reason = "Information is inaccurate";
  let report_note = "";
  let busy = false;
  async function share() {
    // Manual: native share sheet where available, otherwise copy the link.
    if (navigator.share) {
      try {
        await navigator.share({ title: job.title, url: share_url });
        return;
      } catch {
        /* cancelled: fall back to copying */
      }
    }
    try {
      await navigator.clipboard.writeText(share_url);
      toast("Job link copied.");
    } catch {
      toast(share_url);
    }
  }
  async function apply_external() {
    window.open(data.job.external_url, "_blank", "noopener");
    jobs_api.outbound(job.id); // referral tracking; the page opens regardless
  }
  async function manage(action) {
    busy = true;
    const result = await jobs_api[action](job.id);
    busy = false;
    if (!result.ok) return toast(result.error);
    toast(action === "close" ? "Applications closed." : "Reposted for another 30 days.");
    invalidate_all();
  }
  function submit_report() {
    report_dialog = false;
    toast("Feedback captured for this preview. No report was sent.");
  }
</script>

<svelte:head
  ><title>{job.title} at {company_name} — Referise</title><meta
    name="description"
    content={`${job.title} at ${company_name}. ${converted_salary(job, "", $rates)}. ${job.mode}.`}
  />{#if job.unlisted}<meta name="robots" content="noindex" />{/if}</svelte:head
>
<main id="main-content" class="detail_page">
  <div class="portal_container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/jobs"><Icon name="arrow-left" size={14} />All opportunities</a
      ><span>/</span><span>{job.title}</span>
    </nav>
  </div>
  <section class="detail_hero">
    <div class="detail_arch_art" aria-hidden="true"><span></span><i>✳</i></div>
    <div class="portal_container">
      <div class="detail_company_line">
        <div class="company_identity">
          <Company_logo id={company?.slug ?? ""} src={image_url(company?.logo_url)} size={52} />
          <div>
            <span class="detail_company_name"
              >{company_name}{#if company}<span class="verified_company"
                  ><Icon name="shield" size={13} />Posted by an approved member</span
                >{/if}</span
            >{#if company}<span class="job_posted">{company.tagline} · {company.size}</span>{/if}
          </div>
        </div>
        <div class="detail_actions">
          <button
            class="button button_outline button_small"
            class:saved={$saved_jobs.includes(job.id)}
            on:click={() => toggle_saved(job.id)}
            aria-pressed={$saved_jobs.includes(job.id)}
            ><Icon name="bookmark" size={15} />{$saved_jobs.includes(job.id)
              ? "Saved"
              : "Save role"}</button
          ><button class="icon_button" aria-label="Share this opportunity" on:click={share}
            ><Icon name="share" size={18} /></button
          >
        </div>
      </div>
      <div class="detail_title_line">
        <div>
          <h1>{job.title}<span>.</span></h1>
          {#if data.job.recruiter}<p>Posted by {data.job.recruiter.name}</p>{/if}
        </div>
        <span class="detail_tier"
          >{job.unlisted ? "Direct-link listing" : "Premium listing"} <Icon name="spark" size={12} /></span
        >
      </div>
      <div class="detail_location">
        <span><Icon name="location" size={15} />{job.location}</span><span
          class="green_dot_label"
          ><span></span>{open ? "Actively hiring" : data.job.status === "expired" ? "Listing expired" : "Applications closed"}</span
        ><span
          >Posted {job.posted === 0
            ? "today"
            : `${job.posted} ${job.posted === 1 ? "day" : "days"} ago`}</span
        >
      </div>
      <div class="job_facts_strip">
        <div>
          <Icon name="money" size={20} /><span
            >COMPENSATION<strong>{converted_salary(job, $viewing_currency, $rates)}</strong></span
          >
        </div>
        <div>
          <Icon name="laptop" size={20} /><span>WORK ARRANGEMENT<strong>{job.mode}</strong></span>
        </div>
        <div>
          <Icon name="briefcase" size={20} /><span>EMPLOYMENT TYPE<strong>{job.type}</strong></span>
        </div>
        <div>
          <Icon name="chart" size={20} /><span
            >EXPERIENCE REQUIRED<strong>{job.experience_years}+ years</strong></span
          >
        </div>
      </div>
    </div>
  </section>
  <div class="portal_container detail_grid">
    <article class="job_description">
      <section id="overview" class="description_section">
        <span class="eyebrow_label">A LITTLE ABOUT THE ROLE</span>
        <!-- render_markdown escapes all HTML before formatting -->
        <div>{@html render_markdown(data.job.description)}</div>
        <dl class="requirement_facts">
          <div>
            <dt>Notice periods accepted</dt>
            <dd>{job.notice_periods.join(" · ") || "Any"}</dd>
          </div>
          <div>
            <dt>Relocation support</dt>
            <dd>{job.relocation}</dd>
          </div>
          <div>
            <dt>Interview rounds</dt>
            <dd>{job.interview_rounds}</dd>
          </div>
          <div>
            <dt>Application method</dt>
            <dd>{job.application}</dd>
          </div>
          <div>
            <dt>Location eligibility</dt>
            <dd>
              {job.location_type === "world_remote"
                ? "Worldwide remote"
                : places.slice(0, 12).join(", ") + (places.length > 12 ? ` and ${places.length - 12} more` : "")}
            </dd>
          </div>
        </dl>
        {#if !job.salary_hidden}<label class="field_label"
            >View salary in<select
              class="field_input"
              style="max-width: 150px"
              bind:value={$viewing_currency}
              >{#each $currency_options as code}<option>{code}</option>{/each}</select
            ><small>Converted with today’s exchange rates.</small></label
          >{/if}
      </section>
      {#if data.job.interview_stages.length}<section id="hiring-process" class="description_section">
          <span class="eyebrow_label">KNOW WHAT COMES NEXT</span>
          <h2>A conversation, step by step.</h2>
          <ol class="hiring_steps">
            {#each data.job.interview_stages as stage, i}<li>
                <span class="step_number">{String(i + 1).padStart(2, "0")}</span>
                <div><h3>{stage}</h3></div>
              </li>{/each}
          </ol>
        </section>{/if}
      <section class="apply_section" id="apply">
        <div>
          <span class="eyebrow_label">SEE YOURSELF HERE?</span>
          <h2>Let’s open that door.</h2>
          <p>Your experience could be the start of something good.</p>
        </div>
        {#if applied_at}<button class="button button_terracotta" disabled
            ><Icon name="check" size={17} />Applied on {applied_at.toLocaleDateString("en-IN")}</button
          >{:else if !open}<button class="button button_terracotta" disabled
            >Applications closed</button
          >{:else if job.application === "External"}<button
            class="button button_terracotta"
            on:click={apply_external}
            ><Icon name="arrow-up-right" size={17} />Apply on the company’s site</button
          >{:else}<button class="button button_terracotta" on:click={() => goto(`/jobs/${job.id}/apply`)}
            ><Icon name="arrow-up-right" size={17} />Apply for this role</button
          >{/if}
      </section>
      <div class="report_row">
        <span>Something doesn’t look right?</span><button on:click={() => (report_dialog = true)}
          >Report this listing <Icon name="arrow-up-right" size={12} /></button
        >
      </div>
    </article>
    <aside class="detail_sidebar">
      {#if data.job.analytics}<section class="hiring_activity_card">
          <div class="activity_heading">
            <Icon name="chart" size={18} />
            <h3>Your listing</h3>
          </div>
          <div class="hiring_metrics">
            <div><strong>{data.job.analytics.views}</strong><span>Views</span></div>
            <div><strong>{data.job.analytics.applications}</strong><span>Applications</span></div>
            {#if job.application === "Easy apply"}<div>
                <strong>{data.job.analytics.high_fit ?? 0}</strong><span>70%+ match</span>
              </div>
              <div>
                <strong>{data.job.analytics.recruiter_actions ?? 0}</strong><span>Recruiter actions</span>
              </div>{:else}<div>
                <strong>{data.job.analytics.outbound_clicks}</strong><span>Apply clicks</span>
              </div>{/if}
          </div>
          <p class="small_text">
            {open ? `${data.job.analytics.expires_in_days} days left in the 30-day listing window.` : "Not visible to candidates."}
          </p>
          <div class="workspace_actions">
            {#if open}<button class="button button_outline button_small" disabled={busy} on:click={() => manage("close")}
                >Close applications</button
              >{:else}<button class="button button_dark button_small" disabled={busy} on:click={() => manage("repost")}
                >Repost for 30 days</button
              >{/if}<a class="button button_outline button_small" href={`/recruiter/post-job?edit=${job.id}`}>Edit</a>
          </div>
          {#if job.unlisted}<p class="small_text">
              Free jobs are unlisted. Share this link: <code>{share_url}</code>
            </p>{/if}
        </section>{/if}
      {#if company}<section class="detail_company_card">
          <div class="sidebar_card_label">MEET YOUR NEXT TEAM</div>
          <Company_logo id={company.slug} src={image_url(company.logo_url)} size={55} />
          <h2>{company.name}</h2>
          <p>{company.tagline}</p>
          <dl>
            <div>
              <dt><Icon name="users" size={15} />Team size</dt>
              <dd>{company.size}</dd>
            </div>
          </dl>
          <a href={`/company/${company.slug}?tab=jobs`} class="button button_outline button_full"
            >More roles at {company.name}<Icon name="arrow-up-right" size={15} /></a
          >
        </section>{:else}<section class="detail_company_card">
          <div class="sidebar_card_label">KEEP EXPLORING</div>
          <h2>Find more opportunities.</h2>
          <p>
            Find more exciting job opportunities on our platform. Sign in or create
            an account to explore roles that fit you.
          </p>
          <a href="/jobs" class="button button_outline button_full"
            >Explore jobs<Icon name="arrow-up-right" size={15} /></a
          >
        </section>{/if}
      <section class="detail_skills_card">
        <span class="eyebrow_label">THE CRAFT YOU’LL BRING</span>
        <div class="skill_chips">
          {#each job.skills as skill}<a href={`/jobs?skill=${encodeURIComponent(skill)}`}>{skill}</a>{/each}
        </div>
      </section>
      <div class="detail_fairness_note">
        <Companion kind="sage" size={90} />
        <p>
          Good work starts with a fair chance.<br /><strong>Your potential belongs here.</strong>
        </p>
      </div>
    </aside>
  </div>
</main>
{#if report_dialog}<Modal title="Help keep things clear." on:close={() => (report_dialog = false)}
    ><form on:submit|preventDefault={submit_report}>
      <p class="modal_description">
        Tell us what needs a closer look. This preview does not submit a report.
      </p>
      <label class="field_label"
        >Reason<select class="field_input" bind:value={report_reason}
          ><option>Information is inaccurate</option><option>Compensation is unclear</option><option
            >The role is no longer available</option
          ><option>Something else</option></select
        ></label
      ><label class="field_label report_note"
        >Anything else we should know?<textarea
          class="field_input"
          bind:value={report_note}
          maxlength="1000"
          rows="3"
          placeholder="Add a little context…"
        ></textarea></label
      >
      <div class="form_actions">
        <button class="button button_dark" type="submit"
          >Preview feedback <Icon name="arrow-right" size={15} /></button
        >
      </div>
    </form></Modal
  >{/if}
