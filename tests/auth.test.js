import test from "node:test";
import assert from "node:assert/strict";
import {
  validate_credentials,
  password_outcome,
  friendly_auth_error,
} from "../src/lib/auth/validation.js";

const valid = {
  email: "review@example.test",
  full_name: "Preview Reviewer",
  password: "sample-only-password",
  confirm_password: "sample-only-password",
};
test("registration validates identity, email and password confirmation", () => {
  assert.deepEqual(validate_credentials(valid, true), {});
  const errors = validate_credentials(
    {
      ...valid,
      email: "missing-at-sign",
      full_name: "A",
      password: "short",
      confirm_password: "different",
    },
    true,
  );
  assert.deepEqual(Object.keys(errors).sort(), [
    "confirm_password",
    "email",
    "full_name",
    "password",
  ]);
});
test("sign-in permits existing passwords without the registration length rule", () => {
  assert.deepEqual(validate_credentials({ ...valid, password: "short" }), {});
  assert.ok(validate_credentials({ ...valid, password: "" }).password);
});
test("password whitespace is not silently stripped and Unicode names are supported", () => {
  assert.deepEqual(
    validate_credentials(
      {
        ...valid,
        full_name: "अनन्या कुमार",
        password: " pass phrase ",
        confirm_password: " pass phrase ",
      },
      true,
    ),
    {},
  );
  assert.ok(
    validate_credentials(
      { ...valid, password: " pass phrase ", confirm_password: "pass phrase" },
      true,
    ).confirm_password,
  );
});
test("registration 202 never creates a session, even if a malformed response includes a token", () => {
  assert.deepEqual(
    password_outcome(
      { status: 202, data: { access_token: "must-not-use" } },
      true,
    ),
    { type: "confirmation" },
  );
});
test("only a 200 response with a nonempty token establishes a session", () => {
  assert.equal(
    password_outcome({
      status: 200,
      data: { access_token: "fixture", expires_at: "2030-01-01" },
    }).type,
    "session",
  );
  for (const result of [
    { status: 200, data: {} },
    { status: 202, data: {} },
    { status: 500, data: { access_token: "bad" } },
  ])
    assert.equal(password_outcome(result).type, "error");
});
test("wrong passwords and unknown accounts get the same sign-in response", () => {
  const unknown = password_outcome({
    status: 401,
    data: { error: "user_not_found" },
  });
  const wrong = password_outcome({
    status: 401,
    data: { error: "wrong_password" },
  });
  assert.deepEqual(unknown, wrong);
  assert.equal(unknown.code, "signin_failed");
});
test("unreachable and rate-limited services produce recoverable error states", () => {
  assert.equal(password_outcome({ status: 0 }).status, 503);
  assert.equal(password_outcome({ status: 429 }).code, "rate_limited");
  assert.match(friendly_auth_error("iam_unreachable"), /try again/);
});
test("unrecognized server errors never echo raw messages into the page", () => {
  assert.equal(
    password_outcome(
      { status: 400, data: { error: "<script>bad</script>" } },
      true,
    ).code,
    "signup_failed",
  );
  assert.ok(!friendly_auth_error("<script>bad</script>").includes("<script>"));
});
