<script>
  export let kind = "peach";
  export let size = 160;
</script>

<span class="career_companion {kind}" style:width="{size}px" aria-hidden="true"
></span>

<style>
  .career_companion {
    display: block;
    aspect-ratio: 1;
    background: url("/illustrations/career_companions.png") no-repeat;
    background-size: 300% 100%;
    flex-shrink: 0;
  }
  .peach {
    background-position: 0 0;
  }
  .sage {
    background-position: 50% 0;
  }
  .blue {
    background-position: 100% 0;
  }
</style>
