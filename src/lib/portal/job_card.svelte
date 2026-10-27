<script>
  import { get_company, posted } from "./data.js";
  import {
    saved_jobs,
    toggle_saved,
    applications,
    profile,
    viewing_currency,
    toast,
  } from "./state.js";
  import { converted_salary } from "./currency.js";
  import { location_label, rates } from "./reference.js";
  import { skill_match } from "./membership_rules.js";
  import Company_logo from "./company_logo.svelte";
  import Icon from "./icon.svelte";
  import Modal from "./modal.svelte";
  export let job;
  export let href = "";
  export let currency = "";
  export let compact = false;
  let all_skills = false;
  let all_locations = false;
  let pending_skill = "";
  // Live jobs carry their company name; unlinked ones may have none.
  $: company = job.live
    ? { name: job.company_name || "Confidential" }
    : job.company_name
      ? { ...get_company(job.company), name: job.company_name }
      : get_company(job.company);
  $: target_currency = currency || $viewing_currency;
  $: match = skill_match(job, $profile.skills);
  $: locations = [
    ...new Set((job.location_ids ?? job.locations ?? []).map($location_label)),
  ];
  $: owned = new Set($profile.skills.map((s) => s.toLowerCase()));
  function add_skill() {
    profile.update((p) => {
      const groups = structuredClone(p.skill_groups ?? []);
      if (
        groups.length &&
        !groups.some((g) =>
          g.skills.some((s) => s.toLowerCase() === pending_skill.toLowerCase()),
        )
      )
        groups[0].skills.push(pending_skill);
      return {
        ...p,
        skill_groups: groups,
        skills: owned.has(pending_skill.toLowerCase())
          ? p.skills
          : [...p.skills, pending_skill],
      };
    });
    toast(`${pending_skill} added to your preview profile.`);
    pending_skill = "";
  }
</script>

<article class={`job_card refined_job tone_${job.company}`} class:compact>
  <div class="job_card_cover">
    <div class="job_card_top">
      <div class="company_identity">
        <Company_logo id={job.company} size={34} />
        <div>
          <span class="company_name">{company.name}</span><span
            class="job_posted">{posted(job.posted)}</span
          >
        </div>
      </div>
      <button
        class="icon_button bookmark_button"
        class:saved={$saved_jobs.includes(job.id)}
        aria-label={`${$saved_jobs.includes(job.id) ? "Unsave" : "Save"} ${job.title}`}
        aria-pressed={$saved_jobs.includes(job.id)}
        on:click={() => toggle_saved(job.id)}
        ><Icon name="bookmark" size={17} /></button
      >
    </div>
    <h3>
      <a class="card_destination" href={href || `/jobs/${job.id}`}
        >{job.title}</a
      >
    </h3>
    <div class="job_under_title">
      <span>{job.type || job.types?.join(" / ")}</span><span
        >{job.experience_years ?? job.min_experience ?? 0}+ years</span
      ><span>{job.mode || job.modes?.join(" / ")}</span>
    </div>
    <div class="job_location_line">
      <Icon name="location" size={13} /><span
        >{job.location_type === "world_remote"
          ? "Worldwide remote"
          : locations[0] || job.location}</span
      >{#if locations.length > 1}<button
          type="button"
          aria-expanded={all_locations}
          on:click={() => (all_locations = !all_locations)}
          >{all_locations
            ? "Less"
            : `+${locations.length - 1} locations`}</button
        >{/if}
    </div>
    {#if all_locations}<p class="expanded_locations">
        {locations.join(" · ")}
      </p>{/if}
  </div>
  <div class="job_card_content">
    <div class="job_match">
      <strong>{match}% skill match</strong><span
        title="Illustrative match: the share of job skills present in your preview profile."
        >Preview profile</span
      >
    </div>
    <div class="matching_skills" class:expanded={all_skills}>
      {#each job.skills as skill}<button
          class:matched={owned.has(skill.toLowerCase())}
          class:missing={!owned.has(skill.toLowerCase())}
          aria-label={owned.has(skill.toLowerCase())
            ? `${skill}: already on your profile`
            : `Add ${skill} to your profile`}
          on:click={() => {
            if (!owned.has(skill.toLowerCase())) pending_skill = skill;
            else toast(`${skill} is already on your profile.`);
          }}>{owned.has(skill.toLowerCase()) ? "✓" : "+"} {skill}</button
        >{/each}
    </div>
    {#if job.skills.length > 2}<button
        class="skill_more"
        aria-expanded={all_skills}
        on:click={() => (all_skills = !all_skills)}
        >{all_skills
          ? "Show fewer skills"
          : `All ${job.skills.length} skills`}</button
      >{/if}
    <div class="job_card_bottom">
      <div>
        <strong>{converted_salary(job, target_currency, $rates)}</strong><span
          class="salary_note"
          >{target_currency !== job.currency && !job.salary_hidden
            ? `Posted: ${converted_salary(job, job.currency, $rates)}`
            : "Annual compensation"}</span
        >
      </div>
      <span class="job_card_link" aria-hidden="true"
        ><Icon name="arrow-up-right" size={18} /></span
      >
    </div>
    <div class="job_card_foot">
      <span
        >{$applications.includes(job.id)
          ? "Applied in preview"
          : job.application}</span
      ><span>{job.tier}</span>
    </div>
  </div>
</article>
{#if pending_skill}<Modal
    title={`Add ${pending_skill}?`}
    on:close={() => (pending_skill = "")}
    ><p>
      Only add skills you have experience with. This updates your profile and
      the preview match scores.
    </p>
    <div class="modal_actions">
      <button
        class="button button_outline"
        on:click={() => (pending_skill = "")}>Cancel</button
      ><button class="button button_blue" on:click={add_skill}
        >Add to my skills</button
      >
    </div></Modal
  >{/if}
