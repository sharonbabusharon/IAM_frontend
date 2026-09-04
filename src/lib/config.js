import { env } from '$env/dynamic/public';

function trim_trailing_slash(value) {
    return (value || '').replace(/\/+$/, '');
}

export const iam_base_url = trim_trailing_slash(env.PUBLIC_IAM_BASE_URL) || 'http://localhost:8080';
export const iam_app_id = env.PUBLIC_IAM_APP_ID || 'iam';
export const app_brand = env.PUBLIC_APP_BRAND || 'Referise';

export function build_sso_login_url(provider_slug, return_to) {
    const params = new URLSearchParams({
        provider: provider_slug,
        app_id: iam_app_id,
        return_to: return_to
    });
    return iam_base_url + '/login?' + params.toString();
}
