// Salary conversion with the published daily rates (manual "Salary"): rates
// are INR per one unit of each currency, INR is the baseline.
import { get } from "svelte/store";
import { rates as rates_store } from "./reference.js";

export function to_inr(amount, currency, rates = get(rates_store)) {
  return amount * (rates[currency] ?? 1);
}
// Pass $rates from components so the text updates when the rates load.
export function converted_salary(job, currency, rates = get(rates_store)) {
  if (job.salary_hidden || job.salary_max == null) return "Competitive";
  // Until the rates file loads, show the original currency rather than a wrong conversion.
  const target = currency && rates[currency] && rates[job.currency] ? currency : job.currency;
  const format = (amount) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: target,
      maximumFractionDigits: 0,
    }).format(target === job.currency ? amount : to_inr(amount, job.currency, rates) / rates[target]);
  return job.salary_min == null
    ? `Up to ${format(job.salary_max)} / year`
    : `${format(job.salary_min)}–${format(job.salary_max)} / year`;
}
