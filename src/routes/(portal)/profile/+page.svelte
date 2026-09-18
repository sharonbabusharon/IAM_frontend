<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import Icon from "$lib/portal/icon.svelte";
  import Company_logo from "$lib/portal/company_logo.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import { profile, applications, saved_jobs, toast } from "$lib/portal/state";
  import { default_profile, jobs, get_company } from "$lib/portal/data";
  import type { profile_data } from "$lib/portal/types";
  let editing = "";
  let draft: profile_data = {
    ...default_profile,
    skills: [...default_profile.skills],
  };
  let skill_text = "";
  let public_preview = false;
  let resume_open = false;
  let project_open = "";
  let sharing = false;
  let share_url = "";
  const privacy_options: {
    key: "visible" | "open" | "salary_private" | "resume_private";
    title: string;
    text: string;
  }[] = [
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
    ? $page.url.searchParams.get("tab")!
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
  function edit(section: string) {
    draft = { ...$profile, skills: [...$profile.skills] };
    skill_text = draft.skills.join(", ");
    editing = section;
  }
  function save() {
    if (!draft.name.trim() || !draft.title.trim()) {
      toast("Add your name and professional title before saving.");
      return;
    }
    if (editing === "skills")
      draft.skills = [
        ...new Set(
          skill_text
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        ),
      ].slice(0, 16);
    profile.set({
      ...draft,
      name: draft.name.trim(),
      title: draft.title.trim(),
    });
    editing = "";
    toast("Profile updated. Your next chapter looks good on you.");
  }
  function privacy(
    key: "visible" | "salary_private" | "resume_private" | "open",
  ) {
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
  function download_resume() {
    const text = `${$profile.name}\n${$profile.title}\n${$profile.location}\n\nABOUT\n${$profile.about}\n\nSKILLS\n${$profile.skills.join(", ")}\n\nEXPERIENCE\nProduct Designer, Forma | 2023 - Present\nDesigner, Layers | 2020 - 2023\n\nThis is a sample resume from the Referise design preview.`;
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
      <h1>{public_preview ? "Your public profile." : "Make yourself known."}</h1>
    </div>
    <button
      class="button button_outline button_small"
      on:click={() => {
        goto(public_preview ? "/profile" : "/profile?public=1", { noScroll: true });
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
            stroke="#aeb59a"
            stroke-width="32"
          /><path
            d="M820 220V92a105 105 0 0 1 210 0v128"
            fill="none"
            stroke="#c6ccb4"
            stroke-width="21"
          /><circle cx="1084" cy="6" r="95" fill="#d8c8a4" /><path
            d="M60 150C180-55 410 170 560 10"
            fill="none"
            stroke="#b6bea1"
            stroke-width="1"
            stroke-dasharray="3 6"
          /></svg
        ><span>THERE’S MORE TO YOUR STORY.</span><span class="cover_star"
          >✳</span
        >
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
          <p class="profile_title">{$profile.title}</p>
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
      <div class="profile_navigation">
        <nav aria-label="Profile sections">
          <a
            href="/profile"
            class:active={current_tab === "overview"}
            on:click|preventDefault={() => goto("/profile", { noScroll: true })}
            >Overview</a
          >{#if !public_preview}<a
              href="/profile?tab=activity"
              class:active={current_tab === "activity"}
              on:click|preventDefault={() =>
                goto("/profile?tab=activity", { noScroll: true })}
              >Activity & insights <span class="tab_dot"></span></a
            ><a
              href="/profile?tab=preferences"
              class:active={current_tab === "preferences"}
              on:click|preventDefault={() =>
                goto("/profile?tab=preferences", { noScroll: true })}
              >Preferences</a
            >{/if}
        </nav>
        {#if !public_preview}<button on:click={share}
            ><Icon name="share" size={14} />Share profile</button
          >{/if}
      </div>
    </section>
    <div class="profile_content_grid">
      <div class="profile_main_content">
        {#if current_tab === "overview" || public_preview}
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
              {#each $profile.skills as skill}<span>{skill}</span>{/each}
            </div>
          </section>
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>My journey so far</h2>
              <span class="section_label">EXPERIENCE</span>
            </div>
            <div class="experience_timeline">
              <article>
                <Company_logo id="forma" size={43} />
                <div>
                  <div class="experience_title">
                    <h3>Product Designer</h3>
                    <span>2023 — Present</span>
                  </div>
                  <p class="experience_company">
                    Forma <span>Full-time</span><span class="verified_small"
                      ><Icon name="shield" size={13} />Verified</span
                    >
                  </p>
                  <p class="experience_description">
                    Designing thoughtful tools for modern teams. Leading product
                    experiences from discovery to delivery, and helping build a
                    design system that grows with the product.
                  </p>
                  <div class="experience_tags">
                    <span>Product design</span><span>Design systems</span>
                  </div>
                </div>
              </article>
              <article>
                <Company_logo id="layers" size={43} />
                <div>
                  <div class="experience_title">
                    <h3>Designer</h3>
                    <span>2020 — 2023</span>
                  </div>
                  <p class="experience_company">
                    Layers <span>Full-time</span>
                  </p>
                  <p class="experience_description">
                    Partnered with early-stage teams to bring new ideas to life.
                    Worked across research, interaction design, and visual
                    storytelling.
                  </p>
                  <div class="experience_tags">
                    <span>Interaction design</span><span>Prototyping</span>
                  </div>
                </div>
              </article>
            </div>
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
                <h3>Bachelor of Design</h3>
                <p>Communication Design · 2016–2020</p>
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
                <Icon name="eye" size={19} /><strong>248</strong><span
                  >Profile views</span
                ><small>+18% this month</small>
              </div>
              <div>
                <Icon name="file" size={19} /><strong>36</strong><span
                  >Résumé views</span
                ><small>+8% this month</small>
              </div>
              <div>
                <Icon name="briefcase" size={19} /><strong
                  >{$applications.length}</strong
                ><span>Preview applications</span><small
                  >Made by you in this browser</small
                >
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
                aria-label="Illustrative profile engagement rising over four weeks"
                ><defs
                  ><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"
                    ><stop
                      offset="0%"
                      stop-color="#bdc8a9"
                      stop-opacity=".5"
                    /><stop
                      offset="100%"
                      stop-color="#bdc8a9"
                      stop-opacity="0"
                    /></linearGradient
                  ></defs
                ><path
                  d="M30 30h590M30 75h590M30 120h590"
                  stroke="#e6e9dd"
                  stroke-dasharray="3 4"
                /><path
                  d="M30 119C90 115 75 79 130 92S211 135 270 81 310 76 350 68 416 36 470 53 546 24 620 15V150H30Z"
                  fill="url(#chart-fill)"
                /><path
                  d="M30 119C90 115 75 79 130 92S211 135 270 81 310 76 350 68 416 36 470 53 546 24 620 15"
                  fill="none"
                  stroke="#78886a"
                  stroke-width="2.5"
                /><g font-size="9" fill="#959d88" font-family="DM Sans"
                  ><text x="30" y="169">Week 1</text><text x="220" y="169"
                    >Week 2</text
                  ><text x="407" y="169">Week 3</text><text x="580" y="169"
                    >Week 4</text
                  ></g
                ></svg
              >
            </div>
          </section>
          <section class="profile_section">
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
                    <span><Icon name="check" size={12} />Saved in preview</span
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
          </section>
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
                <dd>{$profile.notice}</dd>
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
            {#each privacy_options as preference}<div class="privacy_preference">
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
              <dd>{$profile.notice}</dd>
            </div>
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
                  >Sample document · Profile overview</span
                >
              </div>
            </div>
            <button
              class="button button_outline button_full button_small"
              on:click={() => (resume_open = true)}
              >View résumé <Icon name="arrow-up-right" size={14} /></button
            >{#if !public_preview}<p class="resume_privacy">
                <Icon name="lock" size={11} />{$profile.resume_private
                  ? "Shared with applications only"
                  : "Visible on your public profile"}
              </p>{/if}
          </section>{/if}
        {#if !public_preview}<section class="profile_side_card contact_card">
            <div class="side_card_heading">
              <h2>The best way to reach me</h2>
              <Icon name="lock" size={14} />
            </div>
            <p><Icon name="mail" size={15} />{$profile.email}</p>
            <span>Contact details stay private in this preview.</span>
          </section>
          <div class="profile_quiet_note">
            <Icon name="heart" size={20} />
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
              maxlength="80"
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
              bind:value={draft.experience}
              maxlength="25"
            /></label
          ><label class="field_label"
            >Portfolio display name<input
              class="field_input"
              bind:value={draft.website}
              maxlength="100"
              placeholder="yourname.design"
            /></label
          >{:else if editing === "about"}<label class="field_label full_width"
            >A little about you<textarea
              class="field_input"
              rows="9"
              required
              maxlength="1500"
              bind:value={draft.about}></textarea><span class="muted"
              >{draft.about.length}/1500 characters</span
            ></label
          >{:else if editing === "skills"}<label class="field_label full_width"
            >Your skills<textarea
              class="field_input"
              rows="5"
              maxlength="500"
              bind:value={skill_text}></textarea><span class="muted"
              >Separate each skill with a comma. Up to 16 skills.</span
            ></label
          >{:else}<label class="field_label full_width"
            >Roles you’re interested in<input
              class="field_input"
              required
              bind:value={draft.roles}
              maxlength="140"
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
          ><label class="field_label"
            >Expected compensation<input
              class="field_input"
              required
              bind:value={draft.expected}
              maxlength="40"
              placeholder="₹28–36 LPA"
            /></label
          ><label class="field_label full_width"
            >Notice period<select class="field_input" bind:value={draft.notice}
              ><option>Immediately</option><option>15 days</option><option
                >30 days</option
              ><option>60 days</option><option>90 days</option></select
            ></label
          >{/if}
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
    ><div class="resume_preview">
      <h2>{$profile.name}</h2>
      <p>{$profile.title} · {$profile.location}</p>
      <hr />
      <h3>About</h3>
      <p>{$profile.about}</p>
      <h3>Experience</h3>
      <strong>Product Designer · Forma</strong>
      <p>2023 — Present</p>
      <strong>Designer · Layers</strong>
      <p>2020 — 2023</p>
      <h3>Skills</h3>
      <p>{$profile.skills.join(" · ")}</p>
      <h3>Education</h3>
      <p>Bachelor of Design · Communication Design</p>
    </div>
    <div class="form_actions">
      <button class="button button_dark" on:click={download_resume}
        >Download text résumé <Icon name="download" size={16} /></button
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
