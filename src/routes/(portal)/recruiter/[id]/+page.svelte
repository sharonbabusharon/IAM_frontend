<script>
  import Heading from "$lib/portal/page_heading.svelte";
  import Empty from "$lib/portal/empty_state.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import { browser } from "$app/environment";
  import { jobs_api, to_card, to_criteria } from "$lib/portal/jobs_api.js";
  import { default_filters } from "$lib/portal/search.js";
  import { location_label, rates } from "$lib/portal/reference.js";
  export let data;
  $: person = data.card.recruiter;
  let jobs = [];
  let loading = true;
  let load_error = "";
  // ?tab=jobs is the only tab for now. ponytail: one page of 50, newest first.
  $: if (browser) load(person.id);
  async function load(id) {
    loading = true;
    const criteria = to_criteria({ ...default_filters(), recruiter: id }, { rates: $rates, page_size: 50 });
    const result = await jobs_api.search(criteria);
    loading = false;
    load_error = result.ok ? "" : result.error;
    jobs = result.ok ? result.data.jobs.map((j) => to_card(j, $location_label)) : [];
  }
</script>

<svelte:head><title>{person.name}, recruiter — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="THE PERSON HIRING"
    title={person.name}
    description={data.card.open_jobs
      ? `${data.card.open_jobs} open ${data.card.open_jobs === 1 ? "role" : "roles"} on Referise.`
      : "No public roles right now."}
    companion="blue"
  />
  <h2 class="eyebrow_label">OPEN ROLES</h2>
  {#if load_error}<p class="auth_alert" role="alert">{load_error}</p>{/if}
  {#if jobs.length}<div class="results_jobs grid_view">
      {#each jobs as job (job.id)}<Job_card {job} />{/each}
    </div>{:else if loading}<p class="form_helper">Loading their roles…</p>{:else}<Empty
      title="No open roles right now."
      text="Check back later, or explore other opportunities."
      ><a class="button button_dark" href="/jobs">Explore jobs ↗</a></Empty
    >{/if}
</main>
