import { redirect } from "@sveltejs/kit";

// Live jobs have one page: /jobs/[id] shows the owner's view (analytics,
// close, repost) to its recruiters. Drafts open in /recruiter/post-job.
export function load({ params }) {
  redirect(308, "/jobs/" + encodeURIComponent(params.id));
}
