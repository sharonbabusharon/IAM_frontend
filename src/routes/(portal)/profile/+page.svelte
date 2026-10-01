<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onDestroy as on_destroy } from "svelte";
  import { profile_error } from "$lib/portal/profile_validation.js";
  import Profile_fields from "$lib/portal/profile_fields.svelte";
  import { notice_periods, location_name } from "$lib/portal/filter_options.js";
  import Icon from "$lib/portal/icon.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import {
    profile,
    applications,
    saved_jobs,
    resume_file,
    toast,
  } from "$lib/portal/state";
  import { default_profile, jobs, get_company } from "$lib/portal/data";
  const weekly_views = [5, 7, 8, 6, 9, 12, 15];
  const weekly_resume_views = [2, 1, 2, 3, 1, 4, 5];
  const weekly_downloads = [0, 1, 1, 0, 2, 1, 1];
  const week_days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function chart_points(values) {
    return values
      .map((value, index) => `${30 + index * 96},${145 - value * 8}`)
      .join(" ");
  }
  let editing = "";
  let expanded_skills = false;
  let resume_url = "";
  let draft = {
    ...default_profile,
    skills: [...default_profile.skills],
  };
  let skill_text = "";
  let public_preview = false;
  let resume_open = false;
  let project_open = "";
  let sharing = false;
  let share_url = "";
  $: if ($resume_file && !resume_url)
    resume_url = URL.createObjectURL($resume_file);
  on_destroy(() => {
    if (resume_url) URL.revokeObjectURL(resume_url);
  });
  const privacy_options = [
    {
      key: "current_salary_private",
      title: "Keep current salary private",
      text: "Hide your current compensation from public visitors.",
    },
    {
      key: "hourly_private",
      title: "Keep hourly rate private",
      text: "Hide your hourly rate from public visitors.",
    },
    {
      key: "contact_private",
      title: "Keep contact details private",
      text: "Hide your email and phone from public visitors.",
    },
    {
      key: "visible",
      title: "Public profile",
      text: "Let people see your experience, skills, and selected work.",
    },
    {
      key: "open",
      title: "Open to opportunities",
      text: "Show that you’re open to hearing about your next role.",
    },
    {
      key: "salary_private",
      title: "Keep compensation private",
      text: "Hide your salary expectations from your public profile.",
    },
    {
      key: "resume_private",
      title: "Share résumé with applications only",
      text: "Hide the résumé from visitors to your public profile.",
    },
  ];
  $: current_tab = ["overview", "activity", "preferences"].includes(
    $page.url.searchParams.get("tab") ?? "",
  )
    ? $page.url.searchParams.get("public") === "1" &&
      $page.url.searchParams.get("tab") === "preferences"
      ? "overview"
      : $page.url.searchParams.get("tab")
    : "overview";
  $: initials = $profile.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
  $: applied_jobs = jobs.filter((job) => $applications.includes(job.id));
  $: completeness = [
    $profile.name,
    $profile.title,
    $profile.about,
    $profile.skills.length,
  ].filter(Boolean).length;
  $: public_preview = $page.url.searchParams.get("public") === "1";
  function edit(section) {
    draft = structuredClone($profile);
    skill_text = draft.skills.join(", ");
    editing = section;
  }
  function save() {
    if (!draft.name.trim() || !draft.title.trim()) {
      toast("Add your name and professional title before saving.");
      return;
    }
    const error = profile_error(draft);
    if (error) {
      toast(error);
      return;
    }
    if (editing === "profile")
      draft.experience = `${draft.experience_years || 0} years`;
    draft.current_salary = Number(draft.current_salary) || 0;
    draft.hourly_rate = Number(draft.hourly_rate) || 0;
    if (editing === "about") draft.about_updated = new Date().toISOString();
    if (editing === "preferences")
      draft.expected =
        new Intl.NumberFormat("en", {
          style: "currency",
          currency: draft.salary_currency,
          maximumFractionDigits: 0,
        }).format(draft.expected_salary) + " / year";
    if (editing === "background")
      draft.experiences = draft.experiences.map((entry, index) => ({
        ...entry,
        verification:
          JSON.stringify(entry) !== JSON.stringify($profile.experiences[index])
            ? entry.verification === "Verified"
              ? "Pending"
              : "Unverified"
            : entry.verification,
      }));
    if (editing === "skills")
      draft.skills = [
        ...new Set(
          skill_text
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        ),
      ];
    profile.set({
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
    });
    editing = "";
    toast("Profile updated. Your next chapter looks good on you.");
  }
  function privacy(key) {
    profile.update((value) => ({ ...value, [key]: !value[key] }));
    toast("Preference saved in this browser.");
  }
  async function share() {
    share_url = `${window.location.origin}/profile?public=1`;
    try {
      await navigator.clipboard.writeText(share_url);
      toast("Preview link copied. Profile edits stay in your browser.");
    } catch {
      sharing = true;
    }
  }
  function month_label(value) {
    return value
      ? new Date(`${value}-01T12:00:00`).toLocaleDateString("en", {
          month: "short",
          year: "numeric",
          timeZone: "UTC",
        })
      : "";
  }
  function upload_resume(event) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (
      !/\.(pdf|docx)$/i.test(file.name) ||
      file.size > 5 * 1024 * 1024 ||
      file.size === 0
    ) {
      toast("Choose a PDF or DOCX file, up to 5 MB.");
      event.currentTarget.value = "";
      return;
    }
    if (resume_url) URL.revokeObjectURL(resume_url);
    resume_file.set(file);
    resume_url = URL.createObjectURL(file);
    toast("Résumé ready for this session. File hosting is not connected yet.");
  }
  function download_resume() {
    if ($resume_file) {
      const url = URL.createObjectURL($resume_file);
      const link = document.createElement("a");
      link.href = url;
      link.download = $resume_file.name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const text = `${$profile.name}\n${$profile.title}\n${$profile.location}\n\nABOUT\n${$profile.about}\n\nSKILLS\n${$profile.skills.join(", ")}\n\nEXPERIENCE\n${$profile.experiences.map((entry) => `${entry.title}, ${entry.company} | ${entry.start} - ${entry.current ? "Present" : entry.end}`).join("\n")}\n\nThis is a sample resume from the Referise design preview.`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${$profile.name.replace(/[^a-z0-9]/gi, "_")}_resume_preview.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head
  ><title>{$profile.name} — Your profile — Referise</title><meta
    name="description"
    content="Make your experience, skills, and next chapter your own. Manage your Referise profile and privacy preferences."
  /><meta name="robots" content="noindex" /></svelte:head
>
<main id="main-content" class="profile_page portal_container">
  <div class="profile_page_intro">
    <div>
      <span class="eyebrow_label"
        >{public_preview
          ? "A LOOK THROUGH SOMEONE ELSE’S EYES"
          : "YOUR STORY, IN YOUR WORDS"}</span
      >
      <h1>
        {public_preview ? "Your public profile." : "Make yourself known."}
      </h1>
    </div>
    <button
      class="button button_outline button_small"
      on:click={() => {
        goto(public_preview ? "/profile" : "/profile?public=1", {
          noScroll: true,
        });
      }}
      ><Icon
        name={public_preview ? "arrow-left" : "eye"}
        size={15}
      />{public_preview ? "Back to editing" : "Preview public profile"}</button
    >
  </div>
  {#if public_preview}<div class="public_preview_notice">
      <Icon name="eye" size={17} /><span
        >{$profile.visible
          ? "Public preview. Private salary, contact details, and restricted résumé access are hidden."
          : "Your profile is private. Other people would see the message below."}</span
      >
    </div>{/if}
  {#if public_preview && !$profile.visible}<section
      class="empty_state private_profile"
    >
      <span class="empty_icon"><Icon name="lock" size={30} /></span>
      <h2>This profile is taking a little quiet time.</h2>
      <p>This person has chosen to keep their profile private.</p>
      <button
        class="button button_dark"
        on:click={() => goto("/profile", { noScroll: true })}
        >Back to your profile <Icon name="arrow-left" size={16} /></button
      >
    </section>
  {:else}<section class="profile_identity_card">
      <div class="profile_cover">
        <svg
          viewBox="0 0 1200 150"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          ><path
            d="M775 220V90a150 150 0 0 1 300 0v130"
            fill="none"
            stroke="#8da4ff"
            stroke-width="32"
          /><path
            d="M820 220V92a105 105 0 0 1 210 0v128"
            fill="none"
            stroke="#6080ff"
            stroke-width="21"
          /><circle cx="1084" cy="6" r="95" fill="#dfff8c" /><path
            d="M60 150C180-55 410 170 560 10"
            fill="none"
            stroke="#c5d1ff"
            stroke-width="1"
            stroke-dasharray="3 6"
          /></svg
        ><span>THERE’S MORE TO YOUR STORY.</span><span
          class="profile_cover_companion"
          aria-hidden="true"><Companion kind="peach" size={145} /></span
        ><span class="cover_star">✳</span>
      </div>
      <div class="profile_identity_body">
        <div class="profile_avatar">
          {initials}<span><Icon name="check" size={12} /></span>
        </div>
        <div class="profile_identity_main">
          <div class="profile_name_row">
            <h2>{$profile.name}</h2>
            {#if $profile.open}<span class="open_to_work"
                ><span></span>Open to opportunities</span
              >{/if}
          </div>
          <p class="profile_title">
            {$profile.title}{#if $profile.pronouns}<small>
                · {$profile.pronouns}</small
              >{/if}
          </p>
          {#if $profile.social_links.length}<div class="profile_meta">
              {#each $profile.social_links as link}<a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer">{link.platform} ↗</a
                >{/each}
            </div>{/if}
          <div class="profile_meta">
            <span><Icon name="location" size={14} />{$profile.location}</span
            ><span
              ><Icon name="briefcase" size={14} />{$profile.experience} of experience</span
            ><span
              ><Icon name="globe" size={14} />{$profile.website ||
                "Portfolio coming soon"}</span
            >
          </div>
        </div>
        {#if !public_preview}<button
            class="button button_outline button_small edit_profile_button"
            on:click={() => edit("profile")}
            ><Icon name="edit" size={14} />Edit profile</button
          >{/if}
      </div>
      {#if !public_preview}<a
          class="text_link"
          style="margin: 0 28px 20px; font-size: 12px"
          href="/profile?tab=activity"
          >62 profile views this week · Sample insights <Icon
            name="arrow-right"
            size={13}
          /></a
        >{/if}
      <div class="profile_navigation">
        <nav aria-label="Profile sections">
          <a
            href={public_preview ? "/profile?public=1" : "/profile"}
            class:active={current_tab === "overview"}>Overview</a
          >
          <a
            href={public_preview
              ? "/profile?public=1&tab=activity"
              : "/profile?tab=activity"}
            class:active={current_tab === "activity"}
            >Activity & insights <span class="tab_dot"></span></a
          >
          {#if !public_preview}<a
              href="/profile?tab=preferences"
              class:active={current_tab === "preferences"}>Preferences</a
            >{/if}
        </nav>
        {#if !public_preview}<button on:click={share}
            ><Icon name="share" size={14} />Share profile</button
          >{/if}
      </div>
    </section>
    <div class="profile_content_grid">
      <div class="profile_main_content">
        {#if current_tab === "overview"}
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>A little about me</h2>
              {#if !public_preview}<button
                  class="icon_button"
                  aria-label="Edit about me"
                  on:click={() => edit("about")}
                  ><Icon name="edit" size={16} /></button
                >{/if}
            </div>
            {#if $profile.about_updated}<small class="muted"
                >Updated {new Date($profile.about_updated).toLocaleDateString(
                  "en",
                  { timeZone: "UTC" },
                )}</small
              >{/if}
            <div class="about_text">
              {#each $profile.about.split("\n\n") as paragraph}<p>
                  {paragraph}
                </p>{/each}
            </div>
          </section>
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>The craft I bring</h2>
              {#if !public_preview}<button
                  class="icon_button"
                  aria-label="Edit skills"
                  on:click={() => edit("skills")}
                  ><Icon name="edit" size={16} /></button
                >{/if}
            </div>
            <div class="skill_chips profile_skills">
              {#each expanded_skills ? $profile.skills : $profile.skills.slice(0, 8) as skill}<span
                  >{skill}</span
                >{/each}
            </div>
          </section>
          {#if $profile.skills.length > 8}<button
              class="text_link"
              aria-expanded={expanded_skills}
              on:click={() => (expanded_skills = !expanded_skills)}
              >{expanded_skills
                ? "Show fewer skills"
                : `Show all ${$profile.skills.length} skills`}</button
            >{/if}
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>My journey so far</h2>
              <span class="section_label">EXPERIENCE</span
              >{#if !public_preview}<button
                  class="icon_button"
                  aria-label="Edit experience, education, languages and authorization"
                  on:click={() => edit("background")}
                  ><Icon name="edit" size={16} /></button
                >{/if}
            </div>
            <div class="experience_timeline">
              {#each $profile.experiences as experience}<article>
                  <span class="resume_file_icon"
                    ><Icon name="building" size={24} /></span
                  >
                  <div>
                    <div class="experience_title">
                      <h3>{experience.title}</h3>
                      <span
                        >{month_label(experience.start)} — {experience.current
                          ? "Present"
                          : month_label(experience.end)}</span
                      >
                    </div>
                    <p class="experience_company">
                      {experience.company} <span>{experience.type}</span><span
                        >{experience.verification}</span
                      >
                    </p>
                    {#if experience.promoted}<span class="promoted_tag"
                        >Promoted</span
                      >{/if}
                    <p class="experience_description">
                      {experience.description}
                    </p>
                  </div>
                </article>{/each}
            </div>
            <dl class="requirement_facts">
              <div>
                <dt>Languages</dt>
                <dd>
                  {$profile.languages
                    .map(
                      (language) =>
                        `${language.name} · ${language.proficiency}`,
                    )
                    .join(", ") || "Not added"}
                </dd>
              </div>
              <div>
                <dt>Work authorization</dt>
                <dd>
                  {#each $profile.authorizations as authorization}<p>
                      {authorization.country} · {authorization.type}<br /><small
                        >{authorization.indefinite
                          ? "No expiry"
                          : `Valid until ${authorization.until}`}</small
                      >
                    </p>{:else}Not added{/each}
                </dd>
              </div>
            </dl>
          </section>
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>A few things I’ve made</h2>
              <span class="section_label">SELECTED WORK</span>
            </div>
            <div class="portfolio_grid">
              <button
                class="portfolio_item"
                on:click={() => (project_open = "A calmer way to work")}
                ><div class="portfolio_art project_one">
                  <div class="project_mini_window">
                    <div><i></i><i></i><i></i></div>
                    <span>Good morning, Alex.</span>
                    <div class="mini_columns">
                      <span></span><span></span><span></span>
                    </div>
                    <div class="mini_lines"><i></i><i></i><i></i></div>
                  </div>
                  <span class="project_annotation"
                    >less noise.<br />more focus.</span
                  >
                </div>
                <div class="portfolio_caption">
                  <h3>A calmer way to work</h3>
                  <Icon name="arrow-up-right" size={16} />
                  <p>Product strategy · UX/UI design</p>
                </div></button
              ><button
                class="portfolio_item"
                on:click={() => (project_open = "A shared design language")}
                ><div class="portfolio_art project_two">
                  <span class="design_letter">Aa<span>↗</span></span>
                  <div class="design_swatches">
                    <i></i><i></i><i></i><i></i>
                  </div>
                  <span class="design_system_tag">THE FOUNDATIONS / 01</span>
                </div>
                <div class="portfolio_caption">
                  <h3>A shared design language</h3>
                  <Icon name="arrow-up-right" size={16} />
                  <p>Design systems · Visual design</p>
                </div></button
              >
            </div>
          </section>
          <section class="profile_section education_section">
            <div class="profile_section_heading">
              <h2>Where it began</h2>
              <span class="section_label">EDUCATION</span>
            </div>
            <div class="education_row">
              <span><Icon name="building" size={23} /></span>
              <div>
                {#each $profile.education as education}<h3>
                    {education.degree}
                  </h3>
                  <p>
                    {education.institution}{education.institution
                      ? " · "
                      : ""}{education.field} · {education.start}–{education.end}
                  </p>{:else}<p>Education not added.</p>{/each}
              </div>
            </div>
          </section>
        {:else if current_tab === "activity"}
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>Your story is finding its people.</h2>
              <span class="section_label">SAMPLE INSIGHTS</span>
            </div>
            <div class="profile_stats">
              <div>
                <Icon name="eye" size={19} /><strong>62</strong><span
                  >Profile views</span
                ><small>+18% this week</small>
              </div>
              <div>
                <Icon name="file" size={19} /><strong>18</strong><span
                  >Résumé views</span
                ><small>+8% this week</small>
              </div>
              <div>
                <Icon name="briefcase" size={19} /><strong>6</strong><span
                  >Résumé downloads</span
                ><small>Illustrative weekly total</small>
              </div>
            </div>
            <div class="profile_chart">
              <div>
                <strong>A little more visible, every week.</strong><span
                  >Illustrative engagement</span
                >
              </div>
              <svg
                viewBox="0 0 640 170"
                role="img"
                aria-label="Illustrative seven-day engagement: 62 profile views, 18 résumé views and 6 downloads"
                ><path
                  d="M30 25h576M30 65h576M30 105h576M30 145h576"
                  stroke="#dce1ef"
                  stroke-dasharray="3 4"
                />{#each [{ values: weekly_views, color: "#3155ef" }, { values: weekly_resume_views, color: "#55734a" }, { values: weekly_downloads, color: "#ac603a" }] as series}<polyline
                    points={chart_points(series.values)}
                    fill="none"
                    stroke={series.color}
                    stroke-width="2.5"
                  />{/each}<g font-size="10" fill="currentColor"
                  >{#each week_days as day, index}<text
                      x={22 + index * 96}
                      y="168">{day}</text
                    >{/each}</g
                ></svg
              >
              <p class="small_text">
                Blue: profile views · Green: résumé views · Copper: downloads
              </p>
              <details>
                <summary class="small_text">View chart data</summary>
                <table class="weekly_analytics_table">
                  <thead
                    ><tr
                      ><th>Day</th><th>Profile views</th><th>Résumé views</th
                      ><th>Downloads</th></tr
                    ></thead
                  ><tbody
                    >{#each week_days as day, index}<tr
                        ><td>{day}</td><td>{weekly_views[index]}</td><td
                          >{weekly_resume_views[index]}</td
                        ><td>{weekly_downloads[index]}</td></tr
                      >{/each}</tbody
                  >
                </table>
              </details>
            </div>
          </section>
          {#if !public_preview}<section class="profile_section">
              <div class="profile_section_heading">
                <h2>The doors you’ve opened</h2>
                <span class="section_label"
                  >{$applications.length} PREVIEW APPLICATIONS</span
                >
              </div>
              {#if applied_jobs.length}<div class="application_list">
                  {#each applied_jobs as job}<a href={`/jobs/${job.id}`}
                      ><Company_logo id={job.company} size={40} />
                      <div>
                        <h3>{job.title}</h3>
                        <p>{get_company(job.company).name} · {job.location}</p>
                      </div>
                      <span
                        ><Icon name="check" size={12} />Saved in preview</span
                      ><Icon name="arrow-up-right" size={17} /></a
                    >{/each}
                </div>{:else}<div class="activity_empty">
                  <Icon name="briefcase" size={29} />
                  <h3>Your next move is out there.</h3>
                  <p>When you try an application, you’ll see it here.</p>
                  <a href="/jobs" class="text_link"
                    >Explore opportunities <Icon
                      name="arrow-right"
                      size={15}
                    /></a
                  >
                </div>{/if}
            </section>{/if}
        {:else}
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>What your next chapter looks like</h2>
              <button
                class="button button_outline button_small"
                on:click={() => edit("preferences")}
                ><Icon name="edit" size={14} />Edit</button
              >
            </div>
            <dl class="preferences_list">
              <div>
                <dt>Roles I’m interested in</dt>
                <dd>{$profile.roles}</dd>
              </div>
              <div>
                <dt>How I’d like to work</dt>
                <dd>{$profile.work_mode}</dd>
              </div>
              <div>
                <dt>Expected compensation</dt>
                <dd>{$profile.expected}</dd>
              </div>
              <div>
                <dt>Notice period</dt>
                <dd>
                  {$profile.is_serving_notice
                    ? `Last working day: ${$profile.last_working_date}`
                    : $profile.notice}
                </dd>
              </div>
            </dl>
          </section>
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>Your profile. Your boundaries.</h2>
              <Icon name="lock" size={19} />
            </div>
            <p class="preferences_description">
              Choose what others can see. Use the public preview to check how
              these preferences change your profile.
            </p>
            {#each privacy_options as preference}<div
                class="privacy_preference"
              >
                <div>
                  <strong>{preference.title}</strong>
                  <p>{preference.text}</p>
                </div>
                <button
                  role="switch"
                  aria-checked={Boolean($profile[preference.key])}
                  aria-label={preference.title}
                  class:enabled={Boolean($profile[preference.key])}
                  class="privacy_switch"
                  on:click={() => privacy(preference.key)}><span></span></button
                >
              </div>{/each}
            <div class="inline_notice preferences_notice">
              <Icon name="info" size={16} /><span
                >These controls demonstrate the intended privacy experience.
                This preview stores changes in your browser; a shared link shows
                the sample profile on another device.</span
              >
            </div>
          </section>
        {/if}
      </div>
      <aside class="profile_sidebar">
        {#if !public_preview}<section class="profile_strength_card">
            <div>
              <span class="eyebrow_label">A LITTLE MORE YOU</span><span
                class="strength_star">✳</span
              >
            </div>
            <h2>Your story is<br />coming together.</h2>
            <p>
              The essentials are in place.<br />Keep making this space your own.
            </p>
            <div class="strength_bar">
              <span style:width={`${(completeness / 4) * 100}%`}></span>
            </div>
            <div class="strength_caption">
              <span>Profile essentials</span><strong
                >{completeness} of 4 complete</strong
              >
            </div>
            <a href="/jobs" class="text_link"
              >Find your next chapter <Icon name="arrow-right" size={15} /></a
            >
          </section>{/if}
        <section class="profile_side_card">
          <div class="side_card_heading">
            <h2>{public_preview ? "Career preferences" : "My next chapter"}</h2>
            {#if !public_preview}<button
                class="icon_button"
                aria-label="Edit career preferences"
                on:click={() => edit("preferences")}
                ><Icon name="edit" size={15} /></button
              >{/if}
          </div>
          <dl class="career_preferences">
            <div>
              <dt><Icon name="briefcase" size={14} />LOOKING FOR</dt>
              <dd>{$profile.roles}</dd>
            </div>
            <div>
              <dt><Icon name="laptop" size={14} />WORK ARRANGEMENT</dt>
              <dd>{$profile.work_mode}</dd>
            </div>
            {#if !public_preview || !$profile.salary_private}<div>
                <dt><Icon name="money" size={14} />EXPECTED COMPENSATION</dt>
                <dd>
                  {$profile.expected}{#if $profile.salary_private}<span
                      class="private_label"
                      ><Icon name="lock" size={10} />Only you</span
                    >{/if}
                </dd>
              </div>{/if}
            <div>
              <dt><Icon name="clock" size={14} />READY TO START IN</dt>
              <dd>
                {$profile.is_serving_notice
                  ? `Last working day: ${$profile.last_working_date}`
                  : $profile.notice}
              </dd>
            </div>
            <div>
              <dt>EMPLOYMENT TYPES</dt>
              <dd>{$profile.work_types.join(", ") || "No preference"}</dd>
            </div>
            <div>
              <dt>PREFERRED LOCATIONS</dt>
              <dd>
                {$profile.preferred_locations.map(location_name).join(", ") ||
                  "No preference"}{$profile.open_to_remote
                  ? " · Worldwide remote"
                  : ""}
              </dd>
            </div>
            <div>
              <dt>RELOCATION</dt>
              <dd>{$profile.relocation || "No preference"}</dd>
            </div>
            {#if !public_preview || !$profile.current_salary_private}<div>
                <dt>CURRENT SALARY</dt>
                <dd>
                  {$profile.salary_currency}
                  {$profile.current_salary.toLocaleString()} / year
                </dd>
              </div>{/if}
            {#if $profile.hourly_rate && (!public_preview || !$profile.hourly_private)}<div
              >
                <dt>HOURLY RATE</dt>
                <dd>
                  {$profile.salary_currency}
                  {$profile.hourly_rate.toLocaleString()} / hour
                </dd>
              </div>{/if}
          </dl>
        </section>
        {#if !public_preview || !$profile.resume_private}<section
            class="profile_side_card resume_card"
          >
            <div class="side_card_heading">
              <h2>My résumé</h2>
              <Icon name="file" size={17} />
            </div>
            <div class="resume_document">
              <span class="resume_file_icon"
                ><Icon name="file" size={25} /></span
              >
              <div>
                <strong>{$profile.name.split(" ")[0]}’s résumé</strong><span
                  >{$resume_file
                    ? $resume_file.name
                    : "Sample document · Profile overview"}</span
                >
              </div>
            </div>
            <button
              class="button button_outline button_full button_small"
              on:click={() => (resume_open = true)}
              >View résumé <Icon name="arrow-up-right" size={14} /></button
            >{#if !public_preview}<label
                class="field_label"
                style="margin-top: 14px"
                >Upload résumé<input
                  type="file"
                  accept=".pdf,.docx"
                  on:change={upload_resume}
                /><small
                  >PDF or DOCX · up to 5 MB. Kept for this session only; a
                  shareable file URL requires storage integration.</small
                ></label
              >
              <p class="resume_privacy">
                <Icon name="lock" size={11} />{$profile.resume_private
                  ? "Shared with applications only"
                  : "Visible on your public profile"}
              </p>{/if}
          </section>{/if}
        {#if !public_preview || !$profile.contact_private}<section
            class="profile_side_card contact_card"
          >
            <div class="side_card_heading">
              <h2>The best way to reach me</h2>
              <Icon name="lock" size={14} />
            </div>
            <p><Icon name="mail" size={15} />{$profile.email}</p>
            <p>{$profile.phone || "Phone not added"}</p>
            <span
              >{$profile.contact_private
                ? "Contact details are private."
                : "Contact details are visible on the public preview."}</span
            >
          </section>
          <div class="profile_quiet_note">
            <Companion kind="blue" size={88} />
            <p>
              A career is a collection of chapters.<br />Make the next one
              yours.
            </p>
          </div>{/if}
      </aside>
    </div>{/if}
</main>
{#if editing}<Modal
    title={editing === "about"
      ? "Your story, in your words."
      : editing === "skills"
        ? "The craft you bring."
        : editing === "preferences"
          ? "Make room for what’s next."
          : "Make this space yours."}
    on:close={() => (editing = "")}
    ><form on:submit|preventDefault={save}>
      <div class="form_grid">
        {#if editing === "profile"}<label class="field_label"
            >Full name<input
              class="field_input"
              required
              minlength="2"
              maxlength="100"
              bind:value={draft.name}
            /></label
          ><label class="field_label"
            >Professional title<input
              class="field_input"
              required
              maxlength="80"
              bind:value={draft.title}
            /></label
          ><label class="field_label"
            >Location<input
              class="field_input"
              required
              bind:value={draft.location}
              maxlength="80"
            /></label
          ><label class="field_label"
            >Email address<input
              class="field_input"
              required
              type="email"
              bind:value={draft.email}
            /></label
          ><label class="field_label"
            >Years of experience<input
              class="field_input"
              bind:value={draft.experience_years}
              type="number"
              min="0"
              max="99"
              step="1"
              required
            /></label
          ><label class="field_label"
            >Portfolio display name<input
              class="field_input"
              bind:value={draft.website}
              maxlength="100"
              placeholder="yourname.design"
            /></label
          ><Profile_fields
            bind:draft
            section="profile"
          />{:else if editing === "background"}<Profile_fields
            bind:draft
            section="background"
          />{:else if editing === "about"}<label class="field_label full_width"
            >A little about you<textarea
              class="field_input"
              rows="9"
              required
              maxlength="2000"
              bind:value={draft.about}></textarea><span class="muted"
              >{draft.about.length}/2000 characters</span
            ></label
          >{:else if editing === "skills"}<label class="field_label full_width"
            >Your skills<textarea
              class="field_input"
              rows="5"
              maxlength="500"
              bind:value={skill_text}></textarea><span class="muted"
              >Separate each skill with a comma.</span
            ></label
          >{:else}<label class="field_label full_width"
            >Roles you’re interested in<input
              class="field_input"
              required
              bind:value={draft.roles}
              maxlength="1000"
            /></label
          ><label class="field_label"
            >Work arrangement<select
              class="field_input"
              bind:value={draft.work_mode}
              ><option>Remote or hybrid</option><option>Remote</option><option
                >Hybrid</option
              ><option>On-site</option><option>Open to all arrangements</option
              ></select
            ></label
          ><label class="field_label full_width"
            >Notice period<select class="field_input" bind:value={draft.notice}
              >{#each notice_periods as notice}<option>{notice}</option
                >{/each}</select
            ></label
          ><Profile_fields bind:draft section="preferences" />{/if}
      </div>
      <p class="form_helper">
        Changes are saved in this browser for the design preview.
      </p>
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (editing = "")}>Cancel</button
        ><button type="submit" class="button button_dark"
          >Save changes <Icon name="check" size={16} /></button
        >
      </div>
    </form></Modal
  >{/if}
{#if resume_open}<Modal
    title="Your experience, at a glance."
    wide
    on:close={() => (resume_open = false)}
    >{#if $resume_file}<div class="resume_preview">
        <h2>{$resume_file.name}</h2>
        <p>Uploaded for this browser session.</p>
        {#if $resume_file.type === "application/pdf"}<a
            class="text_link"
            href={resume_url}
            target="_blank"
            rel="noopener noreferrer">Open PDF ↗</a
          >{:else}<p>
            Download the DOCX to view it in your document editor.
          </p>{/if}
      </div>{:else}<div class="resume_preview">
        <h2>{$profile.name}</h2>
        <p>{$profile.title} · {$profile.location}</p>
        <hr />
        <h3>About</h3>
        <p>{$profile.about}</p>
        <h3>Experience</h3>
        {#each $profile.experiences as experience}<strong
            >{experience.title} · {experience.company}</strong
          >
          <p>
            {month_label(experience.start)} — {experience.current
              ? "Present"
              : month_label(experience.end)}
          </p>{/each}
        <h3>Skills</h3>
        <p>{$profile.skills.join(" · ")}</p>
        <h3>Education</h3>
        {#each $profile.education as education}<p>
            {education.degree} · {education.field} · {education.institution}
          </p>{/each}
      </div>
    {/if}
    <div class="form_actions">
      <button class="button button_dark" on:click={download_resume}
        >{$resume_file ? "Download résumé" : "Download sample text résumé"}
        <Icon name="download" size={16} /></button
      >
    </div></Modal
  >{/if}
{#if project_open}<Modal
    title={project_open}
    wide
    on:close={() => (project_open = "")}
    ><div class="case_study">
      <span class="eyebrow_label">SELECTED WORK / SAMPLE CASE STUDY</span>
      <h3>
        {project_open === "A calmer way to work"
          ? "Helping teams find focus."
          : "Making consistency feel effortless."}
      </h3>
      <p>
        {project_open === "A calmer way to work"
          ? "A product concept that brings tasks, conversations, and priorities into one quiet workspace. The goal was to make the next useful action easy to see."
          : "A flexible system of foundations and components designed to help a growing team create a consistent, accessible product experience."}
      </p>
      <dl>
        <div>
          <dt>My role</dt>
          <dd>Product design, research, and prototyping</dd>
        </div>
        <div>
          <dt>The approach</dt>
          <dd>Listen first. Explore openly. Refine through feedback.</dd>
        </div>
        <div>
          <dt>The work</dt>
          <dd>
            {project_open === "A calmer way to work"
              ? "Customer interviews, journey mapping, interaction design, and an interactive prototype."
              : "Component audit, design tokens, accessible states, and documentation for designers and engineers."}
          </dd>
        </div>
      </dl>
      <p class="small_text muted">
        This is an illustrative portfolio entry in the profile preview.
      </p>
    </div></Modal
  >{/if}
{#if sharing}<Modal
    title="Share your next chapter."
    on:close={() => (sharing = false)}
    ><p class="modal_description">
      Copy this preview link. Profile edits are local to your browser; other
      devices will see the sample profile.
    </p>
    <label class="field_label"
      >Profile preview link<input
        class="field_input"
        readonly
        value={share_url}
        on:focus={(event) => event.currentTarget.select()}
      /></label
    ></Modal
  >{/if}
