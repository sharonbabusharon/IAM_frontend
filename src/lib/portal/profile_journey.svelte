<script>
  export let profile;
  export let public_preview = false;
  $: experience = profile.experiences
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => a.start.localeCompare(b.start));
  $: steps = journey_steps(experience, profile.education);
  function journey_steps(items, education) {
    const result = education
      .filter((e) => e.end)
      .map((e) => ({
        label: e.end,
        title: "Graduation",
        detail: [e.degree, e.institution].filter(Boolean).join(" · "),
        href: "#profile-background",
      }));
    items.forEach((item, i) => {
      const previous = items[i - 1];
      if (previous?.end && item.start) {
        const gap =
          (new Date(item.start + "-01") - new Date(previous.end + "-01")) /
          86400000;
        if (gap > 62)
          result.push({
            label: "A pause",
            title: "Between chapters",
            detail: `${previous.end} – ${item.start}`,
            href: `#experience-${item.index}`,
          });
      }
      result.push({
        label: item.start?.slice(0, 4) || "Next",
        title: item.company,
        detail: item.roles?.map((role) => role.title).join(" → ") ?? "",
        href: `#experience-${item.index}`,
      });
    });
    return result;
  }
</script>

<div class="career_path" aria-label="Career journey">
  <span class="career_path_label">EVERY CHAPTER COUNTS</span>
  <ol
    class="career_path_steps"
    class:extended={steps.length > 3}
    style={`--milestone_count:${Math.max(steps.length, 1)}`}
  >
    {#each steps as step, i}
      <li>
        <a
          class="journey_step"
          href={`/profile${public_preview ? "?public=1" : ""}${step.href}`}
          style={`--step:${i}`}
          title={`${step.title} · ${step.label} — ${step.detail}`}
        >
          <span class="journey_dot" aria-hidden="true"
            >{i === 0 ? "✳" : "•"}</span
          >
          <strong class="journey_title">{step.title}</strong>
          <span class="journey_date">{step.label}</span>
          <span class="journey_detail">{step.detail}</span>
        </a>
      </li>
    {/each}
  </ol>
</div>
