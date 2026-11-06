<script>
  import { membership_settings, load_platform_settings } from "./membership_state.js";
  import { premium_filter_options } from "./membership_rules.js";
  import { toast } from "./state.js";
  import { onMount as on_mount } from "svelte";
  let draft = structuredClone($membership_settings);
  // The daily free limit is live (findJobs settings); the rest is preview-only.
  const settings_url = "/framework_api/admin/reference/settings";
  on_mount(() =>
    fetch(settings_url)
      .then((r) => r.json())
      .then((r) => Number.isInteger(r?.data?.daily_free_applications) && (draft.daily_free = r.data.daily_free_applications))
      .catch(() => {}),
  );
  async function save() {
    try {
      const response = await fetch(settings_url);
      const current = (await response.json())?.data;
      if (!response.ok || !current) throw new Error();
      const saved = await fetch(settings_url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, daily_free_applications: Math.round(draft.daily_free) }),
      });
      if (!saved.ok) throw new Error((await saved.json().catch(() => null))?.error);
    } catch (error) {
      return toast(error.message || "Couldn’t save the daily free limit. Try again.");
    }
    membership_settings.set(structuredClone(draft));
    await load_platform_settings();
    toast("Daily free limit saved for everyone. Pricing and premium filters saved in this browser.");
  }
</script>

<section class="workspace_panel">
  <h2>Membership & search access</h2>
  <p>
    Free applications per day is live for every user. Prices and premium
    filters are still a preview for this browser until billing is connected.
  </p>
  <form class="membership_form" on:submit|preventDefault={save}>
    <div class="form_grid">
      {#each [["daily_free", "Free applications per day"], ["day_price", "Price per day"], ["month_price", "Price per 30 days"], ["credit_price", "Price of one credit"]] as [key, label]}<label
          class="field_label"
          >{label}<input
            class="field_input"
            required
            type="number"
            min={key === "credit_price" ? 0.01 : 0}
            max="1000000"
            step={key === "daily_free" ? 1 : 0.01}
            bind:value={draft[key]}
          /></label
        >{/each}<label class="field_label"
        >Pricing currency<select class="field_input" bind:value={draft.currency}
          ><option>INR</option><option>USD</option><option>EUR</option><option
            >GBP</option
          ></select
        ></label
      >
    </div>
    <fieldset>
      <legend>Require premium for these filters</legend>
      <div class="premium_filter_grid">
        {#each Object.entries(premium_filter_options) as [key, label]}<label
            ><input
              type="checkbox"
              value={key}
              bind:group={draft.premium_filters}
            />{label}</label
          >{/each}
      </div>
    </fieldset>
    <button class="button button_blue">Save settings</button>
  </form>
</section>
