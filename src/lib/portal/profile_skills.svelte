<script>
  import Skill_line from "./skill_line.svelte";
  let all_open = false;
  import { profile, toast } from "./state.js";
  import { profile_api, to_store } from "./profile_api.js";
  import Modal from "./modal.svelte";
  import { skills as skill_terms } from "./reference.js";
  export let readonly = false;
  let editing = false;
  let groups = [];
  let dragged = null;
  let new_skill = "";
  let target_group = 0;
  $: suggestions = $skill_terms.map((term) => term.name);
  $: displayed = $profile.skill_groups?.length
    ? $profile.skill_groups
    : [{ name: "Core skills", skills: $profile.skills }];
  function open() {
    groups = structuredClone(displayed);
    editing = true;
    target_group = 0;
  }
  async function save() {
    if (groups.some((g) => !g.name.trim())) {
      toast("Give each skill group a name.");
      return;
    }
    const result = await profile_api.save({ ...$profile, skill_groups: groups });
    if (!result.ok) {
      toast(result.error);
      return;
    }
    profile.set(to_store(result.data));
    editing = false;
    toast("Skill groups saved.");
  }
  function add() {
    const skill = new_skill.trim();
    if (!skill || !groups[target_group]) return;
    if (!groups.some((g) => g.skills.includes(skill))) {
      groups[target_group].skills = [...groups[target_group].skills, skill];
      groups = [...groups];
    }
    new_skill = "";
  }
  function move_group(i, delta) {
    const next = i + delta;
    if (next < 0 || next >= groups.length) return;
    [groups[i], groups[next]] = [groups[next], groups[i]];
    groups = [...groups];
  }
  function move_skill(from, index, to) {
    const skill = groups[from].skills[index];
    groups[from].skills.splice(index, 1);
    groups[to].skills.push(skill);
    groups = [...groups];
  }
  function reorder_skill(group, index, delta) {
    const skills = [...groups[group].skills];
    const next = index + delta;
    if (next < 0 || next >= skills.length) return;
    [skills[index], skills[next]] = [skills[next], skills[index]];
    groups[group].skills = skills;
    groups = [...groups];
  }
  function drop(target) {
    if (dragged === null) return;
    if (dragged.type === "group") {
      const [group] = groups.splice(dragged.index, 1);
      groups.splice(target, 0, group);
      groups = [...groups];
    } else move_skill(dragged.group, dragged.index, target);
    dragged = null;
  }
</script>

<div class="profile_section_heading">
  <h2>The craft I bring</h2>
  {#if !readonly}<button
      class="button button_outline button_small"
      on:click={open}>Organise skills</button
    >{/if}
</div>
{#each displayed as group}<div style="margin-bottom:18px">
    <h3 style="font-size:13px;margin-bottom:12px">{group.name}</h3>
    <Skill_line skills={group.skills} />
  </div>{/each}
<button class="text_link" on:click={() => (all_open = true)}
  >View all skills ({$profile.skills.length}) ↗</button
>
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
      Drag skills between groups. Use the move controls with a keyboard.
    </p>
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
          >
        </div>
        <div class="workspace_list">
          {#each group.skills as skill, j}<div>
              <button
                class="button button_outline button_small"
                draggable="true"
                on:dragstart={() =>
                  (dragged = { type: "skill", group: i, index: j })}
                >{skill} ↕</button
              ><button
                class="button button_outline button_small"
                aria-label={`Move ${skill} up`}
                disabled={j === 0}
                on:click={() => reorder_skill(i, j, -1)}>↑</button
              ><button
                class="button button_outline button_small"
                aria-label={`Move ${skill} down`}
                disabled={j === group.skills.length - 1}
                on:click={() => reorder_skill(i, j, 1)}>↓</button
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
                  groups = [...groups];
                }}>×</button
              >
            </div>{/each}
        </div>
        {#if !group.skills.length}<p>Drop a skill here or add one below.</p>
          {#if groups.length > 1}<button
              class="button button_outline button_small"
              on:click={() => {
                groups = groups.filter((_, n) => n !== i);
                target_group = 0;
              }}>Remove empty group</button
            >{/if}{/if}
      </section>{/each}
    <div class="workspace_form">
      <label class="field_label"
        >Add a skill
        <div class="inline_fields">
          <input
            class="field_input"
            list="profile_skill_options"
            bind:value={new_skill}
            on:keydown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          /><select
            class="field_input"
            aria-label="Add skill to group"
            bind:value={target_group}
            >{#each groups as group, i}<option value={i}>{group.name}</option
              >{/each}</select
          ><button class="button button_outline" on:click={add}>Add</button>
        </div></label
      ><datalist id="profile_skill_options"
        >{#each suggestions as skill}<option value={skill} />{/each}</datalist
      >
    </div>
    <div class="form_actions">
      <button
        class="button button_outline"
        on:click={() =>
          (groups = [...groups, { name: "New group", skills: [] }])}
        >Add group +</button
      ><button class="button button_dark" on:click={save}>Save skills</button>
    </div>
  </Modal>{/if}
