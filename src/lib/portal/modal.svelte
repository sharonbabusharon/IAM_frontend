<script lang="ts">
  import {
    createEventDispatcher as create_event_dispatcher,
    onMount as on_mount,
  } from "svelte";
  import Icon from "./icon.svelte";
  export let title = "";
  export let wide = false;
  const dispatch = create_event_dispatcher();
  let dialog: HTMLDialogElement;
  on_mount(() => {
    const previous_focus = document.activeElement as HTMLElement | null;
    const previous_overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previous_overflow;
      previous_focus?.focus();
    };
  });
  function backdrop(event: MouseEvent) {
    if (event.target === dialog) dispatch("close");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions -->
<dialog
  bind:this={dialog}
  class="portal_modal"
  class:wide
  aria-label={title}
  on:cancel|preventDefault={() => dispatch("close")}
  on:click={backdrop}
>
  <div class="modal_content">
    <div class="modal_heading">
      <h2>{title}</h2>
      <button
        class="icon_button"
        aria-label="Close dialog"
        on:click={() => dispatch("close")}><Icon name="close" /></button
      >
    </div>
    <slot />
  </div>
</dialog>
