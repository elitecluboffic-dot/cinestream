export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const email = await env.KV.get(`session:${token}`);
  const user = email ? JSON.parse(await env.KV.get(`user:${email}`) || '{}') : null;
  if (!user || user.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  const { postId } = await request.json();
  const post = JSON.parse(await env.KV.get(`post:${postId}`) || 'null');
  if (!post) return new Response(JSON.stringify({ error: 'Post tidak ditemukan' }), { status: 404 });

  // Hapus dari R2
  if (post.fileKey) await env.R2.delete(post.fileKey);

  // Hapus dari KV
  await env.KV.delete(`post:${postId}`);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
