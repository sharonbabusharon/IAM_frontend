import { redirect } from '@sveltejs/kit';
import { exchange_code_for_token } from '$lib/server/iam_api.js';
import { set_session_cookie } from '$lib/server/session_cookie.js';

export async function GET({ url, cookies }) {
    const code = url.searchParams.get('code');
    if (!code) {
        throw redirect(303, '/login?error=missing_code');
    }

    const result = await exchange_code_for_token(code);
    if (!result.ok || !result.data || !result.data.access_token) {
        const error_code = (result.data && result.data.error) || 'login_failed';
        throw redirect(303, '/login?error=' + encodeURIComponent(error_code));
    }

    set_session_cookie(cookies, result.data.access_token, result.data.expires_at);
    throw redirect(303, '/account');
}
