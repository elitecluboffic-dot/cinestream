export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const email = await env.KV.get(`session:${token}`)
  if (!email) return new Response('Unauthorized', { status: 401 })
  const userStr = await env.KV.get(`user:${email}`)
  const user = JSON.parse(userStr)
  if (user.role !== 'admin') return new Response('Forbidden', { status: 403 })

  const { keys } = await env.KV.list({ prefix: 'post:' })
  const posts = []
  for (const k of keys) {
    const str = await env.KV.get(k.name)
    if (str) {
      const p = JSON.parse(str)
      if (p.status === 'pending') posts.push(p)
    }
  }
  return new Response(JSON.stringify(posts), { headers: { 'Content-Type': 'application/json' } })
}
