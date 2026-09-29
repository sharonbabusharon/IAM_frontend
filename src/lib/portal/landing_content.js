export const platform_metrics = [
  {
    value: "100K+",
    label: "Registered users",
    detail: "A world of different skills, stories, and ambitions.",
    note: "+14% month on month",
    icon: "users",
  },
  {
    value: "12K+",
    label: "HR professionals",
    detail: "People helping the right talent find its place.",
    note: "Verified leads",
    icon: "user",
  },
  {
    value: "8K+",
    label: "Global companies",
    detail: "From small, ambitious teams to global names.",
    note: "75+ sectors",
    icon: "building",
  },
  {
    value: "25K+",
    label: "Open opportunities",
    detail: "Fresh roles, clear expectations, a next step.",
    note: "Pre-vetted roles · Response SLAs",
    icon: "briefcase",
  },
  {
    value: "120+",
    label: "Countries with candidates",
    detail: "Good work has never belonged to one place.",
    note: "24 time zones",
    icon: "globe",
  },
  {
    value: "75+",
    label: "Countries with jobs & companies",
    detail: "A growing network of possibilities across borders.",
    note: "Global hiring coverage",
    icon: "location",
  },
];
export const landing_faqs = [
  {
    question: "What makes Referise different?",
    answer:
      "We’re building a more transparent way to find work: verified experience, clearer compensation, and visibility into the hiring journey. The goal is simple—less guesswork for candidates and more meaningful connections for teams.",
  },
  {
    question: "Can I explore jobs without an account?",
    answer:
      "Yes. Browse opportunities, read full job descriptions, and explore companies before signing in. In this preview, saved jobs and application interactions stay in your browser.",
  },
  {
    question: "How does employment verification work?",
    answer:
      "The planned workflow lets a company approve an employment entry on your profile. Editing a verified entry requests a new review. Verification badges in this preview are illustrative; company approval APIs are not connected yet.",
  },
  {
    question: "Can I choose who sees my résumé?",
    answer:
      "The profile design includes public and application-only résumé preferences. Use the public preview to explore them. These choices are currently demonstrated in your browser; secure access will be enforced by the backend when it is connected.",
  },
  {
    question: "Can I view salaries in my own currency?",
    answer:
      "The planned platform stores salaries against an INR baseline and uses daily exchange rates to display your preferred currency. The current sample jobs show their original currencies; live conversion is not connected yet.",
  },
  {
    question: "Are the jobs and platform numbers live?",
    answer:
      "This is a design preview. Jobs, companies, verification states, and platform figures are sample content. No application is sent to an employer. The final platform metrics are intended to refresh once a day.",
  },
];
export const preview_topics = {
  employer: {
    title: "A place for your next great hire.",
    text: "The employer experience will bring job posting, company profiles, applicant review, and team management together. This landing-page preview focuses on the candidate experience; employer screens are still to come.",
    action: "Explore candidate experience",
    href: "/profile",
  },
  dashboard: {
    title: "Your hiring workspace.",
    text: "Posted jobs, application review, and company management will live here. Those dashboards are part of the next design phase. You can explore the candidate profile and job pages now.",
    action: "View my profile",
    href: "/profile",
  },
  applications: {
    title: "Every next step, in one place.",
    text: "Your application history and recruiter updates will appear here once the application service is connected. Applications in this preview are saved only in your browser.",
    action: "Explore opportunities",
    href: "/jobs",
  },
  install: {
    title: "A little closer to your next chapter.",
    text: "The planned PWA includes offline job queuing, background synchronization on slower connections, interview push notifications, biometric authentication, and continuity across desktop and mobile. These are requirements for the future app; this UI preview is not installable yet.",
    action: "Explore opportunities",
    href: "/jobs",
  },
  compensation: {
    title: "Know where you stand.",
    text: "The compensation design calls for upfront salary bands and equity, daily conversion from an INR baseline to currencies including USD, EUR, GBP, CAD, and JPY, private salary matching, local cost-of-living comparisons, and pre-tax or cross-border contractor breakdowns. Conversion, calculations, and matching are planned services. Current sample roles show their original currencies.",
    action: "Explore salary ranges",
    href: "/jobs",
  },
  resources: {
    title: "A little guidance for the journey.",
    text: "Career guides, interview preparation, and salary resources will help candidates navigate their next move. This resource library is still to be designed. You can explore the complete job descriptions and profile experience today.",
    action: "Explore a job description",
    href: "/jobs/senior-product-designer",
  },
  talent: {
    title: "Meet the people behind the potential.",
    text: "Talent search and candidate discovery are planned parts of the employer experience. Candidate visibility, verified experience, and privacy preferences will determine what hiring teams can see. Explore the sample candidate profile to review those ideas.",
    action: "Explore a candidate profile",
    href: "/profile",
  },
  integrations: {
    title: "A place in your hiring workflow.",
    text: "Enterprise ATS integration appears in the shortlisted design. Provider support, data exchange, permissions, and the integration setup flow still need to be agreed with the team.",
    action: "Explore the current experience",
    href: "/jobs",
  },
  pricing: {
    title: "Plans that fit the way you hire.",
    text: "A pricing page is included in the shortlisted navigation. Packages, billing terms, and plan limits have not been finalized, so this preview does not offer subscriptions or take payments.",
    action: "Explore opportunities",
    href: "/jobs",
  },
  security: {
    title: "Trust should be earned.",
    text: "The shortlisted design includes ISO 27001, SOC 2 Type II, and GDPR references. Compliance review and independent certification need confirmation before any badges can be published. They are review requirements, not certifications held by this preview. The product also needs secure profile access and a record of hiring activity.",
    action: "Explore profile privacy",
    href: "/profile?tab=preferences",
  },
  privacy: {
    title: "Your information. Your choice.",
    text: "This preview uses fictional content. Profile edits, saved jobs, and applications stay in this browser. No résumé is uploaded and no application is sent. Explore the profile preferences to see the proposed privacy controls.",
    action: "View privacy preferences",
    href: "/profile?tab=preferences",
  },
  legal: {
    title: "The details matter.",
    text: "Terms of service, privacy policy, cookie preferences, and support content will be published before launch. This is a UI review preview; the product’s legal and support pages are still being prepared.",
    action: "Back to opportunities",
    href: "/jobs",
  },
  verification: {
    title: "Trust, with something behind it.",
    text: "The specification calls for company-approved employment history, cryptographic employer signatures, and renewed verification whenever an entry changes. The shortlisted design also proposes recruiter response SLAs, 48-hour escalation, and an audit trail of review milestones to reduce ghosting. Approval, escalation, and verification services are planned; badges in this preview are sample states.",
    action: "Explore a profile",
    href: "/profile",
  },
};
