export const auth_errors = {
  missing_code:
    "Sign-in wasn’t completed. Please choose a sign-in option and try again.",
  login_failed: "We couldn’t complete sign-in. Please try again.",
  signin_failed: "The email or password is incorrect. Please try again.",
  signup_failed:
    "We couldn’t create your account with those details. Try signing in if you already have an account.",
  account_suspended:
    "This account is unavailable. Contact your account administrator for help.",
  provider_disabled:
    "That sign-in option is currently unavailable. Please choose another.",
  rate_limited:
    "There have been too many attempts. Wait a little before trying again.",
  iam_unreachable:
    "We can’t reach the sign-in service right now. Please try again shortly.",
  auth_unconfigured:
    "Sign-in isn’t connected on this preview yet. You can still explore the jobs and profile designs.",
  confirmation_required:
    "Please confirm your email before signing in. Check your inbox for the confirmation link.",
};
export function friendly_auth_error(code) {
  return (
    auth_errors[code] ?? "We couldn’t complete that request. Please try again."
  );
}
export function validate_credentials(values, signup = false) {
  const errors = {};
  if (
    !values.email ||
    values.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  )
    errors.email = "Enter a valid email address.";
  if (!values.password || values.password.length > 1024)
    errors.password = "Enter your password.";
  if (signup) {
    if (values.full_name.length < 2 || values.full_name.length > 100)
      errors.full_name = "Enter your full name, between 2 and 100 characters.";
    if (values.password.length < 8)
      errors.password = "Use at least 8 characters for your password.";
    if (values.password !== values.confirm_password)
      errors.confirm_password = "Your passwords don’t match.";
  }
  return errors;
}
export function password_outcome(result, signup = false) {
  if (signup && result.status === 202) return { type: "confirmation" };
  if (
    result.status === 200 &&
    typeof result.data?.access_token === "string" &&
    result.data.access_token
  )
    return {
      type: "session",
      token: result.data.access_token,
      expires_at: result.data.expires_at,
    };
  if (result.status === 401)
    return { type: "error", code: "signin_failed", status: 401 };
  if (result.status === 429)
    return { type: "error", code: "rate_limited", status: 429 };
  if (result.status === 0)
    return { type: "error", code: "iam_unreachable", status: 503 };
  const code = ["account_suspended", "confirmation_required"].includes(
    result.data?.error,
  )
    ? result.data.error
    : signup
      ? "signup_failed"
      : "login_failed";
  return {
    type: "error",
    code,
    status: result.status >= 400 && result.status < 500 ? result.status : 502,
  };
}
