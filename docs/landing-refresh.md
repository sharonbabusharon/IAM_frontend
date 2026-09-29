# Referise landing exploration

29 September 2026 · UI review · Cobalt exploration

## Direction

The screenshots are a content checklist. The latest direction deliberately explores a different visual language: cobalt, pale blue, deep navy, and sharp lime, with lavender and soft green supporting panels. Typography is the locally hosted DM Sans throughout the landing.

The opening pairs oversized typography with a custom blue doorway, a career companion, and offset profile/opportunity tickets. The doorway also echoes the existing Referise logo. Search leads into coloured role cards, a navy company directory, a feature composition with a CSS phone illustration, six platform figures, and FAQ. A lime closing section repeats the doorway motif. Characters appear at relevant moments rather than as a continuous animation.

The supplied Dribbble JobFly artwork was inspected visually. Its bold contrast, offset composition, and playful geometry informed this exploration; its images and layout were not copied. Reference: https://dribbble.com/shots/24805854-Job-Portal-Website-Landing-Page

Animations are brief entrances triggered when sections enter view. There are no continuous loops. System reduced-motion preferences are respected; the footer also offers a motion switch.

## Review locally

Run `npm run dev` from the repository, then open the URL Vite prints. During this review the page is running at http://127.0.0.1:5173/.

The cobalt direction now covers all four main pages: `/`, `/jobs`, `/jobs/[slug]`, and `/profile`. The profile's activity, preferences, public preview, and edit dialogs are included. Login and administration pages remain outside this design pass.

### Product pages

- **Job listings:** a compact doorway illustration, a white filter panel, colourful company-based role cards, and grid/list views. Search, salary filters, sorting, pagination, saved roles, and the mobile filter dialog remain available.
- **Job detail:** a navy role header with a lime apply button, prominent compensation/work facts, a white description panel, company information, lavender skill tags, and a navy hiring activity card. Existing application, sharing, and report interactions are retained.
- **Profile:** a cobalt cover with arch artwork and a peach companion, a navy/lime avatar and completion panel, white content sections, updated project artwork, activity charts, and privacy controls. The original profile data remains in the browser store.

The shared product header, footer, dialogs, form controls, empty states, and responsive layouts now use the same palette and sans-serif typography as the landing. The default job results view is a two-column grid on desktop. List view is still available.

## Content carried forward

| Shortlisted content | Location in this exploration |
| --- | --- |
| Job and company search | Two search modes in the hero |
| Keyword, location, country, work mode, experience, industry | Search controls; job filters transfer to the existing results page |
| Profile, posted jobs, applied jobs, saved jobs | Header navigation; unfinished destinations explain the planned experience |
| Company search, company creation, my company | Header navigation and company section |
| Install app, sign in, post a job | Header actions and mobile menu |
| Registered users, HR professionals, companies, jobs, candidate countries, employer/job countries | Six figures in the platform reach section: 100K+, 12K+, 8K+, 25K+, 120+, 75+ |
| Daily metric refresh | Note alongside the illustrative figures |
| PWA, offline queue, background sync, interview notifications, biometrics, cross-device continuity | First feature card and its detail dialog |
| Employment verification, employer signatures, response SLAs, 48-hour escalation, review audit trail | Second feature card and its detail dialog |
| Upfront compensation, equity, currency conversion, salary matching, cost-of-living and contractor breakdowns | Third feature card and its detail dialog |
| Salary calculator, career resources, talent search, ATS integration, pricing | Footer destinations with explanatory preview dialogs |
| Terms, privacy, cookies, trust/security, support | Footer destinations with explanatory preview dialogs |
| ISO 27001, SOC 2 Type II, GDPR references | Trust/security dialog records these as items requiring confirmation; the page does not assert certification |

The shortened homepage copy introduces each feature. Detailed concepts from the shortlisted HTML remain accessible through its related dialog. Job counts in the feed describe the twelve fixtures; larger platform figures are explicitly illustrative. The supplied billing, administration, and job-creation screens inform the broader product context; those additional routes have not been implemented.

## Working interactions

- Job search transfers keyword, location, country, work mode, experience, and category to `/jobs`.
- Entering “remote” with a country applies a remote work filter and that country separately.
- Company search filters local company fixtures, shows all matches, and provides an empty state and reset.
- Role category tabs change the preview jobs. Saving a role uses the existing browser persistence store.
- Company cards open a company introduction and a link to its sample jobs.
- Header dropdowns, the mobile menu, dialogs, FAQ disclosures, and the motion switch work with keyboard controls.
- Employer, install, legal, and other unfinished destinations show planned functionality without pretending to submit, install, or purchase anything.

## Implementation

