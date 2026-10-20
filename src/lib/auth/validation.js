export const auth_errors = {
  missing_code:
    "Sign-in wasn’t completed. Please choose a sign-in option and try again.",
  login_failed: "We couldn’t complete sign-in. Please try again.",
  invalid_or_expired_code:
    "That sign-in link expired. Please choose a sign-in option and try again.",
  access_denied: "Sign-in was cancelled. Choose a sign-in option to try again.",
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
};
export function friendly_auth_error(code) {
  return (
    auth_errors[code] ?? "We couldn’t complete that request. Please try again."
  );
}
