<script>
  import { page } from "$app/stores";
  import { profile, saved_jobs } from "./state";
  import Logo from "./logo.svelte";
  import Icon from "./icon.svelte";
  let menu_open = false;
  $: path = $page.url.pathname;
  $: if (path) menu_open = false;
  $: initials = $profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
</script>

<a class="skip_link" href="#main-content">Skip to content</a>
<div class="announcement">
  <div class="portal_container">
    <span>A little more clarity. A world of possibility.</span><a
      href="/#our-approach"
      >A fairer world of work <Icon name="arrow-up-right" size={13} /></a
    >
  </div>
</div>
<header class="portal_header">
  <div class="portal_container header_inner">
    <a href="/" class="brand_link" aria-label="Referise home"><Logo /></a>
    <nav class="desktop_nav" aria-label="Main navigation">
      <a
        href="/jobs"
        class:active={path.startsWith("/jobs") &&
          !$page.url.searchParams.has("saved")}>Find a job</a
      >
      <a href="/#companies">Explore companies</a>
      <a href="/#our-approach">Our approach</a>
    </nav>
    <div class="header_actions">
      <a
        class="saved_nav"
        href="/jobs?saved=1"
        aria-label={`Saved jobs, ${$saved_jobs.length} saved`}
        ><Icon name="bookmark" size={18} /><span>Saved jobs</span
        >{#if $saved_jobs.length}<span class="small_count"
            >{$saved_jobs.length}</span
          >{/if}</a
      >
      <span class="nav_divider"></span>
      <a href="/profile" class="profile_nav" aria-label="Your profile"
        ><span class="avatar_mini">{initials || "AM"}</span><span
          >My profile</span
        ><Icon name="chevron-down" size={14} /></a
      >
      <button
        class="icon_button mobile_menu_button"
        aria-label={menu_open ? "Close navigation" : "Open navigation"}
        aria-expanded={menu_open}
        aria-controls="mobile_navigation"
        on:click={() => (menu_open = !menu_open)}
        ><Icon name={menu_open ? "close" : "menu"} /></button
      >
    </div>
  </div>
  {#if menu_open}<nav
      id="mobile_navigation"
      class="mobile_navigation"
      aria-label="Mobile navigation"
    >
      <a href="/jobs" on:click={() => (menu_open = false)}
        >Find a job <Icon name="arrow-right" size={17} /></a
      ><a href="/#companies" on:click={() => (menu_open = false)}
        >Explore companies</a
      ><a href="/#our-approach" on:click={() => (menu_open = false)}
        >Our approach</a
      ><a href="/jobs?saved=1" on:click={() => (menu_open = false)}
        >Saved jobs ({$saved_jobs.length})</a
      ><a href="/profile" on:click={() => (menu_open = false)}>My profile</a>
    </nav>{/if}
</header>
