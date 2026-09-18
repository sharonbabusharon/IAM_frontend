<script lang="ts">
  import { get_company } from "./data";
  export let id = "forma";
  export let size = 44;
  $: company = get_company(id);
</script>

<span
  class="company_logo"
  style:width={`${size}px`}
  style:height={`${size}px`}
  style:color={company.color}
  style:background={company.background}
  aria-hidden="true"
>
  <svg viewBox="0 0 32 32" width="65%" height="65%" fill="currentColor">
    {#if id === "forma"}<path d="M5 26V6h22v6H12v3h12v6H12v5H5Z" />
    {:else if id === "layers"}<path
        d="m16 3 14 8-14 8L2 11 14 3Zm-12 13 12 7 12-7 2 4-14 8-14-8 2-4Z"
      />
    {:else if id === "orbit"}<circle
        cx="16"
        cy="16"
        r="10"
        fill="none"
        stroke="currentColor"
        stroke-width="5"
      /><ellipse
        cx="16"
        cy="16"
        rx="17"
        ry="5"
        transform="rotate(-35 16 16)"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      />
    {:else if id === "northstar"}<path
        d="m16 1 4 11 11 4-11 4-4 11-4-11-11-4 11-4 4-11Z"
      />
    {:else if id === "monograph"}<path
        d="M3 25V7h6l7 9 7-9h6v18h-6V15l-7 9-7-9v10H3Z"
      />
    {:else}<path d="M2 27 13 5h7l11 22h-8l-7-15-7 15H2Z" />{/if}
  </svg>
</span>
