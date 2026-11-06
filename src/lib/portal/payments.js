// Wallets, top-ups and the Razorpay Checkout widget (through the SvelteKit
// proxies, which add the session). Calls resolve to { ok, status, data, error };
// a 402 carries { reason, fee_paise, balance_paise } in data.
import { writable } from "svelte/store";

// One top-up is ₹1 to ₹5,00,000: Razorpay's default per-payment limit (the backend checks it too).
export const MIN_TOPUP_INR = 1;
export const MAX_TOPUP_INR = 500000;

async function call(path, { method = "GET", body, headers = {} } = {}) {
  const options = { method, headers: { ...headers } };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  try {
    const response = await fetch(path, options);
    const result = await response.json().catch(() => null);
    if (!result) return { ok: false, status: response.status, data: null, error: "Something went wrong. Try again." };
    if (result.error) result.error = result.error[0].toUpperCase() + result.error.slice(1);
    return result;
  } catch {
    return { ok: false, status: 0, data: null, error: "You seem to be offline. Try again." };
  }
}

const enc = encodeURIComponent;
const company = (slug) => `/framework_api/companies/${enc(slug)}`;

export const wallet_api = {
  // Personal wallet (candidates: paid applications, match-score sorting).
  mine: (page = 1, page_size = 20) => call(`/framework_api/wallet?page=${page}&page_size=${page_size}`),
  topup: (amount_paise) => call("/framework_api/wallet/topups", { method: "POST", body: { amount_paise } }),
  // Company wallet (company admins).
  company: (slug, page = 1, page_size = 20) => call(`${company(slug)}/wallet?page=${page}&page_size=${page_size}`),
  company_topup: (slug, amount_paise) => call(`${company(slug)}/wallet/topups`, { method: "POST", body: { amount_paise } }),
  set_allowance: (slug, user_id, cap_type, limit_paise) =>
    call(`${company(slug)}/members/${user_id}/allowance`, { method: "PUT", body: { cap_type, limit_paise } }),
  // Match-score sorting for one set of filters (sort and page are ignored).
  unlock_match: (criteria) => call("/framework_api/jobs/search/unlocks", { method: "POST", body: { criteria } }),
  // Paid job posts: key makes a retried publish return the first job instead of charging twice.
  post_job: (input, key) =>
    call("/framework_api/recruiter/jobs", { method: "POST", body: input, headers: { "Idempotency-Key": key } }),
  job_checkout: (job_id) => call(`/framework_api/recruiter/jobs/${enc(job_id)}/checkout`, { method: "POST" }),
};

/** Paise as rupees: 50000 -> "₹500", 250 -> "₹2.50". */
export const rupees = (paise) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2, minimumFractionDigits: 0 })
    .format((paise || 0) / 100);

// Any page asks for the shared top-up modal (mounted once in the portal
// layout): { company_slug?, alert?, need_paise? }. null closes it.
export const topup_request = writable(null);
export const request_topup = (options = {}) => topup_request.set(options);

let script;
function load_checkout() {
  script ??= new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "https://checkout.razorpay.com/v1/checkout.js";
    tag.onload = () => resolve(window.Razorpay);
    tag.onerror = () => {
      script = undefined;
      reject(new Error("checkout unavailable"));
    };
    document.head.append(tag);
  });
  return script;
}

/**
 * Opens Razorpay Checkout for a backend checkout ({ key_id, order_id,
 * amount_paise, currency }). Resolves "paid" when the widget reports success,
 * "dismissed" when the user closes it. "Paid" is only the widget's word: the
 * money lands when Razorpay's webhook reaches the backend, so poll after it.
 */
export async function open_checkout(checkout, description) {
  const Razorpay = await load_checkout();
  return new Promise((resolve) => {
    const widget = new Razorpay({
      key: checkout.key_id,
      order_id: checkout.order_id,
      amount: checkout.amount_paise,
      currency: checkout.currency,
      name: "Referise",
      description,
      handler: () => resolve("paid"),
      modal: { ondismiss: () => resolve("dismissed") },
    });
    // A failed attempt stays in the widget, which lets the user retry.
    widget.open();
  });
}

/** Polls check() every 2 s until it's true or timeout_ms passes; resolves whether it became true. */
export async function wait_until(check, timeout_ms = 90000) {
  const end = Date.now() + timeout_ms;
  while (Date.now() < end) {
    if (await check()) return true;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

// Manual: credit updates reflect instantly across all open tabs. Browser only:
// on the server an open channel would keep the Node process alive.
const channel =
  typeof window === "undefined" || typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("referise-wallet");
export function wallet_changed() {
  channel?.postMessage("changed");
}
export function on_wallet_change(callback) {
  if (!channel) return () => {};
  const listener = () => callback();
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}

/**
 * Pays for a job waiting in pending_payment and waits for the webhook to
 * publish it. Pass the checkout from the post response, or none to ask the
 * backend for a new order ("Pay to publish"). Resolves { outcome, error? }:
 * published | pending (paid, not confirmed yet) | dismissed | error.
 */
export async function pay_for_job(job_id, checkout = null) {
  if (!checkout) {
    const result = await wallet_api.job_checkout(job_id);
    if (!result.ok)
      return { outcome: "error", error: result.status === 503 ? "Payments aren’t available yet. Try again later." : result.error };
    if (!result.data.checkout) return { outcome: "published" }; // the fee became ₹0 meanwhile
    checkout = result.data.checkout;
  }
  let outcome;
  try {
    outcome = await open_checkout(checkout, "Job post fee");
  } catch {
    return { outcome: "error", error: "The payment window couldn’t load. Check your connection and try again." };
  }
  if (outcome !== "paid") return { outcome: "dismissed" };
  const live = await wait_until(async () => (await call(`/framework_api/jobs/${enc(job_id)}`)).data?.status === "active");
  return { outcome: live ? "published" : "pending" };
}
