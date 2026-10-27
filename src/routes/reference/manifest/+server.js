import { json } from '@sveltejs/kit';
import { backend_url } from '$lib/server/backend_api.js';

// Which reference file is current per kind. Public and the same for everyone,
// so the backend's short public Cache-Control is passed through.
export async function GET() {
    try {
        const response = await fetch(backend_url('/assets/manifest'), { signal: AbortSignal.timeout(8000) });
        const body = await response.json().catch(() => null);
        if (!response.ok || !body?.data) return json({ error: 'reference_unavailable' }, { status: 502 });
        return json(body.data, {
            headers: { 'cache-control': response.headers.get('cache-control') || 'no-store' }
        });
    } catch {
        return json({ error: 'reference_unavailable' }, { status: 502 });
    }
}
