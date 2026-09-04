import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const session_storage_key = 'iam_user';

export function save_session_user(user) {
    if (!browser) return;
    try {
        localStorage.setItem(session_storage_key, JSON.stringify(user));
    } catch (error) {
        return;
    }
}

export function read_session_user() {
    if (!browser) return null;
    try {
        const raw = localStorage.getItem(session_storage_key);
        if (!raw) return null;
        const user = JSON.parse(raw);
        if (user && user.expires_at && new Date(user.expires_at).getTime() < Date.now()) {
            localStorage.removeItem(session_storage_key);
            return null;
        }
        return user;
    } catch (error) {
        return null;
    }
}

export function clear_session_user() {
    if (!browser) return;
    try {
        localStorage.removeItem(session_storage_key);
    } catch (error) {
        return;
    }
}

export async function ensure_session() {
    const local_user = read_session_user();
    if (local_user) return local_user;
    try {
        const response = await fetch('/auth/session');
        if (response.ok) {
            const data = await response.json();
            if (data && data.authenticated && data.user) {
                save_session_user(data.user);
                return data.user;
            }
        }
    } catch (error) {
        goto('/login', { replaceState: true });
        return null;
    }
    goto('/login', { replaceState: true });
    return null;
}

export function require_session() {
    const user = read_session_user();
    if (!user) {
        goto('/login', { replaceState: true });
        return null;
    }
    return user;
}
