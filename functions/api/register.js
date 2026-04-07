export async function onRequest({ request, env }) {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const form = await request.formData()
  const email = form.get('email').toLowerCase()
  const password = form.get('password')

  if (await env.KV.get(`user:${email}`)) {
    return new Response(JSON.stringify({ error: 'Email sudah terdaftar' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const salt = crypto.randomUUID()
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const hashBuffer = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256)
  const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

  const user = {
    id: crypto.randomUUID(),
    email,
    passwordHash: hash,
    salt,
    role: email.includes('admin') ? 'admin' : 'user'
  }

  await env.KV.put(`user:${email}`, JSON.stringify(user))
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } })
}
