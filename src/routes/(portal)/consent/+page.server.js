import { fail, redirect } from "@sveltejs/kit";
import { api_request } from "$lib/server/backend_api.js";
import { read_session_id } from "$lib/server/session_cookie.js";
import { safe_next } from "$lib/portal/legal_documents.js";

async function required(session_id) {
  const result = await api_request("/consents/required", { session_id });
  return result.ok ? result.data ?? [] : null;
}

// The documents you still have to accept; nothing left sends you on.
export async function load({ cookies, url }) {
  const session_id = read_session_id(cookies);
  const next = safe_next(url.searchParams.get("next"));
  if (!session_id) redirect(303, `/login?next=${encodeURIComponent("/consent?next=" + next)}`);
  const documents = await required(session_id);
  if (documents && !documents.length) redirect(303, next);
  return { documents: documents ?? [], unavailable: !documents, next };
}

export const actions = {
  // Accepts every pending document, each at the version the server lists now.
  default: async ({ cookies, request, url }) => {
    const session_id = read_session_id(cookies);
    if (!session_id) redirect(303, "/login?next=%2Fconsent");
    const form = await request.formData();
    const documents = await required(session_id);
    if (!documents) return fail(502, { error: "The service is unavailable. Try again shortly." });
    if (documents.some((d) => form.get(`accept_${d.doc_id}`) !== "on"))
      return fail(400, { error: "Tick each document to accept it." });
    for (const d of documents) {
      const result = await api_request("/consents", {
        method: "POST",
        session_id,
        body: { doc_id: d.doc_id, version: d.version },
      });
      if (!result.ok) return fail(result.status || 502, { error: result.error || "Something went wrong. Try again." });
    }
    redirect(303, safe_next(url.searchParams.get("next")));
  },
};
