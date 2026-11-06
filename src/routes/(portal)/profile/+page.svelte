<script>
  import { browser } from "$app/environment";
  import Profile_journey from "$lib/portal/profile_journey.svelte";
  import Social_icon from "$lib/portal/social_icon.svelte";
  import Posting_analytics from "$lib/portal/posting_analytics.svelte";
  import Profile_activity from "$lib/portal/profile_activity.svelte";
  import {
    membership_open,
    premium_active,
    preview_account,
  } from "$lib/portal/membership_state.js";
  import { viewing_currency } from "$lib/portal/state.js";
  import { to_inr } from "$lib/portal/currency.js";
  let analytics_tab = "profile";
  let membership_query_seen = false;
  $: if (
    browser &&
    $page.url.searchParams.get("membership") === "1" &&
    !membership_query_seen
  ) {
    membership_open.set(true);
    membership_query_seen = true;
  }
  // Your active posts; visitors (public preview) don't see direct-link-only (Free) ones.
  $: posted_jobs = (data.posted_jobs ?? []).filter((j) => !public_preview || j.tier !== "Free");
  $: format_preference = (amount) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: $viewing_currency,
      maximumFractionDigits: 0,
    }).format(
      to_inr(amount || 0, $profile.salary_currency, $rates) /
        ($rates[$viewing_currency] ?? 1),
    );
  async function copy_resume() {
    if ($profile.resume_visibility !== "all" || !$profile.visible) {
      toast("Make your profile and résumé public in Preferences before sharing the résumé link.");
      return;
    }
    share_url = window.location.origin + resume_link($profile.slug);
    try {
      await navigator.clipboard.writeText(share_url);
      toast("Résumé link copied.");
    } catch {
      sharing = true;
    }
  }

  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onDestroy as on_destroy } from "svelte";
  import { profile_error } from "$lib/portal/profile_validation.js";
  import Profile_skills from "$lib/portal/profile_skills.svelte";
  import Profile_projects from "$lib/portal/profile_projects.svelte";
  import Profile_photo from "$lib/portal/profile_photo.svelte";
  import {
    profile_api,
    to_store,
    regroup,
    availability_text,
    resume_link,
    resume_type,
    resume_max_bytes,
  } from "$lib/portal/profile_api.js";
  import { sync_my_skills } from "$lib/portal/my_skills.js";
  import { designations as designation_terms } from "$lib/portal/reference.js";
  import Profile_fields from "$lib/portal/profile_fields.svelte";
  import Delete_account from "$lib/portal/delete_account.svelte";
  import { visibility_labels, work_types } from "$lib/portal/filter_options.js";
  import Location_select from "$lib/portal/location_select.svelte";
  import { location_label, rates } from "$lib/portal/reference.js";
  import Icon from "$lib/portal/icon.svelte";
  import Companion from "$lib/portal/companion.svelte";
  import Modal from "$lib/portal/modal.svelte";
  import { profile, toast } from "$lib/portal/state";
  import { default_profile } from "$lib/portal/data";
  export let data;
  // The server's copy is the truth; the store feeds the profile components.
  $: profile.set(to_store(data.profile));
  let editing = "";
  let resume_busy = false;
  let draft = to_store(data.profile);
  let saving = false;
  let skill_text = "";
  let public_preview = false;
  let resume_open = false;
  let sharing = false;
  let share_url = "";
  // The profile store also backs signed-out match previews: don't leave a
  // visited profile in it.
  on_destroy(() => data.visitor && profile.set(structuredClone(default_profile)));
  // Who sees each restricted field: everyone, or only recruiters of jobs you
  // apply to; your current salary can also be hidden from everyone.
  const visibility_options = [
    { key: "current_salary_visibility", title: "Current salary", choices: ["all", "applied", "hidden"] },
    { key: "expected_salary_visibility", title: "Expected salary", choices: ["all", "applied"] },
    { key: "hourly_rate_visibility", title: "Hourly rate", choices: ["all", "applied"] },
    { key: "resume_visibility", title: "Résumé", choices: ["all", "applied"] },
    { key: "contact_visibility", title: "Contact details", choices: ["all", "applied"] },
  ];
  // Public visitors (and the public preview) see a field only when it's visible to all.
  $: shows = (key) => !public_preview || $profile[key] === "all";
  const privacy_options = [
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
  ];
  $: current_tab = data.visitor
    ? $page.url.searchParams.get("tab") === "activity" ? "activity" : "overview"
    : ["overview", "activity", "preferences", "jobs"].includes(
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
  $: applied_jobs = data.applications ?? [];
  $: completeness = [
    $profile.name,
    $profile.title,
    $profile.about,
    $profile.skills.length,
  ].filter(Boolean).length;
  // Visitors (/profiles/[slug]) get the read-only view the owner previews
  // with ?public=1, minus the owner-only posting analytics and résumé preview.
  $: visitor = !!data.visitor;
  $: public_preview = visitor || $page.url.searchParams.get("public") === "1";
  $: tab_href = (tab) => {
    const query = new URLSearchParams({
      ...(public_preview && !visitor && { public: "1" }),
      ...(tab !== "overview" && { tab }),
    });
    return (visitor ? `/profiles/${$profile.slug}` : "/profile") + (query.size ? "?" + query : "");
  };
  // The old notice select set only the filter bucket: start the number + unit from it.
  const bucket_days = { Immediate: 0, "15 days": 15, "30 days": 30, "45 days": 45, "60 days": 60, "90 days": 90, "More than 90 days": 120 };
  function edit(section) {
    draft = structuredClone($profile);
    if (!draft.notice_unit)
      [draft.notice_unit, draft.notice_value] = ["days", bucket_days[draft.notice] ?? 30];
    skill_text = draft.skills.join(", ");
    editing = section;
  }
  async function save() {
    if (saving) return;
    if (!draft.name.trim() || !draft.title.trim()) {
      toast("Add your name and professional title before saving.");
      return;
    }
    if (editing === "preferences")
      draft.target_roles = [
        ...new Set(
          draft.roles
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean),
        ),
      ];
    if (editing === "skills")
      draft.skill_groups = regroup(draft.skill_groups, [
        ...new Set(
          skill_text
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
        ),
      ]);
    const error = profile_error(draft);
    if (error) {
      toast(error);
      return;
    }
    saving = true;
    const result = await profile_api.save(draft);
    saving = false;
    if (!result.ok) {
      toast(result.error);
      return;
    }
    // Editing a verified experience sends it back to the company for review.
    const rereview = result.data.experiences.some(
      (e, i) => e.verification === "Pending" && $profile.experiences[i]?.verification === "Verified",
    );
    profile.set(to_store(result.data));
    if (editing === "skills") sync_my_skills();
    editing = "";
    toast(
      rereview
        ? "Profile updated. You edited a verified experience, so the company will review it again."
        : "Profile updated. Your next chapter looks good on you.",
    );
  }
  async function set_visibility(key, value) {
    const result = await profile_api.save({ ...$profile, [key]: value });
    if (!result.ok) {
      toast(result.error);
      return;
    }
    profile.set(to_store(result.data));
    toast("Privacy preference saved.");
  }
  async function privacy(key) {
    const result = await profile_api.save({ ...$profile, [key]: !$profile[key] });
    if (!result.ok) {
      toast(result.error);
      return;
    }
    profile.set(to_store(result.data));
    toast("Privacy preference saved.");
  }
  async function request_verification(index) {
    const result = await profile_api.request_verification(index);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    profile.set(to_store(result.data));
    toast("Verification requested. The company will review it.");
  }
  async function share() {
    if (!$profile.saved) return toast("Save your profile first, then share it.");
    if (!$profile.visible) return toast("Your profile is private. Make it public in Preferences to share it.");
    share_url = `${window.location.origin}/profiles/${$profile.slug}`;
    try {
      await navigator.clipboard.writeText(share_url);
      toast("Profile link copied.");
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
  async function upload_resume(event) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file || resume_busy) return;
    if (!resume_type(file.name) || file.size > resume_max_bytes || file.size === 0) {
      toast("Choose a PDF or DOCX file, up to 5 MB.");
      return;
    }
    if (!$profile.saved) {
      toast("Save your profile once before uploading a résumé.");
      return;
    }
    resume_busy = true;
    const result = await profile_api.upload_resume(file);
    resume_busy = false;
    if (!result.ok) {
      toast(result.error || "Could not upload your résumé. Try again.");
      return;
    }
    profile.set(to_store(result.data));
    toast("Résumé uploaded.");
  }
  async function remove_resume() {
    if (resume_busy) return;
    resume_busy = true;
    const result = await profile_api.remove_resume();
    resume_busy = false;
    if (!result.ok) {
      toast(result.error || "Could not remove your résumé. Try again.");
      return;
    }
    profile.set(to_store(result.data));
    resume_open = false;
    toast("Résumé removed.");
  }
  $: resume_details = $profile.resume
    ? `${$profile.resume.format.toUpperCase()} · uploaded ${new Date($profile.resume.uploaded_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}`
    : "";
  // Without an uploaded file: the profile overview as plain text.
  function download_resume() {
    const text = `${$profile.name}\n${$profile.title}\n${$profile.location}\n\nABOUT\n${$profile.about}\n\nSKILLS\n${$profile.skills.join(", ")}\n\nEXPERIENCE\n${$profile.experiences.map((entry) => `${entry.roles.at(-1)?.title ?? ""}, ${entry.company} | ${entry.start} - ${entry.current ? "Present" : entry.end}`).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${$profile.name.replace(/[^a-z0-9]/gi, "_")}_profile_summary.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head
  ><title>{$profile.name} — {visitor ? "Profile" : "Your profile"} — Referise</title><meta
    name="description"
    content="Make your experience, skills, and next chapter your own. Manage your Referise profile and privacy preferences."
  />{#if !visitor}<meta name="robots" content="noindex" />{/if}</svelte:head
>
<main id="main-content" class="profile_page portal_container">
  {#if !visitor}<div class="profile_page_intro">
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
    {#if !public_preview}<button
        class="button button_outline button_small edit_profile_button"
        on:click={() => edit("profile")}
        ><Icon name="edit" size={14} />Edit profile</button
      >{/if}
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
  </div>{/if}
  {#if public_preview && !visitor}<div class="public_preview_notice">
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
      <div class="profile_cover journey_cover">
        <Profile_journey profile={$profile} {public_preview} />
      </div>
      <div class="profile_identity_body">
        <Profile_photo
          {initials}
          readonly={public_preview}
          premium={$premium_active}
        />
        <div class="profile_identity_main">
          <div class="profile_name_row">
            <h2>{$profile.name}</h2>
            {#if data.analytics}<a
              class="profile_mini_analytics"
              href={tab_href("activity")}
              ><strong>{data.analytics.totals.profile_views} <span>views in the last 7 days</span></strong><svg
                viewBox="0 0 80 24"
                aria-hidden="true"
                ><path
                  d="M1 22L13 18L25 20L38 11L50 14L63 5L78 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                /></svg
              ><small>Updated daily</small></a
            >{/if}
          </div>
          <p class="profile_title">
            {$profile.title}{#if $profile.pronouns}<small>
                · {$profile.pronouns}</small
              >{/if}
          </p>
          {#if $profile.social_links.length}<div class="profile_meta">
              {#each $profile.social_links as link}<Social_icon {link} />{/each}
            </div>{/if}
          <div class="profile_meta">
            {#if $profile.current_company}<span
                ><Icon name="building" size={14} />{[
                  $profile.current_company,
                  $profile.current_work_arrangement,
                  $profile.current_work_type,
                ]
                  .filter(Boolean)
                  .join(" · ")}</span
              >{/if}{#if $profile.location}<span
                ><Icon name="location" size={14} />{$profile.location}</span
              >{/if}<span
              ><Icon name="briefcase" size={14} />{$profile.experience} of experience</span
            ><span
              ><Icon name="globe" size={14} />{$profile.website ||
                "Portfolio coming soon"}</span
            >
          </div>
        </div>
      </div>
      <div class="profile_contact_actions">
        {#if !public_preview && $premium_active}<span class="premium_status"
            >Premium preview active · until {new Date(
              $preview_account.premium_until,
            ).toLocaleDateString()}</span
          >{/if}
        {#if shows("contact_visibility")}<a
            href={`mailto:${$profile.email}`}>{$profile.email}</a
          >{#if $profile.phone}<a href={`tel:${$profile.phone}`}
              >{$profile.phone}</a
            >{/if}{/if}
        {#if (!visitor || $profile.resume) && shows("resume_visibility")}<button
            class="text_link"
            on:click={() => (resume_open = true)}>View résumé ↗</button
          >{/if}
        <button class="text_link" on:click={share}>Copy profile link</button>
        {#if !visitor && $profile.resume && shows("resume_visibility")}<button
            class="text_link"
            on:click={copy_resume}>Copy résumé link</button
          >{/if}
        {#if !public_preview}<button
            class="text_link"
            on:click={() => membership_open.set(true)}>Membership ↗</button
          >{/if}
      </div>
      {#if !public_preview}<p class="profile_link_note">
          Your profile link opens your public profile.
        </p>{/if}
      <div class="profile_navigation">
        <nav aria-label="Profile sections">
          <a href={tab_href("overview")} class:active={current_tab === "overview"}>Overview</a
          ><a href={tab_href("activity")} class:active={current_tab === "activity"}
              >Activity & insights <span class="tab_dot"></span></a
            >{#if !visitor}<a href={tab_href("jobs")} class:active={current_tab === "jobs"}
              >{public_preview ? "Jobs posted" : "Jobs posted by me"}</a
            >{/if}{#if !public_preview}<a
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
            <Profile_skills readonly={public_preview} />
          </section>
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
              {#each $profile.experiences as experience, experience_index}<article
                  id={`experience-${experience_index}`}
                >
                  <span class="resume_file_icon"
                    ><Icon name="building" size={24} /></span
                  >
                  <div>
                    <div class="experience_title">
                      <h3>{experience.company}</h3>
                      <span
                        >{month_label(experience.start)} — {experience.current
                          ? "Present"
                          : month_label(experience.end)}</span
                      >
                    </div>
                    <p class="experience_company">
                      {[experience.type, experience.work_arrangement, experience.location]
                        .filter(Boolean)
                        .join(" · ")}<span
                        >{#if experience.verification === "Verified"}<span
                            class="verified_employment"
                            ><Icon name="shield" size={13} />Employer verified</span
                          >{:else if !public_preview}{experience.verification === "Pending"
                            ? "Pending company review"
                            : experience.verification}{/if}</span
                      >
                    </p>
                    {#each experience.roles as role}<div class="experience_role">
                        <div class="experience_title">
                          <h4>{role.title}</h4>
                          <span
                            >{month_label(role.start)} — {role.end
                              ? month_label(role.end)
                              : "Present"}</span
                          >
                        </div>
                        {#if role.promoted}<span class="promoted_tag">Promoted</span
                          >{/if}
                        {#if role.responsibilities}<p class="experience_description">
                            {role.responsibilities}
                          </p>{/if}
                        {#if role.achievements.length}<ul class="experience_achievements">
                            {#each role.achievements as achievement}<li>{achievement}</li>{/each}
                          </ul>{/if}
                      </div>{/each}
                    {#if !public_preview && experience.verification !== "Verified" && experience.verification !== "Pending"}<button
                        class="button button_outline button_small"
                        on:click={() => request_verification(experience_index)}
                        >{experience.verification === "Rejected"
                          ? "Request approval again"
                          : "Request verification"}</button
                      >{/if}
                  </div>
                </article>{/each}
            </div>
          </section>
          <Profile_projects readonly={public_preview} />
        {:else if current_tab === "jobs"}
          <section class="profile_section">
            <div class="profile_section_heading">
              <h2>
                {public_preview
                  ? "Opportunities I’ve shared"
                  : "Jobs posted by me"}
              </h2>
              {#if !public_preview}<a class="text_link" href="/recruiter/jobs"
                  >Manage jobs ↗</a
                >{/if}
            </div>
            <p class="small_text">
              Active listings{public_preview
                ? ""
                : " · Includes your direct-link listings"}.
            </p>
            <div class="profile_posted_jobs">
              {#each posted_jobs as job (job.id)}<a class="workspace_hint" href={`/jobs/${job.id}`}>
                  <strong>{job.title}</strong>
                  <span class="small_text">
                    {job.company_name || "Confidential"} · {job.tier === "Free" ? "Direct link only" : job.tier}
                    · Posted {new Date(job.posted_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    {#if !public_preview}· {job.views} views · {job.applications} applications{/if}
                  </span>
                </a>{:else}<p>No active jobs to show.</p>{/each}
            </div>
          </section>
        {:else if current_tab === "activity"}{#if !public_preview}<div class="analytics_tabs">
            <button
              class:active={analytics_tab === "profile"}
              on:click={() => (analytics_tab = "profile")}
              >Profile · 7 days</button
            ><button
              class:active={analytics_tab === "jobs"}
              on:click={() => (analytics_tab = "jobs")}>Job posting</button
            >
          </div>{/if}
          {#if analytics_tab === "jobs" && !public_preview}<Posting_analytics />{:else}
            <Profile_activity analytics={data.analytics} />
            {#if !public_preview}<section class="profile_section">
                <div class="profile_section_heading">
                  <h2>The doors you’ve opened</h2>
                  <span class="section_label"
                    >{applied_jobs.length} {applied_jobs.length === 1 ? "APPLICATION" : "APPLICATIONS"}</span
                  >
                </div>
                {#if applied_jobs.length}<div class="application_list">
                    {#each applied_jobs.slice(0, 5) as a (a.id)}<a href={`/jobs/${a.job_id}`}
                        ><div>
                          <h3>{a.job_title}</h3>
                          <p>
                            {a.company_name || "Confidential"} · Applied {new Date(a.submitted_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                          </p>
                        </div>
                        <span
                          ><Icon name="check" size={12} />{a.apply_type === "external"
                            ? "On employer’s site"
                            : { new: "Submitted", shortlisted: "Shortlisted", contacted: "Contacted", rejected: "Not moving forward" }[a.stage]}</span
                        ><Icon name="arrow-up-right" size={17} /></a
                      >{/each}
                    {#if applied_jobs.length > 5}<a class="text_link" href="/applications">All your applications ↗</a>{/if}
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
          {/if}
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
                <dt>Minimum expected salary</dt>
                <dd>{format_preference($profile.expected_salary)} / {$profile.expected_salary_period}</dd>
              </div>
              <div>
                <dt>Availability</dt>
                <dd>{availability_text($profile)}</dd>
              </div>
              <div>
                <dt>Travel</dt>
                <dd>{$profile.travel || "No preference"}</dd>
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
            {#each visibility_options as option}<div class="privacy_preference">
                <div>
                  <strong>{option.title}</strong>
                  <p>
                    {$profile[option.key] === "all"
                      ? "Anyone who opens your profile can see it."
                      : $profile[option.key] === "applied"
                        ? "Only recruiters of jobs you apply to can see it."
                        : "Nobody sees it, not even recruiters you apply to."}
                  </p>
                </div>
                <select
                  class="field_input"
                  aria-label={`${option.title} visibility`}
                  value={$profile[option.key]}
                  on:change={(e) => set_visibility(option.key, e.currentTarget.value)}
                  >{#each option.choices as choice}<option value={choice}
                      >{visibility_labels[choice]}</option
                    >{/each}</select
                >
              </div>{/each}
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
                >These settings are saved to your profile and apply to
                everyone who opens your public profile link.</span
              >
            </div>
            <Delete_account />
          </section>
        {/if}
      </div>
      <aside class="profile_sidebar">
        <section id="profile-background" class="profile_side_card">
          <div class="side_card_heading">
            <h2>Background</h2>
            {#if !public_preview}<button
                class="icon_button"
                aria-label="Edit background"
                on:click={() => edit("background")}
                ><Icon name="edit" size={15} /></button
              >{/if}
          </div>
          <dl class="requirement_facts">
            <div>
              <dt>Languages</dt>
              <dd>
                {$profile.languages
                  .map((language) => {
                    const can = ["read", "write", "speak"].filter((k) => language[k]);
                    return can.length ? `${language.name} (${can.join(", ")})` : language.name;
                  })
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
          <div class="sidebar_education">
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
                  </p>
                  {#if education.grade || education.honors}<p>
                      {[education.grade, education.honors].filter(Boolean).join(" · ")}
                    </p>{/if}
                  {#if education.description}<p>{education.description}</p>{/if}
                  {#if education.achievements?.length}<ul class="experience_achievements">
                      {#each education.achievements as achievement}<li>{achievement}</li>{/each}
                    </ul>{/if}{:else}<p>Education not added.</p>{/each}
              </div>
            </div>
          </div>
        </section>
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
          <label class="preference_currency"
            >Display currency<select
              aria-label="Profile display currency"
              bind:value={$viewing_currency}
              ><option>INR</option><option>USD</option><option>EUR</option
              ><option>GBP</option></select
            ></label
          ><small class="small_text">Converted at today’s published rates.</small>
          <dl class="career_preferences">
            <div>
              <dt><Icon name="briefcase" size={14} />LOOKING FOR</dt>
              <dd>{$profile.roles}</dd>
            </div>
            <div>
              <dt><Icon name="laptop" size={14} />WORK ARRANGEMENT</dt>
              <dd>{$profile.work_mode}</dd>
            </div>
            {#if shows("expected_salary_visibility")}<div>
                <dt><Icon name="money" size={14} />MINIMUM EXPECTED SALARY</dt>
                <dd>
                  {format_preference($profile.expected_salary)} / {$profile.expected_salary_period}{#if $profile.expected_salary_visibility !== "all"}<span
                      class="private_label"
                      ><Icon name="lock" size={10} />{visibility_labels[$profile.expected_salary_visibility]}</span
                    >{/if}
                </dd>
              </div>{/if}
            <div>
              <dt><Icon name="clock" size={14} />READY TO START</dt>
              <dd>{availability_text($profile)}</dd>
            </div>
            <div>
              <dt>EMPLOYMENT TYPES</dt>
              <dd>{$profile.work_types.join(", ") || "No preference"}</dd>
            </div>
            <div>
              <dt>PREFERRED LOCATIONS</dt>
              <dd>
                {$profile.preferred_locations.map($location_label).join(", ") ||
                  "No preference"}{$profile.open_to_remote
                  ? " · Worldwide remote"
                  : ""}
              </dd>
            </div>
            <div>
              <dt>RELOCATION</dt>
              <dd>{$profile.relocation || "No preference"}</dd>
            </div>
            <div>
              <dt>TRAVEL</dt>
              <dd>{$profile.travel || "No preference"}</dd>
            </div>
            {#if shows("current_salary_visibility")}<div>
                <dt>CURRENT SALARY</dt>
                <dd>
                  {$profile.salary_currency}
                  {$profile.current_salary.toLocaleString()} / {$profile.current_salary_period}{#if !public_preview}<span
                      class="private_label"
                      ><Icon name="lock" size={10} />{visibility_labels[$profile.current_salary_visibility]}</span
                    >{/if}
                </dd>
              </div>{/if}
            {#if shows("hourly_rate_visibility")}<div>
                <dt>HOURLY GIG RATE</dt>
                <dd>
                  {$profile.hourly_rate
                    ? `${format_preference($profile.hourly_rate)} / hour`
                    : "Not specified"}
                </dd>
              </div>{/if}
          </dl>
        </section>
        {#if (!visitor || $profile.resume) && shows("resume_visibility")}<section
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
                  >{$profile.resume ? resume_details : "No file yet · showing your profile overview"}</span
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
                >{$profile.resume ? "Replace résumé" : "Upload résumé"}<input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  disabled={resume_busy}
                  on:change={upload_resume}
                /><small
                  >{resume_busy ? "Working…" : "PDF or DOCX · up to 5 MB."}</small
                ></label
              >{#if $profile.resume}<button
                  class="text_link"
                  disabled={resume_busy}
                  on:click={remove_resume}>Remove résumé</button
                >{/if}
              <p class="resume_privacy">
                <Icon name="lock" size={11} />{$profile.resume_visibility === "all"
                  ? "Visible on your public profile"
                  : "Shared with applications only"}
              </p>{/if}
          </section>{/if}
        {#if shows("contact_visibility")}<section
            class="profile_side_card contact_card"
          >
            <div class="side_card_heading">
              <h2>The best way to reach me</h2>
              <Icon name="lock" size={14} />
            </div>
            <p><Icon name="mail" size={15} />{$profile.email}</p>
            <p>{$profile.phone || "Phone not added"}</p>
            <span
              >{$profile.contact_visibility === "all"
                ? "Contact details are visible on the public preview."
                : "Shared only with recruiters of jobs you apply to."}</span
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
            >Current company · optional<input
              class="field_input"
              maxlength="150"
              bind:value={draft.current_company}
            /></label
          ><Location_select
            label="Current work location"
            bind:value={draft.current_location_id}
          /><label class="field_label"
            >Current work arrangement<select
              class="field_input"
              bind:value={draft.current_work_arrangement}
              ><option value="">Not specified</option
              >{#each ["On-site", "Hybrid", "Remote"] as mode}<option>{mode}</option
                >{/each}</select
            ></label
          ><label class="field_label"
            >Current work type<select
              class="field_input"
              bind:value={draft.current_work_type}
              ><option value="">Not specified</option
              >{#each work_types as type}<option>{type}</option>{/each}</select
            ></label
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
              bind:value={draft.about}
            ></textarea><span class="muted"
              >{draft.about.length}/2000 characters</span
            ></label
          >{:else if editing === "skills"}<label class="field_label full_width"
            >Your skills<textarea
              class="field_input"
              rows="5"
              maxlength="500"
              bind:value={skill_text}
            ></textarea><span class="muted"
              >Separate each skill with a comma.</span
            ></label
          >{:else}<label class="field_label full_width"
            >Roles you’re interested in<input
              class="field_input"
              list="designation_names"
              placeholder="Product Designer, UX Researcher"
              bind:value={draft.roles}
              maxlength="1000"
            /><datalist id="designation_names"
              >{#each $designation_terms as term}<option value={term.name}
                ></option>{/each}</datalist
            ><small>Separate roles with commas. New roles are added for review.</small></label
          ><label class="field_label"
            >Work arrangement<select
              class="field_input"
              bind:value={draft.work_mode}
              ><option>Remote or hybrid</option><option>Remote</option><option
                >Hybrid</option
              ><option>On-site</option><option>Open to all arrangements</option
              ></select
            ></label
          ><Profile_fields bind:draft section="preferences" />{/if}
      </div>
      <p class="form_helper">
        Changes are saved to your Referise profile.
      </p>
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          on:click={() => (editing = "")}>Cancel</button
        ><button type="submit" class="button button_dark" disabled={saving}
          >{saving ? "Saving…" : "Save changes"} <Icon name="check" size={16} /></button
        >
      </div>
    </form></Modal
  >{/if}
{#if resume_open}<Modal
    title="Your experience, at a glance."
    wide
    on:close={() => (resume_open = false)}
    >{#if $profile.resume}<div class="resume_preview">
        <h2>{$profile.name.split(" ")[0]}’s résumé</h2>
        <p>{resume_details}</p>
        {#if $profile.resume.format === "pdf"}<a
            class="text_link"
            href={resume_link($profile.slug)}
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
            >{experience.roles.map((r) => r.title).join(" → ")} · {experience.company}</strong
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
      {#if $profile.resume}<a class="button button_dark" href={resume_link($profile.slug, "download")}
          >Download résumé <Icon name="download" size={16} /></a
        >{:else}<button class="button button_dark" on:click={download_resume}
          >Download profile summary (text) <Icon name="download" size={16} /></button
        >{/if}
    </div></Modal
  >{/if}
{#if sharing}<Modal
    title="Share your next chapter."
    on:close={() => (sharing = false)}
    ><p class="modal_description">
      Anyone with this link can see your public profile. Private salary,
      contact details and résumé settings still apply.
    </p>
    <label class="field_label"
      >Profile link<input
        class="field_input"
        readonly
        value={share_url}
        on:focus={(event) => event.currentTarget.select()}
      /></label
    ></Modal
  >{/if}
