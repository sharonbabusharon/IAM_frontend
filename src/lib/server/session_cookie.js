const cookie_name = 'iam_token';

export function decode_jwt_claims(token) {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return null;
        let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        payload = payload + '='.repeat((4 - (payload.length % 4)) % 4);
        const json = Buffer.from(payload, 'base64').toString('utf-8');
        return JSON.parse(json);
    } catch (error) {
        return null;
    }
}

export function set_session_cookie(cookies, token, expires_at) {
    let max_age = 600;
    if (expires_at) {
        const seconds = Math.floor((new Date(expires_at).getTime() - Date.now()) / 1000);
        if (seconds > 0) max_age = seconds;
    } else {
        const claims = decode_jwt_claims(token);
        if (claims && claims.exp) {
            const seconds = claims.exp - Math.floor(Date.now() / 1000);
            if (seconds > 0) max_age = seconds;
        }
    }
    cookies.set(cookie_name, token, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: max_age
    });
}

export function read_token(cookies) {
    return cookies.get(cookie_name) || null;
}

export function clear_session_cookie(cookies) {
    cookies.delete(cookie_name, { path: '/' });
}

export function build_session_user(token, fallback) {
    const claims = decode_jwt_claims(token) || {};
    const source = fallback || {};
    return {
        ecosystem_id: source.ecosystem_id || claims.sub || '',
        email: claims.email || '',
        name: claims.name || '',
        status: claims.status || 'active',
        expires_at:
            source.expires_at || (claims.exp ? new Date(claims.exp * 1000).toISOString() : null)
    };
}
