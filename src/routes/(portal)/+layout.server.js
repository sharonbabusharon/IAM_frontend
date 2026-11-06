import { redirect } from "@sveltejs/kit";
import { current_user, api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";
import { consent_open_paths } from "$lib/portal/legal_documents.js";

// Signed-in user for the header; null when signed out or the backend is down.
// The consent gate: a signed-in user who hasn't accepted the current legal
// documents goes to /consent first (the backend refuses their API calls too).
export async function load({ cookies, url }) {
  const session_id = read_session_id(cookies);
  if (!session_id) return { user: null, companies: [] };
  const [result, consents] = await Promise.all([
    current_user(session_id),
    api_request("/consents/required", { session_id }),
  ]);
  const ok = result.ok && result.data;
  if (ok && consents.ok && consents.data?.length && !consent_open_paths.includes(url.pathname))
    redirect(303, `/consent?next=${encodeURIComponent(url.pathname + url.search)}`);
  return {
    user: ok ? result.data.user : null,
    // Companies the user belongs to (admins first), for "My company".
    companies: ok ? result.data.authorization?.companies ?? [] : [],
  };
}
