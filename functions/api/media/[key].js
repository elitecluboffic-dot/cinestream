// functions/api/media/[key].js
export async function onRequest({ request, env, params }) {
  const key = params.key;   // ini yang diambil dari [key]

  if (!key) {
    return new Response('File key tidak ditemukan', { status: 400 });
  }

  try {
    const object = await env.R2.get(key);

    if (!object) {
      return new Response('File tidak ditemukan', { status: 404 });
    }

    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Content-Disposition', `inline; filename="${key.split('-').pop()}"`); // optional

    // Tambahan security header
    headers.set('X-Content-Type-Options', 'nosniff');

    return new Response(object.body, {
      status: 200,
      headers
    });

  } catch (err) {
    console.error('Error serving media:', err);
    return new Response('Terjadi kesalahan saat mengambil file', { status: 500 });
  }
}
