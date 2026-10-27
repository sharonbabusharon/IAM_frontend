import { error } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';

const name_pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// Uploaded public images (company logos and banners). Names are random and
// never reused, so the backend marks them immutable and Cloudflare caches them.
export async function GET({ params }) {
    if (!name_pattern.test(params.name)) error(404, 'Not found');
    let response;
    try {
        response = await fetch(backend_url('/files/img/' + params.name), { signal: AbortSignal.timeout(15000) });
    } catch {
        error(502, 'Image unavailable');
    }
    if (!response.ok) error(response.status === 404 ? 404 : 502, 'Not found');
    const headers = {};
    for (const name of ['content-type', 'cache-control', 'content-security-policy', 'x-content-type-options']) {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
    }
    return new Response(response.body, { headers });
}
