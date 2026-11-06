<script>
  import Heading from "$lib/portal/page_heading.svelte";
  import Delete_account from "$lib/portal/delete_account.svelte";
  import { legal_documents } from "$lib/portal/legal_documents.js";
  export let data;
  export let form;
</script>

<svelte:head><title>Review our terms — Referise</title></svelte:head>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="TRUST & TRANSPARENCY"
    title="Before you continue,"
    accent="a few documents."
    description="To use Referise, accept the current version of each document below. Open any of them to read it first."
    companion="blue"
  />
  {#if data.unavailable}<p class="workspace_hint warning" role="alert">
      The service is unavailable. Try again shortly.
    </p>{:else}<form method="POST" class="workspace_panel consent_form">
      {#each data.documents as doc}{@const info = legal_documents[doc.doc_id]}<label
          class="profile_field_check"
          ><input type="checkbox" name={`accept_${doc.doc_id}`} required />
          <span
            >I accept the <a href={info?.href ?? "#"} target="_blank" rel="noopener"
              >{info?.title ?? doc.doc_id}</a
            >
            <small class="muted"
              >Version {doc.version}{doc.accepted_version
                ? ` · updated since you accepted version ${doc.accepted_version}`
                : ""}</small
            ></span
          ></label
        >{/each}
      {#if form?.error}<p class="form_error" role="alert">{form.error}</p>{/if}
      <div class="form_actions">
        <button type="submit" class="button button_dark">Accept and continue</button>
      </div>
    </form>
    <section class="workspace_panel">
      <p class="small_text">
        Don’t want to accept? You can sign out, or delete your Referise account.
      </p>
      <Delete_account />
    </section>{/if}
</main>

<style>
  .consent_form {
    display: grid;
    gap: 14px;
    margin-bottom: 20px;
  }
  .consent_form small {
    display: block;
  }
</style>
