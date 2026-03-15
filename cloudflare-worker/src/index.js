const UPSTREAM_BASE = "https://goriant-studio.github.io/super-nails";
const UPSTREAM_PATH_PREFIX = "/super-nails";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = url.pathname;

    // Map: super-nails.goriant.com{path} → github.io/super-nails{path}
    const upstreamUrl = UPSTREAM_BASE + pathname + url.search;

    const response = await fetch(upstreamUrl, {
      method: request.method,
      headers: request.headers,
    });

    const headers = new Headers(response.headers);
    // Xóa headers block iframe/CSP không cần thiết
    headers.delete("X-Frame-Options");
    headers.delete("Content-Security-Policy");

    const contentType = headers.get("Content-Type") || "";

    if (contentType.includes("text/html")) {
      let body = await response.text();

      // Fix: Vite build với base="/super-nails/", nên HTML có paths dạng:
      //   href="/super-nails/assets/..." và src="/super-nails/assets/..."
      // Khi proxy, browser sẽ request super-nails.goriant.com/super-nails/assets/...
      // Worker lại map thành github.io/super-nails/super-nails/assets/... → 404
      // Fix: rewrite "/super-nails/" → "/" trong HTML để browser request đúng path
      body = body.replaceAll(`href="${UPSTREAM_PATH_PREFIX}/`, 'href="/');
      body = body.replaceAll(`src="${UPSTREAM_PATH_PREFIX}/`, 'src="/');
      body = body.replaceAll(`"${UPSTREAM_PATH_PREFIX}/assets/`, '"/assets/');
      body = body.replaceAll(`'${UPSTREAM_PATH_PREFIX}/assets/`, "'/assets/");
      // Rewrite absolute GitHub Pages URLs
      body = body.replaceAll(UPSTREAM_BASE, "");

      return new Response(body, { status: response.status, headers });
    }

    return new Response(response.body, { status: response.status, headers });
  },
};
