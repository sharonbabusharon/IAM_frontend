import { error } from '@sveltejs/kit';
import { stream_resume } from '$lib/server/resume.js';

// An applicant's résumé for the job's recruiter or a company admin.
export function GET(event) {
    if (!/^[0-9a-f-]{36}$/.test(event.params.id)) error(404, 'This résumé isn’t available.');
    return stream_resume(`/recruiter/applications/${event.params.id}/resume`, event);
}
