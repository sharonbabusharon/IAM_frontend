import { json } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';
import { read_session_id } from '$lib/server/session_cookie.js';

// Proxies the findJobs platform-admin endpoints. Only these paths and methods
// are forwarded; the backend still enforces PLATFORM_ADMIN_IDS on every call.
const routes = [
    { pattern: /^taxonomy\/(skill|designation)$/, methods: ['GET'] },
    { pattern: /^taxonomy\/(skill|designation)\/merge$/, methods: ['POST'] },
    { pattern: /^taxonomy\/(skill|designation)\/[1-9][0-9]{0,17}$/, methods: ['PATCH', 'DELETE'] },
    { pattern: /^fx\/refresh$/, methods: ['POST'] },
    { pattern: /^settings$/, methods: ['GET', 'PUT'] }
];
const query_keys = ['status', 'page', 'page_size'];

async function forward({ params, request, url, cookies }) {
    const route = routes.find((r) => r.pattern.test(params.path));
    if (!route || !route.methods.includes(request.method)) {
        return json({ error: 'not_found' }, { status: 404 });
    }
    const session_id = read_session_id(cookies);
    if (!session_id) return json({ error: 'not_authenticated' }, { status: 401 });

    const query = new URLSearchParams();
    for (const key of query_keys) {
        const value = url.searchParams.get(key);
        if (value) query.set(key, value);
    }
    const headers = { Cookie: 'jp_session=' + session_id };
    let body;
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
        const text = await request.text();
        if (text && !(request.headers.get('content-type') || '').startsWith('application/json')) {
            return json({ error: 'json_required' }, { status: 415 });
        }
        if (text) {
            headers['Content-Type'] = 'application/json';
            body = text;
        }
    }
    try {
        const response = await fetch(backend_url('/admin/' + params.path) + (query.size ? '?' + query : ''), {
            method: request.method,
            headers,
            body,
            signal: AbortSignal.timeout(15000)
        });
        const result = await response.json().catch(() => null);
        return json(result ?? { error: 'internal_error' }, {
            status: response.status,
            headers: { 'cache-control': 'no-store' }
        });
    } catch {
        return json({ error: 'backend_unreachable' }, { status: 502 });
    }
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
