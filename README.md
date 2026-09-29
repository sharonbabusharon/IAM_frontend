# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
npx sv@0.17.0 create --template minimal --no-types --install npm W:/Sarversh/iam_frontend
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Deploying to Vercel

The project uses `@sveltejs/adapter-vercel` in `svelte.config.js`. Vite uses the
existing SvelteKit plugin; no extra Vite settings or redirect rules are needed.

1. Push the changes to GitHub and import the repository into Vercel.
2. Use these project settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | SvelteKit |
   | Root directory | Repository root (`.`) |
   | Install command | `npm ci` |
   | Build command | `npm run build` |
   | Output directory | Leave the framework default; do not set `dist` |
   | Node.js version | 22.x |

3. Deploy, then check `/`, `/jobs`, `/jobs/senior-product-designer`, and `/profile`
   on the deployment URL, including opening each route directly.

The four portal pages use sample data and can be reviewed without an IAM backend.
Saved jobs and profile edits stay in the current browser.

For the existing IAM login and admin pages, set these environment variables in
Vercel before deploying:

- `PUBLIC_IAM_BASE_URL`: the deployed IAM backend's HTTPS URL, not localhost.
- `PUBLIC_IAM_APP_ID`: `iam`, or the app ID registered with your backend.
- `PUBLIC_APP_BRAND`: `Referise`.

Configure the IAM backend to allow the deployed frontend origin and any required
SSO return URLs. Variables prefixed with `PUBLIC_` are visible in the browser;
use them only for public configuration.

Reference: [SvelteKit's Vercel adapter](https://svelte.dev/docs/kit/adapter-vercel).
