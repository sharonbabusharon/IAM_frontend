<script>
  import Modal from "./modal.svelte";
  // Deletes the Referise account through /auth/account (which also drops the
  // session cookie). The IAM sign-in identity is kept.
  let open = false;
  let typed = "";
  let busy = false;
  let error = "";
  let companies = [];
  async function remove() {
    if (busy || typed !== "DELETE") return;
    busy = true;
    error = "";
    try {
      const response = await fetch("/auth/account", { method: "DELETE" });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        window.location.href = "/?account_deleted=1";
        return;
      }
      error = result?.error || "Something went wrong. Try again.";
      companies = result?.data?.companies ?? [];
    } catch {
      error = "You seem to be offline. Try again.";
    }
    busy = false;
  }
</script>

<section class="delete_account">
  <div>
    <strong>Delete your Referise account</strong>
    <p>
      Removes your profile, applications and saved jobs and signs you out
      everywhere. This can’t be undone.
    </p>
  </div>
  <button
    type="button"
    class="button button_outline button_small"
    on:click={() => {
      open = true;
      typed = "";
      error = "";
      companies = [];
    }}>Delete account</button
  >
</section>

{#if open}<Modal title="Delete your Referise account?" on:close={() => (open = false)}>
    <ul class="delete_account_effects">
      <li>Your profile, photo, applications, saved jobs, drafts and company memberships are deleted.</li>
      <li>Jobs you posted without a company are closed; a company’s jobs stay with the company.</li>
      <li>Any wallet balance is forfeited: deposits are non-refundable.</li>
      <li>Payment and consent records are kept, but no longer show your name or email.</li>
      <li>You’re signed out on every device. Your sign-in identity stays, so you can create a new account later.</li>
    </ul>
    <label class="field_label"
      >Type DELETE to confirm<input
        class="field_input"
        autocomplete="off"
        bind:value={typed}
      /></label
    >
    {#if error}<p class="form_error" role="alert">
        {error}{#if companies.length}<br />Companies: {companies.join(", ")}{/if}
      </p>{/if}
    <div class="form_actions">
      <button type="button" class="button button_outline" on:click={() => (open = false)}>Cancel</button
      ><button
        type="button"
        class="button button_dark"
        disabled={busy || typed !== "DELETE"}
        on:click={remove}>{busy ? "Deleting…" : "Delete my account"}</button
      >
    </div>
  </Modal>{/if}

<style>
  .delete_account {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--line, #dce1ef);
    margin-top: 20px;
    padding-top: 20px;
  }
  .delete_account p {
    margin: 4px 0 0;
  }
  .delete_account_effects {
    margin: 0 0 16px;
    padding-left: 18px;
    line-height: 1.5;
  }
</style>
