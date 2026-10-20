import test from "node:test";
import assert from "node:assert/strict";
import { friendly_auth_error } from "../src/lib/auth/validation.js";

test("IAM and backend error codes map to recoverable messages", () => {
  for (const code of ["missing_code", "login_failed", "account_suspended", "provider_disabled", "invalid_or_expired_code", "access_denied"])
    assert.notEqual(friendly_auth_error(code), friendly_auth_error("unknown_code"), code);
  assert.match(friendly_auth_error("iam_unreachable"), /try again/);
});

test("unrecognized error codes never echo raw text into the page", () => {
  assert.ok(!friendly_auth_error("<script>bad</script>").includes("<script>"));
});
