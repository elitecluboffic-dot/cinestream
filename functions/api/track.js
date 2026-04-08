export async function onRequest({ request, env }) {
  const ip = request.headers.get('CF-Connecting-IP') || 
             request.headers.get('X-Forwarded-For') || 
             'unknown';
  const country = request.headers.get('CF-IPCountry') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || 'unknown';
  const url = request.headers.get('Referer') || 'unknown';

  const entry = {
    ip,
    country,
    userAgent,
    url,
    timestamp: Date.now()
  };

  // Simpan ke KV dengan key unik per visit
  const key = `visit:${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await env.KV.put(key, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 hari

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
