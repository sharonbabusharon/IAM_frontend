<script>
  import Icon from "./icon.svelte";
  // The public Activity & Analytics tab (GET /profiles/{slug}/analytics):
  // aggregates for the last 7 complete days, never who viewed. null when the
  // profile isn't saved or public yet, or the service is unavailable.
  export let analytics = null;

  const series = [
    { key: "profile_views", label: "Profile views", icon: "eye", color: "#3155ef" },
    { key: "resume_views", label: "Résumé views", icon: "file", color: "#55734a" },
    { key: "resume_downloads", label: "Résumé downloads", icon: "briefcase", color: "#ac603a" },
  ];
  const day_name = (date) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
  const long_date = (date) =>
    new Date(date + "T00:00:00Z").toLocaleDateString("en", { day: "numeric", month: "short", timeZone: "UTC" });

  /** "+18.4%", "−12%", or a word when there was nothing to compare with. */
  function growth(key) {
    const g = analytics.growth?.[key];
    if (g == null) return analytics.totals[key] ? "New" : "No previous activity";
    return `${g > 0 ? "+" : g < 0 ? "−" : ""}${Math.abs(g)}%`;
  }

  $: days = analytics?.daily ?? [];
  $: top = Math.max(1, ...days.flatMap((d) => series.map((s) => d[s.key])));
  $: points = (key) =>
    days.map((d, i) => `${30 + i * 96},${145 - (d[key] / top) * 120}`).join(" ");
  $: peak = analytics?.peak_day ?? null;
</script>

{#if !analytics}<section class="profile_section">
    <div class="activity_empty">
      <Icon name="eye" size={29} />
      <h3>Activity shows up here once the profile is public.</h3>
      <p>Views are counted daily; check back tomorrow.</p>
    </div>
  </section>{:else}<section class="profile_section">
    <div class="profile_section_heading">
      <h2>Your story is finding its people.</h2>
      <span class="section_label">LAST 7 DAYS · {long_date(analytics.from)}–{long_date(analytics.to)}</span>
    </div>
    <div class="profile_stats">
      {#each series as s}<div>
          <Icon name={s.icon} size={19} /><strong>{analytics.totals[s.key]}</strong><span
            >{s.label}</span
          ><small>{growth(s.key)}</small>
        </div>{/each}
    </div>
    <p class="small_text">
      {analytics.view_sources.search} from recruiter searches · {analytics.view_sources.direct} direct impressions
    </p>
    <div class="profile_chart">
      <div>
        <strong>Daily engagement</strong><span
          >{peak ? `${day_name(peak)} · peak activity` : "No activity yet"}</span
        >
      </div>
      <svg
        viewBox="0 0 640 170"
        role="img"
        aria-label={`Last 7 days: ${analytics.totals.profile_views} profile views, ${analytics.totals.resume_views} résumé views and ${analytics.totals.resume_downloads} downloads`}
        ><path d="M30 25h576M30 65h576M30 105h576M30 145h576" stroke="#dce1ef" stroke-dasharray="3 4" />
        {#each series as s}<polyline points={points(s.key)} fill="none" stroke={s.color} stroke-width="2.5" />{/each}
        <g font-size="10" fill="currentColor"
          >{#each days as d, i}<text x={22 + i * 96} y="168" font-weight={d.date === peak ? 700 : 400}
              >{day_name(d.date)}</text
            >{/each}</g
        ></svg
      >
      <p class="small_text">Blue: profile views · Green: résumé views · Copper: downloads</p>
      <details>
        <summary class="small_text">View chart data</summary>
        <table class="weekly_analytics_table">
          <thead><tr><th>Day</th>{#each series as s}<th>{s.label}</th>{/each}</tr></thead>
          <tbody
            >{#each days as d}<tr
                ><td>{day_name(d.date)}, {long_date(d.date)}</td>{#each series as s}<td>{d[s.key]}</td>{/each}</tr
              >{/each}</tbody
          >
        </table>
      </details>
    </div>
    <p class="small_text muted">
      Updated once a day. Counts are aggregates; nobody can see who viewed a profile.
      Résumé views and downloads start counting once résumés can be uploaded.
    </p>
  </section>{/if}
