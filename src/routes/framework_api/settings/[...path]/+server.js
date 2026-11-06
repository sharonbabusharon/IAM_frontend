import { make_proxy } from '$lib/server/proxy.js';

// Browser -> backend proxy for the public, read-only platform settings
// (daily free applications and fees).
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('settings', [{ pattern: /^$/, methods: ['GET'] }]);
