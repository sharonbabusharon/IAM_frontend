import { env } from '$env/dynamic/private';

// The findJobs backend owns the session: it redeems IAM's login code, keeps
// the IAM tokens server-side and hands back only an opaque session ID.
const api_base = (env.BACKEND_URL || 'http://localhost:8081').replace(/\/+$/, '') + '/api/v1';
const base_url = api_base + '/auth';

// Full backend URL for a path under /api/v1 (path starts with '/').
export const backend_url = (path) => api_base + path;

async function backend_request(path, { method = 'GET', session_id = null, body } = {}) {
    const headers = {};
    if (session_id) headers.Cookie = 'jp_session=' + session_id;
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    try {
        const response = await fetch(base_url + path, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: AbortSignal.timeout(12000)
        });
        let data = null;
        try {
            data = await response.json();
        } catch (error) {
            data = null;
        }
        const session_cookie = response.headers.getSetCookie().find((c) => c.startsWith('jp_session='));
        return {
            ok: response.ok,
            status: response.status,
            data: data && data.data,
            session_id: session_cookie ? session_cookie.split(';')[0].slice('jp_session='.length) : null
        };
    } catch (error) {
        return { ok: false, status: 0, data: null, session_id: null };
    }
}

export const create_session = (code) => backend_request('/session', { method: 'POST', body: { code } });
export const current_user = (session_id) => backend_request('/me', { session_id });
export const end_session = (session_id) => backend_request('/logout', { method: 'POST', session_id });

// Current IAM access token for this session (refreshed by the backend when
// expired), used server-side only to call IAM's admin API as this user.
export async function iam_access_token(session_id) {
    if (!session_id) return null;
    const result = await backend_request('/token', { session_id });
    return result.ok && result.data ? result.data.access_token : null;
}

// Generic call to the backend under /api/v1 as the session's user. body is
// JSON-encoded unless raw is given ({ data, type }) for image uploads.
// Returns { ok, status, data, error } with the envelope unwrapped.
export async function api_request(path, { method = 'GET', session_id = null, body, raw } = {}) {
    const headers = {};
    if (session_id) headers.Cookie = 'jp_session=' + session_id;
    let payload;
    if (raw) {
        headers['Content-Type'] = raw.type;
        payload = raw.data;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
    }
    try {
        const response = await fetch(backend_url(path), {
            method,
            headers,
            body: payload,
            signal: AbortSignal.timeout(15000)
        });
        const envelope = await response.json().catch(() => null);
        return {
            ok: response.ok,
            status: response.status,
            data: envelope?.data ?? null,
            error: envelope?.error ?? (response.ok ? null : 'Something went wrong. Try again.')
        };
    } catch {
        return { ok: false, status: 502, data: null, error: 'The service is unavailable. Try again shortly.' };
    }
}
