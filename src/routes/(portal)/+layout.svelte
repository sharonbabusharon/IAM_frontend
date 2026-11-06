<script>
  import { onMount as on_mount } from "svelte";
  import { page } from "$app/stores";
  import "$lib/portal/portal.css";
  import "$lib/portal/portal_pages.css";
  import "$lib/portal/cobalt_pages.css";
  import "$lib/portal/requirement_fields.css";
  import "$lib/portal/workspace.css";
  import "$lib/portal/refinements.css";
  import Membership_panel from "$lib/portal/membership_panel.svelte";
  import {
    hydrate_membership,
    membership_open,
    membership_clock,
  } from "$lib/portal/membership_state.js";
  import Header from "$lib/portal/header.svelte";
  import Footer from "$lib/portal/footer.svelte";
  import Icon from "$lib/portal/icon.svelte";
  import { hydrate_preview, notification } from "$lib/portal/state";
  import { hydrate_workspace } from "$lib/portal/workspace_state.js";
  import { sync_my_skills, clear_my_skills } from "$lib/portal/my_skills.js";
  import { load_quota, server_quota } from "$lib/portal/membership_state.js";
  import { use_server_saved, use_local_saved } from "$lib/portal/state";
  import { browser } from "$app/environment";
  import Topup_modal from "$lib/portal/topup_modal.svelte";
  import { topup_request, on_wallet_change } from "$lib/portal/payments.js";
  export let data;
  // Manual: skills sync only on the profile, job search, job details and
  // company/recruiter job pages; signed-out visitors keep no skills.
  const sync_routes = /^\/(profile|jobs|company|recruiter)(\/|$)/;
  $: if (browser && !data.user) clear_my_skills(), server_quota.set(null), use_local_saved();
  $: if (browser && data.user) load_quota(), use_server_saved();
  $: path = $page.url.pathname; // a string, so query-only changes don't re-sync
  $: if (browser && data.user && sync_routes.test(path)) sync_my_skills();
  let offline = false;
  hydrate_preview();
  hydrate_workspace();
  hydrate_membership();
  on_mount(() => {
    const clock_timer = setInterval(
      () => membership_clock.set(Date.now()),
      30000,
    );
    const update = () => (offline = !navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    // A top-up in another tab updates the header balance here too.
    const stop_wallet_sync = on_wallet_change(() => data.user && load_quota());
    return () => {
      stop_wallet_sync();
      clearInterval(clock_timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  });
</script>

<svelte:head
  ><meta name="theme-color" content="#f5f7ff" /><link
    rel="icon"
    href="/referise.svg"
    type="image/svg+xml"
  /></svelte:head
>
<div class="portal" class:cobalt_pages={$page.url.pathname !== "/"}>
  <Header user={data?.user} companies={data?.companies ?? []} />
  {#if $membership_open}<Membership_panel />{/if}
  {#if $topup_request && data.user}<Topup_modal request={$topup_request} />{/if}
  {#if offline}<div class="offline_notice" role="status">
      <Icon name="wifi" size={16} />You’re offline. Your saved preview is still
      here.
    </div>{/if}
  <slot />
  {#if $page.url.pathname !== "/"}<Footer compact />{/if}
  <div class="toast_region" aria-live="polite" aria-atomic="true">
    {#if $notification}<div class="portal_toast">
        <span class="toast_check"><Icon name="check" size={16} /></span
        >{$notification}<button
          class="icon_button"
          aria-label="Dismiss notification"
          on:click={() => notification.set("")}
          ><Icon name="close" size={16} /></button
        >
      </div>{/if}
  </div>
</div>
