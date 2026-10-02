import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createServer as create_vite_server } from "vite";

test("auth pages and server actions follow the IAM contract", async (context) => {
  let reply_status = 401;
  let reply_body = { error: "signin_failed" };
  const requests = [];
  const backend = http.createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({ path: request.url, body: JSON.parse(body || "{}") });
    response.writeHead(reply_status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(reply_body));
  });
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  const previous_url = process.env.PUBLIC_IAM_BASE_URL;
  process.env.PUBLIC_IAM_BASE_URL = `http://127.0.0.1:${backend.address().port}`;
  let server;
  context.after(async () => {
    await server?.close();
    backend.closeAllConnections();
    await new Promise((resolve) => backend.close(resolve));
    if (previous_url === undefined) delete process.env.PUBLIC_IAM_BASE_URL;
    else process.env.PUBLIC_IAM_BASE_URL = previous_url;
  });
  server = await create_vite_server({
    server: { port: 0, host: "127.0.0.1", watch: null },
    logLevel: "error",
  });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  const post = (path, values, source = origin) =>
    fetch(origin + path, {
      method: "POST",
      redirect: "manual",
      headers: {
        Accept: "text/html",
        Origin: source,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(values),
    });
  const values = {
    email: "review@example.test",
    password: "sample-only-password",
    full_name: "Preview Reviewer",
    confirm_password: "sample-only-password",
  };

  for (const [route, heading] of [
    ["/login", "Welcome back."],
    ["/signup", "Your next chapter"],
    ["/auth/check-email", "Check your inbox."],
    ["/auth/help", "Forgot your password?"],
  ]) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes(heading), route);
  }
  for (const [route, destination] of [
    ["/register", "/signup"],
    ["/signin", "/login"],
  ]) {
    const response = await fetch(origin + route, { redirect: "manual" });
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), destination);
  }
  const invalid = await post("/signup", {
    ...values,
    confirm_password: "mismatch",
  });
  assert.equal(invalid.status, 400);
  const invalid_html = await invalid.text();
  assert.ok(invalid_html.includes("passwords don’t match"));
  assert.ok(!invalid_html.includes(values.password));
  assert.equal(requests.length, 0);

  const failed = await post("/login", values);
  assert.equal(failed.status, 401);
  const failed_html = await failed.text();
  assert.ok(failed_html.includes("email or password is incorrect"));
  assert.ok(!failed_html.includes(values.password));
  assert.equal(requests.at(-1).path, "/signin");
  assert.deepEqual(Object.keys(requests.at(-1).body).sort(), [
    "email",
    "password",
  ]);

  reply_status = 202;
  reply_body = { status: "confirmation_required" };
  const confirmation = await post("/signup", values);
  assert.equal(confirmation.status, 303);
  assert.equal(confirmation.headers.get("location"), "/auth/check-email");
  assert.ok(!confirmation.headers.get("set-cookie").includes("iam_token"));
  assert.ok(
    confirmation.headers
      .get("set-cookie")
      .includes("auth_confirmation_pending=1"),
  );
  assert.deepEqual(Object.keys(requests.at(-1).body).sort(), [
    "email",
    "full_name",
    "password",
  ]);

  reply_status = 200;
  reply_body = {
    access_token: "local-test-session",
    expires_at: new Date(Date.now() + 600000).toISOString(),
  };
  const success = await post("/login", values);
  assert.equal(success.status, 303);
  assert.equal(success.headers.get("location"), "/account");
  const cookie = success.headers.get("set-cookie");
  assert.ok(cookie.includes("iam_token=local-test-session"));
  assert.ok(cookie.includes("HttpOnly"));
  assert.ok(cookie.includes("SameSite=Lax"));
  const count = requests.length;
  const cross_origin = await post(
    "/signup",
    values,
    "https://untrusted.example",
  );
  assert.equal(cross_origin.status, 403);
  assert.equal(requests.length, count);
});
