import { current_user } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Signed-in user for the header; null when signed out or the backend is down.
export async function load({ cookies }) {
  const session_id = read_session_id(cookies);
  if (!session_id) return { user: null };
  const result = await current_user(session_id);
  return { user: result.ok && result.data ? result.data.user : null };
}
