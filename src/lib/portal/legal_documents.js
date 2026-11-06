// Titles and pages for the legal documents the backend asks users to accept
// (LEGAL_DOCUMENTS ids). An id missing here still shows, under its own name.
export const legal_documents = {
  terms: { title: "Terms & conditions", href: "/terms" },
  privacy: { title: "Privacy policy", href: "/privacy" },
  cookies: { title: "Cookie policy", href: "/cookies" },
};

// Pages a user who hasn't accepted yet can still open: the consent page and
// the documents themselves.
export const consent_open_paths = ["/consent", ...Object.values(legal_documents).map((d) => d.href)];

/** A same-site path to return to after consenting; anything else goes home. */
export function safe_next(next) {
  // A path on this site: "/x", never "//host" or "/\host" (both leave the site).
  const ok = typeof next === "string" && next.startsWith("/") && next[1] !== "/" && next[1] !== String.fromCharCode(92);
  return ok ? next : "/";
}
