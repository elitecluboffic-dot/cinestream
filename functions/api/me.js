export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return new Response('Unauthorized', { status: 401 })
  const email = await env.KV.get(`session:${token}`)
  if (!email) return new Response('Unauthorized', { status: 401 })
  const userStr = await env.KV.get(`user:${email}`)
  const user = JSON.parse(userStr)
  return new Response(JSON.stringify({ id: user.id, email: user.email, role: user.role }), { headers: { 'Content-Type': 'application/json' } })
}
