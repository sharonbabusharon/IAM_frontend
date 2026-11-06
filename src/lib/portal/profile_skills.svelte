<script>
  import Skill_line from "./skill_line.svelte";
  import { profile, toast } from "./state.js";
  import { profile_api, to_store } from "./profile_api.js";
  import { sync_my_skills } from "./my_skills.js";
  import Modal from "./modal.svelte";
  import { skills as skill_terms } from "./reference.js";
  export let readonly = false;
  // Mirrors the backend limits (findJobs domain/profiles: MaxSkills, MaxSkillGroups).
  const max_skills = 50;
  const max_groups = 20;
  let all_open = false;
  let editing = false;
  let groups = [];
  let dragged = null;
  let query = "";
  let picker_open = false;
  let target_group = 0;
  const key = (name) => name.trim().replace(/\s+/g, " ").toLowerCase();
  $: displayed = $profile.skill_groups?.length
    ? $profile.skill_groups
    : $profile.skills?.length
      ? [{ name: "Core skills", skills: $profile.skills }]
      : [];
  $: total = groups.reduce((n, g) => n + g.skills.length, 0);
  $: taken = new Set(groups.flatMap((g) => g.skills.map(key)));
  $: typed = query.trim().replace(/\s+/g, " ");
  $: matches = typed
    ? $skill_terms
        .filter((t) => !taken.has(key(t.name)) && key(t.name).includes(key(typed)))
        .slice(0, 8)
    : [];
  $: exact = $skill_terms.find((t) => key(t.name) === key(typed));
  $: is_new = typed && !exact && !taken.has(key(typed));
  function open() {
    groups = displayed.length
      ? structuredClone(displayed)
      : [{ name: "Core skills", skills: [] }];
    editing = true;
    target_group = 0;
    query = "";
  }
  async function save() {
    const names = groups.map((g) => key(g.name));
    if (names.some((n) => !n)) return toast("Give each skill group a name.");
    if (new Set(names).size !== names.length)
      return toast("Give each skill group a different name.");
    const result = await profile_api.save({ ...$profile, skill_groups: groups });
    if (!result.ok) return toast(result.error);
    profile.set(to_store(result.data));
    sync_my_skills();
    editing = false;
    toast("Skill groups saved.");
  }
  // Global term name when one matches (so the profile links the master skill),
  // otherwise the typed text, which the backend adds as a pending term.
  function add(name) {
    const skill = ($skill_terms.find((t) => key(t.name) === key(name))?.name ?? name)
      .trim()
      .replace(/\s+/g, " ");
    if (!skill || !groups[target_group] || taken.has(key(skill))) return;
    if (total >= max_skills) return toast(`You can add up to ${max_skills} skills.`);
    groups[target_group].skills = [...groups[target_group].skills, skill];
    groups = groups;
    query = "";
  }
  function add_group() {
    if (groups.length >= max_groups) return toast(`You can have up to ${max_groups} groups.`);
    groups = [...groups, { name: "New group", skills: [] }];
    target_group = groups.length - 1;
  }
  function remove_group(i) {
    const n = groups[i].skills.length;
    if (n && !confirm(`Remove “${groups[i].name}” and its ${n} skill${n === 1 ? "" : "s"}?`)) return;
    groups = groups.filter((_, g) => g !== i);
    if (!groups.length) groups = [{ name: "Core skills", skills: [] }];
    target_group = Math.min(target_group, groups.length - 1);
  }
  function move_group(i, delta) {
    const next = i + delta;
    if (next < 0 || next >= groups.length) return;
    [groups[i], groups[next]] = [groups[next], groups[i]];
    groups = groups;
  }
  // Moves a skill to position `at` in group `to` (end of the group when omitted).
  function move_skill(from, index, to, at = groups[to].skills.length) {
    const [skill] = groups[from].skills.splice(index, 1);
    if (from === to && index < at) at--;
    groups[to].skills.splice(at, 0, skill);
    groups = groups;
  }
  function drop(group, at) {
    if (!dragged) return;
    if (dragged.type === "group") {
      const [moved] = groups.splice(dragged.index, 1);
      groups.splice(group, 0, moved);
      groups = groups;
    } else if (at !== undefined || dragged.group !== group)
      move_skill(dragged.group, dragged.index, group, at);
    dragged = null;
  }
  function on_key(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      // Exact term, else the top suggestion; a brand-new skill is added only
      // when nothing matches (or by clicking its option).
      add(exact?.name ?? matches[0]?.name ?? typed);
    } else if (e.key === "Escape") picker_open = false;
  }
</script>

