<script>
  import { enhance } from "$app/forms";
  import { page } from "$app/stores";
  import { onMount as on_mount, tick } from "svelte";
  import Icon from "$lib/portal/icon.svelte";
  import { sso_providers } from "$lib/providers.js";
  import { build_sso_login_url } from "$lib/config.js";
  import { clear_session_user } from "$lib/session.js";
  import { friendly_auth_error, validate_credentials } from "./validation.js";
  export let signup = false;
  export let form = null;
  export let data;
  let email = form?.fields?.email ?? "";
  let full_name = form?.fields?.full_name ?? "";
  let password = "";
  let confirm_password = "";
  let show_password = false;
  let show_confirmation = false;
  let busy = false;
  let redirecting_provider = "";
  let local_message = "";
  let local_errors = {};
  let error_summary;
  $: errors = Object.keys(local_errors).length
    ? local_errors
    : (form?.errors ?? {});
  $: error_code = $page.url.searchParams.get("error");
  $: message =
    local_message ||
    form?.message ||
    (error_code ? friendly_auth_error(error_code) : "");
  const primary_providers = sso_providers.filter((provider) =>
    ["google", "linkedin_oidc"].includes(provider.slug),
  );
  const other_providers = sso_providers.filter(
    (provider) => !["google", "linkedin_oidc"].includes(provider.slug),
  );
  function reset_busy() {
    busy = false;
    redirecting_provider = "";
  }
  on_mount(() => {
    window.addEventListener("pageshow", reset_busy);
    return () => window.removeEventListener("pageshow", reset_busy);
  });
  function start_sso(provider) {
    if (busy || redirecting_provider) return;
    local_message = "";
    if (!data.auth_configured) {
      local_message = friendly_auth_error("auth_unconfigured");
      return;
    }
    redirecting_provider = provider.slug;
    clear_session_user();
    window.location.assign(
      build_sso_login_url(
        provider.slug,
        window.location.origin + "/auth/callback",
      ),
    );
  }
  async function submit({ cancel }) {
    if (busy || redirecting_provider) {
      cancel();
      return;
    }
    local_message = "";
    local_errors = validate_credentials(
      {
        email: email.trim(),
        full_name: full_name.trim(),
        password,
        confirm_password,
      },
      signup,
    );
    if (Object.keys(local_errors).length) {
      cancel();
      await tick();
      error_summary?.focus();
      return;
    }
    busy = true;
    return async ({ result, update }) => {
      busy = false;
      password = "";
      confirm_password = "";
      if (result.type === "error") {
        local_message =
          "We couldn’t reach the sign-in service. Please try again.";
        return;
      }
      if (result.type === "redirect") clear_session_user();
      await update({ reset: false });
      if (result.type === "failure") error_summary?.focus();
    };
  }
</script>

<div class="auth_form_heading">
  <span class="auth_eyebrow"
    >{signup ? "MAKE YOUR NEXT MOVE" : "A LITTLE CLOSER TO WHAT’S NEXT"}</span
  >
  <h1>{signup ? "Your next chapter\nstarts with you." : "Welcome back."}</h1>
  <p>
    {signup
      ? "Create your account. Find the work and people that fit."
      : "Good to see you. Let’s pick up where you left off."}
  </p>
