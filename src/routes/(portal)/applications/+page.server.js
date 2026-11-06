import { error, redirect } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Your applications, newest first, with the stage the hiring team set.
export async function load({ cookies }) {
  const session_id = read_session_id(cookies);
  const to_login = "/login?next=%2Fapplications";
  if (!session_id) redirect(303, to_login);
  const result = await api_request("/applications", { session_id });
  if (result.status === 401) redirect(303, to_login);
  if (!result.ok) error(502, "Your applications are unavailable right now.");
  return { applications: result.data };
}
