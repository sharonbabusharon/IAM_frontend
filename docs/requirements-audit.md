# Portal fields and filters audit

Reviewed 1 October 2026. Scope: the four approved portal pages, keeping the cobalt design. These remain a frontend preview with fictional data.

## Sources

- **Manual document Job portal – Google Docs.pdf:** pp. 1–7 compensation, metadata and consolidated search; pp. 7–9 location tree and landing; pp. 9–15 candidate profile; p. 22 sorting; pp. 24–27 listing rules and job fields.
- **Job Portal Ui Designs.docx – Google Docs.pdf:** pp. 3–5 discovery fields and corrections; pp. 7–8 detail and analytics; pp. 10–12 profile fields and privacy.
- **System level requirements for All portals – Google Docs.pdf:** shared accessibility, responsive forms, privacy and service boundaries.
- **PRD____IAM global 1-08-26.pdf** and **swagger.json:** identity service scope. Swagger contains authentication, users and providers; it does not supply job search, candidate profile, applications, files or analytics endpoints.

## What was missing and what changed

| Page      | Gap in the existing preview                                                                | Change                                                                                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Landing   | Limited quick filters; no access to the full filter set; department and industry conflated | Shared advanced filters, separate department/industry selectors, URL handoff and client search state                                                                              |
| Discovery | Filters immediately changed results                                                        | Draft selections apply on explicit Search; changed-filter notice; URL restoration and saved searches retain the expanded options                                                  |
| Discovery | Free-text location only                                                                    | Country → state → city selection, partial parent checks, expand/collapse controls, flattened city IDs and optional radius from one city                                           |
| Discovery | Remote conflated with worldwide eligibility                                                | Separate worldwide-remote toggle; restricted remote roles remain distinct                                                                                                         |
| Discovery | Only four employment types; incomplete experience options                                  | Full-time, part-time, contract, internship, freelance, consultant, gig, advisory, board member, volunteering and others; Lead/Executive levels; numeric minimum and maximum years |
| Discovery | Missing hiring logistics                                                                   | All seven notice intervals, relocation options, exact/maximum interview rounds                                                                                                    |
| Discovery | No freshness/tier/method filters                                                           | 1/3/7/9/15/30-day intervals; separate Free/Premium tiers and Easy apply/External/Email methods; 30-day maximum freshness; applied and explicitly unlisted jobs excluded           |
| Discovery | Missing company and skill controls                                                         | Industry, company size, benefits, designation selection and searchable skill multi-select                                                                                         |
| Discovery | Salary minimum only, matching the same source currency                                     | Annual min/max range, INR-normalized comparisons, INR/USD/GBP/EUR viewing currency, highest-salary sorting across currencies                                                      |
| Discovery | Recommended default with no salary sort                                                    | Newest default, most relevant (text relevance), highest salary and title A–Z. Sort changes also apply on Search                                                                   |
| Discovery | No match-score state                                                                       | Disabled match-score control explaining the AI-payload dependency; no invented match percentages                                                                                  |
| Detail    | Missing notice, relocation, numeric experience and interview count                         | Role facts match the fixture metadata; interview-step count follows the role; currency selector and location eligibility shown                                                    |
| Detail    | Apply button appeared before the description                                               | Apply action moved to the end, as requested by the UI notes                                                                                                                       |
| Detail    | Incomplete application context/analytics                                                   | Profile-prefilled location, notice, expected compensation, experience and résumé selection; tier-aware analytics; external/email preview cannot create an Easy apply record       |
| Profile   | Incomplete identity/contact/preferences                                                    | Phone, handle, optional gender/pronouns, social links, numeric experience, target role IDs, employment types, location tree, remote eligibility and relocation                    |
| Profile   | Free-text expected pay only                                                                | Numeric current/expected annual salary, currency, optional hourly rate and separate privacy preferences; legacy expected-pay text preserved until preferences are saved           |
| Profile   | Missing notice options and serving-notice state                                            | Immediate/15/30/45/60/90/>90 days; last-working-date field for candidates serving notice                                                                                          |
| Profile   | Hardcoded career history/education; no language or authorization fields                    | Editable repeatable entries, month/year career dates, promotion tag, language proficiency, work authorization country/type/validity; changed verified entries return to pending   |
| Profile   | About capped at 1,500; skill list lacked collapse                                          | 2,000-character about field with update date; expandable skills; removed the arbitrary 16-skill truncation                                                                        |
| Profile   | Sample text résumé only                                                                    | PDF/DOCX selection up to 5 MB, PDF opening and file download for the session; public/applications-only choice retained                                                            |
| Profile   | Application count substituted for résumé downloads; private-only analytics                 | Seven-day profile/resumé/download chart with an accessible data table; public sample insights; application history and preferences remain owner-only                              |

