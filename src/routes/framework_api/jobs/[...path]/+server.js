import { make_proxy, job_id } from '$lib/server/proxy.js';

// Browser -> backend proxy for job search (with the session, so jobs you
// applied to are excluded) and external-apply click logging.
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('jobs', [
    { pattern: /^search$/, methods: ['POST'] },
    { pattern: new RegExp(`^${job_id}$`), methods: ['GET'] },
    { pattern: new RegExp(`^${job_id}/outbound$`), methods: ['POST'] }
]);
