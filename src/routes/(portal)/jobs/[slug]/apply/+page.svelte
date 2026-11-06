<script>
  import { invalidateAll as invalidate_all } from "$app/navigation";
  import { focus_feedback } from "$lib/portal/focus_feedback.js";
  import { jobs_api } from "$lib/portal/jobs_api.js";
  import { my_skill_ids } from "$lib/portal/my_skills.js";
  import { load_quota, server_quota } from "$lib/portal/membership_state.js";
  import { rupees, request_topup } from "$lib/portal/payments.js";
  import Heading from "$lib/portal/page_heading.svelte";
  import Empty from "$lib/portal/empty_state.svelte";
  import Modal from "$lib/portal/modal.svelte";
  export let data;
  // Manual: Easy Apply sends the profile itself (no form to retype). The
  // server snapshots it with the privacy rules applied and computes the match.
  $: job = data.job;
  $: p = data.profile;
  $: company_name = job.company?.name || job.company_name || "Confidential";
  $: skill_ids = job.skill_ids ?? [];
  $: match = skill_ids.length
    ? Math.round((100 * skill_ids.filter((id) => $my_skill_ids.has(id)).length) / skill_ids.length)
    : 0;
  $: money = (amount) =>
    amount
      ? new Intl.NumberFormat("en", { style: "currency", currency: p.salary_currency, maximumFractionDigits: 0 }).format(amount)
      : "Not set";
  $: shared = [
    ["Name", p.name],
    ["Email", p.email || "Not set"],
    ["Phone", p.phone || "Not set"],
    ["Location", p.location || "Not set"],
    ["Experience", `${p.experience_years || 0} years`],
    ["Notice period", p.notice || "Not set"],
    ["Expected salary", money(p.expected_salary)],
    ["Current salary", p.current_salary_visibility === "hidden" ? "Hidden from all (not shared)" : money(p.current_salary)],
    ["Skills", p.skills.length ? p.skills.join(", ") : "None yet"],
  ];
  let consent = false;
  let busy = false;
  let error = "";
  let needs_profile = false;
  let done = null;
  // Manual: past the free daily applications each one costs the apply fee
  // from the wallet, after an explicit confirmation; too little balance opens
  // the top-up modal instead.
  $: quota = $server_quota ?? data.quota;
  let paid_prompt = null; // { fee_paise, balance_paise } while the confirm modal is open
  function top_up(fee_paise, balance_paise) {
    request_topup({
      alert: `Applying for this role needs ${rupees(fee_paise)}; your wallet has ${rupees(balance_paise)}. Top up to continue.`,
      need_paise: fee_paise - balance_paise,
    });
  }
  function ask_to_pay(fee_paise, balance_paise) {
    if (balance_paise < fee_paise) top_up(fee_paise, balance_paise);
    else paid_prompt = { fee_paise, balance_paise };
  }
  function submit() {
    if (!consent || busy) return;
    if (quota && quota.remaining === 0 && quota.apply_fee_paise > 0)
      return ask_to_pay(quota.apply_fee_paise, quota.wallet_paise);
    send(false);
  }
  async function send(confirm_paid) {
    paid_prompt = null;
    busy = true;
    error = "";
    const result = await jobs_api.apply(job.id, confirm_paid);
    busy = false;
    if (result.status === 402 && result.data) {
      // The quota or the balance changed since the page loaded.
      load_quota();
      const { reason, fee_paise, balance_paise } = result.data;
      if (reason === "confirm_paid") ask_to_pay(fee_paise, balance_paise);
      else top_up(fee_paise, balance_paise);
      return;
    }
    if (!result.ok) {
      error = result.error;
      needs_profile = result.status === 409 && !p.saved;
      return;
    }
    done = result.data;
    load_quota();
    invalidate_all();
  }
</script>

<svelte:head><title>Apply for {job.title} — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="A LITTLE COURAGE. A NEW POSSIBILITY."
    title="Make your"
    accent="next move."
    description={`${job.title} at ${company_name}`}
  />
  {#if done || job.applied_at}<div class="feedback_panel" tabindex="-1" use:focus_feedback>
      <Empty
        title="Your application is in."
        text={`Sent to the ${company_name} hiring team on ${new Date(done?.submitted_at || job.applied_at).toLocaleDateString("en-IN")}. Follow its progress in your applications.`}
        ><a class="button button_dark" href="/applications">View my applications ↗</a></Empty
      >
    </div>{:else if job.status !== "active"}<Empty
      title="This role is no longer open."
      text="Explore current opportunities to find your next move."
      ><a class="button button_dark" href="/jobs">Find another role</a></Empty
    >{:else if job.application !== "Easy apply"}<Empty
      title="This role takes applications on the employer’s site."
      text="Open the role and use “Apply on the company’s site”."
      ><a class="button button_dark" href={`/jobs/${job.id}`}>Back to the role</a></Empty
    >{:else}<form class="workspace_grid workspace_form" on:submit|preventDefault={submit}>
      <section class="workspace_panel">
        <h2>What the hiring team will see</h2>
        <p class="form_helper">
          A copy of your profile as it is now. Change anything on
          <a class="text_link" href="/profile">your profile</a> before you apply.
        </p>
        <dl class="facts_list">
          {#each shared as [label, value]}<div>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>{/each}
        </dl>
      </section>
      <aside class="workspace_panel">
        <h2>{match}% skill match</h2>
        <p class="form_helper">The share of this role’s skills on your profile.</p>
        {#if quota}<p>
            {quota.remaining > 0
              ? `Uses 1 of today’s free applications (${quota.remaining} of ${quota.limit} left).`
              : quota.apply_fee_paise > 0
                ? `You’ve used today’s ${quota.limit} free applications. This one costs ${rupees(quota.apply_fee_paise)} from your wallet (balance ${rupees(quota.wallet_paise)}).`
                : `You’ve used today’s ${quota.limit} free applications.`}
          </p>{/if}
        {#if !p.saved}<p class="auth_alert" role="alert">
            Save your profile first so the hiring team has something to read.
            <a class="text_link" href="/profile">Go to your profile ↗</a>
          </p>{/if}
        <label class="filter_checkbox"
          ><input type="checkbox" required bind:checked={consent} />I’ve reviewed these details. My email and
          phone go to this employer even if my public profile hides them.</label
        >
        {#if error}<p class="auth_alert" role="alert">
            {error}{#if needs_profile}. <a class="text_link" href="/profile">Go to your profile ↗</a>{/if}
          </p>{/if}
        <button
          class="button button_terracotta"
          disabled={!consent || busy || !p.saved}
          >{busy ? "Sending…" : "Send application"}</button
        >
      </aside>
    </form>{/if}
</main>
{#if paid_prompt}<Modal title="Use your wallet for this application?" on:close={() => (paid_prompt = null)}
    ><p>
      You have reached your daily limit of {quota?.limit ?? ""} free applications. Applying for
      this role requires {rupees(paid_prompt.fee_paise)} from your wallet balance
      ({rupees(paid_prompt.balance_paise)}).
    </p>
    <div class="form_actions">
      <button class="button button_outline" on:click={() => (paid_prompt = null)}>Not now</button
      ><button class="button button_dark" on:click={() => send(true)}
        >Confirm & spend {rupees(paid_prompt.fee_paise)}</button
      >
    </div></Modal
  >{/if}
