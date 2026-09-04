import { json } from '@sveltejs/kit';
import { read_token } from '$lib/server/session_cookie.js';
import { admin_set_provider } from '$lib/server/iam_api.js';

export async function PATCH({ params, request, cookies }) {
    const token = read_token(cookies);
    if (!token) {
        return json({ error: 'missing_bearer_token' }, { status: 401 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ error: 'invalid_request' }, { status: 400 });
    }

    const enabled = !!(body && body.enabled);
    const result = await admin_set_provider(token, params.name, enabled);
    return json(result.data || { error: 'internal_error' }, { status: result.status || 500 });
}
