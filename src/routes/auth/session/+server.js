import { json } from '@sveltejs/kit';
import { read_token, build_session_user } from '$lib/server/session_cookie.js';

export function GET({ cookies }) {
    const token = read_token(cookies);
    if (!token) {
        return json({ authenticated: false });
    }
    return json({ authenticated: true, user: build_session_user(token) });
}
