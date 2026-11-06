<script>
  import { page } from "$app/stores";
  import { invalidateAll as invalidate_all } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  // 502/503/504 (and 500 from a failed backend call) mean the service, or the
  // network on the way to it, didn't answer: say so and offer a retry.
  $: unreachable = $page.status >= 500;
  let retrying = false;
  async function retry() {
    retrying = true;
    // Rerun the page's loads; a full reload if that can't recover the page.
    try {
      await invalidate_all();
    } catch {
      location.reload();
    }
    retrying = false;
  }
</script>

<svelte:head
  ><title
    >{unreachable ? "Can’t reach Referise" : "Let’s find another door"} — Referise</title
  ></svelte:head
>
<main id="main-content" class="portal_container error_page">
  <span class="eyebrow_label">{$page.status} / {unreachable ? "CONNECTION TROUBLE" : "A SMALL DETOUR"}</span>
  {#if unreachable}<h1>We couldn’t reach<br /><em>Referise just now.</em></h1>
    <p role="alert">
      {$page.error?.message && $page.status !== 500
        ? $page.error.message
        : "The service didn’t answer."} Check your connection, then try again.
      Nothing you saved is lost.
    </p>
    <div class="form_actions">
      <button class="button button_terracotta" on:click={retry} disabled={retrying}
        >{retrying ? "Retrying…" : "Retry"} <Icon name="arrow-right" size={17} /></button
      ><a class="button button_outline" href="/jobs">Explore opportunities</a>
    </div>{:else}<h1>There are other doors<br /><em>worth opening.</em></h1>
    <p>
      {$page.status === 404
        ? "This page may have moved, or the opportunity is no longer here. Your next chapter is still out there."
        : "Something interrupted this page. Try again, or head back to the opportunities."}
    </p>
    <a class="button button_terracotta" href="/jobs"
      >Explore opportunities <Icon name="arrow-right" size={17} /></a
    >{/if}
</main>
