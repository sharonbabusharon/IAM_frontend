import { env } from '$env/dynamic/public';

const base_url = (env.PUBLIC_IAM_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const app_id = env.PUBLIC_IAM_APP_ID || 'iam';

export const iam_app_id = app_id;

async function read_json_safe(response) {
    try {
        return await response.json();
    } catch (error) {
        return null;
    }
}

async function iam_request(path, options = {}) {
    try {
        const response = await fetch(base_url + path, options);
        const data = await read_json_safe(response);
        return { ok: response.ok, status: response.status, data: data };
    } catch (error) {
        return { ok: false, status: 0, data: { error: 'iam_unreachable' } };
    }
}

function json_headers(extra) {
    return Object.assign({ 'Content-Type': 'application/json' }, extra || {});
}

function bearer_headers(token, extra) {
    return Object.assign({ Authorization: 'Bearer ' + token }, extra || {});
}

export function exchange_code_for_token(code) {
    return iam_request('/token', {
        method: 'POST',
        headers: json_headers(),
        body: JSON.stringify({ code: code, app_id: app_id })
    });
}

export function admin_list_users(token, search_params) {
    const query = search_params && search_params.toString() ? '?' + search_params.toString() : '';
    return iam_request('/admin/users' + query, { headers: bearer_headers(token) });
}

export function admin_suspend_user(token, id) {
    return iam_request('/admin/users/' + encodeURIComponent(id) + '/suspend', {
        method: 'POST',
        headers: bearer_headers(token)
    });
}

export function admin_activate_user(token, id) {
    return iam_request('/admin/users/' + encodeURIComponent(id) + '/activate', {
        method: 'POST',
        headers: bearer_headers(token)
    });
}

export function admin_list_providers(token) {
    return iam_request('/admin/providers', { headers: bearer_headers(token) });
}

export function admin_set_provider(token, name, enabled) {
    return iam_request('/admin/providers/' + encodeURIComponent(name), {
        method: 'PATCH',
        headers: bearer_headers(token, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ enabled: enabled })
    });
}
