import { auth_configuration } from "$lib/server/auth_config.js";
export function load({ setHeaders: set_headers }) {
  set_headers({ "cache-control": "no-store" });
  return auth_configuration();
}
