import { make_proxy } from '$lib/server/proxy.js';

// Browser -> backend proxy for your personal wallet: balance and ledger, top-ups.
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('wallet', [
    { pattern: /^$/, methods: ['GET'], query: ['page', 'page_size'] },
    { pattern: /^topups$/, methods: ['POST'] }
]);
