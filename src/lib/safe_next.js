// Where to land after sign-in. Only same-site paths: "//evil.com" or "/\evil.com"
// would be read by browsers as another origin (open redirect).
export function safe_next(value) {
  return typeof value === "string" && /^\/(?![/\\])/.test(value) ? value : "/profile";
}
