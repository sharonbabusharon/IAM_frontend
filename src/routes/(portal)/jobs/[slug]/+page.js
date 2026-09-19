import { error } from "@sveltejs/kit";
import { jobs } from "$lib/portal/data";
export const load = ({ params }) => {
  const job = jobs.find((item) => item.id === params.slug);
  if (!job) throw error(404, "This opportunity could not be found.");
  return { job };
};
