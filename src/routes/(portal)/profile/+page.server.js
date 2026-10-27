import { error, redirect } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Your own profile, loaded on the server. Before the first save the backend
// returns a starter built from your account (saved: false).
export async function load({ cookies }) {
  const session_id = read_session_id(cookies);
  const to_login = "/login?next=%2Fprofile";
  if (!session_id) redirect(303, to_login);
  const result = await api_request("/profile/me", { session_id });
  if (result.status === 401) redirect(303, to_login);
  if (!result.ok) error(502, "Your profile is unavailable right now.");
  return { profile: result.data };
}
