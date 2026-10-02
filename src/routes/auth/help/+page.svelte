<script>
  import Auth_shell from "$lib/auth/auth_shell.svelte";
  import Icon from "$lib/portal/icon.svelte";
</script>

<svelte:head><title>Sign-in help — Referise</title></svelte:head>
<Auth_shell>
  <div class="auth_message_icon"><Icon name="lock" size={28} /></div>
  <div class="auth_form_heading">
    <span class="auth_eyebrow">LET’S GET YOU BACK IN</span>
    <h1>A little help<br />with signing in.</h1>
    <p>
      Choose the situation that fits. You don’t need to start your profile over.
    </p>
  </div>
  <div class="auth_help_list">
    <details class="auth_help_detail" open>
      <summary>Forgot your password?</summary>
      <p>
        Password reset isn’t available in this version yet. Contact your account
        administrator for help recovering your email/password account.
      </p>
      <p>
        If you originally joined with Google, LinkedIn or another provider, use
        that same provider to sign in. Reset its password through that provider
        if needed.
      </p>
    </details>
    <details class="auth_help_detail">
      <summary>Waiting for a confirmation email?</summary>
      <p>
        Check your spam or junk folder and confirm that you entered the correct
        address. After following the confirmation link, return here to sign in.
      </p>
      <a href="/auth/check-email">View confirmation steps ↗</a>
    </details>
    <details class="auth_help_detail">
      <summary>Your sign-in provider isn’t working?</summary>
      <p>
        Retry the same provider you used when you joined. Some providers may be
        temporarily unavailable. If the problem continues, contact your account
        administrator.
      </p>
    </details>
    <details class="auth_help_detail">
      <summary>Too many attempts or an unavailable account?</summary>
      <p>
        For too many attempts, wait before retrying. If your account is
        unavailable, your account administrator will need to review it.
      </p>
    </details>
  </div>
  <a class="auth_primary" href="/login"
    >Back to sign in <Icon name="arrow-right" size={18} /></a
  >
  <p class="auth_switch">
    Just exploring? <a href="/jobs">Browse opportunities ↗</a>
  </p>
</Auth_shell>
