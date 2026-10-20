import { goto } from '$app/navigation';

// Asks the server every time: the backend session (not a browser cache) is
// the source of truth, so logout, expiry and suspension take effect at once.
export async function ensure_session() {
    try {
        const response = await fetch('/auth/session');
        if (response.ok) {
            const data = await response.json();
            if (data && data.authenticated && data.user) return data.user;
        }
    } catch (error) {
        // fall through to sign-in
    }
    goto('/login', { replaceState: true });
    return null;
}
