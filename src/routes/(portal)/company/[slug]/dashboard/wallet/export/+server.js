import { error } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';
import { client_headers } from '$lib/server/request_context.js';
import { read_session_id } from '$lib/server/session_cookie.js';

// Company wallet CSV download ("View Full Transaction History"). The backend
// checks the session is a current admin of the company.
export async function GET({ params, cookies }) {
    const session_id = read_session_id(cookies);
    if (!session_id) error(401, 'Sign in to download transactions.');
    let response;
    try {
        response = await fetch(backend_url(`/companies/${encodeURIComponent(params.slug)}/wallet?format=csv`), {
            headers: { ...client_headers(), Cookie: 'jp_session=' + session_id },
            signal: AbortSignal.timeout(30000)
        });
    } catch {
        error(502, 'The service is unavailable. Try again shortly.');
    }
    if (!response.ok) error(response.status, response.status === 403 ? 'Only company admins can download transactions.' : 'Could not download transactions.');
    return new Response(response.body, {
        headers: {
            'content-type': 'text/csv; charset=utf-8',
            'content-disposition': response.headers.get('content-disposition') ?? 'attachment; filename="wallet.csv"',
            'cache-control': 'private, no-store'
        }
    });
}
