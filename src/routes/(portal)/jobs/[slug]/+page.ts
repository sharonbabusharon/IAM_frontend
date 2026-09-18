import { error } from "@sveltejs/kit";
import { jobs } from "$lib/portal/data";
import type { PageLoad } from "./$types";

export const load: PageLoad = ({ params }) => {
  const job = jobs.find((item) => item.id === params.slug);
  if (!job) throw error(404, "This opportunity could not be found.");
  return { job };
};
