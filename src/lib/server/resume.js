import { error } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';
import { client_headers } from '$lib/server/request_context.js';
import { read_session_id } from '$lib/server/session_cookie.js';

// Streams a résumé from the backend (path under /api/v1) with its type and
// Content-Disposition. The backend decides who may read it; a refusal is a 404.
export async function stream_resume(path, { url, cookies }) {
    const query = new URLSearchParams();
    if (url.searchParams.get('mode') === 'download') query.set('mode', 'download');
    if (url.searchParams.get('src') === 'search') query.set('src', 'search');
    const session_id = read_session_id(cookies);
    let response;
    try {
        response = await fetch(backend_url(path + (query.size ? '?' + query : '')), {
            headers: { ...client_headers(), ...(session_id && { Cookie: 'jp_session=' + session_id }) },
            signal: AbortSignal.timeout(30000)
        });
    } catch {
        error(502, 'The service is unavailable. Try again shortly.');
    }
    if (response.status === 404) error(404, 'This résumé isn’t available.');
    if (response.status === 401) error(401, 'Sign in to see this résumé.');
    if (!response.ok) error(502, 'Could not load the résumé.');
    return new Response(response.body, {
        headers: {
            'content-type': response.headers.get('content-type') ?? 'application/octet-stream',
            'content-disposition': response.headers.get('content-disposition') ?? 'attachment',
            'cache-control': 'private, no-store',
            'x-content-type-options': 'nosniff'
        }
    });
}
