<script>
  import Logo from "./logo.svelte";
  import Icon from "./icon.svelte";
  import Modal from "./modal.svelte";
  export let compact = false;
  let privacy = false;
</script>

<footer class="portal_footer" class:compact>
  <div class="portal_container">
    {#if !compact}<div class="footer_main">
        <div class="footer_brand">
          <a href="/" aria-label="Referise home"><Logo /></a>
          <p>
            Good work starts with a fair chance.<br />Let’s open a few more
            doors.
          </p>
        </div>
        <div class="footer_links">
          <span>YOUR NEXT CHAPTER</span><a href="/jobs">Find a job</a><a
            href="/jobs?mode=Remote">Work from anywhere</a
          ><a href="/jobs?saved=1">Saved opportunities</a>
        </div>
        <div class="footer_links">
          <span>MAKE YOURSELF KNOWN</span><a href="/profile">Your profile</a><a
            href="/#companies">Explore companies</a
          ><a href="/#our-approach">The Referise approach</a>
        </div>
        <div class="footer_note">
          <span class="eyebrow_label">BUILT AROUND PEOPLE</span>
          <p>Where potential<br /><em>gets a fair chance.</em></p>
          <Icon name="arrow-up-right" size={28} />
        </div>
      </div>{/if}
    <div class="footer_bottom">
      <span>© {new Date().getFullYear()} Referise. A world of possibility.</span
      ><span class="preview_label"
        ><span></span>Interactive preview · Sample data</span
      ><button on:click={() => (privacy = true)}
        >Privacy & your data <Icon name="arrow-up-right" size={12} /></button
      >
    </div>
  </div>
</footer>
{#if privacy}<Modal
    title="Your data, your choice"
    on:close={() => (privacy = false)}
    ><div class="modal_copy">
      <p>
        This is an interactive design preview. The people, companies,
        opportunities, and activity shown are sample content.
      </p>
      <p>
        Saved jobs, profile edits, searches, and preview applications are stored
        only in this browser. This preview does not send applications or upload
        résumés to an employer.
      </p>
      <p>
        You can change profile visibility and résumé preferences from your
        profile. These illustrate the intended controls; server-enforced privacy
        will be connected with the product APIs.
      </p>
      <a
        class="button button_dark"
        href="/profile?tab=preferences"
        on:click={() => (privacy = false)}
        >Manage preferences <Icon name="arrow-right" size={16} /></a
      >
    </div></Modal
  >{/if}
