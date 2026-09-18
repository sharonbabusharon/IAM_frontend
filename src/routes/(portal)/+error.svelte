<script lang="ts">
  import { page } from "$app/stores";
  import Icon from "$lib/portal/icon.svelte";
</script>

<svelte:head><title>Let’s find another door — Referise</title></svelte:head>
<main id="main-content" class="portal_container error_page">
  <span class="eyebrow_label">{$page.status} / A SMALL DETOUR</span>
  <h1>There are other doors<br /><em>worth opening.</em></h1>
  <p>
    {$page.status === 404
      ? "This page may have moved, or the opportunity is no longer here. Your next chapter is still out there."
      : "Something interrupted this page. Try again, or head back to the opportunities."}
  </p>
  <a class="button button_terracotta" href="/jobs"
    >Explore opportunities <Icon name="arrow-right" size={17} /></a
  >
</main>
