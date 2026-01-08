/**
 * Google Maps API 키 제공 API Route
 * 
 * Vercel 환경 변수에서 API 키를 읽어서 클라이언트에 제공합니다.
 * 서버 사이드에서만 환경 변수에 접근하므로 클라이언트에 노출되지 않습니다.
 */

export default function handler(req, res) {
    // GET 요청만 허용
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 환경 변수에서 API 키 가져오기
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'API key not configured' });
    }

    // API 키 반환
    res.status(200).json({ apiKey });
}

