export async function onRequest({ env }) {
  const baseUrl = 'https://cinestream.kraxx.my.id';

  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/login.html', changefreq: 'monthly', priority: '0.8' },
    { url: '/register.html', changefreq: 'monthly', priority: '0.8' },
  ];

  const dynamicUrls = [];
  try {
    let cursor;
    do {
      const listed = await env.KV.list({ prefix: 'post:', cursor });

      for (const key of listed.keys) {
        const raw = await env.KV.get(key.name);
        if (!raw) continue;

        const post = JSON.parse(raw);
        if (post.status !== 'approved') continue;

        const lastmod = new Date(post.createdAt).toISOString().split('T')[0];

        dynamicUrls.push({
          url: post.url, // /api/media/posts/xxx atau /api/media/xxx
          lastmod,
          changefreq: 'weekly',
          priority: '0.7',
        });
      }

      cursor = listed.list_complete ? null : listed.cursor;
    } while (cursor);

  } catch (err) {
    console.error('KV fetch error:', err);
  }

  const today = new Date().toISOString().split('T')[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url === '/' ? '' : page.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  for (const post of dynamicUrls) {
    xml += `
  <url>
    <loc>${baseUrl}${post.url}</loc>
    <lastmod>${post.lastmod}</lastmod>
    <changefreq>${post.changefreq}</changefreq>
    <priority>${post.priority}</priority>
  </url>`;
  }

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
