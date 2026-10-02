<script>
  import { onMount as on_mount } from "svelte";
  import { goto } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Logo from "$lib/portal/logo.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import { get } from "svelte/store";
  import Filter_panel from "$lib/portal/filter_panel.svelte";
  import {
    default_filters,
    filters_from_params,
    filters_to_params,
    filter_error,
  } from "$lib/portal/search.js";
  import Modal from "$lib/portal/modal.svelte";
  import {
    jobs,
    companies,
    get_company,
    salary as format_salary,
  } from "$lib/portal/data";
  import {
    saved_jobs,
    toggle_saved,
    applications,
    search_filters,
    viewing_currency,
    toast,
  } from "$lib/portal/state";
  import {
    platform_metrics,
    landing_faqs,
    preview_topics,
  } from "$lib/portal/landing_content";
  import "$lib/portal/landing.css";

  let advanced = default_filters();
  let advanced_open = false;
  let sector = "";
  let query = "";
  let location = "";
  let country = "";
  let work_mode = "";
  let experience = "";
  let industry = "";
  let search_type = "jobs";
  let company_query = "";
  let company_location = "";
  let company_country = "";
  let active_category = "All roles";
  let selected_company = null;
  let topic = "";
  let mobile_menu = false;
  let motion_paused = false;
  let page_root;
  const categories = ["All roles", "Design", "Engineering", "Product"];
  $: featured_jobs = jobs
    .filter(
      (job) =>
        (active_category === "All roles" || job.category === active_category) &&
        !$applications.includes(job.id) &&
        !job.unlisted &&
        job.posted <= 30,
    )
    .slice(0, 3);
  $: visible_companies = companies.filter(
    (company) =>
      `${company.name} ${company.sector} ${company.description}`
        .toLowerCase()
        .includes(company_query.toLowerCase()) &&
      company.location.toLowerCase().includes(company_location.toLowerCase()) &&
      company.location.toLowerCase().includes(company_country.toLowerCase()),
  );

  $: displayed_companies =
    company_query || company_location || company_country
      ? visible_companies
      : visible_companies.slice(0, 3);

  on_mount(() => {
    advanced = structuredClone(get(search_filters));
    query = advanced.query;
    location = advanced.location;
    work_mode = advanced.modes.length === 1 ? advanced.modes[0] : "";
    experience = advanced.levels.length === 1 ? advanced.levels[0] : "";
    industry = advanced.categories.length === 1 ? advanced.categories[0] : "";
    sector = advanced.industries.length === 1 ? advanced.industries[0] : "";
    const reduced_motion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    motion_paused = reduced_motion.matches;
    const update_motion = (event) => (motion_paused = event.matches);
    reduced_motion.addEventListener("change", update_motion);
    const reveal_observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is_visible");
            reveal_observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    page_root
      .querySelectorAll(".reveal")
      .forEach((element) => reveal_observer.observe(element));
    const dismiss_menus = (event) => {
      page_root.querySelectorAll(".nav_dropdown[open]").forEach((element) => {
        if (
          event.key === "Escape" ||
          (event.type === "click" &&
            (!element.contains(event.target) || event.target.closest("a")))
        ) {
          element.removeAttribute("open");
          if (event.key === "Escape") element.querySelector("summary")?.focus();
        }
      });
      if (event.key === "Escape") mobile_menu = false;
    };
    document.addEventListener("click", dismiss_menus);
    document.addEventListener("keydown", dismiss_menus);
    return () => {
      reveal_observer.disconnect();
      reduced_motion.removeEventListener("change", update_motion);
      document.removeEventListener("click", dismiss_menus);
      document.removeEventListener("keydown", dismiss_menus);
    };
  });

  function search() {
    if (search_type === "companies") {
      company_query = query.trim();
      company_location = location.trim();
      company_country = country;
      document.getElementById("companies")?.scrollIntoView({
        behavior: motion_paused ? "instant" : "smooth",
        block: "start",
      });
      return;
    }
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    const search_location = location.trim();
    const remote_search = search_location.toLowerCase() === "remote";
    if (remote_search) {
      params.set("mode", "Remote");
      if (country) params.set("location", country);
    } else {
      if (search_location || country)
        params.set(
          "location",
          search_location &&
            country &&
            !search_location.toLowerCase().includes(country.toLowerCase())
            ? `${search_location}, ${country}`
            : search_location || country,
        );
      if (work_mode) params.set("mode", work_mode);
    }
    if (experience) params.set("level", experience);
    if (industry) params.set("category", industry);
    const quick = filters_from_params(params);
    advanced = {
      ...advanced,
      query: quick.query,
      location: quick.location,
      modes: work_mode || remote_search ? quick.modes : advanced.modes,
      levels: experience ? quick.levels : advanced.levels,
      categories: industry ? quick.categories : advanced.categories,
      industries: sector ? [sector] : advanced.industries,
    };
    run_search();
  }

  function run_search() {
    const error = filter_error(advanced);
    if (error) {
      toast(error);
      return;
    }
    advanced = filters_from_params(filters_to_params(advanced));
    search_filters.set(structuredClone(advanced));
    viewing_currency.set(advanced.currency);
    const params = filters_to_params(advanced);
    goto(`/jobs${params.size ? `?${params}` : ""}`);
  }
  function open_advanced() {
    const search_location = location.trim();
    const remote_search = search_location.toLowerCase() === "remote";
    advanced = {
      ...advanced,
      query,
      location: remote_search
        ? country
        : search_location &&
            country &&
            !search_location.toLowerCase().includes(country.toLowerCase())
          ? `${search_location}, ${country}`
          : search_location || country,
      modes: remote_search
        ? ["Remote"]
        : work_mode
          ? [work_mode]
          : advanced.modes,
      levels: experience ? [experience] : advanced.levels,
      categories: industry ? [industry] : advanced.categories,
      industries: sector ? [sector] : advanced.industries,
    };
    advanced_open = true;
  }
  function open_topic(value) {
    topic = value;
    mobile_menu = false;
    page_root
      .querySelectorAll(".nav_dropdown[open]")
      .forEach((element) => element.removeAttribute("open"));
  }
