<script>
  import Auth_shell from "$lib/auth/auth_shell.svelte";
  import Auth_form from "$lib/auth/auth_form.svelte";
  export let data;
  export let form;
</script>

<svelte:head
  ><title>Create an account — Referise</title><meta
    name="description"
    content="Create your Referise account and find your next opportunity."
  /></svelte:head
>
<Auth_shell signup><Auth_form signup {data} {form} /></Auth_shell>
