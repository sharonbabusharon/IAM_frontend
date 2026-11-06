import { error } from '@sveltejs/kit';
import { stream_resume } from '$lib/server/resume.js';

// /profiles/{slug}/resume?mode=view|download: for the owner, recruiters of a
// job the candidate applied to, or anyone when the résumé is public.
export function GET(event) {
    if (!/^[a-z0-9-]{3,50}$/.test(event.params.slug)) error(404, 'This résumé isn’t available.');
    return stream_resume(`/profiles/${event.params.slug}/resume`, event);
}
