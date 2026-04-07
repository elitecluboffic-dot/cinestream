// functions/api/admin/reject-post.js
export async function onRequest({ request, env }) {
  try {
    // === 1. Cek Authorization ===
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: "Token tidak ditemukan" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // === 2. Cek Session ===
    const email = await env.KV.get(`session:${token}`);
    if (!email) {
      return new Response(JSON.stringify({ error: "Session expired atau tidak valid" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    // === 3. Cek User & Role Admin ===
    const userStr = await env.KV.get(`user:${email}`);
    if (!userStr) {
      return new Response(JSON.stringify({ error: "User tidak ditemukan" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      return new Response(JSON.stringify({ error: "Hanya admin yang boleh reject post" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }

    // === 4. Ambil postId ===
    const { postId } = await request.json();
    if (!postId) {
      return new Response(JSON.stringify({ error: "postId diperlukan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // === 5. Ambil data post ===
    const postStr = await env.KV.get(`post:${postId}`);
    if (!postStr) {
      return new Response(JSON.stringify({ error: "Post tidak ditemukan" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    const post = JSON.parse(postStr);

    // === 6. HAPUS FILE DI R2 (Foto & Video) ===
    if (post.media && Array.isArray(post.media)) {
      for (const item of post.media) {
        if (item?.key) {
          try {
            await env.R2.delete(item.key);
            console.log(`✅ Deleted from R2: ${item.key}`);
          } catch (e) {
            console.error(`Gagal hapus ${item.key}:`, e);
          }
        }
      }
    }

    // Hapus thumbnail kalau ada
    if (post.thumbnailKey) {
      try {
        await env.R2.delete(post.thumbnailKey);
      } catch (e) {
        console.error(`Gagal hapus thumbnail:`, e);
      }
    }

    // === 7. Update status menjadi rejected ===
    post.status = 'rejected';
    post.rejectedAt = Date.now();
    post.rejectedBy = email;

    await env.KV.put(`post:${postId}`, JSON.stringify(post));

    return new Response(JSON.stringify({ 
      success: true,
      message: "Post berhasil direject dan file media dihapus dari R2"
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Reject Post Error:", err);
    return new Response(JSON.stringify({ 
      error: "Terjadi kesalahan saat memproses reject" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
