<script>
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { onMount as on_mount } from "svelte";
  import { toast } from "./state.js";
  import { companies_api, image_url } from "./companies_api.js";
  import Image_field from "./image_field.svelte";
  import Heading from "./page_heading.svelte";
  import Location_picker from "./location_picker.svelte";
  export let editing = false;
  const sizes = ["1–10 people", "11–50 people", "51–200 people", "201–500 people", "501–1,000 people", "1,001–5,000 people", "5,000+ people"];
  const social_fields = [["linkedin", "LinkedIn"], ["x", "X / Twitter"], ["github", "GitHub or tech blog"], ["glassdoor", "Glassdoor or Crunchbase"]];
  let form = {
    name: "",
    slug: "",
    tagline: "",
    size: "11–50 people",
    industries: "",
    headquarters: [],
    branches: [],
    address: "",
    about: "",
    website: "",
    social: { linkedin: "", x: "", github: "", glassdoor: "" },
    founded: "",
    products: [],
    benefits: [],
    logo: "",
    banner: "",
  };
  let original_slug = "";
  let error = "";
  let saving = false;
  let loaded = !editing;
  let slug_edited = false;
  let slug_status = "";
  on_mount(async () => {
    if (!editing) return;
    const result = await companies_api.get($page.params.slug);
    if (!result.ok) {
      error = result.error;
      return;
    }
    const c = result.data;
    if (c.viewer_role !== "admin") {
      error = "Only company admins can edit this page.";
      return;
    }
    original_slug = c.slug;
    form = {
      name: c.name,
      slug: c.slug,
      tagline: c.tagline,
      size: c.size,
      industries: c.industries.join(", "),
      headquarters: c.hq_location_id ? [c.hq_location_id] : [],
      branches: c.branch_location_ids,
      address: c.hq_address,
      about: c.about,
      website: c.website,
      social: { linkedin: "", x: "", github: "", glassdoor: "", ...c.social },
      founded: c.founded_year ?? "",
      products: c.products.map((p) => ({ ...p })),
      benefits: c.benefits.map((b) => ({ ...b })),
      logo: image_url(c.logo_url),
      banner: image_url(c.banner_url),
    };
    loaded = true;
  });
  function set_slug() {
    if (!slug_edited && !editing)
      form.slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
  }
  async function check_slug() {
    slug_status = "";
    if (!form.slug || (editing && form.slug === original_slug)) return;
    const result = await companies_api.slug_available(form.slug);
    slug_status = !result.ok ? result.error : result.data.available ? "✓ Available" : "Already taken — choose another link.";
  }
  function move(key, index, direction) {
    const items = [...form[key]];
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    form = { ...form, [key]: items };
  }
  async function save() {
    error = "";
    if (form.headquarters.length !== 1) {
      error = "Choose one headquarters city.";
      return;
    }
    const input = {
      name: form.name,
      slug: form.slug,
      tagline: form.tagline,
      size: form.size,
      industries: form.industries.split(",").map((s) => s.trim()).filter(Boolean),
      about: form.about,
      website: form.website,
      social: Object.fromEntries(Object.entries(form.social).filter(([, v]) => v.trim())),
      founded_year: form.founded === "" || form.founded == null ? null : Number(form.founded),
      hq_location_id: form.headquarters[0],
      hq_address: form.address,
      branch_location_ids: form.branches,
      products: form.products.map(({ name, about, url }) => ({ name, about, url: url || "" })),
      benefits: form.benefits.map(({ title, details, icon }) => ({ title, details: details || "", icon })),
    };
    saving = true;
    const result = editing ? await companies_api.update(original_slug, input) : await companies_api.create(input);
    if (!result.ok) {
      error = result.status === 401 ? "Sign in first, then try again." : result.error;
      saving = false;
      return;
    }
    const slug = result.data.slug;
    // Images upload after the page exists; only newly cropped ones (data: URLs).
    for (const [kind, value] of [["logo", form.logo], ["banner", form.banner]]) {
      if (!value?.startsWith("data:")) continue;
      const upload = await companies_api.upload_image(slug, kind, value);
      if (!upload.ok) toast(`Saved, but the ${kind} didn’t upload: ${upload.error}`);
    }
    saving = false;
    toast(editing ? "Company page updated." : "Your company page is live.");
    goto(`/company/${slug}`);
  }
