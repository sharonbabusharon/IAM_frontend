<script>
  // The wallet top-up modal (manual: header [+], company "Top Up Wallet", and
  // every "balance too low" flow). Mounted once in the portal layout; open it
  // with request_topup({ company_slug?, alert?, need_paise? }).
  import Modal from "./modal.svelte";
  import { toast } from "./state.js";
  import { load_quota } from "./membership_state.js";
  import {
    wallet_api,
    open_checkout,
    wait_until,
    wallet_changed,
    rupees,
    topup_request,
    MIN_TOPUP_INR,
    MAX_TOPUP_INR,
  } from "./payments.js";
  export let request; // { company_slug?, alert?, need_paise? }
  const read = () =>
    request.company_slug ? wallet_api.company(request.company_slug, 1, 1) : wallet_api.mine(1, 1);
  let amount = Math.min(MAX_TOPUP_INR, Math.max(request.company_slug ? 500 : 100, Math.ceil((request.need_paise || 0) / 100)));
  let stage = "form"; // form | paying | confirming | pending
  let error = "";
  function close() {
    if (stage === "paying" || stage === "confirming") return;
    topup_request.set(null);
  }
  async function pay() {
    error = "";
    const rupee_amount = Math.round(Number(amount));
    if (!(rupee_amount >= MIN_TOPUP_INR && rupee_amount <= MAX_TOPUP_INR)) {
      error = `Enter an amount from ₹${MIN_TOPUP_INR} to ₹5,00,000.`;
      return;
    }
    stage = "paying";
    const before = await read();
    if (!before.ok) return fail(before.error);
    const start = before.data.balance_paise;
    const order = request.company_slug
      ? await wallet_api.company_topup(request.company_slug, rupee_amount * 100)
      : await wallet_api.topup(rupee_amount * 100);
    if (!order.ok) return fail(order.status === 503 ? "Payments aren’t available yet. Try again later." : order.error);
    let outcome;
    try {
      outcome = await open_checkout(order.data, request.company_slug ? "Company wallet top-up" : "Wallet top-up");
    } catch {
      return fail("The payment window couldn’t load. Check your connection and try again.");
    }
    if (outcome !== "paid") return fail("Payment cancelled. Nothing was charged.");
    // The webhook credits the wallet; wait for it before saying it's done.
    stage = "confirming";
    const landed = await wait_until(async () => {
      const now = await read();
      return now.ok && now.data.balance_paise >= start + rupee_amount * 100;
    });
    wallet_changed();
    load_quota();
    if (!landed) {
      stage = "pending";
      return;
    }
    toast(`${rupees(rupee_amount * 100)} added to your ${request.company_slug ? "company " : ""}wallet.`);
    request.on_paid?.();
    topup_request.set(null);
  }
  function fail(message) {
    error = message;
    stage = "form";
  }
</script>

<Modal title={request.company_slug ? "Top up company wallet" : "Top up your wallet"} on:close={close}>
  {#if stage === "pending"}<div class="workspace_hint">
      <p>
        Your payment went through. The balance updates as soon as Razorpay
        confirms it, usually within a few minutes.
      </p>
    </div>
    <div class="form_actions">
      <button class="button button_dark" on:click={() => topup_request.set(null)}>Close</button>
    </div>{:else}<form class="workspace_form" on:submit|preventDefault={pay}>
      {#if request.alert}<p class="workspace_hint" role="status">{request.alert}</p>{/if}
      <label class="field_label"
        >Amount (INR)<input
          class="field_input"
          type="number"
          required
          min={MIN_TOPUP_INR}
          max={MAX_TOPUP_INR}
          step="1"
          disabled={stage !== "form"}
          bind:value={amount}
        /></label
      >
      <p class="workspace_hint warning" role="note">
        Money added to the wallet is non-refundable. It can’t be withdrawn,
        refunded or transferred out.
      </p>
      {#if error}<p class="filter_error" role="alert">{error}</p>{/if}
      <div class="form_actions">
        <button type="button" class="button button_outline" disabled={stage !== "form"} on:click={close}
          >Cancel</button
        ><button class="button button_dark" disabled={stage !== "form"}
          >{stage === "paying"
            ? "Opening payment…"
            : stage === "confirming"
              ? "Confirming payment…"
              : `Pay ${rupees(Math.round(Number(amount) || 0) * 100)}`}</button
        >
      </div>
    </form>{/if}
</Modal>
