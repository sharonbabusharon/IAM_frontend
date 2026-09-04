import { json } from '@sveltejs/kit';
import { read_token } from '$lib/server/session_cookie.js';
import { admin_list_users } from '$lib/server/iam_api.js';

export async function GET({ url, cookies }) {
    const token = read_token(cookies);
    if (!token) {
        return json({ error: 'missing_bearer_token' }, { status: 401 });
    }

    const params = new URLSearchParams();
    const query = url.searchParams.get('query');
    const status = url.searchParams.get('status');
    const limit = url.searchParams.get('limit');
    const offset = url.searchParams.get('offset');
    if (query) params.set('query', query);
    if (status) params.set('status', status);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const result = await admin_list_users(token, params);
    return json(result.data || { error: 'internal_error' }, { status: result.status || 500 });
}
