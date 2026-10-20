import { dev } from '$app/environment';
import { iam_access_token } from './backend_api.js';

// Holds only the opaque findJobs session ID; IAM tokens never reach the browser.
// Outside dev the __Host- prefix makes the browser insist on Secure, Path=/
// and no Domain, so a sibling subdomain can't plant or overwrite the cookie.
// Plain http://localhost dev keeps the unprefixed name. (The SvelteKit ->
// backend hop always uses the backend's own `jp_session`; see backend_api.js.)
const cookie_name = dev ? 'jp_session' : '__Host-jp_session';

export function set_session_cookie(cookies, session_id) {
    cookies.set(cookie_name, session_id, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: !dev,
        maxAge: 30 * 24 * 3600
    });
}

export function read_session_id(cookies) {
    return cookies.get(cookie_name) || null;
}

export function clear_session_cookie(cookies) {
    cookies.delete(cookie_name, { path: '/' });
}

// IAM access token for the admin proxy routes, or null when signed out.
export function read_token(cookies) {
    return iam_access_token(read_session_id(cookies));
}
