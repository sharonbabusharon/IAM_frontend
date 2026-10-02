<script>
  import Logo from "$lib/portal/logo.svelte";
  import Icon from "$lib/portal/icon.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import "./auth.css";
  export let signup = false;
</script>

<svelte:head
  ><meta name="theme-color" content="#3155ef" /><meta
    name="robots"
    content="noindex"
  /><link rel="icon" href="/referise.svg" /></svelte:head
>
<div class="auth_page">
  <a class="auth_skip" href="#auth-content">Skip to sign-in options</a>
  <aside class="auth_story" aria-label="Welcome to Referise">
    <a class="auth_brand" href="/" aria-label="Referise home"><Logo light /></a>
    <div class="auth_story_copy">
      <span class="auth_eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
      <h2>Good work.<br />Good people.<br /><em>A place for you.</em></h2>
      <p>
        Your skills, your ambitions, your kind of team.<br />Let’s see where
        they take you.
      </p>
    </div>
    <div class="auth_illustration" aria-hidden="true">
      <div class="auth_arch arch_outer"></div>
      <div class="auth_arch arch_inner"></div>
      <span class="auth_spark">✳</span><span class="auth_orbit"></span>
      <div class="auth_career_card">
        <span class="auth_card_mark"><Icon name="briefcase" size={19} /></span>
        <div>
          <small>THE NEXT CHAPTER</small><strong
            >Made for your potential.</strong
          ><span>Explore. Connect. Grow.</span>
        </div>
        <span class="auth_card_arrow">↗</span>
      </div>
      <span class="auth_companion"
        ><Companion kind={signup ? "sage" : "peach"} size={215} /></span
      >
      <span class="auth_little_note"
        >A little curiosity.<br /><em>A world of possibility.</em></span
      >
    </div>
    <div class="auth_story_footer">
      <span class="auth_footer_dot"></span><span
        >Different paths. Equal possibility.</span
      ><span>01 / YOUR NEXT MOVE</span>
    </div>
  </aside>
  <div class="auth_workspace">
    <header class="auth_topbar">
      <a class="auth_mobile_brand" href="/" aria-label="Referise home"
        ><Logo /></a
      ><a href="/jobs"
        >Explore the opportunities <Icon name="arrow-up-right" size={15} /></a
      >
    </header>
    <main id="auth-content" class="auth_content"><slot /></main>
    <footer class="auth_footer">
      <span>© {new Date().getFullYear()} Referise</span><a href="/auth/help"
        >Need a hand? <Icon name="arrow-up-right" size={12} /></a
      >
    </footer>
  </div>
</div>
