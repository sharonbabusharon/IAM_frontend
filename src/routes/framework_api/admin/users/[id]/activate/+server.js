import { json } from '@sveltejs/kit';
import { read_token } from '$lib/server/session_cookie.js';
import { admin_activate_user } from '$lib/server/iam_api.js';

export async function POST({ params, cookies }) {
    const token = read_token(cookies);
    if (!token) {
        return json({ error: 'missing_bearer_token' }, { status: 401 });
    }

    const result = await admin_activate_user(token, params.id);
    return json(result.data || { error: 'internal_error' }, { status: result.status || 500 });
}
