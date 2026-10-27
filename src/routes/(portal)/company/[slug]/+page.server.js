import { error } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";

// Public company page, rendered on the server (SEO, manual: viewable without
// an account). The session, when present, adds the viewer's role.
export async function load({ params, cookies }) {
  if (!/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(params.slug)) error(404, "We couldn’t find this company.");
  const result = await api_request("/companies/" + params.slug, {
    session_id: read_session_id(cookies),
  });
  // A real 404 (not a 200 "not found" page), so search engines drop it.
  if (result.status === 404) error(404, "We couldn’t find this company.");
  if (!result.ok) error(502, "Company pages are unavailable right now.");
  return { company: result.data };
}
