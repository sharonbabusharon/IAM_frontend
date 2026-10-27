<script>
  import "../app.css";
  import { onMount as on_mount } from "svelte";
  import { sync_reference } from "$lib/portal/reference.js";

  // Skills, designations, locations and exchange rates for every page
  // (cached in IndexedDB; only changed files are downloaded).
  on_mount(() => {
    sync_reference();
  });
</script>

<svelte:head
  ><link rel="manifest" href="/manifest.webmanifest" /><link
    rel="apple-touch-icon"
    href="/app-icon-192.png"
  /></svelte:head
>
<slot />