</script>

<svelte:head>
  <title>Referise — Your talent. A world of possibility.</title>
  <meta
    name="description"
    content="A more human way to find your next chapter. Explore global opportunities, thoughtful teams, and a clearer hiring experience with Referise."
  />
  <link rel="preload" as="image" href="/illustrations/career_companions.png" />
</svelte:head>

<div class="landing_refresh" class:motion_paused bind:this={page_root}>
  <a class="skip_link" href="#main-content">Skip to content</a>
  <header class="refresh_header">
    <div class="refresh_nav landing_container">
      <a href="/" aria-label="Referise home"><Logo /></a>
      <nav class="refresh_desktop_nav" aria-label="Main navigation">
        <details class="nav_dropdown">
          <summary>Find work <Icon name="chevron-down" size={13} /></summary>
          <div class="nav_popover">
            <a href="/jobs"
              >Search jobs <Icon name="arrow-up-right" size={15} /></a
            ><a href="/jobs?saved=1">Saved jobs</a><button
              on:click={() => open_topic("applications")}>Applied jobs</button
            >
          </div>
        </details>
        <details class="nav_dropdown">
          <summary>Companies <Icon name="chevron-down" size={13} /></summary>
          <div class="nav_popover">
            <a href="#companies">Explore companies</a><button
              on:click={() => open_topic("employer")}>Create a company</button
            ><button on:click={() => open_topic("dashboard")}>My company</button
            >
          </div>
        </details>
        <a href="#our-approach">Our approach</a>
        <details class="nav_dropdown">
          <summary>My space <Icon name="chevron-down" size={13} /></summary>
          <div class="nav_popover">
            <a href="/profile">My profile</a><button
              on:click={() => open_topic("dashboard")}
              >Job post dashboard</button
            >
          </div>
        </details>
      </nav>
      <div class="refresh_nav_actions">
        <button class="install_control" on:click={() => open_topic("install")}
          ><Icon name="download" size={15} /><span>Install app</span></button
        >
        <a class="sign_in_link" href="/login">Sign in</a>
        <button
          class="r_button small dark"
          on:click={() => open_topic("employer")}
          >Post a job <Icon name="plus" size={14} /></button
        >
        <button
          class="mobile_nav_toggle"
          aria-label={mobile_menu ? "Close menu" : "Open menu"}
          aria-expanded={mobile_menu}
          aria-controls="landing_mobile_nav"
          on:click={() => (mobile_menu = !mobile_menu)}
          ><Icon name={mobile_menu ? "close" : "menu"} /></button
        >
      </div>
    </div>
    {#if mobile_menu}<nav
        class="refresh_mobile_nav"
        id="landing_mobile_nav"
        aria-label="Mobile navigation"
      >
        <a href="/jobs">Find work</a><a
          href="#companies"
          on:click={() => (mobile_menu = false)}>Explore companies</a
        ><a href="#our-approach" on:click={() => (mobile_menu = false)}
          >Our approach</a
        ><a href="/profile">My profile</a><a href="/jobs?saved=1">Saved jobs</a
        ><button on:click={() => open_topic("applications")}
          >Applied jobs</button
        ><button on:click={() => open_topic("dashboard")}
          >Company & job dashboard</button
        ><button on:click={() => open_topic("employer")}
          >Create a company</button
        ><button on:click={() => open_topic("install")}>Install app</button><a
          href="/login">Sign in</a
        ><a href="/signup">Create an account</a>
      </nav>{/if}
  </header>

  <main id="main-content">
    <section class="new_hero" aria-labelledby="landing_title">
      <div class="landing_container">
        <div class="hero_grid">
          <div class="new_hero_copy">
            <span class="hero_eyebrow"
              ><span class="tiny_star">✳</span> SKILLS FIRST. POSSIBILITIES EVERYWHERE.</span
            >
            <h1 id="landing_title">
              Your talent.<br />A world of<br /><span
                >possibility<svg viewBox="0 0 470 19" aria-hidden="true"
                  ><path d="M5 13C103 3 293 4 463 8" /></svg
                >.</span
              >
            </h1>
            <p>
              There’s good work out there with your name on it.<br
                class="desktop_break"
              />
              Find the roles, the people, and the possibilities<br
                class="desktop_break"
              /> that feel right for you.
            </p>
            <div class="hero_micro">
              <span class="micro_arrow">↗</span><span
                >Big ambitions welcome.<br /><strong
                  >Every background. Every next chapter.</strong
                ></span
              >
            </div>
          </div>
          <div
            class="hero_art reveal"
            aria-label="A friendly career companion stepping through a blue doorway into a new opportunity"
            role="img"
          >
            <svg class="orbit_path" viewBox="0 0 500 480" aria-hidden="true"
              ><path
                d="M33 362C-12 178 437 461 458 236S78 26 125 176"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-dasharray="5 8"
              /></svg
            >
            <span class="art_coordinate">NEXT CHAPTER / 01</span>
            <div class="portal_arch">
              <div class="arch_inner"></div>
              <div class="arch_floor"></div>
              <span class="arch_spark">✳</span>
            </div>
            <div class="hero_character">
              <Companion kind="blue" size={300} />
            </div>
            <div class="good_work_stamp">
              <Icon name="arrow-up-right" size={32} /><span
                >GOOD WORK<br />AHEAD</span
              >
            </div>
            <div class="potential_ticket">
              <div class="ticket_heading">
                <span class="ticket_avatar"
                  ><Companion kind="peach" size={45} /></span
                ><span
                  >YOU, AT YOUR BEST<small>Skills. Experience. Potential.</small
                  ></span
                >
              </div>
              <strong>More than<br />a résumé.</strong>
              <div class="ticket_skills">
                <span>Curiosity</span><span>Good ideas</span><span>You +</span>
              </div>
              <div class="ticket_line">
                <span></span><span></span><span></span>
              </div>
            </div>
            <div class="chapter_ticket">
              <span>YOUR NEXT MOVE</span><strong
                >Something<br />worth waking up for.</strong
              ><Icon name="arrow-up-right" size={23} />
            </div>
            <span class="chapter_note"
              >A little courage. A lot of possibility.</span
            >
          </div>
        </div>
        <form class="refresh_search" on:submit|preventDefault={search}>
          <div class="search_heading">
            <div class="search_type_switch" aria-label="Search for">
              <button
                type="button"
                class:active={search_type === "jobs"}
                aria-pressed={search_type === "jobs"}
                on:click={() => (search_type = "jobs")}
                ><Icon name="briefcase" size={15} />Find a job</button
              ><button
                type="button"
                class:active={search_type === "companies"}
                aria-pressed={search_type === "companies"}
                on:click={() => (search_type = "companies")}
                ><Icon name="building" size={15} />Find a company</button
              >
            </div>
            <span class="search_note">One search. A whole new chapter.</span>
          </div>
          <div class="search_input_row">
            <label
              ><Icon name="search" size={20} /><span class="sr_only"
                >{search_type === "jobs"
                  ? "Job title, skill, or company"
                  : "Company name or industry"}</span
              ><input
                bind:value={query}
                placeholder={search_type === "jobs"
                  ? "Job title, skill, or company"
                  : "Company name or industry"}
              /></label
            ><label
              ><Icon name="location" size={19} /><span class="sr_only"
                >City, country, or remote</span
              ><input
                bind:value={location}
                placeholder="City, country, or remote"
              /></label
            ><button class="r_button blue" type="submit"
              >{search_type === "jobs"
                ? "Find my next role"
                : "Explore companies"}<Icon
                name="arrow-right"
                size={18}
              /></button
            >
          </div>
          <div class="search_filters">
            <span>Refine your search</span><label
              ><span class="sr_only">Country</span><select
                aria-label="Country"
                bind:value={country}
                ><option value="">Country</option><option>India</option><option
                  >United Kingdom</option
                ><option>United States</option></select
              ></label
            >{#if search_type === "jobs"}<label
                ><span class="sr_only">Work mode</span><select
                  aria-label="Work mode"
                  bind:value={work_mode}
                  on:change={() =>
                    (advanced.modes = work_mode ? [work_mode] : [])}
                  ><option value="">Work mode</option><option>Remote</option
                  ><option>Hybrid</option><option>On-site</option></select
                ></label
              ><label
                ><span class="sr_only">Experience</span><select
                  aria-label="Experience"
                  bind:value={experience}
                  on:change={() =>
                    (advanced.levels = experience ? [experience] : [])}
                  ><option value="">Experience</option><option
                    >Entry-level</option
                  ><option>Mid-level</option><option>Senior</option><option
                    >Lead</option
                  ></select
                ></label
              ><label
                ><span class="sr_only">Department</span><select
                  aria-label="Department"
                  bind:value={industry}
                  on:change={() =>
                    (advanced.categories = industry ? [industry] : [])}
                  ><option value="">Department</option><option>Design</option
                  ><option>Engineering</option><option>Product</option><option
                    >Marketing</option
                  ><option>Data</option><option>Operations</option></select
                ></label
              ><label
                ><span class="sr_only">Industry</span><select
                  aria-label="Industry"
                  bind:value={sector}
                  on:change={() =>
                    (advanced.industries = sector ? [sector] : [])}
                  ><option value="">Industry</option
                  >{#each companies as company}<option value={company.sector}
                      >{company.sector}</option
                    >{/each}</select
                ></label
              ><button
                type="button"
                class="advanced_search_link"
                on:click={open_advanced}
                >All filters <Icon name="filter" size={14} /></button
              >{/if}<span class="search_preview_note"
              >Explore the preview <span class="status_dot"></span></span
            >
          </div>
        </form>
        <div class="trending_links">
          <span>A FEW PLACES TO START</span><a href="/jobs?mode=Remote"
            >Anywhere, remotely <Icon name="arrow-up-right" size={13} /></a
          ><a href="/jobs?category=Design"
            >Design something better <Icon name="arrow-up-right" size={13} /></a
          ><a href="/jobs?level=Entry-level"
            >Make your first move <Icon name="arrow-up-right" size={13} /></a
          >
        </div>
      </div>
    </section>
    <div class="company_strip landing_container">
      <span
        >GET TO KNOW THE TEAMS<br /><strong>IN OUR DESIGN PREVIEW</strong></span
      >
      <div>
        {#each companies as company}<button
            on:click={() => (selected_company = company)}
            ><Company_logo id={company.id} size={26} />{company.name}</button
          >{/each}
      </div>
    </div>

    <section
      class="opportunities_section landing_container"
      id="opportunities"
      aria-labelledby="opportunity_title"
    >
      <div class="landing_section_heading">
        <div>
          <span class="section_kicker">01 / FIND YOUR FIT</span>
          <h2 id="opportunity_title">
            Good work.<br /><span>A great next step.</span>
          </h2>
        </div>
        <div class="heading_aside">
          <p>
            Fresh challenges. Clear expectations.<br />A little closer to where
            you want to be.
          </p>
          <a class="inline_link" href="/jobs"
            >Explore all {jobs.length} sample roles <Icon
              name="arrow-up-right"
              size={18}
            /></a
          >
        </div>
      </div>
      <div class="feed_toolbar">
        <div class="window_tabs" aria-label="Featured job categories">
          {#each categories as category}<button
              class:active={active_category === category}
              aria-pressed={active_category === category}
              on:click={() => (active_category = category)}>{category}</button
            >{/each}
        </div>
        <a href="/jobs?saved=1" class="saved_link"
          ><Icon name="bookmark" size={15} /> Your shortlist
          <span>{$saved_jobs.length}</span></a
        >
      </div>
      <div class="role_list" aria-live="polite">
        {#each featured_jobs as job (job.id)}{@const company = get_company(
            job.company,
          )}
          <article class="opportunity_card">
            <div class="role_cover">
              <div class="role_top">
                <Company_logo id={company.id} size={44} /><span
                  >{company.name}<small>{company.sector}</small></span
                ><button
                  class="mini_save"
                  class:is_saved={$saved_jobs.includes(job.id)}
                  aria-label={`${$saved_jobs.includes(job.id) ? "Unsave" : "Save"} ${job.title}`}
                  aria-pressed={$saved_jobs.includes(job.id)}
                  on:click={() => toggle_saved(job.id)}
                  ><Icon
                    name={$saved_jobs.includes(job.id) ? "check" : "bookmark"}
                    size={18}
                  /></button
                >
              </div>
              <h3><a href={`/jobs/${job.id}`}>{job.title}</a></h3>
              <div class="role_location">
                <Icon name="location" size={13} />{job.location}<span
                  >{job.mode}</span
                >
              </div>
              <span class="cover_plus" aria-hidden="true">+</span>
            </div>
            <div class="role_body">
              <div class="role_meta">
                <span>{job.type}</span><span>{job.level}</span><span
                  >{job.posted === 0 ? "Today" : `${job.posted}d ago`}</span
                >
              </div>
              <p class="role_summary">{job.summary}</p>
              <div class="role_skills">
                {#each job.skills.slice(0, 3) as skill}<span>{skill}</span
                  >{/each}
              </div>
              <div class="role_salary">
                <strong>{format_salary(job)}</strong><span
                  >Annual compensation</span
                >
              </div>
              <div class="role_bottom">
                <span><span class="status_dot"></span>{job.application}</span><a
                  href={`/jobs/${job.id}`}
                  class="role_link"
                  >View role <span
                    ><Icon name="arrow-up-right" size={19} /></span
                  ></a
                >
              </div>
            </div>
          </article>
        {/each}
      </div>
      <div class="opportunities_note">
        <Icon name="shield" size={15} /><span
          >Your skills tell the story. Your next role should recognise them.</span
        ><span>Illustrative roles · Company verification is a preview</span>
      </div>
    </section>

    <section class="teams_section" id="companies">
      <div class="landing_container teams_layout">
        <div class="teams_intro">
          <span class="section_kicker">02 / FIND YOUR PEOPLE</span>
          <h2>
            Great things<br />happen with<br /><span>the right team.</span>
          </h2>
          <p>
            Look beyond the job title. Meet the people building something you
            want to be part of.
          </p>
          <div class="team_companions reveal">
            <Companion kind="peach" size={115} /><Companion
              kind="sage"
              size={115}
            /><span class="team_spark">✳</span>
          </div>
          <span class="team_caption"
            >Different people. Shared possibilities.</span
          >
        </div>
        <div class="teams_directory">
          <div class="directory_heading">
            <span>TEAMS TO GET TO KNOW</span><span
              >Sample company directory <Icon
                name="arrow-right"
                size={14}
              /></span
            >
          </div>
          <div class="company_search_status" aria-live="polite">
            {#if company_query || company_location || company_country}<p>
                {visible_companies.length} sample {visible_companies.length ===
                1
                  ? "company"
                  : "companies"} matching {company_query
                  ? `“${company_query}”`
                  : "your search"}{company_location || company_country
                  ? ` in ${[company_location, company_country].filter(Boolean).join(", ")}`
                  : ""}.
              </p>
              <button
                on:click={() => {
                  company_query = "";
                  company_location = "";
                  company_country = "";
                }}>Clear search</button
              >{/if}
          </div>
          <div class="teams_grid">
            {#each displayed_companies as company}<button
                class="team_card"
                on:click={() => (selected_company = company)}
                ><Company_logo id={company.id} size={52} />
                <div>
                  <h3>{company.name}</h3>
                  <p>{company.tagline}</p>
                  <div class="team_tags">
                    <span>{company.sector}</span><span>{company.location}</span
                    ><span>{company.size}</span>
                  </div>
                </div>
                <span class="team_openings"
                  ><strong
                    >{jobs.filter((job) => job.company === company.id)
                      .length}</strong
                  >open roles</span
                ><span class="team_arrow"
                  ><Icon name="arrow-up-right" size={21} /></span
                ></button
              >{/each}
          </div>
          {#if !visible_companies.length}<div class="company_empty">
              <h3>No matches just yet.</h3>
              <p>
                Try a name like Forma, or take a look at all our sample teams.
              </p>
              <button
                class="r_button lime"
                on:click={() => {
                  company_query = "";
                  company_location = "";
                  company_country = "";
                }}
                >Show sample teams <Icon name="arrow-right" size={16} /></button
              >
            </div>{/if}
          <div class="hiring_invitation">
            <Icon name="building" size={22} />
            <div>
              <strong>Building something good?</strong><span
                >Make room for your next great hire.</span
              >
            </div>
            <button on:click={() => open_topic("employer")}
              >Let’s find your people <Icon
                name="arrow-up-right"
                size={16}
              /></button
            >
          </div>
        </div>
      </div>
    </section>

    <section class="confidence_section landing_container" id="our-approach">
      <div class="landing_section_heading">
        <div>
          <span class="section_kicker">03 / BUILT AROUND YOU</span>
          <h2>Less friction.<br /><span>More forward.</span></h2>
        </div>
        <div class="heading_aside">
          <p>
            From the first search to your next chapter.<br />The details that
            make a difference.
          </p>
          <a class="inline_link" href="/profile"
            >Explore your profile <Icon name="arrow-up-right" size={18} /></a
          >
        </div>
      </div>
      <div class="feature_grid">
        <article class="pocket_feature">
          <div class="feature_text">
            <span class="feature_index">01 — TAKE POSSIBILITY WITH YOU</span>
            <h3>A world of work.<br />Right in your pocket.</h3>
            <p>
              Pick up where you left off. An app-like experience designed to
              move with your life.
            </p>
            <ul>
              <li><Icon name="check" size={14} />Native PWA experience</li>
              <li>
                <Icon name="check" size={14} />Offline discovery & background
                sync
              </li>
              <li>
                <Icon name="check" size={14} />Desktop & mobile continuity
              </li>
            </ul>
            <button class="inline_link" on:click={() => open_topic("install")}
              >Meet your pocket companion <Icon
                name="arrow-up-right"
                size={18}
              /></button
            >
          </div>
          <div class="phone_scene" aria-hidden="true">
            <div class="phone_orbit"></div>
            <span class="phone_star">✳</span>
            <div class="career_phone">
              <div class="phone_notch"></div>
              <span class="phone_wordmark">referise.</span><span
                class="phone_hello">Hey, possibility.</span
              ><strong>Your next<br />chapter is calling.</strong>
              <div class="phone_search">
                <Icon name="search" size={12} />Find your next role
              </div>
              <div class="phone_role">
                <span>F</span>
                <div>
                  <strong>Product Designer</strong><small>Forma · Hybrid</small>
                </div>
                <Icon name="bookmark" size={13} />
              </div>
              <div class="phone_role">
                <span>L</span>
                <div>
                  <strong>Frontend Engineer</strong><small
                    >Layers · Remote</small
                  >
                </div>
                <Icon name="bookmark" size={13} />
              </div>
              <span class="phone_button">Explore opportunities ↗</span>
            </div>
            <div class="phone_chip">
              <Icon name="globe" size={18} />Your world. Your way.
            </div>
          </div>
        </article>
        <article class="trust_feature">
          <div class="feature_text">
            <span class="feature_index">02 — EXPERIENCE THAT COUNTS</span>
            <h3>You did the work.<br />Let it speak for you.</h3>
            <p>
              Company-approved employment history and cryptographic vetting,
              built to make real experience count.
            </p>
            <button
              class="inline_link"
              on:click={() => open_topic("verification")}
              >See how trust works <Icon
                name="arrow-up-right"
                size={18}
              /></button
            >
          </div>
          <div class="trust_art">
            <Companion kind="sage" size={130} />
            <div class="trust_label">
              <Icon name="shield" size={18} /><span
                >Experience, verified.<small>Illustrative verification</small
                ></span
              >
            </div>
          </div>
          <div class="feature_tags">
            <span>Blue-tick verification</span><span>Recruiter activity</span
            ><span>Zero-ghosting vision</span>
          </div>
        </article>
        <article class="salary_feature">
          <div class="feature_text">
            <span class="feature_index">03 — THE FULL PICTURE, UPFRONT</span>
            <h3>Clear numbers.<br />Confident decisions.</h3>
            <p>
              Understand the offer, explore in your currency, and find a role
              that fits your expectations.
            </p>
            <button
              class="inline_link"
              on:click={() => open_topic("compensation")}
              >Let’s talk compensation <Icon
                name="arrow-up-right"
                size={18}
              /></button
            >
          </div>
          <div class="salary_art">
            <span>SAMPLE SALARY RANGE</span><strong
              >₹28–40<small>LPA</small></strong
            >
            <div class="salary_track"><span></span><i></i><i></i></div>
            <div class="currency_chips">
              <span>INR</span><span>USD</span><span>EUR</span><span>GBP</span>
            </div>
          </div>
          <div class="feature_tags">
            <span>Multi-currency</span><span>Private salary matching</span><span
              >Clear interview steps</span
            >
          </div>
        </article>
      </div>
      <p class="section_disclosure">
        A preview of the platform vision. Verification, live exchange rates, and
        app installation are planned integrations.
      </p>
    </section>

    <section class="reach_section" id="global-reach">
      <div class="landing_container reach_layout">
        <div class="reach_intro">
          <span class="section_kicker">04 / A BIGGER WORLD OF WORK</span>
          <h2>Good people.<br />Everywhere.</h2>
          <p>
            Talent doesn’t have a postcode.<br />Neither should opportunity.
          </p>
          <span class="metrics_note"
            >Illustrative platform figures<br />Planned daily updates</span
          ><svg
            class="reach_globe"
            width="130"
            height="130"
            viewBox="0 0 130 130"
            aria-hidden="true"
            ><circle cx="65" cy="65" r="60" /><ellipse
              cx="65"
              cy="65"
              rx="28"
              ry="60"
            /><path d="M5 65h120M15 34h100M15 96h100M65 5v120" /></svg
          >
        </div>
        <div class="reach_grid">
          {#each platform_metrics as metric}<article>
              <strong>{metric.value}</strong>
              <h3>{metric.label}</h3>
              <p>{metric.detail}</p>
              <span>{metric.note}</span>
            </article>{/each}
        </div>
      </div>
    </section>
    <section class="refresh_faq landing_container reveal" id="faq">
      <div class="faq_intro">
        <span class="section_kicker">05 / A LITTLE CLARITY</span>
        <h2>Good questions.<br />Clear answers.</h2>
        <p>
          Finding work comes with enough unknowns.<br />Let’s clear up a few.
        </p>
        <div class="faq_companion">
          <Companion kind="sage" size={114} /><span class="handwritten"
            >Glad you asked.</span
          >
        </div>
      </div>
      <div class="refresh_faq_list">
        {#each landing_faqs as faq}<details>
            <summary
              >{faq.question}<span class="faq_plus"
                ><Icon name="plus" size={17} /></span
              ></summary
            >
            <p>{faq.answer}</p>
          </details>{/each}
      </div>
    </section>

    <section class="refresh_closing">
      <div class="landing_container closing_garden">
        <div class="closing_copy">
          <span class="section_kicker">HERE’S TO WHAT COMES NEXT.</span>
          <h2>Your next chapter<br />looks good on you.</h2>
          <div class="closing_actions">
            <a class="r_button blue" href="/jobs"
              >Find my next role <Icon name="arrow-up-right" size={19} /></a
            ><button class="inline_link" on:click={() => open_topic("employer")}
              >I’m here to hire <Icon name="arrow-up-right" size={16} /></button
            >
          </div>
        </div>
        <div class="closing_art reveal">
          <div class="closing_arch"></div>
          <div class="closing_blue"><Companion kind="blue" size={225} /></div>
          <span class="closing_star">✳</span><span class="closing_caption"
            >Go on. Make your move.</span
          >
        </div>
      </div>
    </section>
  </main>
  <footer class="refresh_footer">
    <div class="refresh_footer_top landing_container">
      <div class="footer_brand_block">
        <a href="/" aria-label="Referise home"><Logo /></a>
        <p>
          Good work starts with a fair chance.<br />Let’s open a few more doors.
        </p>
        <span class="footer_brand_note"
          ><span class="status_dot"></span> A more human world of work.</span
        >
      </div>
      <div>
        <h3>FOR YOUR NEXT CHAPTER</h3>
        <a href="/jobs">Find jobs</a><a href="#companies">Browse companies</a><a
          href="/profile">Your profile</a
        ><a href="/jobs?saved=1">Saved opportunities</a><button
          on:click={() => open_topic("compensation")}>Salary calculator</button
        ><button on:click={() => open_topic("resources")}
          >Career resources</button
        >
      </div>
      <div>
        <h3>FOR YOUR NEXT GREAT HIRE</h3>
        <button on:click={() => open_topic("employer")}>Post a job</button
        ><button on:click={() => open_topic("employer")}
          >Create a company</button
        ><button on:click={() => open_topic("dashboard")}
          >Company dashboard</button
        ><button on:click={() => open_topic("talent")}>Talent search</button
        ><button on:click={() => open_topic("integrations")}
          >ATS integration</button
        ><button on:click={() => open_topic("pricing")}>Pricing</button><a
          href="#our-approach">Our approach</a
        >
      </div>
      <div>
        <h3>THE HELPFUL DETAILS</h3>
        <a href="#faq">Common questions</a><button
          on:click={() => open_topic("legal")}>Terms of service</button
        ><button on:click={() => open_topic("privacy")}>Privacy policy</button
        ><button on:click={() => open_topic("privacy")}
          >Cookie preferences</button
        ><button on:click={() => open_topic("security")}
          >Trust & security</button
        ><button on:click={() => open_topic("legal")}>Contact support</button>
      </div>
    </div>
    <div class="refresh_footer_bottom landing_container">
      <span>© {new Date().getFullYear()} Referise.</span><span
        >Design preview · Sample data</span
      ><button
        aria-pressed={motion_paused}
        on:click={() => (motion_paused = !motion_paused)}
        ><Icon name="spark" size={13} />
        {motion_paused ? "Motion off" : "Motion on"}</button
      ><a href="#main-content">Back to top ↑</a>
    </div>
  </footer>
</div>

{#if selected_company}<Modal
    title={`Meet ${selected_company.name}`}
    on:close={() => (selected_company = null)}
    ><div class="company_modal_intro">
      <Company_logo id={selected_company.id} size={60} />
      <div>
        <h3>{selected_company.tagline}</h3>
        <p>{selected_company.sector} · {selected_company.size}</p>
      </div>
    </div>
    <div class="modal_copy">
      <p>{selected_company.description}</p>
      <p>{selected_company.location} · Founded {selected_company.founded}</p>
      <p class="muted small_text">
        An illustrative company in the design preview.
      </p>
      <a
        class="button button_dark"
        href={`/jobs?q=${encodeURIComponent(selected_company.name)}`}
        >Explore open roles <Icon name="arrow-right" size={17} /></a
      >
    </div></Modal
  >{/if}
{#if topic}<Modal
    title={preview_topics[topic].title}
    on:close={() => (topic = "")}
    ><div class="modal_copy">
      <p>{preview_topics[topic].text}</p>
      <a
        class="button button_dark"
        href={preview_topics[topic].href}
        on:click={() => (topic = "")}
        >{preview_topics[topic].action}<Icon name="arrow-right" size={17} /></a
      >
    </div></Modal
  >{/if}

{#if advanced_open}<Modal
    title="Find work that fits"
    on:close={() => (advanced_open = false)}
    ><form on:submit|preventDefault={run_search}>
      <Filter_panel bind:filters={advanced} scope="landing" />
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => {
            advanced = default_filters();
            query = "";
            location = "";
            country = "";
            work_mode = "";
            experience = "";
            industry = "";
            sector = "";
          }}>Reset all</button
        ><button type="submit" class="button button_dark"
          >Search opportunities</button
        >
      </div>
    </form></Modal
  >{/if}
