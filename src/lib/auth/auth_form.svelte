<script>
  import { page } from "$app/stores";
  import { onMount as on_mount } from "svelte";
  import { sso_providers } from "$lib/providers.js";
  import { build_sso_login_url } from "$lib/config.js";
  import { friendly_auth_error } from "./validation.js";
  export let signup = false;
  export let data;
  let redirecting_provider = "";
  let local_message = "";
  $: error_code = $page.url.searchParams.get("error");
  $: next = $page.url.searchParams.get("next");
  $: message =
    local_message || (error_code ? friendly_auth_error(error_code) : "");
  on_mount(() => {
    const reset = () => (redirecting_provider = "");
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  });
  function start_sso(provider) {
    if (redirecting_provider) return;
    if (!data.auth_configured) {
      local_message = friendly_auth_error("auth_unconfigured");
      return;
    }
    local_message = "";
    redirecting_provider = provider.slug;
    window.location.assign(
      build_sso_login_url(
        provider.slug,
        window.location.origin +
          "/auth/callback" +
          (next ? "?next=" + encodeURIComponent(next) : ""),
      ),
    );
  }
</script>

<div class="auth_form_heading">
  <span class="auth_eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
  <h1>{signup ? "Make yourself known." : "Welcome back."}</h1>
  <p>
    {signup
      ? "Create your account with a service you already use."
      : "Choose how you’d like to sign in."}
  </p>
</div>
{#if message}<div class="auth_alert" role="alert">{message}</div>{/if}
<div class="sso_provider_grid">
  {#each sso_providers as provider}<button
      type="button"
      disabled={!!redirecting_provider}
      on:click={() => start_sso(provider)}
      ><span class="sso_brand_icon">{@html provider.icon}</span><span
        >{redirecting_provider === provider.slug
          ? "Opening…"
          : provider.label}</span
      ></button
    >{/each}
</div>
<p class="sso_help">
  {#if signup}Already have an account? <a
      href={"/login" + (next ? "?next=" + encodeURIComponent(next) : "")}
      >Sign in</a
    >{:else}New to Referise? <a
      href={"/signup" + (next ? "?next=" + encodeURIComponent(next) : "")}
      >Create an account</a
    >{/if}
</p>
<p class="sso_terms">
  By continuing, you agree to our <a href="/terms">Terms & conditions</a> and
  <a href="/privacy">Privacy policy</a>.
</p>
<p class="sso_help">
  Use the same provider each time to return to your account. <a
    href="/auth/help">Need help?</a
  >
</p>
