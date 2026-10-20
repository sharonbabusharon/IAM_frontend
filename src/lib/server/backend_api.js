import { env } from '$env/dynamic/private';

// The findJobs backend owns the session: it redeems IAM's login code, keeps
// the IAM tokens server-side and hands back only an opaque session ID.
const base_url = (env.BACKEND_URL || 'http://localhost:8081').replace(/\/+$/, '') + '/api/v1/auth';

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
