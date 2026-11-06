import { api_request } from "$lib/server/backend_api.js";

// The landing page's platform counters (GET /stats, recomputed daily by the
// backend). On failure the page hides the section instead of showing zeros.
export async function load() {
  const stats = await api_request("/stats");
  return { stats: stats.ok ? stats.data : null };
}
