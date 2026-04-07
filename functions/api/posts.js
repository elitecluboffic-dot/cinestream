export async function onRequest({ request, env }) {
  const url = new URL(request.url)
  const approvedOnly = url.searchParams.get('approved') === 'true'

  const { keys } = await env.KV.list({ prefix: 'post:' })
  const posts = []

  for (const k of keys) {
    const str = await env.KV.get(k.name)
    if (str) {
      const post = JSON.parse(str)
      if (!approvedOnly || post.status === 'approved') posts.push(post)
    }
  }

  posts.sort((a, b) => b.createdAt - a.createdAt)
  return new Response(JSON.stringify(posts), { headers: { 'Content-Type': 'application/json' } })
}
