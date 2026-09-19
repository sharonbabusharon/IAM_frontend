<script>
  import Icon from "$lib/portal/icon.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import { get_company, salary, jobs, posted } from "$lib/portal/data";
  import {
    saved_jobs,
    toggle_saved,
    profile,
    applications,
    toast,
  } from "$lib/portal/state";
  export let data;
  $: job = data.job;
  $: company = get_company(job.company);
  $: related = [
    ...jobs.filter(
      (item) => item.id !== job.id && item.category === job.category,
    ),
    ...jobs.filter(
      (item) => item.id !== job.id && item.category !== job.category,
    ),
  ].slice(0, 2);
  let apply_dialog = false;
  let application_complete = false;
  let application_name = "";
  let application_email = "";
  let application_note = "";
  let consent = false;
  let share_dialog = false;
  let share_url = "";
  let report_dialog = false;
  let report_reason = "Information is inaccurate";
  let report_note = "";
  let active_section = "overview";
  function start_apply() {
    application_name = $profile.name;
    application_email = $profile.email;
    application_note = "";
    consent = false;
    application_complete = false;
    apply_dialog = true;
  }
  function apply() {
    if (!consent) return;
    applications.update((value) =>
      value.includes(job.id) ? value : [...value, job.id],
    );
    application_complete = true;
  }
  async function share() {
    share_url = window.location.href;
    try {
      await navigator.clipboard.writeText(share_url);
      toast("Link copied. Good opportunities are worth sharing.");
    } catch {
      share_dialog = true;
    }
  }
  function submit_report() {
    report_dialog = false;
    toast("Feedback captured for this preview. No report was sent.");
  }
</script>

<svelte:head
  ><title>{job.title} at {company.name} — Referise</title><meta
    name="description"
    content={`${job.title} at ${company.name}. ${salary(job)}. ${job.mode}. ${job.summary}`}
  /><meta name="robots" content="noindex" /></svelte:head
