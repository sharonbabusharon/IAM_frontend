import { json } from '@sveltejs/kit';
import { end_session } from '$lib/server/backend_api.js';
import { read_session_id, clear_session_cookie } from '$lib/server/session_cookie.js';

export async function POST({ cookies }) {
    const session_id = read_session_id(cookies);
    clear_session_cookie(cookies);
    if (session_id) {
        // Ends the backend session and revokes the IAM session behind it.
        const result = await end_session(session_id);
        if (!result.ok) return json({ status: 'error' }, { status: 502 });
    }
    return json({ status: 'ok' });
}
