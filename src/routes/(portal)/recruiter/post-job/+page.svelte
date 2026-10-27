<script>
  import { page } from "$app/stores";
  import { onMount as on_mount } from "svelte";
  import { notice_periods, work_types, relocation_options } from "$lib/portal/filter_options.js";
  import {
    skills as skill_terms,
    designations as designation_terms,
    currency_options,
  } from "$lib/portal/reference.js";
  import { new_job_form, job_form_error } from "$lib/portal/job_post_rules.js";
  import { jobs_api } from "$lib/portal/jobs_api.js";
  import { toast } from "$lib/portal/state.js";
  import Markdown_editor from "$lib/portal/markdown_editor.svelte";
  import Heading from "$lib/portal/page_heading.svelte";
  import Location_picker from "$lib/portal/location_picker.svelte";
  import Modal from "$lib/portal/modal.svelte";
  let form = { ...new_job_form(), relocation: "On their own" };
  let stages = "";
  let skill_text = "";
  let error = "";
  let confirming = false;
  let completed = null; // the published job
  let saving = false;
  let editing_id = "";
  let draft_id = "";
  let companies = [];
  $: skill_options = $skill_terms.map((term) => term.name);
  // Manual: interview rounds = the number of stages the recruiter lists.
  $: stage_list = stages
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  $: form.rounds = stage_list.length;
  $: chosen_company = companies.find((c) => c.slug === form.company);
  on_mount(async () => {
    const [mine, drafts] = await Promise.all([jobs_api.companies(), jobs_api.drafts()]);
    if (mine.status === 401) error = "Sign in to post a job.";
    companies = mine.ok ? mine.data : [];
    const edit_id = $page.url.searchParams.get("edit");
    const draft = $page.url.searchParams.get("draft");
    if (edit_id) {
      const result = await jobs_api.get(edit_id);
      if (!result.ok || !result.data.can_manage) {
        error = "You can only edit jobs you posted.";
        return;
      }
      const job = result.data;
      editing_id = job.id;
      form = {
        ...new_job_form(),
        title: job.title,
        tier: job.tier === "Free" ? "Free" : "Premium",
        company: job.company_slug ?? "",
        company_name: job.company_slug ? "" : job.company_name,
        skills: job.skills,
        min_experience: job.experience_years,
        locations: job.location_ids,
        worldwide: !!job.worldwide_remote,
        salary_max: job.salary_max ?? "",
        currency: job.currency ?? "INR",
        salary_hidden: job.salary_hidden,
        modes: job.work_modes,
        types: job.work_types,
        notice: job.notice_periods,
        relocation: job.relocation,
        application: job.application,
        external_url: job.external_url ?? "",
        description: job.description,
      };
      stages = job.interview_stages.join("\n");
    } else if (draft && drafts.ok) {
      const found = drafts.data.find((d) => d.id === draft);
      if (found) {
        draft_id = found.id;
        ({ stages = "", ...form } = { ...new_job_form(), ...found.form });
      }
    }
  });
  $: if (form.tier === "Free") {
    form.salary_hidden = false;
    form.application = "Easy apply";
  }
  $: if (!form.company) form.payment = "personal";
  function toggle(key, value) {
    form = {
      ...form,
      [key]: form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value],
    };
  }
  function add_skill() {
    const value = skill_text.trim();
    if (!value) return;
    if (form.skills.length >= 15) {
      error = "A job can include up to 15 skills.";
      return;
    }
    if (!form.skills.some((s) => s.toLowerCase() === value.toLowerCase())) form.skills = [...form.skills, value];
    skill_text = "";
    error = "";
  }
  async function save_draft() {
    // Manual: drafts skip validation.
    const result = await jobs_api.save_draft(draft_id, { ...form, stages });
    if (!result.ok) return toast(result.error);
    draft_id = result.data.id;
    toast("Draft saved. Find it under Manage jobs.");
  }
  function review() {
    error = job_form_error(form);
    if (!error && !form.salary_max) error = "Enter the maximum annual salary.";
    if (!error) confirming = true;
  }
  async function publish() {
    const input = {
      tier: form.tier === "Free" ? "free" : "paid",
      company_slug: form.tier === "Free" ? "" : form.company,
      company_name: form.company_name,
      payment_method: form.payment === "credits" ? "company_credits" : "out_of_pocket",
      designation: form.title,
      skills: form.skills,
      min_experience: Number(form.min_experience),
      location_ids: form.locations,
      worldwide_remote: form.worldwide,
      salary_max: Number(form.salary_max),
      currency: form.currency,
      hide_salary: form.salary_hidden,
      work_modes: form.modes,
      work_types: form.types,
      notice_periods: form.notice,
      relocation: form.relocation,
      interview_stages: stage_list,
      application: form.application,
      external_url: form.external_url,
      description: form.description,
    };
    saving = true;
    const result = editing_id ? await jobs_api.edit(editing_id, input) : await jobs_api.post(input);
    saving = false;
    confirming = false;
    if (!result.ok) {
      error = result.error;
      return;
    }
    if (draft_id) jobs_api.delete_draft(draft_id);
    completed = result.data;
  }
