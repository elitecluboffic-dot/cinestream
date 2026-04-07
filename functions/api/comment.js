export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const email = await env.KV.get(`session:${token}`)
  if (!email) return new Response('Unauthorized', { status: 401 })

  const { postId, text } = await request.json()
  const postStr = await env.KV.get(`post:${postId}`)
  if (!postStr) return new Response('Not found', { status: 404 })

  const post = JSON.parse(postStr)
  if (!post.comments) post.comments = []

  post.comments.unshift({
    id: crypto.randomUUID(),
    username: email.split('@')[0],
    text,
    createdAt: Date.now()
  })

  await env.KV.put(`post:${postId}`, JSON.stringify(post))
  return new Response(JSON.stringify({ comments: post.comments }), { headers: { 'Content-Type': 'application/json' } })
}
