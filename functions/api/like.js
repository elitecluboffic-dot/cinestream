export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const email = await env.KV.get(`session:${token}`)
  if (!email) return new Response('Unauthorized', { status: 401 })

  const { postId } = await request.json()
  const postStr = await env.KV.get(`post:${postId}`)
  if (!postStr) return new Response('Not found', { status: 404 })

  const post = JSON.parse(postStr)
  if (!post.likedBy) post.likedBy = []

  const userStr = await env.KV.get(`user:${email}`)
  const user = JSON.parse(userStr)

  if (post.likedBy.includes(user.id)) {
    post.likedBy = post.likedBy.filter(id => id !== user.id)
    post.likes--
  } else {
    post.likedBy.push(user.id)
    post.likes++
  }

  await env.KV.put(`post:${postId}`, JSON.stringify(post))
  return new Response(JSON.stringify({ likes: post.likes }), { headers: { 'Content-Type': 'application/json' } })
}
