import { env } from "$env/dynamic/public";
import { dev } from "$app/environment";

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
