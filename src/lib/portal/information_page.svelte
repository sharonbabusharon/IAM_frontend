<script>
  import { focus_feedback } from "./focus_feedback.js";
  import Heading from "./page_heading.svelte";
  import Companion from "./companion.svelte";
  import { landing_faqs } from "./landing_content.js";
  import { toast } from "./state.js";
  export let kind = "about";
  let question_query = "";
  let name = "",
    email = "",
    subject = "General question",
    message = "",
    submitted = false;
  const titles = {
    about: ["Good work starts", "with a fair chance."],
    faq: ["A little clarity", "goes a long way."],
    contact: ["Let’s talk", "about what’s next."],
    terms: ["Clear expectations.", "From the start."],
    privacy: ["Your story.", "Your choices."],
  };
  const terms_sections = [
    [
      "Using the platform",
      "This page is the proposed structure for the platform’s terms. The final service agreement, operator details, effective date and applicable jurisdiction have not yet been supplied.",
    ],
    [
      "Accounts & profiles",
      "This section will cover account responsibilities, accurate profile information and acceptable use. Account access is handled by the IAM service.",
    ],
    [
      "Jobs & applications",
      "This section will describe employer responsibilities, application handling and the distinction between public paid listings and direct-link free listings.",
    ],
    [
      "Company credits & payments",
      "The product requirements specify an INR wallet and non-refundable deposits. Final payment terms, taxes, billing and cancellation provisions need approved wording before launch.",
    ],
    [
      "Content & moderation",
      "This section will explain rights in uploaded content, reporting, moderation and appeals. Final policy wording is pending.",
    ],
    [
      "Questions & changes",
      "The final terms will include support details, notice of changes and the version date. Contact details must be confirmed by the team.",
    ],
  ];
  const privacy_sections = [
    [
      "This design preview",
      "Job, company and candidate examples are fictional. Saved jobs, profile edits, workspace drafts and sample review actions may be stored in this browser. They are not live employer records.",
    ],
    [
      "Your profile choices",
      "The profile includes separate controls for contact details, salary and résumé visibility. The public view demonstrates these choices. Production field access must be enforced by the profile API.",
    ],
    [
      "Files & attachments",
      "A résumé selected in the candidate preview is held for the current session. Company images may be saved with local company drafts. Use sample files while reviewing the interface.",
    ],
    [
      "Authentication",
      "Sign-in and registration use the configured identity service. The final privacy notice must identify the operator, processing purposes, retention periods and support contact for that service.",
    ],
    [
      "Browser storage",
      "The preview uses local browser storage for continuity across visits. Clearing site data in your browser removes those local records. A live account’s deletion process will be provided by the service.",
    ],
    [
      "Before launch",
      "The team must supply the final privacy policy, retention rules, contact details and any applicable consent choices before production release.",
    ],
  ];
  $: sections = kind === "terms" ? terms_sections : privacy_sections;
</script>

<svelte:head
  ><title
    >{kind === "faq"
      ? "Frequently asked questions"
      : kind === "terms"
        ? "Terms & conditions"
        : kind === "privacy"
          ? "Privacy"
          : kind === "contact"
            ? "Contact us"
            : "About Referise"} — Referise</title
  ></svelte:head
