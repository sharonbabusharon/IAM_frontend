import { make_proxy, job_id, uuid } from '$lib/server/proxy.js';

// Browser -> backend proxy for posting and managing jobs.
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('recruiter', [
    { pattern: /^companies$/, methods: ['GET'] },
    { pattern: /^jobs$/, methods: ['GET', 'POST'], query: ['status'] },
    { pattern: new RegExp(`^jobs/${job_id}$`), methods: ['PUT'] },
    { pattern: new RegExp(`^jobs/${job_id}/(close|repost)$`), methods: ['POST'] },
    { pattern: /^drafts$/, methods: ['GET', 'POST'] },
    { pattern: new RegExp(`^drafts/${uuid}$`), methods: ['PUT', 'DELETE'] }
]);