- `src/routes/(portal)/+page.svelte`: landing markup and interactions.
- `src/lib/portal/landing.css`: responsive, landing-scoped CSS.
- `src/lib/portal/cobalt_pages.css`: the product-page theme, scoped to non-landing portal routes.
- `src/lib/portal/job_card.svelte`: grouped cover/content regions shared by listings and related roles.
- `src/lib/portal/landing_content.js`: metrics, FAQ answers, and preview dialog text.
- `src/lib/portal/companion.svelte`: reusable decorative character with `kind` and `size` props.
- `src/routes/(portal)/+layout.svelte`: uses the landing's own header/footer only on `/`.
- `static/illustrations/career_companions.png`: locally hosted transparent character sheet, 2172 × 724, approximately 1 MB.

Plain JavaScript and CSS. No animation library or Three.js dependency was added. The landing uses locally hosted DM Sans. Character artwork loads once and is shown as three CSS sprite positions. Doorways, tickets, the phone, salary range, and globe are CSS/inline SVG. No external image service is needed at runtime.

## Asset provenance

The previous exploration's workplace photograph remains at `static/images/workplace_architecture.jpg` but is not used in the cobalt landing. It is by Roger Starnes Sr on Unsplash, published under the Unsplash License.

- Photo and photographer: https://unsplash.com/photos/modern-building-with-large-windows-and-green-trees-RUzB3yHxM3E
- License: https://unsplash.com/license

The companion artwork was created with the built-in image generation tool for this exploration. It is original generated artwork, not a downloaded or licensed stock illustration. The supplied references guided the style; no reference website artwork was copied into the page.

Final asset: `static/illustrations/career_companions.png`.

### Generation prompt

Create a premium 3D clay character asset sheet for a warm cream and terracotta professional job portal website. WIDE LANDSCAPE canvas aspect ratio 3:1. EXACTLY THREE individual full-body characters on a genuinely TRANSPARENT BACKGROUND, absolutely no ground plane or backdrop, very subtle contact shadow only. Arrange each character centered in its own EQUAL WIDTH THIRD of the canvas, all standing on same baseline, each entirely contained inside its own third with generous transparent margins. Character 1 at x=16.67%: a soft terracotta-peach rounded friendly little clay person, squarish softly rounded head, tiny black dot eyes and subtle smile, blush cheeks, simple matching peach overalls, holding a small open ivory laptop with plain screen, looks engaged slightly to right. Character 2 at x=50%: a muted sage green rounded friendly clay person, soft round head tiny black dot eyes subtle smile blush cheeks, cream work jacket, holding small cream clipboard bearing a simple terracotta check mark, standing proudly. Character 3 at x=83.33%: a dusty powder blue rounded friendly clay person, soft round head tiny black dot eyes smile blush cheeks, blue jacket, carrying a little cocoa-brown briefcase in one hand and raising the other hand in a small welcoming wave. Same character family, distinctive silhouettes and poses. Style: handmade tactile polymer clay, slightly imperfect hand sculpted surfaces, beautiful soft studio lighting upper left, warm highlights, realistic soft ambient occlusion, sophisticated cute collectible figurines, NOT glossy plastic, NOT robots. Medium front three-quarter view. Full bodies and all accessories fully visible. No lettering, no logos, no extra objects, no text, no frames, no tiles, no platform. These will be displayed independently by cropping each equal third in CSS, so leave a clear transparent vertical gutter between the three figures. Elegant editorial product rendering, extremely clean silhouette, very high resolution.

## Review boundaries

This is a UI exploration, not a connected hiring service. Jobs, companies, metrics, and verification badges are fictional sample content. Backend verification, live conversion, push notifications, app installation, employer tools, and legal content remain integration/design work. The preview dialogs and FAQ make those boundaries visible.

The four downloaded HTML/screenshot folders continue to inform content coverage. The latest six screenshots inform product information, not the styling of this exploration. Some are low resolution; tiny text has not been treated as a reliable source of additional requirements.

## Verification

- `npm run check:portal`: zero errors and zero warnings.
- `npm run build`: completed with the existing Svelte 4 / newer SvelteKit export warnings (`untrack`, `fork`, `settled`). Those framework warnings predate the landing change and remain a dependency follow-up.
- Browser review at desktop 1440 px, tablet 768 px, and mobile 390 px and 320 px.
- Verified job filters, company search and empty-state recovery, company dialogs, category switching, saved-job persistence, navigation menus, FAQ, and the motion toggle.
- No browser console errors observed during these checks.

The three product pages were also reviewed at 1440, 768, 390, and 320 px. Checked filtering on desktop and mobile, grid/list switching, profile save, activity navigation, private-profile preview and restoration, and application consent validation. Existing sample application state was retained; testing the application dialog did not send or create an application. The Svelte check reported zero errors/warnings and the production build completed with the same existing framework warnings.

Earlier exploration screenshots remain in `output/landing-refresh/` and `output/landing-reference-update/`. Current landing screenshots are in `output/landing-cobalt/`; the three additional page previews are in `output/cobalt-pages/`. No commit, push, or deployment is part of this exploration.
