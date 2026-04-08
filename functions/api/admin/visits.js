export async function onRequest({ request, env }) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  const email = await env.KV.get(`session:${token}`);
  if (!email) return new Response('Unauthorized', { status: 401 });
  const userStr = await env.KV.get(`user:${email}`);
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') return new Response('Forbidden', { status: 403 });

  const { keys } = await env.KV.list({ prefix: 'visit:' });
  const visits = [];
  for (const k of keys) {
    const str = await env.KV.get(k.name);
    if (str) visits.push(JSON.parse(str));
  }

  visits.sort((a, b) => b.timestamp - a.timestamp);

  return new Response(JSON.stringify(visits), {
    headers: { 'Content-Type': 'application/json' }
  });
}
