import { error } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Job details, rendered on the server. The backend applies visibility: free
// jobs only through their share link; closed/expired jobs only for their team.
export async function load({ params, cookies }) {
  if (!/^[a-z0-9][a-z0-9-]{1,148}$/.test(params.slug)) error(404, "This opportunity could not be found.");
  const result = await api_request("/jobs/" + params.slug, { session_id: read_session_id(cookies) });
  if (result.status === 404) error(404, "This opportunity could not be found.");
  if (!result.ok) error(502, "Jobs are unavailable right now.");
  // Manual: a recruiter sidebar with their other open roles (best effort).
  const recruiter = result.data.recruiter
    ? await api_request("/recruiters/" + result.data.recruiter.id, {})
    : null;
  return { job: result.data, recruiter: recruiter?.ok ? recruiter.data : null };
}
