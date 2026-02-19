/**
 * 디테일 페이지 동적 sitemap
 * 백엔드 GET /map/rent/sitemap 응답(List<SiteMapSimple>)을 받아
 * /map/detail/{producer}/{id}, /jp/map/detail/{producer}/{id} URL을 XML로 반환합니다.
 */

const BACKEND_SITEMAP_URL = 'https://www.houberapp.com/map/rent/sitemap';
const BASE_URL = 'https://www.ilgongjp.com';

function escapeXml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  try {
    const response = await fetch(BACKEND_SITEMAP_URL);
    if (!response.ok) {
      throw new Error(`Backend sitemap API failed: ${response.status}`);
    }
    const list = await response.json();
    if (!Array.isArray(list)) {
      throw new Error('Backend sitemap API did not return an array');
    }

    const urls = [];
    for (const item of list) {
      const producer = item?.producer;
      const id = item?.id;
      if (producer != null && id != null) {
        urls.push(`${BASE_URL}/map/detail/${encodeURIComponent(producer)}/${encodeURIComponent(id)}`);
        urls.push(`${BASE_URL}/jp/map/detail/${encodeURIComponent(producer)}/${encodeURIComponent(id)}`);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    return res.status(200).send(xml);
  } catch (err) {
    console.error('sitemap-detail error:', err);
    return res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>');
  }
}
