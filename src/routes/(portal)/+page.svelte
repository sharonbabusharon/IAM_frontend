<script>
  import Designation_picker from "$lib/portal/designation_picker.svelte";
  import Location_search from "$lib/portal/location_search.svelte";

  import { onMount as on_mount } from "svelte";
  import { goto } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Logo from "$lib/portal/logo.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import { get } from "svelte/store";
  import {
    default_filters,
    filters_from_params,
    filters_to_params,
    filter_error,
  } from "$lib/portal/search.js";
  import Modal from "$lib/portal/modal.svelte";
  import { companies_api, image_url } from "$lib/portal/companies_api.js";
  import { location_label, location_tree } from "$lib/portal/reference.js";
  import Location_select from "$lib/portal/location_select.svelte";
  import { company_sizes } from "$lib/portal/filter_options.js";
  import { search_filters, viewing_currency, toast } from "$lib/portal/state";
  import {
    platform_metrics,
    metric_value,
    landing_faqs,
    preview_topics,
  } from "$lib/portal/landing_content";
  // Platform counters from GET /stats (null when the backend couldn't be reached).
  export let data;
  import "$lib/portal/landing.css";

  let advanced = default_filters();
  let query = "";
  // Company search (newer doc §5): name, country, city (HQ or office), industry, size.
  let company = { country: "", city: "", industry: "", size: "" };
  let job_location = "";
  let work_mode = "";
  let search_type = "jobs";
  let topic = "";
  let mobile_menu = false;
  let motion_paused = false;
  let page_root;
  // A few real teams from the company directory (first page of search).
  let featured_companies = [];
  on_mount(async () => {
    // Arriving from account deletion (/auth/account): say it worked, then tidy the URL.
    const url = new URL(window.location.href);
    if (url.searchParams.has("account_deleted")) {
      toast("Your Referise account was deleted. You’ve been signed out everywhere.");
      url.searchParams.delete("account_deleted");
      history.replaceState(history.state, "", url);
    }
    const result = await companies_api.search({ page: 1, page_size: 3 });
    if (result.ok) featured_companies = result.data.companies;
  });

  on_mount(() => {
    const previous = get(search_filters);
    query = previous.query;
    work_mode = previous.modes.length === 1 ? previous.modes[0] : "";
    advanced = { ...default_filters(), currency: previous.currency };
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
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      for (const [key, value] of Object.entries(company)) if (value.trim()) params.set(key, value.trim());
      goto(`/companies${params.size ? `?${params}` : ""}`);
      return;
    }
    const remote = advanced.worldwide;
    advanced = {
      ...default_filters(),
      currency: advanced.currency,
      designations: advanced.designations,
      locations: advanced.locations,
      worldwide: advanced.worldwide,
      query: query.trim(),
      location:
        advanced.locations.length || advanced.worldwide
          ? ""
          : job_location.trim(),
      modes: remote ? ["Remote"] : work_mode ? [work_mode] : [],
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
  function open_topic(value) {
    const routes = {
      employer: "/recruiter/post-job",
      dashboard: "/recruiter",
      applications: "/applications",
      legal: "/terms",
      privacy: "/privacy",
      resources: "/faq",
    };
    if (routes[value]) {
      goto(routes[value]);
      return;
    }
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
            {#if search_type === "jobs"}<Designation_picker
                bind:query
                bind:selected={advanced.designations}
              /><Location_search
                bind:selected={advanced.locations}
                bind:query={job_location}
                bind:worldwide={advanced.worldwide}
              />{:else}<label
                ><Icon name="search" size={20} /><input
                  aria-label="Company name"
                  bind:value={query}
                  maxlength="100"
                  placeholder="Company name"
                /></label
              ><Location_select label="City (HQ or office)" bind:value={company.city} />{/if}
            <button class="r_button blue" type="submit"
              >{search_type === "jobs"
                ? "Find my next role"
                : "Explore companies"}<Icon
                name="arrow-right"
                size={18}
              /></button
            >
          </div>
          <div class="search_filters">
            <span>{search_type === "jobs" ? "How do you like to work?" : "Narrow it down"}</span
            >{#if search_type === "jobs"}<label
                ><span class="sr_only">Workplace</span><select
                  aria-label="Workplace"
                  bind:value={work_mode}
                  on:change={() =>
                    (advanced.modes = work_mode ? [work_mode] : [])}
                  ><option value="">Any workplace</option><option>Remote</option
                  ><option>Hybrid</option><option>On-site</option></select
                ></label
              ><a class="advanced_search_link" href="/jobs"
                >More options in job search <Icon
                  name="arrow-right"
                  size={14}
                /></a
              >{:else}<label
                ><span class="sr_only">Country</span><select aria-label="Headquarters country" bind:value={company.country}
                  ><option value="">Any country</option>{#each $location_tree as c (c.id)}<option value={c.country_code}
                      >{c.name}</option
                    >{/each}</select
                ></label
              ><label
                ><span class="sr_only">Industry</span><input
                  class="company_industry"
                  aria-label="Industry"
                  placeholder="Any industry"
                  maxlength="25"
                  bind:value={company.industry}
                /></label
              ><label
                ><span class="sr_only">Company size</span><select aria-label="Company size" bind:value={company.size}
                  ><option value="">Any size</option>{#each company_sizes as s}<option>{s}</option>{/each}</select
                ></label
              >{/if}
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
    {#if data.stats}<section class="reach_section" id="global-reach">
      <div class="landing_container reach_layout">
        <div class="reach_intro">
          <span class="section_kicker">04 / A BIGGER WORLD OF WORK</span>
          <h2>Good people.<br />Everywhere.</h2>
          <p>
            Talent doesn’t have a postcode.<br />Neither should opportunity.
          </p>
          <span class="metrics_note"
            >Updated daily{#if data.stats.computed_at}<br />As of {new Date(
                data.stats.computed_at,
              ).toLocaleDateString("en", { dateStyle: "medium" })}{/if}</span
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
              <strong>{metric_value(data.stats[metric.key])}</strong>
              <h3>{metric.label}</h3>
              <p>{metric.detail}</p>
            </article>{/each}
        </div>
      </div>
    </section>{/if}
    <section class="opportunities_section landing_container" id="opportunities">
      <div class="landing_section_heading">
        <div>
          <span class="section_kicker">01 / MAKE ROOM FOR POSSIBILITY</span>
          <h2>Your next chapter.<br /><span>Start with you.</span></h2>
        </div>
        <div class="heading_aside">
          <p>
            Put your experience into words.<br />Get clear on what comes next.
          </p>
          <a class="inline_link" href="/profile"
            >Make your profile yours <Icon name="arrow-up-right" size={18} /></a
          >
        </div>
      </div>
      <div class="career_start_grid">
        {#each [{ n: "01", title: "Tell your story.", text: "Bring your experience, skills and portfolio together in a profile that feels like you.", href: "/profile", cta: "Build your profile", kind: "peach" }, { n: "02", title: "Find your people.", text: "Explore how teams work, what they build and the values that bring them together.", href: "/companies", cta: "Explore companies", kind: "sage" }, { n: "03", title: "Choose your direction.", text: "Set your preferred roles, locations and ways of working. Keep your next move on your terms.", href: "/profile?tab=preferences", cta: "Set your preferences", kind: "blue" }] as step}
          <a class="career_start_card" href={step.href}
            ><span>{step.n} / YOUR NEXT MOVE</span><Companion
              kind={step.kind}
              size={140}
            />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
            <strong>{step.cta}<Icon name="arrow-up-right" size={22} /></strong
            ></a
          >{/each}
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
            <span>TEAMS TO GET TO KNOW</span><a href="/companies"
              >All companies <Icon name="arrow-right" size={14} /></a
            >
          </div>
          <div class="teams_grid">
            {#each featured_companies as company (company.id)}<button
                class="team_card"
                on:click={() => goto(`/company/${company.slug}`)}
                ><Company_logo id={company.id} src={image_url(company.logo_url)} size={52} />
                <div>
                  <h3>{company.name}</h3>
                  <p>{company.tagline}</p>
                  <div class="team_tags">
                    {#if company.industries[0]}<span>{company.industries[0]}</span>{/if}{#if company.hq_location_id}<span
                        >{$location_label(company.hq_location_id)}</span
                      >{/if}{#if company.size}<span>{company.size}</span>{/if}
                  </div>
                </div>
                <span class="team_arrow"><Icon name="arrow-up-right" size={21} /></span></button
              >{:else}<div class="company_empty">
                <h3>Teams are joining.</h3>
                <p>Be one of the first companies people get to know here.</p>
                <a class="r_button lime" href="/company/create"
                  >Create a company <Icon name="arrow-right" size={16} /></a
                >
              </div>{/each}
          </div>
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
        app link handling depend on connected services and browser support.
      </p>
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
        ><a href="/saved-jobs">Saved opportunities</a><a href="/applications"
          >My applications</a
        ><a href="/faq">Helpful answers</a>
      </div>
      <div>
        <h3>FOR YOUR NEXT GREAT HIRE</h3>
        <a href="/recruiter/post-job">Post a job</a><a href="/company/create"
          >Create a company</a
        ><a href="/company/forma/dashboard">Company dashboard</a><a
          href="/recruiter/jobs">Manage jobs</a
        ><a href="/recruiter/applicants">View applicants</a><a href="/about"
          >Our approach</a
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
        ><a href="/contact">Contact support</a>
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
