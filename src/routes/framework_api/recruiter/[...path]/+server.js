import { make_proxy, job_id, uuid } from '$lib/server/proxy.js';

// Browser -> backend proxy for posting and managing jobs.
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('recruiter', [
    { pattern: /^companies$/, methods: ['GET'] },
    { pattern: /^jobs$/, methods: ['GET', 'POST'], query: ['status'], headers: ['idempotency-key'] },
    { pattern: new RegExp(`^jobs/${uuid}/checkout$`), methods: ['POST'] },
    { pattern: new RegExp(`^jobs/${job_id}$`), methods: ['PUT'] },
    { pattern: new RegExp(`^jobs/${job_id}/(close|repost)$`), methods: ['POST'] },
    { pattern: new RegExp(`^jobs/${job_id}/applications$`), methods: ['GET'], query: ['stage', 'min_match', 'sort'] },
    { pattern: new RegExp(`^applications/${uuid}$`), methods: ['PATCH'] },
    { pattern: /^drafts$/, methods: ['GET', 'POST'] },
    { pattern: new RegExp(`^drafts/${uuid}$`), methods: ['PUT', 'DELETE'] }
]);
