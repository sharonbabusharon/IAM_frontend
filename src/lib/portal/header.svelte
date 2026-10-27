<script>
  import { page } from "$app/stores";
  import { goto, invalidateAll as invalidate_all } from "$app/navigation";
  import { onMount as on_mount } from "svelte";
  import Logo from "./logo.svelte";
  import Icon from "./icon.svelte";
  import Install_button from "./install_button.svelte";
  import {
    preview_account,
    premium_active,
    applications_remaining,
    membership_open,
  } from "./membership_state.js";
  export let user = null;
  export let companies = [];
  // "My company": the first company you belong to (admins first, so their
  // dashboard); none yet means create one.
  $: my_company = companies[0]
    ? companies[0].role === "admin"
      ? `/company/${companies[0].slug}/dashboard`
      : `/company/${companies[0].slug}`
    : "/company/create";
  let menu_open = false;
  $: sign_in_href = "/login?next=" + encodeURIComponent($page.url.pathname + $page.url.search);
  async function sign_out() {
    try {
      await fetch("/auth/logout", { method: "POST" });
    } catch (error) {
      // the session cookie is cleared server-side either way
    }
    await invalidate_all();
    goto("/");
  }
  let nav_root;
  $: groups = [
    {
      name: "Career",
      links: [
        ["My profile", "/profile"],
        ["Applications", "/applications"],
        ["Membership", "/profile?membership=1"],
      ],
    },
    {
      name: "Jobs",
      links: [
        ["Search jobs", "/jobs"],
        ["Saved jobs", "/saved-jobs"],
        ["Post a job", "/recruiter/post-job"],
        ["Hiring workspace", "/recruiter"],
      ],
    },
    {
      name: "Companies",
      links: [
        ["Explore companies", "/companies"],
        ["Create a company", "/company/create"],
        ["My company", my_company],
      ],
    },
    {
      name: "About",
      links: [
        ["Our approach", "/about"],
        ["FAQs", "/faq"],
        ["Contact us", "/contact"],
      ],
    },
  ];
  $: current_path = $page.url.pathname;
  $: if (current_path) {
    menu_open = false;
    nav_root
      ?.querySelectorAll("details[open]")
      .forEach((el) => el.removeAttribute("open"));
  }
  on_mount(() => {
    const dismiss = (event) => {
      nav_root.querySelectorAll("details[open]").forEach((el) => {
        if (
          event.key === "Escape" ||
          (event.type === "click" &&
            (!el.contains(event.target) || event.target.closest("a")))
        ) {
          el.removeAttribute("open");
          if (event.key === "Escape") el.querySelector("summary").focus();
        }
      });
      if (event.key === "Escape") menu_open = false;
    };
    document.addEventListener("click", dismiss);
    document.addEventListener("keydown", dismiss);
    return () => {
      document.removeEventListener("click", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  });
</script>

<a class="skip_link" href="#main-content">Skip to content</a>
<header class="unified_header" bind:this={nav_root}>
  <div class="unified_nav">
    <a href="/" aria-label="Referise home" class="unified_brand"><Logo /></a>
    <nav class="unified_desktop" aria-label="Main navigation">
      <a href="/" aria-current={current_path === "/" ? "page" : undefined}
        >Home</a
      >
      {#each groups as group}<details class="unified_dropdown">
          <summary>{group.name}<Icon name="chevron-down" size={13} /></summary>
          <div>
            {#each group.links as [label, href]}<a
                {href}
                aria-current={current_path === href ? "page" : undefined}
                >{label}<Icon name="arrow-up-right" size={14} /></a
              >{/each}
          </div>
        </details>{/each}
    </nav>
    <div class="unified_actions">
      <Install_button />
      {#if user || $preview_account.enabled}<button
          class="header_balance"
          on:click={() => membership_open.set(true)}
          aria-label="Preview application allowance and credits"
          ><strong
            >{$premium_active
              ? "Unlimited"
              : `${$applications_remaining} left today`}</strong
          ><small>{$preview_account.credits} credits · Preview</small></button
        >{/if}{#if user}<a class="unified_signin" href="/profile" title={user.email}
          >{user.name || user.email}</a
        ><button class="unified_signin" type="button" on:click={sign_out}
          >Sign out</button
        >{:else}<a class="unified_signin" href={sign_in_href}>Sign in</a>{/if}<a
        class="unified_post"
        href="/recruiter/post-job">Post a job <Icon name="plus" size={16} /></a
      >
      <button
        class="unified_toggle"
        aria-label={menu_open ? "Close navigation" : "Open navigation"}
        aria-expanded={menu_open}
        aria-controls="unified_mobile"
        on:click={() => (menu_open = !menu_open)}
        ><Icon name={menu_open ? "close" : "menu"} /></button
      >
    </div>
  </div>
  {#if menu_open}<nav
      id="unified_mobile"
      class="unified_mobile"
      aria-label="Mobile navigation"
    >
      <a href="/">Home</a>
      {#each groups as group}<details>
          <summary>{group.name}<Icon name="plus" size={16} /></summary>
          <div>
            {#each group.links as [label, href]}<a {href}
                >{label}<Icon name="arrow-right" size={15} /></a
              >{/each}
          </div>
        </details>{/each}
      <div class="mobile_account">
        {#if user}<a href="/profile">My profile</a><button
            type="button"
            on:click={sign_out}>Sign out</button
          >{:else}<a href={sign_in_href}>Sign in</a><a href="/signup"
            >Create an account</a
          >{/if}
      </div>
    </nav>{/if}
</header>
