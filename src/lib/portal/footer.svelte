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
          ><a href="/saved-jobs">Saved opportunities</a>
        </div>
        <div class="footer_links">
          <span>MAKE YOURSELF KNOWN</span><a href="/signup">Create an account</a
          ><a href="/login">Sign in</a><a href="/profile">Your profile</a><a
            href="/companies">Explore companies</a
          ><a href="/about">The Referise approach</a>
        </div>
        <div class="footer_note">
          <span class="eyebrow_label">BUILT AROUND PEOPLE</span>
          <p>Where potential<br /><em>gets a fair chance.</em></p>
          <Icon name="arrow-up-right" size={28} />
        </div>
      </div>{/if}
    <nav class="compact_footer_links" aria-label="Footer">
      <a href="/about">About us</a><a href="/faq">FAQ</a><a href="/contact"
        >Contact us</a
      ><a href="/terms">Terms & conditions</a><a href="/privacy">Privacy</a
      ><a href="/cookies">Cookie policy</a>
    </nav>
    <div class="footer_bottom">
      <span>© {new Date().getFullYear()} Referise. A world of possibility.</span
      ><span
        >Locations: <a href="https://www.geonames.org/" rel="noopener">GeoNames</a>
        (CC BY 4.0) · <a href="https://www.exchangerate-api.com" rel="noopener"
          >Rates by ExchangeRate-API</a
        ></span
      ><span class="preview_label"
        ><span></span>Early access</span
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
        Referise is in early access. Your profile, skills, projects, job posts,
        companies and applications are saved to your account.
      </p>
      <p>
        When you apply with Easy Apply, a copy of your profile goes to that
        employer, including your email and phone. Current salary is left out if
        you keep it private. Résumé files can’t be uploaded yet.
      </p>
      <p>
        Saved jobs, saved searches, followed companies and credits are still kept
        only in this browser. Profile visibility and salary privacy are enforced
        by the server for everyone who opens your profile.
      </p>
      <a
        class="button button_dark"
        href="/profile?tab=preferences"
        on:click={() => (privacy = false)}
        >Manage preferences <Icon name="arrow-right" size={16} /></a
      >
    </div></Modal
  >{/if}
