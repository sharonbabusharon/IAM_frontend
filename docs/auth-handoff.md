# Authentication UI

Updated 2 October 2026. JavaScript and CSS, using the approved cobalt/navy/lime palette, local fonts, arch motif and existing companion illustrations.

## Pages

| Route | Purpose |
| --- | --- |
| `/login` | Email/password sign-in, all 11 existing SSO providers, error and loading states |
| `/signup` | Full name, email, password and confirmation; SSO registration through the existing provider flow |
| `/auth/check-email` | Confirmation instructions after an IAM `202` response; neutral instructions on a direct visit |
| `/auth/help` | Password recovery, missing verification email, provider and account help |
| `/signin`, `/register` | Server redirects to `/login` and `/signup` |

The existing callback, session and logout routes remain in place. Successful password sign-in or immediately confirmed registration leads to the existing `/account` page, matching the SSO callback. The sample `/profile` page remains a separate design preview.

## API behaviour

The supplied `swagger.json` documents `POST /signin` and `POST /signup`. The UI submits same-origin SvelteKit form actions, which forward the documented fields to IAM on the server. It does not implement a separate identity database or call Supabase directly.

- `/signin` receives `email` and `password`.
- `/signup` receives `email`, `full_name` and `password`. Confirmation is checked locally and server-side, then discarded.
- A `200` with a nonempty token sets the existing HttpOnly session cookie and redirects to `/account`.
- A signup `202` redirects to `/auth/check-email` without creating a session. A short-lived HttpOnly flag distinguishes this outcome from a direct visit; it contains no email address.
- A `401` shows the same message for an unknown account and a wrong password.
- `403`, `429`, malformed responses and unavailable services have recoverable error messages. Raw backend error text is not rendered.
- Password requests time out after 12 seconds. A same-origin check runs before processing credentials. Email/password forms also work without client JavaScript.
- Passwords and tokens are not returned in form failure data. Password fields clear after an enhanced submission. Existing cached account metadata is cleared before an authenticated redirect.
- Registration currently requires 8–1024 password characters; sign-in accepts existing passwords without imposing the new registration minimum. Confirm this UI minimum against the deployed IAM policy before launch.

## Deployment configuration

Set `PUBLIC_IAM_BASE_URL` to the actual HTTPS IAM service and `PUBLIC_IAM_APP_ID` to its registered application ID. SSO needs the frontend’s `/auth/callback` origin registered with IAM. Public variables contain configuration, not secrets.

In production, missing/invalid/non-HTTPS IAM configuration displays an honest connection message instead of sending the browser to localhost. Local development can use a loopback HTTP IAM server.

All 11 providers from the existing project remain available: Google, Microsoft, LinkedIn, Facebook, X, GitHub, GitLab, Discord, Twitch, Slack and Snapchat. Google and LinkedIn are prominent; the rest are under “More ways to continue”. Actual provider enablement is enforced by IAM. Apple is omitted as specified by the IAM PRD.

## Still requires backend/product support

- The supplied API has no password-reset, reset-token exchange or resend-verification endpoint. The help and confirmation pages explain this; no fake “email sent” state or unusable reset form was added.
- No live provider consent flow or real account creation was performed for this delivery. A configured, deployed IAM service is needed for end-to-end testing.
- Approved Terms/Privacy URLs and any required consent-recording contract are not supplied. The old links that incorrectly sent users to the home page were removed; approved legal destinations can be connected when provided.
- Session refresh, global session management and application-specific authorization remain the existing IAM integration’s responsibility. They are outside this auth UI pass.

## Verification

- `npm run test:auth`: eight validation/response tests plus one route integration test with a local mock IAM service. Covers rendered pages, aliases, validation, password non-disclosure, `200`/`202`/`401`, cookie attributes and cross-origin rejection. Creates no real accounts.
- `npm run test:portal`: the existing 15 portal tests.
- `npm run check:portal`: includes the new auth components and route files.
- `npm run build`: Vercel adapter production build; the pre-existing SvelteKit/Svelte 4 export warnings remain.
- Browser review: desktop sign-in/registration, mobile registration, 320px help layout, provider expansion, password visibility, mismatched-password validation and confirmation/help navigation.

Preview screenshots are in the local `output/auth-pages` folder and are not committed.
