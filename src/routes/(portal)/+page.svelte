<script lang="ts">
  import { goto } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Hero_art from "$lib/portal/hero_art.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Job_card from "$lib/portal/job_card.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import { jobs, companies } from "$lib/portal/data";
  import type { company_data } from "$lib/portal/types";
  let query = "";
  let location = "";
  let active_category = "All opportunities";
  let selected_company: company_data | null = null;
  let open_faq = -1;
  const categories = [
    "All opportunities",
    "Design",
    "Engineering",
    "Product",
    "Marketing",
  ];
  const faqs = [
    {
      question: "What makes Referise different?",
      answer:
        "We’re building a more considered way to find work, with clear compensation, useful company context, and experience that speaks for itself. Our aim is to give potential a fair chance and help people make informed decisions.",
    },
    {
      question: "Can I browse opportunities without an account?",
      answer:
        "Yes. You can explore roles, read job descriptions, and learn about companies before signing in. In this preview, you can also save jobs and try the application flow locally in your browser.",
    },
    {
      question: "Who can see my profile and résumé?",
      answer:
        "You choose your profile visibility and résumé preferences. The profile page includes a public preview so you can review exactly what you share. In this design preview, changes stay in your browser.",
    },
    {
      question: "Are these real companies and open jobs?",
      answer:
        "This is an interactive preview of the Referise experience. All companies, jobs, people, and activity are illustrative. Applications made here are saved locally and are not sent to an employer.",
    },
  ];
  $: featured = jobs
    .filter(
      (job) =>
        active_category === "All opportunities" ||
        job.category === active_category,
    )
    .slice(0, 3);
  function search() {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("location", location.trim());
    goto(`/jobs?${params}`);
  }
</script>

<svelte:head
  ><title>Referise — Your next chapter starts here</title><meta
    name="description"
    content="A more thoughtful way to find work. Explore opportunities with clear salaries, meaningful company context, and room to grow."
  /></svelte:head
