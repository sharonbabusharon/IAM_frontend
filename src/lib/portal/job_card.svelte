<script lang="ts">
  import type { job_data } from "./types";
  import { get_company, salary, posted } from "./data";
  import { saved_jobs, toggle_saved, applications } from "./state";
  import Company_logo from "./company_logo.svelte";
  import Icon from "./icon.svelte";
  export let job: job_data;
  export let compact = false;
  $: company = get_company(job.company);
</script>

<article class="job_card" class:compact>
  <div class="job_card_top">
    <div class="company_identity">
      <Company_logo id={job.company} />
      <div>
        <span class="company_name"
          >{company.name}<span
            class="verified_small"
            title="Sample verified company"
            ><Icon name="shield" size={14} /></span
          ></span
        ><span class="job_posted">{company.sector}</span>
      </div>
    </div>
    <button
      class:saved={$saved_jobs.includes(job.id)}
      class="icon_button bookmark_button"
      aria-label={`${$saved_jobs.includes(job.id) ? "Unsave" : "Save"} ${job.title} at ${company.name}`}
      aria-pressed={$saved_jobs.includes(job.id)}
      on:click={() => toggle_saved(job.id)}
      ><Icon name="bookmark" size={19} /></button
    >
  </div>
  <h3><a href={`/jobs/${job.id}`}>{job.title}</a></h3>
  <div class="job_meta">
    <span><Icon name="location" size={14} />{job.location}</span><span
      >{job.mode}</span
    >
  </div>
  {#if !compact}<p class="job_summary">{job.summary}</p>{/if}
  <div class="job_tags">
    <span>{job.type}</span><span>{job.level}</span>{#if !compact}<span
        >{job.skills[0]}</span
      >{/if}
  </div>
  <div class="job_card_bottom">
    <div>
      <strong>{salary(job)}</strong><span class="salary_note"
        >{job.currency === "INR"
          ? "Annual compensation"
          : "Base compensation"}</span
      >
    </div>
    <a
      class="job_card_link"
      href={`/jobs/${job.id}`}
      aria-label={`View ${job.title} at ${company.name}`}
      ><Icon name="arrow-up-right" size={20} /></a
    >
  </div>
  {#if !compact}<div class="job_card_foot">
      <span class="easy_apply"
        ><Icon
          name={$applications.includes(job.id) ? "check" : "spark"}
          size={13}
        />{$applications.includes(job.id)
          ? "Applied in preview"
          : job.application}</span
      ><span class="tier_label">{job.tier}</span><span
        >{posted(job.posted)}</span
      >
    </div>{/if}
</article>
