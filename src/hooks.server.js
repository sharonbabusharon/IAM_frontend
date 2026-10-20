// CSRF guard for the server routes that act with the user's session: any
// state-changing request must come from this site's own pages. Browsers always
// send Origin on cross-site POST/PUT/PATCH/DELETE, and pages can't forge it.
// (Defence in depth: the session cookie is also SameSite=Lax.)
const guarded = ['/framework_api/', '/auth/'];
const safe_methods = ['GET', 'HEAD', 'OPTIONS'];

export async function handle({ event, resolve }) {
    const { request, url } = event;
    if (
        !safe_methods.includes(request.method) &&
        guarded.some((prefix) => url.pathname.startsWith(prefix)) &&
        request.headers.get('origin') !== url.origin
    ) {
        return new Response(JSON.stringify({ error: 'forbidden_origin' }), {
            status: 403,
            headers: { 'content-type': 'application/json' }
        });
    }
    return resolve(event);
}
