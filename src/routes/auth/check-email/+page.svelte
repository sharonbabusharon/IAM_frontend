<script>
  import Auth_shell from "$lib/auth/auth_shell.svelte";
  import Icon from "$lib/portal/icon.svelte";
  export let data;
</script>

<svelte:head><title>Confirm your email — Referise</title></svelte:head>
<Auth_shell signup>
  <div class="auth_message_icon">
    <Icon name="mail" size={29} /><span><Icon name="check" size={12} /></span>
  </div>
  <div class="auth_form_heading">
    <span class="auth_eyebrow">ONE SMALL STEP LEFT</span>
    <h1>Check your inbox.</h1>
    <p>
      {data.confirmation_pending
        ? "Your account needs email confirmation. Look for the confirmation link from Referise’s sign-in service."
        : "If you’ve just registered and were asked to confirm your email, open the confirmation link in your inbox."}
    </p>
  </div>
  <ol class="auth_steps">
    <li>
      <span>01</span>
      <div>
        <strong>Find your confirmation email</strong>
        <p>Check your spam or junk folder if it hasn’t arrived yet.</p>
      </div>
    </li>
    <li>
      <span>02</span>
      <div>
        <strong>Follow the link inside</strong>
        <p>Use the link to confirm that the email address belongs to you.</p>
      </div>
    </li>
    <li>
      <span>03</span>
      <div>
        <strong>Come back and sign in</strong>
        <p>Your next chapter will be waiting right here.</p>
      </div>
    </li>
  </ol>
  <a class="auth_primary" href="/login"
    >Continue to sign in <Icon name="arrow-right" size={18} /></a
  >
  <p class="auth_switch">
    Used the wrong address? <a href="/signup">Back to registration ↗</a>
  </p>
  <details class="auth_help_detail">
    <summary>Email still missing?</summary>
    <p>
      Give it a few minutes and check any filtered folders. This version doesn’t
      support resending confirmation emails yet. Your account administrator can
      help if the link doesn’t arrive or has expired.
    </p>
  </details>
</Auth_shell>
