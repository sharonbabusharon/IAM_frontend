import { error } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";

// Public recruiter page (manual: the job page's [View Profile]). The card is
// rendered on the server; their open jobs load in the browser.
export async function load({ params }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(params.id))
    error(404, "We couldn’t find this recruiter.");
  const result = await api_request("/recruiters/" + params.id, {});
  if (result.status === 404) error(404, "We couldn’t find this recruiter.");
  if (!result.ok) error(502, "Recruiter pages are unavailable right now.");
  return { card: result.data };
}
