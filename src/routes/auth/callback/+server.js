import { redirect } from '@sveltejs/kit';
import { create_session } from '$lib/server/backend_api.js';
import { set_session_cookie } from '$lib/server/session_cookie.js';
import { safe_next } from '$lib/safe_next.js';

export async function GET({ url, cookies }) {
    // IAM sends ?error= instead of ?code= when sign-in fails (cancelled, suspended, ...).
    const iam_error = url.searchParams.get('error');
    if (iam_error) {
        throw redirect(303, '/login?error=' + encodeURIComponent(iam_error));
    }
    const code = url.searchParams.get('code');
    if (!code) {
        throw redirect(303, '/login?error=missing_code');
    }

    const result = await create_session(code);
    if (!result.ok || !result.session_id) {
        throw redirect(303, '/login?error=' + (result.status === 0 ? 'iam_unreachable' : 'login_failed'));
    }

    set_session_cookie(cookies, result.session_id);
    // Back to the page sign-in started from (IAM PRD §14.7), else the Referise profile.
    throw redirect(303, safe_next(url.searchParams.get('next')));
}
