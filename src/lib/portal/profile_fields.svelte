<script>
  import Location_search from "./location_search.svelte";
  import Location_select from "./location_select.svelte";
  import Country_select from "./country_select.svelte";
  import { countries } from "./reference.js";
  import { profile_api } from "./profile_api.js";
  import {
    work_types,
    relocation_options,
    availability_options,
    travel_options,
    salary_periods,
  } from "./filter_options.js";
  export let draft;
  export let section;

  // Live handle check (manual "Profile URL Slug"): debounced, latest answer wins.
  const initial_slug = draft.slug;
  let slug_note = "";
  let slug_timer;
  let slug_seq = 0;
  function check_slug(slug) {
    clearTimeout(slug_timer);
    slug_note = "";
    if (slug === initial_slug || !/^[a-z0-9-]{3,50}$/.test(slug)) return;
    const seq = ++slug_seq;
    slug_timer = setTimeout(async () => {
      const result = await profile_api.slug_available(slug);
      if (seq !== slug_seq || result.status === 401) return; // stale, or the signed-out preview
      slug_note = !result.ok
        ? result.error
        : result.data.available
          ? "Available."
          : "Taken: try another handle, e.g. with a number at the end.";
    }, 400);
  }
  $: if (section === "profile") check_slug(draft.slug);

  const arrangements = ["On-site", "Hybrid", "Remote"];
  const blank_role = (start = "") => ({
    title: "",
    start,
    end: "",
    promoted: false,
    responsibilities: "",
    achievements: [],
  });
  // Achievements are edited one per line.
  const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

  function toggle(key, value) {
    draft = {
      ...draft,
      [key]: draft[key].includes(value)
        ? draft[key].filter((item) => item !== value)
        : [...draft[key], value],
    };
  }
</script>

