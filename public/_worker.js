// Cloudflare Pages Edge Router for Aaruni Group Domains
// 1. aarunicloud.com -> /cloud (serves cloud.html)
// 2. my.aarunitech.com (or ?emp=... or ?tab=... or /portal) -> /portal (serves portal.html)
// 3. aarunitech.com (and root requests) -> /index.html (Aaruni Tech Corporate Flagship)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const host = (url.hostname || "").toLowerCase();

    // 1. Aaruni Cloud Host
    const isCloudHost =
      host === "aarunicloud.com" ||
      host === "www.aarunicloud.com" ||
      host.startsWith("aaruni-tech-cloud") ||
      url.searchParams.get("site") === "cloud";

    if (isCloudHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const cloudUrl = new URL("/cloud" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(cloudUrl.toString(), request));
    }

    // 2. Aaruni Employee Portal Host & Deep Links
    const isPortalHost =
      host === "my.aarunitech.com" ||
      host === "www.my.aarunitech.com" ||
      url.searchParams.get("site") === "portal" ||
      url.searchParams.has("emp") ||
      url.searchParams.has("tab");

    if (isPortalHost && (url.pathname === "/" || url.pathname === "/index.html")) {
      const portalUrl = new URL("/portal" + url.search + url.hash, request.url);
      return env.ASSETS.fetch(new Request(portalUrl.toString(), request));
    }

    // 3. Fallback to default asset resolution
    // - aarunitech.com/ -> index.html (Corporate Homepage)
    // - aarunitech.com/portal -> portal.html (Employee Portal)
    // - aarunitech.com/cloud -> cloud.html (Aaruni Cloud)
    return env.ASSETS.fetch(request);
  }
};