## Conflicts that need a product decision

No new instruction resolving these conflicts was received during this change. The existing privacy and Free-listing behaviour is preserved.

1. **Free visibility:** manual p. 24 says Free jobs are unlisted; the manual's own filter table and UI screens include Free jobs. The preview still includes Free listings. Any record explicitly marked `unlisted` is excluded. Do not infer the production visibility policy from the sample fixtures.
2. **Salary/contact privacy:** manual pp. 11–13 makes expected salary and contact public; UI notes pp. 11–12 allow them to be hidden. Existing private choices remain private. Current salary, expected salary, hourly rate, contact and résumé have separate controls.
3. **Experience:** manual p. 6 calls for a minimum-years constraint; UI p. 5 asks for maximum experience. Both are exposed with explicit labels and range validation.
4. **Listing category:** manual p. 6 groups Free/Premium/External; UI p. 5 says there are only two tiers. Tier and application method are separate controls.
5. **Employment and relocation enums:** the manual's filter table and job-post form differ. The preview exposes the union, using consistent labels. Backend enum mapping must be agreed before integration.
6. **Dates and sorts:** the manual prescribes 1/3/9/15/30 days, while UI p. 4 also includes 7 days. All are available. Newest follows manual p. 22; text relevance and alphabetical ordering remain available.

## Integration work still needed

- Replace the fictional jobs, metadata IDs and five-city location sample with the real job service and versioned metadata artifacts. IndexedDB metadata synchronisation is not implemented here.
- Replace illustrative currency rates (`INR=1, USD=85, GBP=110, EUR=95`) with the daily rates artifact. These are **not live exchange rates**. Salary matching currently uses overlapping advertised ranges; the backend contract must settle exact ceiling/range semantics.
- Perform hidden-salary matching and ordering on the server, stripping hidden amounts from returned data. The UI renders “Competitive”; local salary-range searches cannot match records whose amounts are absent. No hidden salary values are sent to this preview.
- Connect AI-provider payloads before enabling match filters or above-70% application metrics.
- Connect job/profile persistence, real application records, valid external/email application destinations and real analytics. Counts and verification metadata shown today are samples.
- Connect résumé storage, server-side file validation, protected retrieval and shareable file URLs. The selected file is held in memory for this browser session; it is not uploaded or persisted on refresh.
- Validate handle uniqueness/reserved names on the server and implement real profile URLs. The handle field does not create a live profile route.
- Enforce field-level privacy and authorization server-side. Public preview is a design demonstration, not an access-control boundary for production data.

## Further UI requirements outside this touch-up

The docs also describe profile photo editing, named skill groups with drag-and-drop, verification request/approval workflows, company management, job posting/billing and recruiter applicant grids. These are not implemented by this four-page field/filter pass. Flat skills remain editable and expandable; actual verification requests are not sent.

## Verification

- `npm run test:portal`: 15 focused tests covering URL round trips and invalid input, AND/OR logic, worldwide eligibility, city/radius rules, converted salary ranges, hidden values, zero-valued experience/rounds, logistics, freshness/applied exclusions, sorting, separate tiers/methods, draft isolation and profile migration/validation.
- `npm run check:portal`: zero errors and warnings.
- `npm run build`: passes with the pre-existing SvelteKit/Svelte 4 export warnings; Vercel adapter completes.
- HTTP checks: all four pages and representative filtered/public-profile variants return 200; public analytics do not render application history or private preferences.
- Visual browser verification for this pass was blocked by the browser URL policy. Responsive CSS and existing modal behaviour are retained, but this pass has not had a fresh interactive desktop/mobile review.

## Suggested team review

1. On `/`, open **All filters** and try a notice-period/location combination.
2. On `/jobs`, change filters and confirm results stay put until Search. Try maximum experience `0`, worldwide remote, and salary in another currency. Save and reopen the search.
3. On a detail page, inspect hiring facts and scroll to Apply; check the prefilled preview application.
4. On `/profile`, edit identity, preferences and career history. Test serving notice and upload a small sample PDF. Use public preview to check privacy choices and the analytics tab.