>
<main id="main-content" class="detail_page">
  <div class="portal_container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/jobs"><Icon name="arrow-left" size={14} />All opportunities</a
      ><span>/</span><a
        href={`/jobs?category=${encodeURIComponent(job.category)}`}
        >{job.category}</a
      ><span>/</span><span>{job.title}</span>
    </nav>
  </div>
  <section class="detail_hero">
    <div class="portal_container">
      <div class="detail_company_line">
        <div class="company_identity">
          <Company_logo id={company.id} size={52} />
          <div>
            <span class="detail_company_name"
              >{company.name}<span class="verified_company"
                ><Icon name="shield" size={13} />Verified company</span
              ></span
            ><span class="job_posted">{company.sector} · {company.size}</span>
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
          ><button
            class="icon_button"
            aria-label="Share this opportunity"
            on:click={share}><Icon name="share" size={18} /></button
          >
        </div>
      </div>
      <div class="detail_title_line">
        <div>
          <h1>{job.title}<span>.</span></h1>
          <p>{job.summary}</p>
        </div>
        <span class="detail_tier"
          >{job.tier} listing <Icon name="spark" size={12} /></span
        >
      </div>
      <div class="detail_location">
        <span><Icon name="location" size={15} />{job.location}</span><span
          class="green_dot_label"><span></span>Actively hiring</span
        ><span
          >Posted {job.posted === 0
            ? "today"
            : `${job.posted} ${job.posted === 1 ? "day" : "days"} ago`}</span
        >
      </div>
      <div class="job_facts_strip">
        <div>
          <Icon name="money" size={20} /><span
            >COMPENSATION<strong>{salary(job)}</strong></span
          >
        </div>
        <div>
          <Icon name="laptop" size={20} /><span
            >WORK ARRANGEMENT<strong>{job.mode}</strong></span
          >
        </div>
        <div>
          <Icon name="briefcase" size={20} /><span
            >EMPLOYMENT TYPE<strong>{job.type}</strong></span
          >
        </div>
        <div>
          <Icon name="chart" size={20} /><span
            >EXPERIENCE LEVEL<strong>{job.level}</strong></span
          >
        </div>
      </div>
    </div>
  </section>
  <div class="portal_container detail_grid">
    <article class="job_description">
      <nav class="detail_tabs" aria-label="Job description sections">
        {#each [{ id: "overview", label: "The opportunity" }, { id: "team", label: "Life at " + company.name }, { id: "hiring-process", label: "Hiring process" }] as section}<a
            href={`#${section.id}`}
            class:active={active_section === section.id}
            on:click={() => (active_section = section.id)}>{section.label}</a
          >{/each}
      </nav>
      <section id="overview" class="description_section">
        <span class="eyebrow_label">A LITTLE ABOUT THE ROLE</span>
        <h2>Make an impact.<br />Find room to grow.</h2>
        <p>{company.description}</p>
        <p>
          We’re looking for a {job.title.toLowerCase()} who brings curiosity, care,
          and a fresh perspective. You’ll have the space to take ownership of meaningful
          work, the support of people who care about their craft, and a voice in what
          we build next.
        </p>
        <h3>What you’ll do</h3>
        <ul class="description_list">
          {#each job.responsibilities as responsibility}<li>
              {responsibility}
            </li>{/each}
        </ul>
        <h3>What you’ll bring</h3>
        <ul class="description_list">
          {#each job.requirements as requirement}<li>{requirement}</li>{/each}
        </ul>
        <div class="encouragement_note">
          <Icon name="spark" size={21} />
          <div>
            <strong>You don’t have to tick every box.</strong>
            <p>
              If the work excites you and you see a place for your experience
              here, we’d love you to explore it. Different paths bring different
              strengths.
            </p>
          </div>
        </div>
      </section>
      <section id="team" class="description_section">
        <span class="eyebrow_label">THE PEOPLE BEHIND THE WORK</span>
        <h2>Good work. Good company.</h2>
        <p>
          We’re a team of thoughtful people who believe in doing ambitious work
          at a sustainable pace. We share ideas early, give useful feedback, and
          make time to learn from each other.
        </p>
        <div class="benefits_grid">
          {#each [{ icon: "sun", title: "Space for life", text: "Flexible hours and time to recharge." }, { icon: "globe", title: "Work that fits", text: job.mode === "Remote" ? "A team connected across locations." : "A thoughtful " + job.mode.toLowerCase() + " working rhythm." }, { icon: "chart", title: "Room to grow", text: "A learning budget and regular feedback." }, { icon: "heart", title: "Care that counts", text: "Support for your health and wellbeing." }] as benefit}<div
            >
              <Icon name={benefit.icon} size={20} /><strong
                >{benefit.title}</strong
              >
              <p>{benefit.text}</p>
            </div>{/each}
        </div>
        <p class="description_small">
          Benefits shown are illustrative and will be confirmed by the employer
          when live roles are available.
        </p>
      </section>
      <section id="hiring-process" class="description_section">
        <span class="eyebrow_label">KNOW WHAT COMES NEXT</span>
        <h2>A conversation, step by step.</h2>
        <p>
          A good hiring experience should feel like a two-way conversation.
          Here’s the planned process for this sample role.
        </p>
        <ol class="hiring_steps">
          {#each [{ title: "A first conversation", time: "30 minutes", text: "Meet the team, talk about your experience, and ask your first questions." }, { title: "A closer look at your work", time: "60 minutes", text: "Walk us through a project and the thinking behind your decisions." }, { title: "Meet your future collaborators", time: "45 minutes", text: "Get to know the people you’d work with and how the team makes decisions." }, { title: "A clear next step", time: "The final conversation", text: "Discuss the opportunity, compensation, and what joining the team could look like." }] as step, i}<li
            >
              <span class="step_number">0{i + 1}</span>
              <div>
                <h3>{step.title}<span>{step.time}</span></h3>
                <p>{step.text}</p>
              </div>
            </li>{/each}
        </ol>
      </section>
      <section class="apply_section" id="apply">
        <div>
          <span class="eyebrow_label">SEE YOURSELF HERE?</span>
          <h2>Let’s open that door.</h2>
          <p>Your experience could be the start of something good.</p>
        </div>
        <button
          class="button button_terracotta"
          on:click={start_apply}
          disabled={$applications.includes(job.id)}
          ><Icon
            name={$applications.includes(job.id) ? "check" : "arrow-up-right"}
            size={17}
          />{$applications.includes(job.id)
            ? "Applied in preview"
            : "Apply for this role"}</button
        ><span class="apply_footnote"
          ><Icon name="lock" size={12} />This is a preview. No application is
          sent to an employer.</span
        >
      </section>
      <div class="report_row">
        <span>Something doesn’t look right?</span><button
          on:click={() => (report_dialog = true)}
          >Report this listing <Icon name="arrow-up-right" size={12} /></button
        >
      </div>
    </article>
    <aside class="detail_sidebar">
      <section class="detail_company_card">
        <div class="sidebar_card_label">MEET YOUR NEXT TEAM</div>
        <Company_logo id={company.id} size={55} />
        <h2>{company.name}</h2>
        <p>{company.description}</p>
        <dl>
          <div>
            <dt><Icon name="users" size={15} />Team size</dt>
            <dd>{company.size}</dd>
          </div>
          <div>
            <dt><Icon name="building" size={15} />Founded</dt>
            <dd>{company.founded}</dd>
          </div>
          <div>
            <dt><Icon name="globe" size={15} />Industry</dt>
            <dd>{company.sector}</dd>
          </div>
        </dl>
        <a
          href={`/jobs?q=${encodeURIComponent(company.name)}`}
          class="button button_outline button_full"
          >More roles at {company.name}<Icon
            name="arrow-up-right"
            size={15}
          /></a
        >
      </section>
      <section class="detail_skills_card">
        <span class="eyebrow_label">THE CRAFT YOU’LL BRING</span>
        <div class="skill_chips">
          {#each job.skills as skill}<a
              href={`/jobs?q=${encodeURIComponent(skill)}`}>{skill}</a
            >{/each}
        </div>
      </section>
      <section class="hiring_activity_card">
        <div class="activity_heading">
          <Icon name="chart" size={18} />
          <h3>Behind the opportunity</h3>
        </div>
        <p>A little visibility into the hiring journey.</p>
        <div class="hiring_metrics">
          <div><strong>128</strong><span>Role views</span></div>
          <div><strong>24</strong><span>Applications</span></div>
          <div><strong>18</strong><span>Recruiter actions</span></div>
        </div>
        <div class="activity_progress"><span></span></div>
        <div class="activity_caption">
          <span>Illustrative hiring activity</span><Icon
            name="info"
            size={12}
          />
        </div>
      </section>
      <div class="detail_fairness_note">
        <Icon name="shield" size={22} />
        <p>
          Good work starts with a fair chance.<br /><strong
            >Your potential belongs here.</strong
          >
        </p>
      </div>
    </aside>
  </div>
  <section class="related_section">
    <div class="portal_container">
      <div class="section_heading">
        <div>
          <span class="eyebrow_label">KEEP A FEW DOORS OPEN</span>
          <h2>A little more possibility.</h2>
        </div>
        <a class="text_link" href="/jobs"
          >All opportunities <Icon name="arrow-right" size={16} /></a
        >
      </div>
      <div class="related_grid">
        {#each related as relatedJob}<Job_card
            job={relatedJob}
            compact
          />{/each}
      </div>
    </div>
  </section>
</main>
{#if apply_dialog}<Modal
    title={application_complete
      ? "Your next chapter is taking shape."
      : "Make your introduction."}
    on:close={() => (apply_dialog = false)}
  >
    {#if application_complete}<div class="application_success">
        <span><Icon name="check" size={32} /></span>
        <h3>Application saved in this preview.</h3>
        <p>
          You’ve tried applying for <strong>{job.title}</strong> at
          <strong>{company.name}</strong>. This is saved in your browser only;
          nothing has been sent to an employer.
        </p>
        <div class="form_actions">
          <a class="button button_outline" href="/profile?tab=activity"
            >View your activity</a
          ><button
            class="button button_dark"
            on:click={() => (apply_dialog = false)}>Back to the role</button
          >
        </div>
      </div>
    {:else}<div class="apply_modal_role">
        <Company_logo id={company.id} size={38} />
        <div>
          <strong>{job.title}</strong><span
            >{company.name} · {job.location}</span
          >
        </div>
      </div>
      <form on:submit|preventDefault={apply}>
        <div class="form_grid">
          <label class="field_label"
            >Full name<input
              class="field_input"
              required
              maxlength="80"
              bind:value={application_name}
              autocomplete="name"
            /></label
          ><label class="field_label"
            >Email address<input
              class="field_input"
              type="email"
              required
              bind:value={application_email}
              autocomplete="email"
            /></label
          ><label class="field_label full_width"
            >A short introduction <span class="muted">Optional</span><textarea
              class="field_input"
              maxlength="1200"
              bind:value={application_note}
              placeholder="What about this opportunity caught your eye?"
              rows="3"></textarea></label
          >
        </div>
        <div class="application_profile_note">
          <Icon name="user" size={18} /><span
            >Your preview profile is ready to share.</span
          ><a href="/profile">Review <Icon name="arrow-up-right" size={13} /></a
          >
        </div>
        <label class="consent_checkbox"
          ><input type="checkbox" required bind:checked={consent} /><span
            >I understand this is a preview application. It will be saved in
            this browser and won’t be sent to an employer.</span
          ></label
        >
        <div class="form_actions">
          <button
            type="button"
            class="button button_outline"
            on:click={() => (apply_dialog = false)}>Cancel</button
          ><button type="submit" class="button button_terracotta"
            >Try the application <Icon name="arrow-right" size={15} /></button
          >
        </div>
      </form>{/if}
  </Modal>{/if}
{#if share_dialog}<Modal
    title="Good work is worth sharing."
    on:close={() => (share_dialog = false)}
    ><p class="modal_description">Copy this link to share the opportunity.</p>
    <label class="field_label"
      >Opportunity link<input
        class="field_input"
        readonly
        value={share_url}
        on:focus={(event) => event.currentTarget.select()}
      /></label
    ></Modal
  >{/if}
{#if report_dialog}<Modal
    title="Help keep things clear."
    on:close={() => (report_dialog = false)}
    ><form on:submit|preventDefault={submit_report}>
      <p class="modal_description">
        Tell us what needs a closer look. This preview does not submit a report.
      </p>
      <label class="field_label"
        >Reason<select class="field_input" bind:value={report_reason}
          ><option>Information is inaccurate</option><option
            >Compensation is unclear</option
          ><option>The role is no longer available</option><option
            >Something else</option
          ></select
        ></label
      ><label class="field_label report_note"
        >Anything else we should know?<textarea
          class="field_input"
          bind:value={report_note}
          maxlength="1000"
          rows="3"
          placeholder="Add a little context…"></textarea></label
      >
      <div class="form_actions">
        <button class="button button_dark" type="submit"
          >Preview feedback <Icon name="arrow-right" size={15} /></button
        >
      </div>
    </form></Modal
  >{/if}
