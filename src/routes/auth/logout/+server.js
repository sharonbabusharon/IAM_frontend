import { json } from '@sveltejs/kit';
import { clear_session_cookie } from '$lib/server/session_cookie.js';

export function POST({ cookies }) {
    clear_session_cookie(cookies);
    return json({ status: 'ok' });
}
