import { error } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';

const file_pattern = /^(skills|designations|locations|rates)-\d{8}T\d{6}Z-[0-9a-f]{8}\.json$/;

// One published reference file. Names carry a timestamp and content hash, so
// the backend marks them immutable and Cloudflare can serve them from the edge.
export async function GET({ params, request }) {
    if (!file_pattern.test(params.file)) error(404, 'Not found');
    let response;
    try {
        response = await fetch(backend_url('/assets/' + params.file), {
            headers: { 'if-none-match': request.headers.get('if-none-match') || '' },
            signal: AbortSignal.timeout(20000)
        });
    } catch {
        error(502, 'Reference data unavailable');
    }
    if (response.status === 404) error(404, 'Not found');
    if (!response.ok && response.status !== 304) error(502, 'Reference data unavailable');
    const headers = {};
    for (const name of ['content-type', 'cache-control', 'etag']) {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
    }
    return new Response(response.body, { status: response.status, headers });
}
