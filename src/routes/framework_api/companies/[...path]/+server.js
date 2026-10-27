import { make_proxy, slug, uuid } from '$lib/server/proxy.js';

// Browser -> backend proxy for the company API (allowlisted shapes only).
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('companies', [
    { pattern: /^$/, methods: ['POST'] },
    { pattern: /^search$/, methods: ['POST'] },
    { pattern: /^slug-availability$/, methods: ['GET'], query: ['slug'] },
    { pattern: new RegExp(`^${slug}$`), methods: ['GET', 'PUT', 'DELETE'] },
    { pattern: new RegExp(`^${slug}/(logo|banner)$`), methods: ['PUT'], image: true },
    { pattern: new RegExp(`^${slug}/dashboard$`), methods: ['GET'] },
    { pattern: new RegExp(`^${slug}/members$`), methods: ['GET'], query: ['status'] },
    { pattern: new RegExp(`^${slug}/members/${uuid}/(approve|reject|offboard)$`), methods: ['POST'] },
    { pattern: new RegExp(`^${slug}/members/${uuid}$`), methods: ['PATCH'] },
    { pattern: new RegExp(`^${slug}/leave$`), methods: ['POST'] }
]);
