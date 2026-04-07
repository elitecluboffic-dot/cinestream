export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const form = await request.formData()
  const email = form.get('email').toLowerCase()
  const password = form.get('password')

  const userStr = await env.KV.get(`user:${email}`)
  if (!userStr) return new Response(JSON.stringify({ error: 'User tidak ditemukan' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const user = JSON.parse(userStr)
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(user.salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (hash !== user.passwordHash) return new Response(JSON.stringify({ error: 'Password salah' }), { status: 401, headers: { 'Content-Type': 'application/json' } })

  const token = crypto.randomUUID()
  await env.KV.put(`session:${token}`, email, { expirationTtl: 86400 }) // 24 jam

  return new Response(JSON.stringify({ token, user: { id: user.id, email: user.email, role: user.role } }), { headers: { 'Content-Type': 'application/json' } })
}
