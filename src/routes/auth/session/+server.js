import { json } from '@sveltejs/kit';
import { current_user } from '$lib/server/backend_api.js';
import { read_session_id, clear_session_cookie } from '$lib/server/session_cookie.js';

export async function GET({ cookies, setHeaders: set_headers }) {
    set_headers({ 'cache-control': 'no-store' });
    const session_id = read_session_id(cookies);
    if (!session_id) {
        return json({ authenticated: false });
    }
    const result = await current_user(session_id);
    if (result.status === 401) {
        clear_session_cookie(cookies);
        return json({ authenticated: false });
    }
    if (!result.ok || !result.data) {
        return json({ authenticated: false, error: 'backend_unavailable' }, { status: 503 });
    }
    const { user, expires_at } = result.data;
    return json({
        authenticated: true,
        user: {
            ecosystem_id: user.iam_user_id,
            email: user.email,
            name: user.name,
            status: user.status,
            expires_at: expires_at
        }
    });
}
