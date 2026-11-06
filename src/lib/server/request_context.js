import { AsyncLocalStorage } from 'node:async_hooks';

// The browser request being served, for calls made to the backend while
// serving it: hooks.server.js runs each request inside run(), backend_api.js
// reads it to forward the client's IP and User-Agent.
const storage = new AsyncLocalStorage();

/** @param {{ ip: string, user_agent: string }} context */
export const run_with_request = (context, fn) => storage.run(context, fn);

/** Headers that tell the backend who the real client is (empty outside a request). */
export function client_headers() {
    const context = storage.getStore();
    if (!context) return {};
    const headers = {};
    // The backend trusts this only from TRUSTED_PROXIES (this server). It is
    // set from the TCP peer, never copied from the browser, so it can't be spoofed.
    if (context.ip) headers['X-Forwarded-For'] = context.ip;
    // For the profile-view bot filter: the browser's agent, not Node's.
    if (context.user_agent) headers['User-Agent'] = context.user_agent;
    return headers;
}
