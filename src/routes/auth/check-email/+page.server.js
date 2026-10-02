export function load({ cookies, setHeaders: set_headers }) {
  set_headers({ "cache-control": "no-store" });
  return {
    confirmation_pending: cookies.get("auth_confirmation_pending") === "1",
  };
}
