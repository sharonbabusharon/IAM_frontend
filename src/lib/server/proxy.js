import { json } from '@sveltejs/kit';
import { api_request } from '$lib/server/backend_api.js';
import { read_session_id } from '$lib/server/session_cookie.js';

const image_types = ['image/jpeg', 'image/png', 'image/webp'];

// Builds a browser -> backend proxy for /api/v1/<prefix>/<path>. Only the
// listed path shapes and methods are forwarded; the backend still checks the
// session and permissions. routes: [{ pattern, methods, query?, image? }].
export function make_proxy(prefix, routes) {
    async function forward({ params, request, url, cookies }) {
        const path = params.path ?? '';
        const route = routes.find((r) => r.pattern.test(path));
        if (!route || !route.methods.includes(request.method)) return json({ error: 'not_found' }, { status: 404 });

        const query = new URLSearchParams();
        for (const key of route.query ?? []) {
            const value = url.searchParams.get(key);
            if (value) query.set(key, value);
        }
        const type = (request.headers.get('content-type') || '').split(';')[0].trim();
        const options = { method: request.method, session_id: read_session_id(cookies) };
        if (route.image) {
            if (!image_types.includes(type)) return json({ error: 'Upload a JPEG, PNG or WebP image.' }, { status: 415 });
            options.raw = { type, data: await request.arrayBuffer() };
        } else if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
            const text = await request.text();
            if (text) {
                if (type !== 'application/json') return json({ error: 'json_required' }, { status: 415 });
                try {
                    options.body = JSON.parse(text);
                } catch {
                    return json({ error: 'invalid_json' }, { status: 400 });
                }
            }
        }
        const result = await api_request(`/${prefix}${path ? '/' + path : ''}${query.size ? '?' + query : ''}`, options);
        return json(result, { status: result.status, headers: { 'cache-control': 'no-store' } });
    }
    return { GET: forward, POST: forward, PUT: forward, PATCH: forward, DELETE: forward };
}

// Shared id shapes for route patterns.
export const slug = '[a-z0-9][a-z0-9-]{1,58}[a-z0-9]';
export const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
// New jobs use uuids; the sample jobs use slug ids.
export const job_id = `(?:${uuid}|[a-z0-9][a-z0-9-]{1,148})`;
