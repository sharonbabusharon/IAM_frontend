<script>
  import { onDestroy as on_destroy } from "svelte";
  import { profile, toast } from "./state.js";
  import { profile_api, to_store } from "./profile_api.js";
  import Modal from "./modal.svelte";
  export let premium = false;
  export let readonly = false;
  export let initials = "";
  let editing = false;
  let image_url = "";
  let zoom = 1;
  let error = "";
  let image_element;
  function select(e) {
    const file = e.currentTarget.files?.[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png"].includes(file.type) ||
      file.size > 1024 * 1024
    ) {
      error = "Choose a JPG or PNG under 1 MB.";
      return;
    }
    if (image_url) URL.revokeObjectURL(image_url);
    image_url = URL.createObjectURL(file);
    zoom = 1;
    error = "";
  }
  function close() {
    if (image_url) URL.revokeObjectURL(image_url);
    image_url = "";
    editing = false;
  }
  on_destroy(() => {
    if (image_url) URL.revokeObjectURL(image_url);
  });
  let uploading = false;
  async function save() {
    if (!image_element?.complete || !image_element.naturalWidth || uploading) return;
    if (!$profile.saved) {
      error = "Save your profile once, then add a photo.";
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const side =
      Math.min(image_element.naturalWidth, image_element.naturalHeight) / zoom;
    ctx.drawImage(
      image_element,
      (image_element.naturalWidth - side) / 2,
      (image_element.naturalHeight - side) / 2,
      side,
      side,
      0,
      0,
      256,
      256,
    );
    uploading = true;
    const result = await profile_api.upload_photo(canvas.toDataURL("image/jpeg", 0.88));
    uploading = false;
    if (!result.ok) {
      error = result.error;
      return;
    }
    profile.set(to_store(result.data));
    close();
    toast("Profile photo updated.");
  }
</script>

{#if readonly}<div class="profile_avatar" class:premium_avatar={premium}>
    {#if $profile.photo}<img
        src={$profile.photo}
        alt={$profile.name}
        style="width:100%;height:100%;border-radius:50%;object-fit:cover"
      />{:else}{initials}{/if}
  </div>{:else}<button
    class="profile_avatar"
    class:premium_avatar={premium}
    aria-label="Edit profile photo"
    on:click={() => (editing = true)}
    >{#if $profile.photo}<img
        src={$profile.photo}
        alt={$profile.name}
        style="width:100%;height:100%;border-radius:50%;object-fit:cover"
      />{:else}{initials}{/if}</button
  >{/if}
{#if editing}<Modal title="A face to your story" on:close={close}
    ><label class="field_label"
      >Choose a photo · JPG or PNG, up to 1 MB<input
        class="field_input"
        type="file"
        accept="image/jpeg,image/png"
        on:change={select}
      /></label
    >{#if error}<p role="alert" class="filter_error">
        {error}
      </p>{/if}{#if image_url}<div
        style="width:220px;height:220px;border-radius:50%;overflow:hidden;margin:25px auto;background:#edf0fa"
      >
        <img
          bind:this={image_element}
          src={image_url}
          alt="Crop preview"
          style={`width:100%;height:100%;object-fit:cover;transform:scale(${zoom})`}
        />
      </div>
      <label class="field_label"
        >Zoom<input
          type="range"
          min="1"
          max="3"
          step="0.05"
          bind:value={zoom}
        /></label
      >{/if}
    <div class="form_actions">
      {#if $profile.photo}<button
          class="button button_outline"
          on:click={() => {
            profile.update((p) => ({ ...p, photo: "" }));
            close();
          }}>Remove photo</button
        >{/if}<button class="button button_outline" on:click={close}
        >Cancel</button
      ><button class="button button_dark" disabled={!image_url} on:click={save}
        >Save photo</button
      >
    </div></Modal
  >{/if}
