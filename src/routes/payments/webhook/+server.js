import { backend_url } from '$lib/server/backend_api.js';
import { client_headers } from '$lib/server/request_context.js';

// Razorpay's webhook. The backend isn't public, so this passes the call
// through: the raw body bytes and X-Razorpay-Signature unchanged, because the
// signature is an HMAC of those exact bytes. It sits outside /framework_api/
// on purpose: the Origin check in hooks.server.js would refuse Razorpay.
// The backend verifies the signature; nothing here trusts the request.
export async function POST({ request }) {
    const body = await request.arrayBuffer();
    if (body.byteLength > 1 << 20) return new Response(null, { status: 413 });
    try {
        const response = await fetch(backend_url('/payments/webhook'), {
            method: 'POST',
            headers: {
                ...client_headers(),
                'Content-Type': 'application/json',
                'X-Razorpay-Signature': request.headers.get('x-razorpay-signature') ?? ''
            },
            body,
            signal: AbortSignal.timeout(15000)
        });
        return new Response(null, { status: response.status });
    } catch {
        return new Response(null, { status: 502 }); // Razorpay retries
    }
}