<div class="profile_extra_fields">
  {#if section === "profile"}
    <div class="form_grid">
      <label class="field_label"
        >Phone number<input
          class="field_input"
          type="tel"
          maxlength="30"
          bind:value={draft.phone}
        /></label
      >
      <label class="field_label"
        >Profile handle<input
          class="field_input"
          minlength="3"
          maxlength="50"
          pattern="[a-z0-9\-]+"
          bind:value={draft.slug}
          required
        /><small aria-live="polite"
          >{slug_note || "Lowercase letters, numbers and hyphens."}</small
        ></label
      >
      <label class="field_label"
        >Gender · optional<select class="field_input" bind:value={draft.gender}
          ><option value="">Not specified</option><option>Male</option><option
            >Female</option
          ><option>Non-binary</option><option>Prefer not to say</option></select
        ></label
      >
      <label class="field_label"
        >Pronouns · optional<input
          class="field_input"
          maxlength="100"
          placeholder="she/her, they/them, or your own"
          bind:value={draft.pronouns}
        /><small>Informational only; never used to rank candidates.</small
        ></label
      >
    </div>
    <h3>Where to find your work</h3>
    {#each draft.social_links as link, index}<div class="profile_repeat_row">
        <div class="form_grid">
          <label class="field_label"
            >Platform<select class="field_input" bind:value={link.platform}
              ><option>LinkedIn</option><option>GitHub</option><option
                >Behance</option
              ><option>Dribbble</option><option>Portfolio</option><option
                >Other</option
              ></select
            ></label
          ><label class="field_label"
            >Link<input
              class="field_input"
              type="url"
              required
              placeholder="https://"
              bind:value={link.url}
            /></label
          >
        </div>
        {#if ["Other", "Portfolio"].includes(link.platform)}<label
            class="field_label"
            >Link icon<select class="field_input" bind:value={link.icon}
              ><option value="globe">Website</option><option value="briefcase"
                >Work</option
              ><option value="file">Document</option><option value="spark"
                >Creative work</option
              ><option value="code">Code</option><option value="camera"
                >Photography</option
              ></select
            ></label
          >{/if}
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (draft.social_links = draft.social_links.filter(
              (_, i) => i !== index,
            ))}>Remove link</button
        >
      </div>{/each}
    <button
      type="button"
      class="button button_outline button_small"
      on:click={() =>
        (draft.social_links = [
          ...draft.social_links,
          { platform: "LinkedIn", url: "" },
        ])}>Add social link</button
    >
  {:else if section === "preferences"}
    <h3>Compensation</h3>
    <div class="form_grid">
      <label class="field_label"
        >Salary currency<select
          class="field_input"
          bind:value={draft.salary_currency}
          ><option>INR</option><option>USD</option><option>GBP</option><option
            >EUR</option
          ></select
        ></label
      >
      <label class="field_label"
        >Current salary<input
          class="field_input"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
          bind:value={draft.current_salary}
        /></label
      >
      <label class="field_label"
        >Current salary is paid per<select
          class="field_input"
          bind:value={draft.current_salary_period}
          >{#each salary_periods as period}<option value={period}>{period}</option
            >{/each}</select
        ></label
      >
      <label class="field_label"
        >Minimum expected salary<input
          class="field_input"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
          required
          bind:value={draft.expected_salary}
        /></label
      >
      <label class="field_label"
        >Expected salary is per<select
          class="field_input"
          bind:value={draft.expected_salary_period}
          >{#each salary_periods as period}<option value={period}>{period}</option
            >{/each}</select
        ></label
      >
      <label class="field_label"
        >Hourly rate for gigs · optional<input
          class="field_input"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          bind:value={draft.hourly_rate}
        /></label
      >
    </div>
    <h3>Availability</h3>
    <div class="form_grid">
      <label class="field_label"
        >Availability<select class="field_input" bind:value={draft.availability}
          ><option value="">Not specified</option
          >{#each availability_options as option}<option>{option}</option
            >{/each}</select
        ></label
      >
      {#if draft.availability === "Serving notice"}<label class="field_label"
          >Last working date<input
            class="field_input"
            type="date"
            required
            bind:value={draft.last_working_date}
          /></label
        >{:else if draft.availability === "Available from date"}<label
          class="field_label"
          >Available from<input
            class="field_input"
            type="date"
            required
            bind:value={draft.available_from}
          /></label
        >{/if}
      <label class="field_label"
        >Notice period<input
          class="field_input"
          type="number"
          min="0"
          max="365"
          step="1"
          bind:value={draft.notice_value}
        /></label
      >
      <label class="field_label"
        >Notice unit<select class="field_input" bind:value={draft.notice_unit}
          ><option value="days">Days</option><option value="weeks">Weeks</option
          ><option value="months">Months</option></select
        ></label
      >
      <label class="field_label"
        >Travel<select class="field_input" bind:value={draft.travel}
          ><option value="">No preference</option
          >{#each travel_options as option}<option>{option}</option
            >{/each}</select
        ></label
      >
    </div>
    <fieldset>
      <legend>Preferred employment types</legend>
      <div class="profile_choice_grid">
        {#each work_types as type}<label class="profile_field_check"
            ><input
              type="checkbox"
              checked={draft.work_types.includes(type)}
              on:change={() => toggle("work_types", type)}
            />{type}</label
          >{/each}
      </div>
    </fieldset>
    <fieldset>
      <legend>Preferred locations</legend><Location_search
        label=""
        allow_worldwide={false}
        bind:selected={draft.preferred_locations}
      /><label class="profile_field_check"
        ><input type="checkbox" bind:checked={draft.open_to_remote} />Open to
        worldwide remote roles</label
      >
    </fieldset>
    <label class="field_label"
      >Relocation preference<select
        class="field_input"
        bind:value={draft.relocation}
        ><option value="">No preference</option
        >{#each relocation_options as option}<option>{option}</option
          >{/each}</select
      ></label
    >
  {:else if section === "background"}
    <h3>Professional journey</h3>
    {#each draft.experiences as experience, index}<fieldset>
        <legend>Experience {index + 1}</legend>
        <div class="form_grid">
          <label class="field_label"
            >Company<input
              class="field_input"
              required
              maxlength="150"
              bind:value={experience.company}
            /></label
          >
          <label class="field_label"
            >Work type<select
              class="field_input"
              bind:value={experience.type}
              >{#each work_types as type}<option>{type}</option>{/each}</select
            ></label
          >
          <label class="field_label"
            >Work arrangement<select
              class="field_input"
              bind:value={experience.work_arrangement}
              ><option value="">Not specified</option
              >{#each arrangements as mode}<option>{mode}</option>{/each}</select
            ></label
          >
          <Location_select label="Work location · optional" bind:value={experience.location_id} />
          <label class="field_label"
            >Joined<input
              class="field_input"
              type="month"
              required
              bind:value={experience.start}
            /></label
          >
          <label class="profile_field_check"
            ><input type="checkbox" bind:checked={experience.current} />I
            currently work here</label
          >
          {#if !experience.current}<label class="field_label"
              >Left<input
                class="field_input"
                type="month"
                min={experience.start}
                required
                bind:value={experience.end}
              /></label
            >{/if}
        </div>
        {#each experience.roles as role, r}<fieldset class="profile_role">
            <legend>Role {r + 1}</legend>
            <div class="form_grid">
              <label class="field_label"
                >Designation<input
                  class="field_input"
                  required
                  maxlength="150"
                  bind:value={role.title}
                /></label
              >
              <label class="field_label"
                >Started<input
                  class="field_input"
                  type="month"
                  required
                  min={experience.start}
                  bind:value={role.start}
                /></label
              >
              <label class="field_label"
                >Ended{experience.current ? " · leave empty for your current role" : ""}<input
                  class="field_input"
                  type="month"
                  min={role.start}
                  max={experience.current ? undefined : experience.end}
                  bind:value={role.end}
                /></label
              >
              <label class="profile_field_check"
                ><input type="checkbox" bind:checked={role.promoted} />I was
                promoted into this role</label
              >
              <label class="field_label full_width"
                >Responsibilities<textarea
                  class="field_input"
                  rows="3"
                  maxlength="5000"
                  bind:value={role.responsibilities}
                ></textarea></label
              >
              <label class="field_label full_width"
                >Key achievements · one per line<textarea
                  class="field_input"
                  rows="3"
                  value={role.achievements.join("\n")}
                  on:change={(e) => (role.achievements = lines(e.currentTarget.value))}
                ></textarea></label
              >
            </div>
            {#if experience.roles.length > 1}<button
                type="button"
                class="button button_outline button_small"
                on:click={() =>
                  (experience.roles = experience.roles.filter((_, i) => i !== r))}
                >Remove role</button
              >{/if}
          </fieldset>{/each}
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (experience.roles = [...experience.roles, blank_role(experience.roles.at(-1)?.end || experience.start)])}
          >Add a role at {experience.company || "this company"}</button
        >
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (draft.experiences = draft.experiences.filter(
              (_, i) => i !== index,
            ))}>Remove experience</button
        >
      </fieldset>{/each}
    <button
      type="button"
      class="button button_outline button_small"
      on:click={() =>
        (draft.experiences = [
          ...draft.experiences,
          {
            company: "",
            type: "Full-time",
            work_arrangement: "",
            location_id: "",
            location: "",
            start: "",
            end: "",
            current: false,
            verification: "Unverified",
            roles: [blank_role()],
          },
        ])}>Add experience</button
    >
    <h3>Education</h3>
    {#each draft.education as education, index}<fieldset>
        <legend>Education {index + 1}</legend>
        <div class="form_grid">
          <label class="field_label"
            >Institution<input
              class="field_input"
              maxlength="150"
              bind:value={education.institution}
            /></label
          ><label class="field_label"
            >Degree<input
              class="field_input"
              required
              maxlength="150"
              bind:value={education.degree}
            /></label
          ><label class="field_label"
            >Field of study<input
              class="field_input"
              maxlength="100"
              bind:value={education.field}
            /></label
          ><label class="field_label"
            >Start year<input
              class="field_input"
              inputmode="numeric"
              pattern={"[0-9]{4}"}
              maxlength="4"
              bind:value={education.start}
            /></label
          ><label class="field_label"
            >End year<input
              class="field_input"
              inputmode="numeric"
              pattern={"[0-9]{4}"}
              maxlength="4"
              bind:value={education.end}
            /></label
          ><label class="field_label"
            >Grade / GPA · optional<input
              class="field_input"
              maxlength="50"
              placeholder="8.9 CGPA, 72%, First class…"
              bind:value={education.grade}
            /></label
          ><label class="field_label"
            >Honors · optional<input
              class="field_input"
              maxlength="200"
              bind:value={education.honors}
            /></label
          ><label class="field_label full_width"
            >Description · optional<textarea
              class="field_input"
              rows="2"
              maxlength="2000"
              bind:value={education.description}
            ></textarea></label
          ><label class="field_label full_width"
            >Achievements · one per line<textarea
              class="field_input"
              rows="2"
              value={(education.achievements ?? []).join("\n")}
              on:change={(e) => (education.achievements = lines(e.currentTarget.value))}
            ></textarea></label
          >
        </div>
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (draft.education = draft.education.filter((_, i) => i !== index))}
          >Remove education</button
        >
      </fieldset>{/each}
    <button
      type="button"
      class="button button_outline button_small"
      on:click={() =>
        (draft.education = [
          ...draft.education,
          { institution: "", degree: "", field: "", start: "", end: "", grade: "", honors: "", description: "", achievements: [] },
        ])}>Add education</button
    >
    <h3>Languages</h3>
    {#each draft.languages as language, index}<div class="profile_repeat_row">
        <div class="form_grid">
          <label class="field_label"
            >Language<input
              class="field_input"
              required
              maxlength="60"
              bind:value={language.name}
            /></label
          ><fieldset class="profile_choice_grid">
            <legend>I can</legend>
            <label class="profile_field_check"
              ><input type="checkbox" bind:checked={language.read} />Read</label
            ><label class="profile_field_check"
              ><input type="checkbox" bind:checked={language.write} />Write</label
            ><label class="profile_field_check"
              ><input type="checkbox" bind:checked={language.speak} />Speak</label
            >
          </fieldset>
        </div>
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (draft.languages = draft.languages.filter((_, i) => i !== index))}
          >Remove language</button
        >
      </div>{/each}
    <button
      type="button"
      class="button button_outline button_small"
      on:click={() =>
        (draft.languages = [
          ...draft.languages,
          { name: "", read: true, write: true, speak: true },
        ])}>Add language</button
    >
    <h3>Work authorization</h3>
    {#each draft.authorizations as authorization, index}<fieldset>
        <legend>Authorization {index + 1}</legend>
        <div class="form_grid">
          <Country_select
            required
            value={$countries.find((c) => c.name === authorization.country)?.code ?? ""}
            on:change={(e) => (authorization.country = e.detail?.name ?? "")}
          /><label class="field_label"
            >Authorization type<input
              class="field_input"
              required
              maxlength="100"
              placeholder="Citizenship, visa, work permit…"
              bind:value={authorization.type}
            /></label
          ><label class="field_label"
            >Valid from<input
              class="field_input"
              type="date"
              bind:value={authorization.from}
            /></label
          ><label class="profile_field_check"
            ><input type="checkbox" bind:checked={authorization.indefinite} />No
            expiry date</label
          >{#if !authorization.indefinite}<label class="field_label"
              >Valid until<input
                class="field_input"
                type="date"
                required
                min={authorization.from}
                bind:value={authorization.until}
              /></label
            >{/if}
        </div>
        <button
          type="button"
          class="button button_outline button_small"
          on:click={() =>
            (draft.authorizations = draft.authorizations.filter(
              (_, i) => i !== index,
            ))}>Remove authorization</button
        >
      </fieldset>{/each}
    <button
      type="button"
      class="button button_outline button_small"
      on:click={() =>
        (draft.authorizations = [
          ...draft.authorizations,
          { country: "", type: "", from: "", until: "", indefinite: false },
        ])}>Add authorization</button
    >
  {/if}
</div>
