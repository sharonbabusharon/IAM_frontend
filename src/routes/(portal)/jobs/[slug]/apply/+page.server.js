import { error, redirect } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Easy Apply review: the job, the profile that will be shared, and today's
// free applications. Applying needs an account (manual: "Candidates must
// register/login").
export async function load({ params, cookies }) {
  if (!/^[a-z0-9][a-z0-9-]{1,148}$/.test(params.slug)) error(404, "This opportunity could not be found.");
  const session_id = read_session_id(cookies);
  const to_login = "/login?next=" + encodeURIComponent(`/jobs/${params.slug}/apply`);
  if (!session_id) redirect(303, to_login);
  const [job, profile, quota] = await Promise.all([
    api_request("/jobs/" + params.slug, { session_id }),
    api_request("/profile/me", { session_id }),
    api_request("/applications/quota", { session_id }),
  ]);
  if (profile.status === 401) redirect(303, to_login);
  if (job.status === 404) error(404, "This opportunity could not be found.");
  if (!job.ok || !profile.ok) error(502, "Applications are unavailable right now.");
  return { job: job.data, profile: profile.data, quota: quota.ok ? quota.data : null };
}
