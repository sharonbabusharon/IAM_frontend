<script>
  import { profile, toast } from "./state.js";
  import { profile_api, to_store } from "./profile_api.js";
  import Modal from "./modal.svelte";
  import Icon from "./icon.svelte";
  export let readonly = false;
  // Mirrors the backend limits (findJobs domain/profiles: maxListItems, 6 tags).
  const max_projects = 20;
  const max_tags = 6;
  let open = null; // the project shown in the detail modal
  let editing = false;
  let saving = false;
  let drafts = [];
  $: projects = $profile.projects ?? [];
  function start() {
    drafts = projects.map((p) => ({ ...p, tag_text: p.tags.join(", ") }));
    if (!drafts.length) add();
    editing = true;
  }
  function add() {
    if (drafts.length >= max_projects) return toast(`You can add up to ${max_projects} projects.`);
    drafts = [...drafts, { title: "", description: "", url: "", tag_text: "" }];
  }
  function move(i, delta) {
    const next = i + delta;
    [drafts[i], drafts[next]] = [drafts[next], drafts[i]];
  }
  async function save() {
    const list = drafts.map(({ tag_text, ...p }) => ({
      title: p.title.trim(),
      description: p.description.trim(),
      url: p.url.trim(),
      tags: [...new Set(tag_text.split(",").map((t) => t.trim()).filter(Boolean))],
    }));
    if (list.some((p) => !p.title)) return toast("Give each project a title.");
    if (list.some((p) => p.url && !/^https?:\/\/[^\s/]+/i.test(p.url)))
      return toast("Project links must start with http:// or https://.");
    if (list.some((p) => p.tags.length > max_tags))
      return toast(`Use at most ${max_tags} tags per project.`);
    saving = true;
    const result = await profile_api.save({ ...$profile, projects: list });
    saving = false;
    if (!result.ok) return toast(result.error);
    profile.set(to_store(result.data));
    editing = false;
    toast("Projects saved.");
  }
</script>

{#if projects.length || !readonly}<section class="profile_section">
    <div class="profile_section_heading">
      <h2>A few things I’ve made</h2>
      {#if readonly}<span class="section_label">SELECTED WORK</span>{:else}<button
          class="button button_outline button_small"
          on:click={start}>{projects.length ? "Edit projects" : "Add a project"}</button
        >{/if}
    </div>
    {#if projects.length}<div class="portfolio_grid">
        {#each projects as project, i}<button
            class="portfolio_item"
            on:click={() => (open = project)}
            ><div class={`portfolio_art ${i % 2 ? "project_two" : "project_one"}`}>
              <span class="design_letter">{project.title[0]?.toUpperCase()}<span>↗</span></span>
            </div>
            <div class="portfolio_caption">
              <h3>{project.title}</h3>
              <Icon name="arrow-up-right" size={16} />
              {#if project.tags.length}<p>{project.tags.join(" · ")}</p>{/if}
            </div></button
          >{/each}
      </div>{:else}<p class="form_helper">
        Show the work you’re proud of: a product, a case study, a repository or a
        side project.
      </p>{/if}
  </section>{/if}
{#if open}<Modal title={open.title} wide on:close={() => (open = null)}
    ><div class="case_study">
      <span class="eyebrow_label">SELECTED WORK</span>
      {#if open.description}<p style="white-space:pre-line">{open.description}</p>{/if}
      {#if open.tags.length}<div class="skill_chips">
          {#each open.tags as tag}<span>{tag}</span>{/each}
        </div>{/if}
      {#if open.url}<p>
          <a class="text_link" href={open.url} target="_blank" rel="noopener noreferrer"
            >Visit project ↗</a
          >
        </p>{/if}
    </div></Modal
  >{/if}
{#if editing}<Modal title="A few things I’ve made" wide on:close={() => (editing = false)}
    ><form class="workspace_form" on:submit|preventDefault={save}>
      {#each drafts as draft, i}<section class="workspace_hint" style="margin-bottom:15px">
          <div class="inline_fields">
            <strong style="margin-right:auto">Project {i + 1}</strong><button
              type="button"
              class="button button_outline button_small"
              disabled={i === 0}
              aria-label={`Move project ${i + 1} up`}
              on:click={() => move(i, -1)}>↑</button
            ><button
              type="button"
              class="button button_outline button_small"
              disabled={i === drafts.length - 1}
              aria-label={`Move project ${i + 1} down`}
              on:click={() => move(i, 1)}>↓</button
            ><button
              type="button"
              class="button button_outline button_small"
              aria-label={`Remove project ${i + 1}`}
              on:click={() => (drafts = drafts.filter((_, n) => n !== i))}>×</button
            >
          </div>
          <label class="field_label"
            >Title<input class="field_input" maxlength="100" required bind:value={draft.title} /></label
          >
          <label class="field_label"
            >What it is and your part in it<textarea
              class="field_input"
              rows="4"
              maxlength="1000"
              bind:value={draft.description}
            ></textarea></label
          >
          <label class="field_label"
            >Link (optional)<input
              class="field_input"
              type="url"
              placeholder="https://"
              maxlength="500"
              bind:value={draft.url}
            /></label
          >
          <label class="field_label"
            >Tags (optional)<input
              class="field_input"
              placeholder="e.g. UX research, Svelte"
              bind:value={draft.tag_text}
            /><span class="form_helper">Separate tags with commas, up to {max_tags}.</span></label
          >
        </section>{/each}
      <div class="form_actions">
        <button
          type="button"
          class="button button_outline"
          disabled={drafts.length >= max_projects}
          on:click={add}>Add project +</button
        ><button class="button button_dark" disabled={saving}
          >{saving ? "Saving…" : "Save projects"}</button
        >
      </div>
    </form></Modal
  >{/if}
