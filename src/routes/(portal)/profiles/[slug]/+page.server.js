import { error } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Someone's public profile (manual: "Publicly accessible via a unique URL
// slug"). The backend hides private profiles (404) and blanks private fields.
export async function load({ params, cookies }) {
  if (!/^[a-z0-9-]{3,50}$/.test(params.slug)) error(404, "This profile could not be found.");
  const [result, analytics] = await Promise.all([
    api_request("/profiles/" + params.slug, { session_id: read_session_id(cookies) }),
    api_request(`/profiles/${params.slug}/analytics`),
  ]);
  if (result.status === 404) error(404, "This profile is private or doesn’t exist.");
  if (!result.ok) error(502, "Profiles are unavailable right now.");
  return {
    profile: result.data,
    analytics: analytics.ok ? analytics.data : null,
    visitor: true,
    posted_jobs: [],
    applications: [],
  };
}