</script>

<svelte:head
  ><title>{editing ? "Edit company" : "Create a company"} — Referise</title
  ></svelte:head
>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow="MAKE YOUR TEAM KNOWN"
    title={editing ? "A little more" : "Great teams deserve"}
    accent={editing ? "you." : "a place of their own."}
    description="Tell your story, introduce your work and help the right people find you."
    companion="sage"
  />
  {#if !loaded}<p class="workspace_hint {error ? 'warning' : ''}">{error || "Loading company…"}</p>{:else}
  <form class="workspace_grid workspace_form" on:submit|preventDefault={save}>
    <div class="workspace_stack">
      <section class="workspace_panel">
        <h2>01 / The essentials</h2>
        <div class="form_grid">
          <label class="field_label"
            >Company name *<input
              class="field_input"
              required
              minlength="2"
              maxlength="120"
              bind:value={form.name}
              on:input={set_slug}
            /></label
          ><label class="field_label"
            >Company link *<input
              class="field_input"
              required
              pattern={"[a-z0-9\\-]{3,60}"}
              maxlength="60"
              bind:value={form.slug}
              on:input={() => ((slug_edited = true), (slug_status = ""))}
              on:blur={check_slug}
            /><small>/company/{form.slug || "your-company"}{slug_status ? ` · ${slug_status}` : ""}</small></label
          ><label class="field_label full"
            >Tagline<input
              class="field_input"
              maxlength="150"
              bind:value={form.tagline}
            /><small>{form.tagline.length}/150</small></label
          ><label class="field_label"
            >Team size *<select class="field_input" bind:value={form.size}
              >{#each sizes as size}<option
                  >{size}</option
                >{/each}</select
            ></label
          ><label class="field_label"
            >Founded<input
              class="field_input"
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              bind:value={form.founded}
            /></label
          ><label class="field_label full"
            >Industries *<input
              class="field_input"
              required
              bind:value={form.industries}
              placeholder="Workplace technology, B2B software"
            /><small>Up to 5, separated by commas. 25 characters each.</small
            ></label
          >
        </div>
      </section>
      <section class="workspace_panel">
        <h2>02 / Places & people</h2>
        <p class="form_caption">
          Choose one headquarters city. Other offices can be added below.
        </p>
        <Location_picker bind:selected={form.headquarters} /><label
          class="field_label"
          >Street address<input
            class="field_input"
            maxlength="250"
            bind:value={form.address}
          /></label
        >
        <details class="filter_disclosure">
          <summary>Branch locations</summary><Location_picker
            bind:selected={form.branches}
          />
        </details>
      </section>
      <section class="workspace_panel">
        <h2>03 / Your story</h2>
        <label class="field_label"
          >About the company<textarea
            class="field_input"
            rows="7"
            maxlength="5000"
            bind:value={form.about}
          ></textarea><small
            >{form.about.length}/5,000 · **bold**, *italic*, "- " lists and "## " headings</small
          ></label
        >
        <div class="form_grid">
          <label class="field_label full"
            >Website *<input
              class="field_input"
              type="url"
              required
              pattern="https?://.*"
              placeholder="https://"
              bind:value={form.website}
            /></label
          >{#each social_fields as [key, label]}<label class="field_label"
              >{label}<input
                class="field_input"
                type="url"
                pattern="https?://.*"
                bind:value={form.social[key]}
              /></label
            >{/each}
        </div>
      </section>
      <section class="workspace_panel">
        <div class="panel_heading">
          <h2>04 / Products & services</h2>
          <button
            type="button"
            class="button button_outline button_small"
            on:click={() =>
              (form.products = [
                ...form.products,
                { name: "", about: "", url: "" },
              ])}>Add product +</button
          >
        </div>
        {#each form.products as product, i}<div
            class="workspace_hint"
            style="margin-bottom:15px"
          >
            <label class="field_label"
              >Product name<input
                class="field_input"
                required
                minlength="2"
                maxlength="80"
                bind:value={product.name}
              /></label
            ><label class="field_label"
              >Description<textarea
                class="field_input"
                required
                maxlength="500"
                bind:value={product.about}
              ></textarea></label
            ><label class="field_label"
              >Product link<input
                class="field_input"
                type="url"
                pattern="https?://.*"
                bind:value={product.url}
              /></label
            >
            <div class="workspace_actions reorder_actions">
              <button
                type="button"
                class="button button_outline button_small"
                disabled={i === 0}
                on:click={() => move("products", i, -1)}>Move up</button
              ><button
                type="button"
                class="button button_outline button_small"
                disabled={i === form.products.length - 1}
                on:click={() => move("products", i, 1)}>Move down</button
              ><button
                type="button"
                class="button button_outline button_small"
                on:click={() =>
                  (form.products = form.products.filter((_, n) => n !== i))}
                >Remove</button
              >
            </div>
          </div>{/each}
      </section>
      <section class="workspace_panel">
        <div class="panel_heading">
          <h2>05 / Culture & benefits</h2>
          <button
            type="button"
            class="button button_outline button_small"
            on:click={() =>
              (form.benefits = [
                ...form.benefits,
                { title: "", details: "", icon: "heart" },
              ])}>Add benefit +</button
          >
        </div>
        {#each form.benefits as benefit, i}<div
            class="workspace_hint"
            style="margin-bottom:15px"
          >
            <div class="form_grid">
              <label class="field_label"
                >Benefit title<input
                  class="field_input"
                  required
                  minlength="2"
                  maxlength="60"
                  bind:value={benefit.title}
                /></label
              ><label class="field_label"
                >Icon<select class="field_input" bind:value={benefit.icon}
                  ><option value="heart">Health & care</option><option
                    value="laptop">Workplace</option
                  ><option value="coffee">Lifestyle</option><option
                    value="spark">Learning</option
                  ><option value="money">Financial</option></select
                ></label
              ><label class="field_label full"
                >Details<textarea
                  class="field_input"
                  maxlength="300"
                  bind:value={benefit.details}
                ></textarea></label
              >
            </div>
            <div class="workspace_actions reorder_actions">
              <button
                type="button"
                class="button button_outline button_small"
                disabled={i === 0}
                on:click={() => move("benefits", i, -1)}>Move up</button
              ><button
                type="button"
                class="button button_outline button_small"
                disabled={i === form.benefits.length - 1}
                on:click={() => move("benefits", i, 1)}>Move down</button
              ><button
                type="button"
                class="button button_outline button_small"
                on:click={() =>
                  (form.benefits = form.benefits.filter((_, n) => n !== i))}
                >Remove</button
              >
            </div>
          </div>{/each}
      </section>
    </div>
    <aside class="workspace_stack">
      <section class="workspace_panel">
        <h2>A face for your company</h2>
        <Image_field
          label="Logo"
          max_mb={2}
          bind:value={form.logo}
        /><Image_field
          label="Cover"
          max_mb={5}
          ratio={3}
          bind:value={form.banner}
        />
      </section>
      <section class="workspace_panel">
        <h2>Ready to meet the world?</h2>
        <p>
          You can revisit your details, products and benefits whenever they
          change.
        </p>
        <p class="workspace_hint">
          Your page goes live as soon as you {editing ? "save" : "create it"}.
          You become its first admin.
        </p>
        {#if error}<p class="filter_error" role="alert">{error}</p>{/if}<button
          class="button button_dark button_full"
          type="submit"
          disabled={saving}
          >{saving ? "Saving…" : editing ? "Save changes" : "Create company page"} ↗</button
        >
      </section>
    </aside>
  </form>{/if}
</main>
