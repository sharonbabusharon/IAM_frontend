import { fail, redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/public";
import { dev } from "$app/environment";
import { password_sign_in, password_sign_up } from "./iam_api.js";
import { set_session_cookie } from "./session_cookie.js";
import {
  validate_credentials,
  password_outcome,
  friendly_auth_error,
} from "../auth/validation.js";

export function auth_configuration() {
  try {
    const url = new URL(
      env.PUBLIC_IAM_BASE_URL || (dev ? "http://localhost:8080" : ""),
    );
    return {
      auth_configured:
        url.protocol === "https:" ||
        (dev &&
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)),
    };
  } catch {
    return { auth_configured: false };
  }
}
export async function submit_password(
  { request, cookies, url },
  signup = false,
) {
  if (request.headers.get("origin") !== url.origin)
    return fail(403, {
      message: "Please refresh this page before trying again.",
    });
  const body = await request.formData();
  const read = (name) =>
    typeof body.get(name) === "string" ? body.get(name) : "";
  const values = {
    email: read("email").trim(),
    full_name: read("full_name").trim(),
    password: read("password"),
    confirm_password: read("confirm_password"),
  };
  const fields = {
    email: values.email.slice(0, 254),
    full_name: values.full_name.slice(0, 100),
  };
  const errors = validate_credentials(values, signup);
  if (Object.keys(errors).length) return fail(400, { fields, errors });
  if (!auth_configuration().auth_configured)
    return fail(503, {
      fields,
      message: friendly_auth_error("auth_unconfigured"),
    });
  const result = signup
    ? await password_sign_up({
        email: values.email,
        full_name: values.full_name,
        password: values.password,
      })
    : await password_sign_in({
        email: values.email,
        password: values.password,
      });
  const outcome = password_outcome(result, signup);
  if (outcome.type === "confirmation") {
    cookies.set("auth_confirmation_pending", "1", {
      path: "/auth/check-email",
      httpOnly: true,
      sameSite: "lax",
      secure: !dev,
      maxAge: 900,
    });
    throw redirect(303, "/auth/check-email");
  }
  if (outcome.type === "session") {
    set_session_cookie(cookies, outcome.token, outcome.expires_at);
    throw redirect(303, "/account");
  }
  return fail(outcome.status, {
    fields,
    message: friendly_auth_error(outcome.code),
  });
}
