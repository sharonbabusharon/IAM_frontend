import adapter from "@sveltejs/adapter-node";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // A Node server (the production compose runs it behind Caddy/Cloudflare).
    adapter: adapter(),
    // Content-Security-Policy. SvelteKit adds a nonce (or hash) to its own
    // inline scripts, so 'unsafe-inline' is only needed for styles (Svelte's
    // style: directives write style attributes).
    csp: {
      mode: "auto",
      directives: {
        "default-src": ["self"],
        "script-src": ["self", "https://checkout.razorpay.com"],
        "style-src": ["self", "unsafe-inline", "https://fonts.googleapis.com"],
        "font-src": ["self", "https://fonts.gstatic.com"],
        // data:/blob: for the photo and logo croppers; Razorpay shows bank logos.
        "img-src": ["self", "data:", "blob:", "https://*.razorpay.com"],
        "connect-src": ["self", "data:", "https://*.razorpay.com"],
        "frame-src": ["https://api.razorpay.com", "https://checkout.razorpay.com"],
        "worker-src": ["self"],
        "manifest-src": ["self"],
        "object-src": ["none"],
        "base-uri": ["self"],
        "form-action": ["self"],
        "frame-ancestors": ["none"],
      },
    },
  },
};

export default config;
