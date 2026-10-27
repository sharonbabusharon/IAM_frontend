import { current_user } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Signed-in user for the header; null when signed out or the backend is down.
export async function load({ cookies }) {
  const session_id = read_session_id(cookies);
  if (!session_id) return { user: null, companies: [] };
  const result = await current_user(session_id);
  const ok = result.ok && result.data;
  return {
    user: ok ? result.data.user : null,
    // Companies the user belongs to (admins first), for "My company".
    companies: ok ? result.data.authorization?.companies ?? [] : [],
  };
}
