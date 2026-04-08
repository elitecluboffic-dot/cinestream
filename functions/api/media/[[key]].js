export async function onRequest({ request, env, params }) {
  const key = params.key;
  if (!key) {
    return new Response('File key tidak ditemukan', { status: 400 });
  }
  // === TAMBAHAN KEAMANAN: DIHAPUS ===
  try {
    const object = await env.R2.get(key);
    if (!object) {
      return new Response('File tidak ditemukan', { status: 404 });
    }
    const headers = new Headers();
    headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
  
    // Cache yang baik untuk media
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  
    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Filename yang lebih aman (FIX BUG UTAMA)
    const filename = key.split('/').pop() || 'file';
    headers.set('Content-Disposition', `inline; filename*=UTF-8''${encodeURIComponent(filename)}`);
    // Support video streaming (PENTING)
    headers.set('Accept-Ranges', 'bytes');
    return new Response(object.body, {
      status: 200,
      headers
    });
  } catch (err) {
    console.error('Error serving media:', err);
    return new Response('Terjadi kesalahan saat mengambil file', { status: 500 });
  }
}
