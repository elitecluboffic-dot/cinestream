export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const email = await env.KV.get(`session:${token}`)
  const user = JSON.parse(await env.KV.get(`user:${email}`))
  if (user.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { postId } = await request.json()
  const postStr = await env.KV.get(`post:${postId}`)
  const post = JSON.parse(postStr)
  post.status = 'approved'
  await env.KV.put(`post:${postId}`, JSON.stringify(post))
  return new Response(JSON.stringify({ success: true }))
}
