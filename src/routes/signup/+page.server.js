import {
  auth_configuration,
  submit_password,
} from "$lib/server/password_auth.js";
export function load({ setHeaders: set_headers }) {
  set_headers({ "cache-control": "no-store" });
  return auth_configuration();
}
export const actions = { default: (event) => submit_password(event, true) };
