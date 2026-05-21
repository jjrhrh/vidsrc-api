export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const tmdb = url.searchParams.get('tmdb');
  const type = url.searchParams.get('type') || 'movie';
  const season = url.searchParams.get('season') || '1';
  const episode = url.searchParams.get('episode') || '1';

  if (!tmdb) return new Response(JSON.stringify({ error: 'tmdb required' }), { status: 400 });

  const base = 'https://vidsrc.me/embed';
  const embedUrl = type === 'movie'
    ? `${base}/movie?tmdb=${tmdb}`
    : `${base}/tv?tmdb=${tmdb}&season=${season}&episode=${episode}`;

  try {
    const r = await fetch(embedUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 Chrome/124.0', 'Referer': 'https://vidsrc.me' },
    });
    const html = await r.text();
    const sources = [];
    const m3u8 = html.match(/https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/g) || [];
    m3u8.forEach(u => sources.push({ stream: u, type: 'hls' }));
    return new Response(JSON.stringify(sources), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  } catch(e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}
