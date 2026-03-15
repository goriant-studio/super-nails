const UPSTREAM_BASE = "https://super-nails.lovable.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Proxy to lovable.app, keep path + search intact
    const upstreamUrl = UPSTREAM_BASE + url.pathname + url.search;

    const upstreamRequest = new Request(upstreamUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
      redirect: "follow",
    });

    const response = await fetch(upstreamRequest);

    const headers = new Headers(response.headers);
    // Remove headers that could block iframe or cause issues
    headers.delete("X-Frame-Options");
    headers.delete("Content-Security-Policy");
    // Allow cross-origin requests
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
