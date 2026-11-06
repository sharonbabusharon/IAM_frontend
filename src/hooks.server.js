import { dev } from '$app/environment';
import { run_with_request } from '$lib/server/request_context.js';

// CSRF guard for the server routes that act with the user's session: any
// state-changing request must come from this site's own pages. Browsers always
// send Origin on cross-site POST/PUT/PATCH/DELETE, and pages can't forge it.
// (Defence in depth: the session cookie is also SameSite=Lax.)
const guarded = ['/framework_api/', '/auth/'];
const safe_methods = ['GET', 'HEAD', 'OPTIONS'];

// Security headers for every response (the Content-Security-Policy itself is
// in svelte.config.js, where SvelteKit can add nonces to its own scripts).
const security_headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'DENY',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    // Razorpay Checkout opens payment pop-ups (UPI, net banking).
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    ...(dev ? {} : { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' })
};

export async function handle({ event, resolve }) {
    const { request, url } = event;
    if (
        !safe_methods.includes(request.method) &&
        guarded.some((prefix) => url.pathname.startsWith(prefix)) &&
        request.headers.get('origin') !== url.origin
    ) {
        return new Response(JSON.stringify({ error: 'forbidden_origin' }), {
            status: 403,
            headers: { 'content-type': 'application/json', ...security_headers }
        });
    }
    // Backend calls made while serving this request carry the real client's
    // IP (rate limiting) and User-Agent (profile-view bot filter).
    const response = await run_with_request(
        { ip: event.getClientAddress(), user_agent: request.headers.get('user-agent') || '' },
        () => resolve(event)
    );
    for (const [name, value] of Object.entries(security_headers)) {
        if (!response.headers.has(name)) response.headers.set(name, value);
    }
    return response;
}
