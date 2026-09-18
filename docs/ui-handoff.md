# Referise — four-page UI handoff

## Review the pages

Run `npm install` if dependencies are missing, then `npm run dev`.

| Page | Route | Main interaction |
| --- | --- | --- |
| Landing | `/` | Search, featured role categories, company previews, FAQ |
| Job discovery | `/jobs` | Search, combined filters, salary, sorting, saved jobs/searches, pagination, grid/list |
| Job detail | `/jobs/senior-product-designer` | Save, share, full description, hiring steps, application preview |
| Candidate profile | `/profile` | Edit profile/about/skills/preferences, public preview, activity, résumé preview |

The existing IAM login, account, and administration routes are still available. The root route now opens the portal landing page.

## Design direction

Warm paper backgrounds, charcoal text, terracotta actions, restrained sage panels, Instrument Serif headings, and DM Sans interface text. The architectural doorway illustration, company symbols, and portfolio graphics are original SVG/CSS assets. Fonts are served locally; their OFL licenses are in `static/fonts`.

The supplied Drive references informed the editorial typography, warm palette, and landing hierarchy. Additional research covered [Wellfound's candidate experience](https://wellfound.com/candidates/overview), [Wellfound search](https://help.wellfound.com/article/777-setting-up-a-search), and [Welcome to the Jungle](https://www.welcometothejungle.com/en). These informed salary visibility, practical filters, and company context.

## What is real in this preview

- All four pages are implemented in the existing SvelteKit project, with desktop and mobile layouts.
- Filters are reflected in the URL and can be bookmarked.
- Saved jobs, up to five saved searches, application IDs, profile edits, and preferences persist in this browser.
- Application, reporting, résumé, and company dialogs work with clearly identified sample content.
- Public profile preview respects visibility, salary, and résumé preferences in the current browser.
- Native dialogs provide keyboard focus trapping and Escape dismissal. Reduced motion, visible focus states, empty results, and unknown-role errors are included.

## Integration boundaries

This is a UI delivery with fictional employers, jobs, candidate information, and illustrative analytics. No application or report is sent. A profile link opened on another device shows the default sample profile, because edits are local. The supplied Swagger describes IAM rather than the job/profile service; backend contracts for these pages remain to be connected.

Before launch: connect real job/profile/application services, enforce privacy on the server, replace sample analytics and verification states, add the chosen deployment adapter, and reconcile the documents' Free-job visibility rule (the manual describes unlisted Free jobs, while reference screens show Free cards). The preview includes both tiers for visual review. Existing IAM pages retain their own styling.

## Implementation map

- `src/routes/(portal)`: four page routes, shared layout, and error page.
- `src/lib/portal`: shared UI components, types, fixture data, query filtering, and browser state.
- `portal.css`: shared visual system and landing styles.
- `portal_pages.css`: discovery, detail, profile, and responsive styles.

## Code conventions

Custom variables, functions, types, component files, and CSS classes use snake_case. Svelte component references start with an uppercase letter (`Job_card`) so Svelte recognizes them as components. Native browser APIs, SvelteKit options, existing URLs, and storage keys keep their required names. Styles are in the two CSS files; component style directives supply dynamic values such as company colors and progress widths.

## Verification

- `npm run build` passes.
- `npm run check:portal` passes with zero errors and warnings.
- Browser review covered desktop and phone layouts, combined filters, landing search navigation, job saving, local application submission, profile activity, edit persistence, public privacy behavior, and dialog behavior.
- The repository-wide `npm run check` had 68 errors in 13 legacy IAM files before this work. Those unrelated errors remain outside this delivery.
- The installed SvelteKit/Svelte 4 combination emits build warnings for Svelte 5 exports. Build succeeds; dependency alignment should be handled with the existing IAM app's regression checks before deployment.

For a production bundle preview, run `npm run build`, then `npm run preview`. No deployment has been performed.
