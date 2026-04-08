// functions/api/upload.js
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

    // === TAMBAHAN FIX: Validasi File ===
    if (file.size > 50 * 1024 * 1024) { // maksimal 50MB
      return new Response(JSON.stringify({ error: "Ukuran file maksimal 50MB" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "Format file tidak didukung. Hanya gambar dan video MP4/WebM" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // === 4. Upload ke R2 (Fix: gunakan file langsung, bukan .stream()) ===
    const fileExt = file.name.split('.').pop().toLowerCase();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileKey = `${crypto.randomUUID()}-${safeFileName}`;

    await env.R2.put(fileKey, file, {
      httpMetadata: { 
        contentType: file.type || 'application/octet-stream' 
      }
    });

    const type = file.type.startsWith('image/') ? 'image' : 'video';

    // === 5. Simpan ke KV ===
    const post = {
      id: crypto.randomUUID(),
      username: email.split('@')[0],
      fileKey,
      url: `/api/media/${fileKey}`,
      type,
      title: title.trim().slice(0, 100), // batasi judul
      status: 'pending',
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: Date.now()
    };

    await env.KV.put(`post:${post.id}`, JSON.stringify(post));

    // === 6. SET COOLDOWN (30 detik) setelah berhasil upload ===
    await env.KV.put(cooldownKey, JSON.stringify({
      expiresAt: Date.now() + 30 * 1000
    }), {
      expirationTtl: 30
    });

    return new Response(JSON.stringify({
      success: true,
      message: "Post berhasil diunggah dan menunggu persetujuan admin"
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error("Upload Error:", err);
    return new Response(JSON.stringify({
      error: "Terjadi kesalahan saat mengunggah. Silakan coba lagi."
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
