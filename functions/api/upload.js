export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const email = await env.KV.get(`session:${token}`)
  if (!email) return new Response('Unauthorized', { status: 401 })

  const form = await request.formData()
  const file = form.get('file')
  const title = form.get('title')

  const fileKey = `${crypto.randomUUID()}-${file.name}`
  await env.R2.put(fileKey, file.stream(), { httpMetadata: { contentType: file.type } })

  const type = file.type.startsWith('image/') ? 'image' : 'video'

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
  }

  await env.KV.put(`post:${post.id}`, JSON.stringify(post))
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
}
