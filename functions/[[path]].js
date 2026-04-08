// functions/[[path]].js
// Load Balancer Full Fix - cinestream.kraxx.my.id

export async function onRequest({ request, env }) {
  // Ambil dari environment variables, bukan hardcode
  const API_TOKEN = env.CF_API_TOKEN;
  const ZONE_ID = env.CF_ZONE_ID;
  const ACCOUNT_ID = env.CF_ACCOUNT_ID;

  try {
    const url = new URL(request.url);
    const pathname = url.pathname + url.search;

    // === DAFTAR BACKEND (Load Balancing) ===
    const backends = [
      "https://cinestream.kraxx.my.id",
      // "https://backup1.cinestream.kraxx.my.id",
    ];

    const targetOrigin = backends[Math.floor(Math.random() * backends.length)];
    const targetUrl = targetOrigin + pathname;

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        "Host": new URL(targetOrigin).host,
        "X-Forwarded-For": request.headers.get("cf-connecting-ip") || "",
        "X-Real-IP": request.headers.get("cf-connecting-ip") || "",
        "CF-Worker": "LoadBalancer",
      },
      body: request.body,
      redirect: "follow",
    });

    const newResponse = new Response(response.body, response);
    newResponse.headers.set("X-Frame-Options", "DENY");
    newResponse.headers.set("X-Content-Type-Options", "nosniff");
    newResponse.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    return newResponse;
  } catch (err) {
    console.error("Load Balancer Error:", err.message);
    return new Response(`Load Balancer Error: ${err.message}`, {
      status: 502,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