>
<main id="main-content" class="workspace portal_container">
  <Heading
    eyebrow={kind === "about"
      ? "THE REFERISE APPROACH"
      : kind === "faq"
        ? "A FEW THINGS WORTH KNOWING"
        : kind === "contact"
          ? "WE’RE LISTENING"
          : "TRUST & TRANSPARENCY"}
    title={titles[kind][0]}
    accent={titles[kind][1]}
    description={kind === "about"
      ? "More room for skills, potential and the people behind a résumé."
      : kind === "contact"
        ? "A question, an idea or a little feedback. There’s room for all of it."
        : kind === "faq"
          ? "Find your way around profiles, opportunities and the hiring experience."
          : "Know how the platform is intended to work and what is still being prepared."}
    companion={kind === "contact" ? "peach" : "blue"}
  />
  {#if kind === "about"}<div class="editorial_split">
      <section class="editorial_statement">
        <span class="eyebrow_label">PEOPLE FIRST. ALWAYS.</span>
        <h2>There’s more<br />to your story<br />than a job title.</h2>
        <Companion kind="peach" size={220} />
      </section>
      <section class="editorial_copy">
        <h2>A better way to meet your next chapter.</h2>
        <p>
          Finding work is personal. It’s about the things you care about, the
          skills you’ve built and the life you want to make room for.
        </p>
        <p>
          We’re building Referise to make that journey clearer. Candidates can
          tell their story, understand a role and get to know the team behind
          it. Employers can share useful details and focus on the experience
          people bring.
        </p>
        <a class="button button_dark" href="/profile">Tell your story ↗</a>
      </section>
    </div>
    <div class="workspace_tiles" style="margin-top:32px">
      {#each [["01", "Skills deserve the spotlight.", "Show your work, your experience and the things you’re ready to learn."], ["02", "Clarity makes a difference.", "Understand compensation, work arrangements and interview expectations before making a move."], ["03", "Trust grows with evidence.", "Company-reviewed employment history helps people put their experience in context."]] as [n, title, text]}<section
          class="workspace_panel"
        >
          <span class="eyebrow_label">{n} / WHAT WE CARE ABOUT</span>
          <h2 style="margin-top:18px">{title}</h2>
          <p>{text}</p>
        </section>{/each}
    </div>
    <section class="workspace_panel" style="margin-top:32px">
      <span class="eyebrow_label">DATA SOURCES</span>
      <p>
        Location data from <a href="https://www.geonames.org/" rel="noopener"
          >GeoNames</a
        >, licensed under
        <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener"
          >CC BY 4.0</a
        >. Exchange rates by
        <a href="https://www.exchangerate-api.com" rel="noopener"
          >ExchangeRate-API</a
        >.
      </p>
    </section>
  {:else if kind === "faq"}<div class="workspace_grid">
      <section class="workspace_panel">
        <label class="field_label"
          >Find an answer<input
            class="field_input"
            type="search"
            placeholder="Search questions"
            bind:value={question_query}
          /></label
        >{#each landing_faqs.filter((f) => `${f.question} ${f.answer}`
            .toLowerCase()
            .includes(question_query.toLowerCase())) as faq}<details
            class="faq_item"
          >
            <summary>{faq.question}</summary>
            <p>{faq.answer}</p>
          </details>{:else}<p>
            No matching questions. Try a shorter search or contact us.
          </p>{/each}
      </section>
      <aside
        class="workspace_panel"
        style="align-self:start;background:#e6edcf"
      >
        <Companion kind="sage" size={130} />
        <h2>Still wondering?</h2>
        <p>Tell us what would make your next step clearer.</p>
        <a class="button button_dark" href="/contact">Get in touch ↗</a>
      </aside>
    </div>
  {:else if kind === "contact"}<div class="workspace_grid">
      <section class="workspace_panel">
        {#if submitted}<div
            class="review_success feedback_panel"
            tabindex="-1"
            use:focus_feedback
          >
            <span class="workspace_badge green">MESSAGE PREVIEW</span>
            <h2>Thanks for sharing your thoughts.</h2>
            <p>
              Your message has not been sent. This form is ready for the support
              service to be connected.
            </p>
            <button
              class="button button_outline"
              on:click={() => (submitted = false)}>Back to message</button
            >
          </div>{:else}<form
            class="workspace_form"
            on:submit|preventDefault={() => (submitted = true)}
          >
            <h2>What’s on your mind?</h2>
            <div class="form_grid">
              <label class="field_label"
                >Your name *<input
                  class="field_input"
                  required
                  maxlength="100"
                  bind:value={name}
                /></label
              ><label class="field_label"
                >Email *<input
                  class="field_input"
                  type="email"
                  required
                  bind:value={email}
                /></label
              ><label class="field_label full"
                >Topic<select class="field_input" bind:value={subject}
                  ><option>General question</option><option
                    >Profile & account</option
                  ><option>Jobs & applications</option><option
                    >Company & hiring</option
                  ><option>Report a concern</option><option>UI feedback</option
                  ></select
                ></label
              ><label class="field_label full"
                >Message *<textarea
                  class="field_input"
                  rows="7"
                  required
                  minlength="10"
                  maxlength="3000"
                  bind:value={message}
                ></textarea></label
              >
            </div>
            <p class="form_helper">
              Preview only. No message is sent from this form yet.
            </p>
            <button class="button button_dark">Review message ↗</button>
          </form>{/if}
      </section>
      <aside class="workspace_stack">
        <section class="workspace_panel">
          <span class="eyebrow_label">A LITTLE HELP</span>
          <h2 style="margin-top:16px">Find your way.</h2>
          <div class="workspace_list">
            <a href="/faq"
              ><div>
                <strong>Common questions ↗</strong>
                <p>Profiles, applications and how things work.</p>
              </div></a
            ><a href="/profile?tab=preferences"
              ><div>
                <strong>Your preferences ↗</strong>
                <p>Manage visibility and career choices.</p>
              </div></a
            ><a href="/auth/help"
              ><div>
                <strong>Account help ↗</strong>
                <p>Help with sign-in and account access.</p>
              </div></a
            >
          </div>
        </section>
        <section class="workspace_hint">
          Official support email and response times will be added when confirmed
          by the team.
        </section>
      </aside>
    </div>
  {:else}<p class="workspace_hint warning">
      {kind === "terms"
        ? "Terms layout for review · Final legal wording is pending. This is not an operative service agreement."
        : "Privacy information for the current preview · Final production policy is pending."}
    </p>
    <div class="reading_layout">
      <aside>
        {#each sections as [title], i}<a href={`#section-${i}`}
            >{String(i + 1).padStart(2, "0")} / {title}</a
          >{/each}
      </aside>
      <article>
        {#each sections as [title, text], i}<section id={`section-${i}`}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>{/each}<a class="button button_outline" href="/contact"
          >Contact us ↗</a
        >
      </article>
    </div>{/if}
</main>
