<script>
  import { onMount as on_mount } from "svelte";
  import { page } from "$app/stores";
  import "$lib/portal/portal.css";
  import "$lib/portal/portal_pages.css";
  import Header from "$lib/portal/header.svelte";
  import Footer from "$lib/portal/footer.svelte";
  import Icon from "$lib/portal/icon.svelte";
  import { hydrate_preview, notification } from "$lib/portal/state";
  let offline = false;
  on_mount(() => {
    hydrate_preview();
    const update = () => (offline = !navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  });
</script>

<svelte:head
  ><meta name="theme-color" content="#f8f7f3" /><link
    rel="icon"
    href="/referise.svg"
    type="image/svg+xml"
  /></svelte:head
>
<div class="portal">
  <Header />
  {#if offline}<div class="offline_notice" role="status">
      <Icon name="wifi" size={16} />You’re offline. Your saved preview is still
      here.
    </div>{/if}
  <slot />
  <Footer compact={$page.url.pathname !== "/"} />
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
