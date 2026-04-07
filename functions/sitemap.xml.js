export async function onRequest({ env }) {
  // Daftar halaman statis
  const pages = [
    { url: '/', lastmod: '2026-04-07', changefreq: 'daily', priority: '1.0' },
    { url: '/login.html', lastmod: '2026-04-07', changefreq: 'monthly', priority: '0.8' },
    { url: '/register.html', lastmod: '2026-04-07', changefreq: 'monthly', priority: '0.8' },
    { url: '/admin.html', lastmod: '2026-04-07', changefreq: 'monthly', priority: '0.5' },
  ];

  // Kalau nanti ingin tambah dynamic posts (approved posts), bisa query KV di sini

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const baseUrl = 'https://' + (env.CF_PAGES_URL || 'cinestream.kraxx.my.id'); // atau hardcode domain

  for (const page of pages) {
    xml += `
  <url>
    <loc>${baseUrl}${page.url === '/' ? '' : page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }

  xml += '\n</urlset>';

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // cache 1 jam
    }
  });
}
