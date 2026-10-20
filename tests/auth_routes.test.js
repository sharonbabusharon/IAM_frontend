import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createServer as create_vite_server } from "vite";

// Mock findJobs backend: /api/v1/auth/{session,me,token,logout}.
test("auth routes delegate the session to the findJobs backend", async (context) => {
  const requests = [];
  let me_status = 200;
  const user = { id: "u1", iam_user_id: "01ECO", name: "Preview Reviewer", email: "review@example.test", status: "active" };
  const backend = http.createServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({ path: request.url, cookie: request.headers.cookie || "", body });
    const send = (status, data, headers = {}) => {
      response.writeHead(status, { "Content-Type": "application/json", ...headers });
      response.end(JSON.stringify({ status: status < 400, data }));
    };
    if (request.url === "/api/v1/auth/session")
      return JSON.parse(body).code === "good"
        ? send(200, { user }, { "Set-Cookie": "jp_session=sid-123; Path=/; HttpOnly" })
        : send(401, null);
    if (request.url === "/api/v1/auth/me")
      return me_status === 200 ? send(200, { user, expires_at: "2026-11-13T00:00:00Z" }) : send(me_status, null);
    if (request.url === "/api/v1/auth/logout") return send(200, {});
    send(404, null);
  });
  await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
  const previous = process.env.BACKEND_URL;
  process.env.BACKEND_URL = `http://127.0.0.1:${backend.address().port}`;
  let server;
  context.after(async () => {
    await server?.close();
    backend.closeAllConnections();
    await new Promise((resolve) => backend.close(resolve));
    if (previous === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = previous;
  });
  server = await create_vite_server({ server: { port: 0, host: "127.0.0.1", watch: null }, logLevel: "error" });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  const get = (path, cookie) => fetch(origin + path, { redirect: "manual", headers: cookie ? { Cookie: cookie } : {} });

  for (const [route, heading] of [["/login", "Welcome back."], ["/signup", "Make yourself known."], ["/auth/help", "Forgot your password?"]]) {
    const response = await get(route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert.ok(html.includes(heading), route);
    assert.ok(!html.includes('type="password"'), route + " has no password field");
  }
  for (const [route, destination] of [["/register", "/signup"], ["/signin", "/login"]]) {
    const response = await get(route);
    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), destination);
  }
  for (const route of ["/login", "/signup"]) {
    const html = await (await get(route)).text();
    assert.ok(!html.includes('type="password"'), route);
    for (const provider of ["Google", "Microsoft", "LinkedIn", "Facebook", "GitHub", "Discord", "GitLab", "Snapchat"])
      assert.ok(html.includes(provider), `${route} ${provider}`);
  }

  let response = await get("/auth/callback?error=account_suspended");
  assert.equal(response.headers.get("location"), "/login?error=account_suspended");
  response = await get("/auth/callback");
  assert.equal(response.headers.get("location"), "/login?error=missing_code");
  response = await get("/auth/callback?code=bad");
  assert.equal(response.headers.get("location"), "/login?error=login_failed");

  response = await get("/auth/callback?code=good");
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "/profile");
  const cookie = response.headers.get("set-cookie");
  assert.match(cookie, /jp_session=sid-123/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.equal(requests.at(-1).body, JSON.stringify({ code: "good" }));

  for (const [next, landing] of [["/jobs/abc?x=1", "/jobs/abc?x=1"], ["//evil.example", "/profile"], ["/\\evil.example", "/profile"], ["https://evil.example", "/profile"]]) {
    response = await get("/auth/callback?code=good&next=" + encodeURIComponent(next));
    assert.equal(response.headers.get("location"), landing, next);
  }

  response = await get("/jobs", "jp_session=sid-123");
  assert.ok((await response.text()).includes("Sign out"), "portal header shows signed-in state");
  me_status = 401;
  response = await get("/jobs", "jp_session=sid-123");
  assert.ok(!(await response.text()).includes("Sign out"), "header signed out when session invalid");
  me_status = 200;

  response = await get("/auth/session", "jp_session=sid-123");
  assert.deepEqual(await response.json(), {
    authenticated: true,
    user: { ecosystem_id: "01ECO", email: user.email, name: user.name, status: "active", expires_at: "2026-11-13T00:00:00Z" },
  });
  assert.equal(requests.at(-1).cookie, "jp_session=sid-123");
  assert.deepEqual(await (await get("/auth/session")).json(), { authenticated: false });

  me_status = 401;
  response = await get("/auth/session", "jp_session=sid-123");
  assert.deepEqual(await response.json(), { authenticated: false });
  assert.match(response.headers.get("set-cookie"), /jp_session=;.*Max-Age=0/);

  response = await fetch(origin + "/auth/logout", { method: "POST", headers: { Cookie: "jp_session=sid-123", Origin: origin } });
  assert.equal(response.status, 200);
  assert.equal(requests.at(-1).path, "/api/v1/auth/logout");
  assert.equal(requests.at(-1).cookie, "jp_session=sid-123");
  assert.match(response.headers.get("set-cookie"), /jp_session=;.*Max-Age=0/);
});
