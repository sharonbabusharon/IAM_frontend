import { make_proxy } from '$lib/server/proxy.js';
import { resume_types } from '$lib/portal/profile_api.js';

// Browser -> backend proxy for your own profile (the backend scopes every
// call to the session's user).
export const { GET, POST, PUT, PATCH, DELETE } = make_proxy('profile', [
    { pattern: /^me$/, methods: ['GET', 'PUT'] },
    { pattern: /^me\/slug-availability$/, methods: ['GET'], query: ['slug'] },
    { pattern: /^me\/photo$/, methods: ['PUT', 'DELETE'], image: true },
    { pattern: /^me\/resume$/, methods: ['PUT', 'DELETE'], upload: { types: resume_types, error: 'Upload a PDF or DOCX file.' } },
    { pattern: /^me\/experiences\/[0-9]{1,2}\/verification$/, methods: ['POST'] },
    { pattern: /^me\/skills$/, methods: ['GET', 'POST'], query: ['signature'] },
    { pattern: /^me\/skills\/[0-9]{1,18}$/, methods: ['DELETE'] }
]);
