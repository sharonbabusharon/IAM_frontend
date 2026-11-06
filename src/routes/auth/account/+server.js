import { json } from '@sveltejs/kit';
import { api_request } from '$lib/server/backend_api.js';
import { read_session_id, clear_session_cookie } from '$lib/server/session_cookie.js';

// Deletes your Referise account (backend: data deleted or anonymised, every
// session ended and revoked at IAM; the IAM identity is kept), then drops
// this browser's session cookie. 409 when you're a company's only admin.
export async function DELETE({ cookies }) {
    const session_id = read_session_id(cookies);
    if (!session_id) return json({ ok: false, error: 'Sign in first.' }, { status: 401 });
    const result = await api_request('/account', { method: 'DELETE', session_id });
    if (result.ok || result.status === 401) clear_session_cookie(cookies);
    return json(result, { status: result.status || 502, headers: { 'cache-control': 'no-store' } });
}
