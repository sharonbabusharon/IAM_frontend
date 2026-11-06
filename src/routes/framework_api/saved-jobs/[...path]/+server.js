import { make_proxy, job_id } from '$lib/server/proxy.js';

// Browser -> backend proxy for your saved jobs.
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('saved-jobs', [
    { pattern: /^$/, methods: ['GET', 'DELETE'], query: ['applied'] },
    { pattern: /^remove$/, methods: ['POST'] },
    { pattern: new RegExp(`^${job_id}$`), methods: ['PUT', 'DELETE'] }
]);