</div>
{#if message || Object.keys(errors).length}<div
    class="auth_alert"
    role="alert"
    tabindex="-1"
    bind:this={error_summary}
  >
    <Icon name="info" size={18} />
    <div>{message || "Please check the highlighted fields."}</div>
  </div>{/if}
<div class="auth_provider_pair">
  {#each primary_providers as provider}<button
      class="auth_provider"
      type="button"
      disabled={busy || !!redirecting_provider}
      on:click={() => start_sso(provider)}
      aria-label={`Continue with ${provider.label}`}
      ><span
        class="auth_provider_icon"
        class:linkedin={provider.slug === "linkedin_oidc"}
        >{@html provider.icon}</span
      >{provider.label}<Icon name="arrow-up-right" size={14} /></button
    >{/each}
</div>
<details class="auth_more_providers">
  <summary>More ways to continue <Icon name="chevron-down" size={12} /></summary
  >
  <div class="auth_other_providers">
    {#each other_providers as provider}<button
        class="auth_provider"
        type="button"
        disabled={busy || !!redirecting_provider}
        on:click={() => start_sso(provider)}
        aria-label={`Continue with ${provider.label}`}
        ><span class="auth_provider_icon">{@html provider.icon}</span
        >{provider.label}</button
      >{/each}
  </div>
</details>
{#if redirecting_provider}<p role="status" class="auth_status">
    Taking you to {sso_providers.find(
      (provider) => provider.slug === redirecting_provider,
    )?.label}…
  </p>{/if}
<div class="auth_divider"><span>or continue with email</span></div>
<form method="POST" use:enhance={submit} class="auth_form" aria-busy={busy}>
  {#if signup}<div class="auth_field">
      <label for="full_name">Full name</label><input
        id="full_name"
        name="full_name"
        autocomplete="name"
        placeholder="Your full name"
        required
        minlength="2"
        maxlength="100"
        bind:value={full_name}
        aria-invalid={!!errors.full_name}
        aria-describedby={errors.full_name ? "name_error" : undefined}
      />{#if errors.full_name}<small class="auth_field_error" id="name_error"
          >{errors.full_name}</small
        >{/if}
    </div>{/if}
  <div class="auth_field">
    <label for="email">Email address</label><input
      id="email"
      name="email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      required
      maxlength="254"
      bind:value={email}
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email_error" : undefined}
    />{#if errors.email}<small class="auth_field_error" id="email_error"
        >{errors.email}</small
      >{/if}
  </div>
  <div class="auth_field">
    <div class="auth_field_heading">
      <label for="password">Password</label>{#if !signup}<a href="/auth/help"
          >Forgot password?</a
        >{/if}
    </div>
    <div class="auth_password">
      <input
        id="password"
        name="password"
        type={show_password ? "text" : "password"}
        autocomplete={signup ? "new-password" : "current-password"}
        placeholder={signup ? "At least 8 characters" : "Enter your password"}
        required
        minlength={signup ? 8 : 1}
        maxlength="1024"
        value={password}
        on:input={(event) => (password = event.currentTarget.value)}
        aria-invalid={!!errors.password}
        aria-describedby={errors.password
          ? "password_error"
          : signup
            ? "password_hint"
            : undefined}
      /><button
        type="button"
        aria-label={show_password ? "Hide password" : "Show password"}
        aria-pressed={show_password}
        on:click={() => (show_password = !show_password)}
        ><Icon name="eye" size={18} /></button
      >
    </div>
    {#if errors.password}<small class="auth_field_error" id="password_error"
        >{errors.password}</small
      >{:else if signup}<small id="password_hint"
        >Use 8 or more characters. A few memorable words work well.</small
      >{/if}
  </div>
  {#if signup}<div class="auth_field">
      <label for="confirm_password">Confirm password</label>
      <div class="auth_password">
        <input
          id="confirm_password"
          name="confirm_password"
          type={show_confirmation ? "text" : "password"}
          autocomplete="new-password"
          placeholder="Enter your password again"
          required
          maxlength="1024"
          value={confirm_password}
          on:input={(event) => (confirm_password = event.currentTarget.value)}
          aria-invalid={!!errors.confirm_password}
          aria-describedby={errors.confirm_password
            ? "confirmation_error"
            : undefined}
        /><button
          type="button"
          aria-label={show_confirmation
            ? "Hide confirmation password"
            : "Show confirmation password"}
          aria-pressed={show_confirmation}
          on:click={() => (show_confirmation = !show_confirmation)}
          ><Icon name="eye" size={18} /></button
        >
      </div>
      {#if errors.confirm_password}<small
          class="auth_field_error"
          id="confirmation_error">{errors.confirm_password}</small
        >{/if}
    </div>{/if}
  <button
    type="submit"
    class="auth_primary"
    disabled={busy || !!redirecting_provider}
    >{#if busy}<span class="auth_spinner" aria-hidden="true"></span>{signup
        ? "Creating your account…"
        : "Signing you in…"}{:else}{signup
        ? "Create my account"
        : "Sign in"}<Icon name="arrow-right" size={18} />{/if}</button
  >
  <p class="auth_secure">
    <Icon name="lock" size={12} />Your account. Your next chapter.
  </p>
</form>
<p class="auth_switch">
  {signup ? "Already have an account?" : "New around here?"}
  <a href={signup ? "/login" : "/signup"}
    >{signup ? "Sign in" : "Create an account"}
    <span aria-hidden="true">↗</span></a
  >
</p>
