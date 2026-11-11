// Cloudflare Pages Edge Router for Aaruni Group Domains
// Routes aarunicloud.com -> /cloud.html (HTTP 200 Edge Rewrite, zero redirect flash)
// Preserves my.aarunitech.com & aarunitech.com -> /index.html untouched.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = (url.hostname || "").toLowerCase();

    const isCloudHost =
      host === "aarunicloud.com" ||
      host === "www.aarunicloud.com" ||
      host.startsWith("aaruni-tech-cloud") ||
      url.searchParams.get("site") === "cloud";

    if (isCloudHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const cloudUrl = new URL("/cloud.html", request.url);
      return env.ASSETS.fetch(new Request(cloudUrl.toString(), request));
    }

    return env.ASSETS.fetch(request);
  }
};