>
<main id="main-content">
  <section class="landing_hero">
    <div class="portal_container">
      <div class="hero_grid">
        <div class="hero_copy">
          <span class="eyebrow_label"
            ><span class="tiny_star">✳</span> GOOD WORK STARTS WITH A FAIR CHANCE</span
          >
          <h1>Your next chapter.<br />A world of<br /><em>possibility.</em></h1>
          <p>
            Find work that sees your potential. Explore meaningful roles, meet
            thoughtful teams, and move forward with clarity.
          </p>
          <div class="hero_assurances">
            <span><Icon name="check" size={14} /> Clear salaries</span><span
              ><Icon name="check" size={14} /> Real potential</span
            ><span><Icon name="check" size={14} /> Your choice</span>
          </div>
        </div>
        <Hero_art />
      </div>
      <form class="hero_search" on:submit|preventDefault={search}>
        <label
          ><span class="search_field_icon"
            ><Icon name="search" size={21} /></span
          ><span class="search_input_wrap"
            ><span>WHAT WOULD YOU LIKE TO DO?</span><input
              aria-label="Job title, skill, or company"
              bind:value={query}
              placeholder="Job title, skill, or company"
            /></span
          ></label
        ><label class="location_search"
          ><span class="search_field_icon"
            ><Icon name="location" size={21} /></span
          ><span class="search_input_wrap"
            ><span>WHERE DO YOU WANT TO BE?</span><input
              aria-label="City, country, or remote"
              bind:value={location}
              placeholder="City, country, or remote"
            /></span
          ></label
        ><button class="button button_terracotta" type="submit"
          >Find my next chapter <Icon name="arrow-right" size={19} /></button
        >
      </form>
      <div class="popular_searches">
        <span>A few places to start</span><a href="/jobs?category=Design"
          >Design <Icon name="arrow-up-right" size={12} /></a
        ><a href="/jobs?category=Engineering"
          >Engineering <Icon name="arrow-up-right" size={12} /></a
        ><a href="/jobs?mode=Remote"
          >Remote roles <Icon name="arrow-up-right" size={12} /></a
        ><a href="/jobs?level=Entry-level"
          >Early careers <Icon name="arrow-up-right" size={12} /></a
        >
      </div>
    </div>
  </section>
  <section class="company_marquee" aria-label="Companies in this preview">
    <div class="portal_container">
      <span>SMALL TEAMS.<br />BIG POSSIBILITIES.</span>
      <div class="wordmark_list">
        {#each companies.slice(0, 5) as company}<button
            on:click={() => (selected_company = company)}
            ><Company_logo id={company.id} size={28} /><strong
              >{company.name}</strong
            ></button
          >{/each}
      </div>
    </div>
  </section>
  <section class="opportunities_section portal_container">
    <div class="section_heading">
      <div>
        <span class="eyebrow_label">MAKE YOUR NEXT MOVE</span>
        <h2>
          Work worth<br class="mobile_only" /> getting excited about<span
            class="serif_period">.</span
          >
        </h2>
      </div>
      <a class="text_link" href="/jobs"
        >Explore all opportunities <Icon name="arrow-right" size={17} /></a
      >
    </div>
    <div class="category_tabs" aria-label="Opportunity categories">
      {#each categories as category}<button
          class:active={active_category === category}
          aria-pressed={active_category === category}
          on:click={() => (active_category = category)}
          >{category}{#if category === "All opportunities"}<span
              >{jobs.length}</span
            >{/if}</button
        >{/each}
    </div>
    <div class="featured_grid">
      {#each featured as job (job.id)}<Job_card {job} compact />{/each}
    </div>
    <div class="section_footnote">
      <span
        ><span class="small_dot"></span> A curated look at the experience · Sample
        opportunities</span
      ><a href="/jobs?sort=newest"
        >See what’s new <Icon name="arrow-up-right" size={14} /></a
      >
    </div>
  </section>
  <section class="approach_section" id="our-approach">
    <div class="portal_container">
      <div class="approach_intro">
        <div>
          <span class="eyebrow_label">A MORE HUMAN WAY FORWARD</span>
          <h2>Less guesswork.<br /><em>More possibility.</em></h2>
        </div>
        <p>
          Finding a job is a big life moment.<br />We think the experience
          should meet it<br />with a little more care.
        </p>
      </div>
      <div class="approach_grid">
        <article>
          <div class="approach_visual salary_visual">
            <span>YOUR EXPERIENCE HAS VALUE</span>
            <div>₹28<span>–</span>40 <small>LPA</small></div>
            <p>
              <Icon name="check" size={14} /> The range, right from the start.
            </p>
          </div>
          <span class="feature_number">01 / CLARITY</span>
          <h3>No salary guessing games.</h3>
          <p>
            Understand the opportunity before investing your time. Clear
            compensation, work arrangements, and expectations.
          </p>
        </article>
        <article>
          <div class="approach_visual potential_visual">
            <div class="skill_label s1">Your craft</div>
            <div class="skill_label s2">Your experience</div>
            <div class="skill_label s3">
              Your potential <Icon name="spark" size={13} />
            </div>
            <svg viewBox="0 0 240 130" aria-hidden="true"
              ><path
                d="M45 112C40 15 180 128 195 15"
                fill="none"
                stroke="#989d8d"
                stroke-dasharray="4 5"
              /></svg
            >
          </div>
          <span class="feature_number">02 / OPPORTUNITY</span>
          <h3>Let your work do the talking.</h3>
          <p>
            Make room for the skills, projects, and experiences that make you
            you. There’s more than one path to great work.
          </p>
        </article>
        <article>
          <div class="approach_visual privacy_visual">
            <span class="privacy_icon"><Icon name="lock" size={30} /></span>
            <div>
              <strong>You’re in control.</strong><span
                >Your profile. Your preferences.</span
              >
            </div>
            <span class="visual_switch"></span>
          </div>
          <span class="feature_number">03 / CONFIDENCE</span>
          <h3>Your next move. Your terms.</h3>
          <p>
            Choose what to share and how you want to work. Find an opportunity
            that fits the life you want to build.
          </p>
        </article>
      </div>
    </div>
  </section>
  <section class="companies_section portal_container" id="companies">
    <div class="section_heading">
      <div>
        <span class="eyebrow_label">FIND YOUR PEOPLE</span>
        <h2>A good team changes everything.</h2>
      </div>
      <p>Get a feel for the people<br />behind your next opportunity.</p>
    </div>
    <div class="company_showcase">
      {#each companies.slice(0, 3) as company, i}<button
          class="company_showcase_card"
          on:click={() => (selected_company = company)}
          ><div class={`company_art company_art_${i}`}>
            <div class="company_art_shape"></div>
            <Company_logo id={company.id} size={72} /><span
              >{i === 0
                ? "MAKE SPACE FOR GOOD WORK."
                : i === 1
                  ? "CREATE SOMETHING TOGETHER."
                  : "GIVE GOOD IDEAS ROOM."}</span
            >
          </div>
          <div class="company_showcase_body">
            <div>
              <h3>{company.name}<Icon name="shield" size={15} /></h3>
              <p>{company.tagline}</p>
              <span>{company.sector} · {company.size}</span>
            </div>
            <span class="company_openings"
              >{jobs.filter((job) => job.company === company.id).length} open roles
              <Icon name="arrow-up-right" size={15} /></span
            >
          </div></button
        >{/each}
    </div>
  </section>
  <section class="possibility_band">
    <div class="portal_container">
      <div class="band_intro">
        <span class="eyebrow_label">A SMALL PREVIEW. A BIGGER VISION.</span>
        <h2>Opportunity is<br /><em>everywhere.</em></h2>
      </div>
      <div class="metrics_grid">
        {#each [{ value: jobs.length, label: "Open opportunities" }, { value: companies.length, label: "Thoughtful teams" }, { value: 4, label: "Countries represented" }, { value: 6, label: "Fields of work" }, { value: new Set(jobs.map((job) => job.type)).size, label: "Ways of working" }, { value: jobs.filter((job) => job.mode === "Remote").length, label: "Fully remote roles" }] as metric}<div
          >
            <strong
              >{String(metric.value).padStart(2, "0")}<span>↗</span></strong
            ><span>{metric.label}</span>
          </div>{/each}
      </div>
    </div>
  </section>
  <section class="faq_section portal_container">
    <div>
      <span class="eyebrow_label">A LITTLE MORE CLARITY</span>
      <h2>Before your<br /><em>next chapter.</em></h2>
      <p>A few things you might be wondering.</p>
    </div>
    <div class="faq_list">
      {#each faqs as faq, i}<div class="faq_item">
          <h3>
            <button
              aria-expanded={open_faq === i}
              aria-controls={`faq-${i}`}
              on:click={() => (open_faq = open_faq === i ? -1 : i)}
              >{faq.question}<span class:rotated={open_faq === i}
                ><Icon name="plus" size={19} /></span
              ></button
            >
          </h3>
          {#if open_faq === i}<p id={`faq-${i}`}>{faq.answer}</p>{/if}
        </div>{/each}
    </div>
  </section>
  <section class="closing_section portal_container">
    <div class="closing_inner">
      <span class="closing_asterisk" aria-hidden="true">✳</span><span
        class="eyebrow_label">THERE’S MORE AHEAD</span
      >
      <h2>Your next chapter<br />could start <em>right here.</em></h2>
      <p>Bring your experience. Your curiosity. Your whole self.</p>
      <a href="/jobs" class="button button_terracotta"
        >Explore opportunities <Icon name="arrow-right" size={18} /></a
      ><a href="/profile" class="closing_secondary"
        >Make your profile yours <Icon name="arrow-up-right" size={14} /></a
      >
    </div>
  </section>
</main>
{#if selected_company}<Modal
    title={`Meet ${selected_company.name}`}
    on:close={() => (selected_company = null)}
    ><div class="company_modal_intro">
      <Company_logo id={selected_company.id} size={64} />
      <div>
        <h3>{selected_company.tagline}</h3>
        <p>{selected_company.sector} · {selected_company.size}</p>
      </div>
    </div>
    <div class="modal_copy">
      <p>{selected_company.description}</p>
      <div class="company_facts">
        <span><Icon name="location" size={16} />{selected_company.location}</span
        ><span
          ><Icon name="building" size={16} />Founded in {selected_company.founded}</span
        >
      </div>
      <p class="muted small_text">
        An illustrative company in the Referise design preview.
      </p>
      <a
        href={`/jobs?q=${encodeURIComponent(selected_company.name)}`}
        class="button button_dark"
        >Explore {jobs.filter((job) => job.company === selected_company?.id)
          .length} open roles <Icon name="arrow-right" size={17} /></a
      >
    </div></Modal
  >{/if}
