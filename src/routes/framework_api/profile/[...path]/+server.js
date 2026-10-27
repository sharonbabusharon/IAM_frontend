import { make_proxy } from '$lib/server/proxy.js';

// Browser -> backend proxy for your own profile (the backend scopes every
// call to the session's user).
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('profile', [
    { pattern: /^me$/, methods: ['GET', 'PUT'] },
    { pattern: /^me\/photo$/, methods: ['PUT'], image: true },
    { pattern: /^me\/experiences\/[0-9]{1,2}\/verification$/, methods: ['POST'] }
]);