</script>


<svelte:head><title>Post a job — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="MAKE ROOM FOR YOUR NEXT GREAT HIRE"
    title="Good work starts"
    accent="with a clear brief."
    description="Tell people what they’ll do, how they’ll work and what they can expect."
  />
  {#if completed}<section class="workspace_panel review_success">
      <span class="workspace_badge green">{editing_id ? "UPDATED" : "PUBLISHED"}</span>
      <h2>A new possibility, out in the world.</h2>
      <p>
        {completed.tier === "Free"
          ? "Free jobs are unlisted: share the direct link below with candidates."
          : "Your job is live in search for the next 30 days."}
      </p>
      {#if completed.tier === "Free"}<p><code>{$page.url.origin}/jobs/share/{completed.share_hash}</code></p>{/if}
      <div class="workspace_actions" style="justify-content:center">
        <a class="button button_dark" href={`/jobs/${completed.id}`}>View job ↗</a
        ><a class="button button_outline" href="/recruiter/jobs">Manage jobs</a>
      </div>
    </section>
  {:else}<form
      class="workspace_grid workspace_form"
      on:submit|preventDefault={review}
    >
      <div class="workspace_stack">
        <section class="workspace_panel">
          <h2>01 / Start with the right listing</h2>
          <div class="step_choices">
            {#each [["Free", "A direct link to share. No posting fee."], ["Premium", "Discoverable in search. Posting fee applies."]] as [value, text]}<label
                class:selected={form.tier === value}
                ><input type="radio" bind:group={form.tier} {value} /><strong
                  >{value}</strong
                ><small>{text}</small></label
              >{/each}
          </div>
          <p class="workspace_hint">
            {form.tier === "Free"
              ? "Free jobs are unlisted. Share the direct link yourself. Salary stays visible and applications stay on the platform."
              : "Paid jobs appear in search. An approved company connection also places the job on its company page."}
          </p>
          <label class="field_label"
            >Company connection<select
              class="field_input"
              bind:value={form.company}
              disabled={!!editing_id}
              ><option value="">Unlinked / confidential</option
              >{#each companies as company}<option value={company.slug}
                  >{company.name} · {company.role === "admin" ? "admin" : company.role === "hr" ? "HR" : "member"}</option
                >{/each}</select
            ></label
          ><label class="field_label"
            >Company display name<input
              class="field_input"
              maxlength="120"
              bind:value={form.company_name}
              disabled={!!form.company}
              placeholder={chosen_company?.name ?? "Confidential (if left blank)"}
            /></label
          >{#if form.tier === "Premium"}<label class="field_label"
              >Payment method<select
                class="field_input"
                bind:value={form.payment}
                ><option value="personal">Out of pocket</option><option
                  value="credits"
                  disabled={!form.company}>Company credits</option
                ></select
              ></label
            >{/if}
        </section>
        <section class="workspace_panel">
          <h2>02 / The work</h2>
          <label class="field_label"
            >Job title *<input
              class="field_input"
              list="job_designations"
              required
              maxlength="120"
              bind:value={form.title}
            /><datalist id="job_designations"
              >{#each $designation_terms as term}<option value={term.name} />{/each}</datalist
            ></label
          ><label class="field_label"
            >Required skills *
            <div class="inline_fields">
              <input
                class="field_input"
                list="job_skills"
                bind:value={skill_text}
                on:keydown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add_skill();
                  }
                }}
                placeholder="Type a skill"
              /><button
                type="button"
                class="button button_outline"
                on:click={add_skill}>Add</button
              >
            </div>
            <datalist id="job_skills"
              >{#each skill_options as skill}<option
                  value={skill}
                />{/each}</datalist
            ></label
          >
          <div class="filter_chips">
            {#each form.skills as skill}<button
                class="button button_outline button_small"
                type="button"
                aria-label={`Remove ${skill}`}
                on:click={() =>
                  (form.skills = form.skills.filter((s) => s !== skill))}
                >{skill} ×</button
              >{/each}
          </div>
          <p class="form_caption">
            {form.skills.length}/15 skills. Custom terms can be reviewed later.
          </p>
          <label class="field_label"
            >Minimum experience (years) *<input
              class="field_input"
              type="number"
              min="0"
              max="99"
              step="1"
              required
              bind:value={form.min_experience}
            /></label
          >
          <fieldset>
            <legend>Eligible work locations *</legend><Location_picker
              bind:selected={form.locations}
              bind:worldwide={form.worldwide}
              allow_worldwide
            />
          </fieldset>
        </section>
        <section class="workspace_panel">
          <h2>03 / Pay & practical details</h2>
          <div class="form_grid">
            <label class="field_label"
              >Currency<select class="field_input" bind:value={form.currency}
                >{#each $currency_options as code}<option>{code}</option>{/each}</select
              ></label
            ><label class="field_label"
              >Maximum annual salary *<input
                class="field_input"
                type="number"
                min="1"
                step="1"
                required
                bind:value={form.salary_max}
              /></label
            >
          </div>
          <label class="filter_checkbox"
            ><input
              type="checkbox"
              bind:checked={form.salary_hidden}
              disabled={form.tier === "Free"}
            />Display “Competitive” instead of salary</label
          >
          <p class="form_caption">
            An exact maximum budget is required even when hidden, so salary
            matching can work.
          </p>
          {#each [{ key: "modes", label: "Workplace *", options: ["On-site", "Hybrid", "Remote"] }, { key: "types", label: "Employment type *", options: work_types.filter((v) => v !== "Gig") }, { key: "notice", label: "Accepted notice periods", options: notice_periods }] as group}<fieldset
            >
              <legend>{group.label}</legend>
              <div class="filter_chips">
                {#each group.options as option}<label
                    class:chosen={form[group.key].includes(option)}
                    ><input
                      type="checkbox"
                      checked={form[group.key].includes(option)}
                      on:change={() => toggle(group.key, option)}
                    />{option}</label
                  >{/each}
              </div>
            </fieldset>{/each}
          <div class="form_grid">
            <label class="field_label"
              >Relocation support<select
                class="field_input"
                bind:value={form.relocation}
                >{#each relocation_options as option}<option>{option}</option>{/each}</select
              ></label
            ><label class="field_label"
              >Interview stages · one per line<textarea
                class="field_input"
                rows="4"
                maxlength="2000"
                placeholder={"HR screen\nTechnical round\nPanel interview"}
                bind:value={stages}
              ></textarea><small>{stage_list.length} rounds</small></label
            >
          </div>
        </section>
        <section class="workspace_panel">
          <h2>04 / Application & description</h2>
          <label class="field_label"
            >Application method<select
              class="field_input"
              bind:value={form.application}
              disabled={form.tier === "Free"}
              ><option>Easy apply</option><option>External</option></select
            ></label
          >{#if form.application === "External"}<label class="field_label"
              >External application URL *<input
                class="field_input"
                type="url"
                pattern="https://.*"
                required
                placeholder="https://"
                bind:value={form.external_url}
              /></label
            >{/if}<Markdown_editor bind:value={form.description} />
        </section>
      </div>
      <aside class="workspace_stack">
        <section class="workspace_panel">
          <span class="eyebrow_label">YOUR LISTING, AT A GLANCE</span>
          <h2 style="margin-top:18px">
            {form.title || "Your next great hire."}
          </h2>
          <p>
            {chosen_company?.name || form.company_name || "Confidential"}
          </p>
          <dl class="facts_list">
            <div>
              <dt>Listing</dt>
              <dd>{form.tier}</dd>
            </div>
            <div>
              <dt>Visibility</dt>
              <dd>
                {form.tier === "Free" ? "Direct link only" : "Public search"}
              </dd>
            </div>
            <div>
              <dt>Application</dt>
              <dd>{form.application}</dd>
            </div>
            <div>
              <dt>Posting fee</dt>
              <dd>{form.tier === "Free" ? "₹0" : "Set by the platform (₹0 for now)"}</dd>
            </div>
          </dl>
          <div class="workspace_actions">
            <button
              type="button"
              class="button button_outline button_full"
              on:click={save_draft}>Save as draft</button
            ><button class="button button_dark button_full" type="submit"
              >Review job preview ↗</button
            >
          </div>
          {#if error}<p class="filter_error" role="alert">{error}</p>{/if}
          <p class="work_note">
            Drafts are saved to your account. Paid posts are free while the
            platform fee is ₹0; card and credit payments arrive later.
          </p>
        </section>
      </aside>
    </form>{/if}
</main>
{#if confirming}<Modal
    title={form.tier === "Free" ? "Review free job" : "Review paid job"}
    on:close={() => (confirming = false)}
    ><div class="workspace_hint">
      <h3>{form.title}</h3>
      <p>
        {form.tier === "Free"
          ? "This job will be accessible by direct link only. It will not appear in public search or on a company page. Salary is public."
          : form.company
            ? "This job is intended for public search and your approved company page."
            : "This unlinked job is intended for public search only. It will not appear on an official company page."}
      </p>
      {#if form.tier === "Premium"}<p>
          Payment method: {form.payment === "credits" ? "Company credits" : "Out of pocket"}.
        </p>{/if}
    </div>
    <p class="form_helper">
      {editing_id ? "Changes go live immediately." : "Your job goes live as soon as you confirm."}
    </p>
    <div class="form_actions">
      <button
        class="button button_outline"
        on:click={() => (confirming = false)}>Keep editing</button
      ><button class="button button_dark" disabled={saving} on:click={publish}
        >{saving ? "Publishing…" : editing_id ? "Save changes" : "Publish job"}</button
      >
    </div></Modal
  >{/if}