<div class="profile_section_heading">
  <h2>The craft I bring</h2>
  {#if !readonly}<button
      class="button button_outline button_small"
      on:click={open}>{displayed.length ? "Organise skills" : "Add skills"}</button
    >{/if}
</div>
{#each displayed as group}<div style="margin-bottom:18px">
    <h3 style="font-size:13px;margin-bottom:12px">{group.name}</h3>
    <Skill_line skills={group.skills} />
  </div>{:else}<p class="form_helper">
    {readonly
      ? "No skills added yet."
      : "Add the skills you work with and group them the way you’d like to be seen."}
  </p>{/each}
{#if $profile.skills?.length}<button class="text_link" on:click={() => (all_open = true)}
    >View all skills ({$profile.skills.length}) ↗</button
  >{/if}
{#if all_open}<Modal
    title="The full skill set"
    on:close={() => (all_open = false)}
    >{#each displayed as group}<h3>{group.name}</h3>
      <div class="skill_chips">
        {#each group.skills as skill}<span>{skill}</span>{/each}
      </div>{/each}</Modal
  >{/if}
{#if editing}<Modal
    title="Make your skills your own"
    wide
    on:close={() => (editing = false)}
    ><p class="form_helper">
      Create groups, then drag skills to order them or move them between groups.
      Drag a group’s ↕ handle to reorder groups. The arrow buttons do the same
      from a keyboard. {total}/{max_skills} skills · {groups.length}/{max_groups} groups.
    </p>
    <div class="workspace_form">
      <div class="field_label">
        Add skills
        <div class="inline_fields">
          <div
            style="position:relative;flex:1"
            on:focusout={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) picker_open = false;
            }}
          >
            <input
              class="field_input"
              aria-label="Search skills"
              placeholder="Search skills, e.g. Svelte"
              autocomplete="off"
              bind:value={query}
              on:focus={() => (picker_open = true)}
              on:input={() => (picker_open = true)}
              on:keydown={on_key}
            />
            {#if picker_open && typed}<div
                class="predictive_options"
                role="group"
                aria-label="Matching skills"
              >
                {#each matches as term}<button
                    type="button"
                    class="text_link"
                    style="display:block;margin:0;padding:8px 0"
                    on:click={() => add(term.name)}>{term.name}</button
                  >{/each}
                {#if is_new}<button
                    type="button"
                    class="text_link"
                    style="display:block;margin:0;padding:8px 0"
                    on:click={() => add(typed)}>Add “{typed}” as a new skill</button
                  ><small>New skills show on your profile right away and are reviewed by our team.</small
                  >{:else if !matches.length}<p>“{typed}” is already on your profile.</p>{/if}
              </div>{/if}
          </div>
          <select
            class="field_input"
            style="width:auto"
            aria-label="Add skill to group"
            bind:value={target_group}
            >{#each groups as group, i}<option value={i}>{group.name}</option
              >{/each}</select
          >
        </div>
      </div>
    </div>
    {#each groups as group, i}<section
        class="workspace_hint"
        style="margin-bottom:15px"
        on:dragover|preventDefault
        on:drop|preventDefault={() => drop(i)}
        aria-label={`Skill group ${group.name}`}
      >
        <div class="inline_fields">
          <button
            class="button button_outline button_small"
            draggable="true"
            aria-label={`Drag ${group.name} group`}
            on:dragstart={() => (dragged = { type: "group", index: i })}
            >↕</button
          ><input
            class="field_input"
            aria-label={`Group ${i + 1} name`}
            maxlength="60"
            bind:value={group.name}
          /><button
            class="button button_outline button_small"
            disabled={i === 0}
            on:click={() => move_group(i, -1)}
            aria-label={`Move ${group.name} up`}>↑</button
          ><button
            class="button button_outline button_small"
            disabled={i === groups.length - 1}
            on:click={() => move_group(i, 1)}
            aria-label={`Move ${group.name} down`}>↓</button
          ><button
            class="button button_outline button_small"
            aria-label={`Remove ${group.name} group`}
            on:click={() => remove_group(i)}>×</button
          >
        </div>
        <div class="workspace_list">
          {#each group.skills as skill, j}<div
              on:dragover|preventDefault
              on:drop|preventDefault|stopPropagation={() => drop(i, j)}
            >
              <button
                class="button button_outline button_small"
                draggable="true"
                on:dragstart|stopPropagation={() =>
                  (dragged = { type: "skill", group: i, index: j })}
                >{skill} ↕</button
              ><button
                class="button button_outline button_small"
                aria-label={`Move ${skill} up`}
                disabled={j === 0}
                on:click={() => move_skill(i, j, i, j - 1)}>↑</button
              ><button
                class="button button_outline button_small"
                aria-label={`Move ${skill} down`}
                disabled={j === group.skills.length - 1}
                on:click={() => move_skill(i, j, i, j + 2)}>↓</button
              ><select
                class="field_input"
                style="width:auto;margin-left:auto"
                aria-label={`Move ${skill} to group`}
                value={i}
                on:change={(e) =>
                  move_skill(i, j, Number(e.currentTarget.value))}
                >{#each groups as option, n}<option value={n}
                    >{option.name}</option
                  >{/each}</select
              ><button
                class="button button_outline button_small"
                aria-label={`Remove ${skill}`}
                on:click={() => {
                  group.skills = group.skills.filter((_, n) => n !== j);
                  groups = groups;
                }}>×</button
              >
            </div>{/each}
        </div>
        {#if !group.skills.length}<p>Drop a skill here or add one above.</p>{/if}
      </section>{/each}
    <div class="form_actions">
      <button
        class="button button_outline"
        disabled={groups.length >= max_groups}
        on:click={add_group}>Add group +</button
      ><button class="button button_dark" on:click={save}>Save skills</button>
    </div>
  </Modal>{/if}
