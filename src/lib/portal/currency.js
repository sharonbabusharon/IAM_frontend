// Illustrative rates for the UI preview; replace with the daily rates.json artifact.
export const preview_rates = { INR: 1, USD: 85, GBP: 110, EUR: 95 };
export function to_inr(amount, currency) {
  return amount * (preview_rates[currency] ?? 1);
}
export function converted_salary(job, currency) {
  if (job.salary_hidden || job.salary_max == null) return "Competitive";
  const target = currency || job.currency;
  const format = (amount) =>
    new Intl.NumberFormat("en", {
      style: "currency",
      currency: target,
      maximumFractionDigits: 0,
    }).format(to_inr(amount, job.currency) / preview_rates[target]);
  return `${format(job.salary_min ?? 0)}–${format(job.salary_max)} / year`;
}
