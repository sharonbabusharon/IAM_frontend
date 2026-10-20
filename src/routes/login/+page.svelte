<script>
  import Auth_shell from "$lib/auth/auth_shell.svelte";
  import Auth_form from "$lib/auth/auth_form.svelte";
  export let data;
</script>

<svelte:head
  ><title>Sign in — Referise</title><meta
    name="description"
    content="Sign in to Referise and pick up your next career chapter."
  /></svelte:head
>
<Auth_shell><Auth_form {data} /></Auth_shell>
