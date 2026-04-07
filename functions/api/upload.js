// functions/api/upload.js   (atau nama file upload kamu)
export async function onRequest({ request, env }) {
  try {
    // === 1. Cek Auth ===
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const email = await env.KV.get(`session:${token}`);
    if (!email) {
      return new Response(JSON.stringify({ error: "Session expired" }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // === 2. ANTI-SPAM: Cek Cooldown ===
    const cooldownKey = `upload-cooldown:${email}`;
    const cooldownData = await env.KV.get(cooldownKey);

    if (cooldownData) {
      const { expiresAt } = JSON.parse(cooldownData);
      const remaining = Math.ceil((expiresAt - Date.now()) / 1000);

      if (remaining > 0) {
        return new Response(JSON.stringify({
          error: `Tunggu ${remaining} detik lagi sebelum mengunggah lagi`,
          cooldown: remaining
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // === 3. Ambil Form Data ===
    const form = await request.formData();
    const file = form.get('file');
    const title = form.get('title') || '';

    if (!file) {
      return new Response(JSON.stringify({ error: "File tidak ditemukan" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // === 4. Upload ke R2 ===
    const fileKey = `${crypto.randomUUID()}-${file.name}`;
    
    await env.R2.put(fileKey, file.stream(), {
      httpMetadata: { contentType: file.type }
    });

    const type = file.type.startsWith('image/') ? 'image' : 'video';

    // === 5. Simpan ke KV ===
    const post = {
      id: crypto.randomUUID(),
      username: email.split('@')[0],
      fileKey,
      url: `/api/media/${fileKey}`,
      type,
      title,
      status: 'pending',
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: Date.now()
    };

    await env.KV.put(`post:${post.id}`, JSON.stringify(post));

    // === 6. SET COOLDOWN (30 detik) setelah berhasil upload ===
    await env.KV.put(cooldownKey, JSON.stringify({
      expiresAt: Date.now() + 30 * 1000   // 30 detik
    }), { 
      expirationTtl: 30 
    });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Post berhasil diunggah"
    }), { 
      headers: { 'Content-Type': 'application/json' } 
    });

  } catch (err) {
    console.error("Upload Error:", err);
    return new Response(JSON.stringify({ 
      error: "Terjadi kesalahan saat mengunggah" 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
