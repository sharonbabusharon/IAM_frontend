import { error } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// A job's direct link (manual: the only way to reach a free, unlisted job).
export async function load({ params, cookies }) {
  if (!/^[0-9a-f]{32}$/.test(params.hash)) error(404, "This opportunity could not be found.");
  const result = await api_request("/jobs/share/" + params.hash, { session_id: read_session_id(cookies) });
  if (result.status === 404) error(404, "This opportunity could not be found.");
  if (!result.ok) error(502, "Jobs are unavailable right now.");
  return { job: result.data };
}
