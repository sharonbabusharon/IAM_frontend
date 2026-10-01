<script>
  import { jobs } from "./data.js";
  import Location_picker from "./location_picker.svelte";
  import { work_types, relocation_options } from "./filter_options.js";
  export let draft;
  export let section;
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
        /><small
          >Lowercase letters, numbers and hyphens. Availability will be checked
          when accounts are connected.</small
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
              ><option>Dribbble</option><option>Portfolio</option></select
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
    <fieldset>
      <legend>Target roles from the sample master list</legend>
      <div class="profile_choice_grid">
        {#each jobs as job}<label class="profile_field_check"
            ><input
              type="checkbox"
              checked={draft.target_roles.includes(job.id)}
              on:change={() => {
                toggle("target_roles", job.id);
                draft.roles = jobs
                  .filter((item) => draft.target_roles.includes(item.id))
                  .map((item) => item.title)
                  .join(", ");
              }}
            />{job.title}</label
          >{/each}
      </div>
    </fieldset>
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
        >Current annual salary<input
          class="field_input"
          type="number"
          min="0"
          max="1000000000000"
          step="1"
          bind:value={draft.current_salary}
        /></label
      >
      <label class="field_label"
        >Expected annual salary<input
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
        >Hourly rate · optional<input
          class="field_input"
          type="number"
          min="0"
          max="1000000"
          step="0.01"
          bind:value={draft.hourly_rate}
        /></label
      >
    </div>
    <label class="profile_field_check"
      ><input type="checkbox" bind:checked={draft.is_serving_notice} />I’m
      serving my notice period</label
    >
    {#if draft.is_serving_notice}<label class="field_label"
        >Last working date<input
          class="field_input"
          type="date"
          required
          bind:value={draft.last_working_date}
        /></label
      >{/if}
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
      <legend>Preferred locations</legend><Location_picker
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
              maxlength="100"
              bind:value={experience.company}
            /></label
          >
          <label class="field_label"
            >Designation<input
              class="field_input"
              required
              maxlength="100"
              bind:value={experience.title}
            /></label
          >
          <label class="field_label"
            >Employment type<select
              class="field_input"
              bind:value={experience.type}
              >{#each work_types as type}<option>{type}</option>{/each}</select
            ></label
          >
          <label class="field_label"
            >Started<input
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
              >Ended<input
                class="field_input"
                type="month"
                min={experience.start}
                required
                bind:value={experience.end}
              /></label
            >{/if}
          <label class="profile_field_check"
            ><input type="checkbox" bind:checked={experience.promoted} />This
            role was a promotion</label
          >
          <label class="field_label full_width"
            >Description<textarea
              class="field_input"
              rows="3"
              maxlength="2000"
              bind:value={experience.description}></textarea></label
          >
        </div>
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
            title: "",
            type: "Full-time",
            start: "",
            end: "",
            current: false,
            promoted: false,
            description: "",
            verification: "Unverified",
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
          { institution: "", degree: "", field: "", start: "", end: "" },
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
          ><label class="field_label"
            >Proficiency<select
              class="field_input"
              bind:value={language.proficiency}
              ><option>Native</option><option>Fluent</option><option
                >Conversational</option
              ></select
            ></label
          >
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
          { name: "", proficiency: "Fluent" },
        ])}>Add language</button
    >
    <h3>Work authorization</h3>
    {#each draft.authorizations as authorization, index}<fieldset>
        <legend>Authorization {index + 1}</legend>
        <div class="form_grid">
          <label class="field_label"
            >Country<input
              class="field_input"
              required
              maxlength="80"
              bind:value={authorization.country}
            /></label
          ><label class="field_label"
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
