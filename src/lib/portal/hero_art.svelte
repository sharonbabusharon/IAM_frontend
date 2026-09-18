<script lang="ts">
  import Company_logo from "./company_logo.svelte";
  import Icon from "./icon.svelte";
</script>

<div
  class="hero_art"
  aria-label="An open doorway to new possibilities, with a sample product design opportunity"
  role="img"
>
  <svg class="doorway_art" viewBox="0 0 520 480" fill="none" aria-hidden="true">
    <defs
      ><pattern
        id="paper-lines"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        ><path d="M0 7 7 0" stroke="#b95132" stroke-opacity=".035" /></pattern
      ><clipPath id="arch-clip"
        ><path d="M178 370V192a115 115 0 0 1 230 0v178Z" /></clipPath
      ></defs
    >
    <circle cx="298" cy="236" r="203" stroke="#dedbd1" stroke-dasharray="2 7" />
    <path d="M144 393V185a149 149 0 0 1 298 0v208H144Z" fill="#e6c9b3" />
    <path d="M160 387V186a133 133 0 0 1 266 0v201H160Z" fill="#f0dac7" />
    <path d="M178 370V192a115 115 0 0 1 230 0v178H178Z" fill="#fcf3df" />
    <g clip-path="url(#arch-clip)"
      ><circle cx="333" cy="169" r="49" fill="#cb7757" /><path
        d="M164 315c82-99 164-92 253-43v131H164Z"
        fill="#a2a58c"
      /><path d="M165 348c58-92 162-56 253-39v94H165Z" fill="#6d7864" /><path
        d="M187 370 276 255l36 2-66 113"
        fill="#f2dfbf"
      /><path d="M178 192h230v178H178Z" fill="url(#paper-lines)" /></g
    >
    <path d="M144 393h298l28 16H117l27-16Z" fill="#d2ac90" /><path
      d="M117 409h353v13H117Z"
      fill="#e5c8b0"
    /><path d="M117 422h353l24 15H94l23-15Z" fill="#e9d5bf" /><path
      d="M94 437h400v11H94Z"
      fill="#d8bba0"
    />
    <path
      d="M53 130c21-15 40-21 63-17M100 102l18 11-18 9"
      stroke="#8d9583"
      stroke-width="1.5"
    />
    <path
      d="M459 81v26m-13-13h26m-22-9 18 18m-18 0 18-18"
      stroke="#a55336"
      stroke-width="1.4"
    />
    <circle cx="98" cy="260" r="4" fill="#be6747" />
    <path d="M465 297h8m-4-4v8" stroke="#8d9583" stroke-width="1.5" />
  </svg>
  <div class="art_caption"><span></span> A little room to grow.</div>
  <div class="hero_opportunity">
    <div class="opportunity_top">
      <Company_logo id="forma" size={38} />
      <div><strong>Forma</strong><span>Workplace technology</span></div>
      <span class="opportunity_spark"><Icon name="spark" size={17} /></span>
    </div>
    <h3>Senior Product Designer</h3>
    <div class="opportunity_meta">
      <span>Hybrid · Bengaluru</span><span>Full-time</span>
    </div>
    <div class="opportunity_salary">
      <strong>₹28–40 LPA</strong><span
        ><Icon name="shield" size={13} /> Salary upfront</span
      >
    </div>
  </div>
  <div class="art_note">
    <span class="note_star">✳</span><span
      >Good things<br /><em>are ahead.</em></span
    >
  </div>
  <span class="art_edition">THE NEXT CHAPTER — VOL. 01</span>
</div>
