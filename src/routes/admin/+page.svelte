<script>
  import Portal_layout from "../(portal)/+layout.svelte";
  import Admin from "$lib/portal/site_admin.svelte";
  export let data;
</script>

<Portal_layout {data}><Admin /></Portal_layout>
