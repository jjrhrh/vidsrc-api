export const config = { runtime: 'edge' };

export default async function handler(req) {
  const url = new URL(req.url);
  const tmdb = url.searchParams.get('tmdb');
  const type = url.searchParams.get('type') || 'movie';
  const season = url.searchParams.get('season') || '1';
  const episode = url.searchParams.get('episode') || '1';

  if (!tmdb) return new Response(JSON.stringify({ error: 'tmdb required' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
  });

  const sources = [];

  // جرب vidsrc.me API مباشرة
  try {
    const apiUrl = type === 'movie'
      ? `https://vidsrc.me/embed/movie?tmdb=${tmdb}`
      : `https://vidsrc.me/embed/tv?tmdb=${tmdb}&season=${season}&episode=${episode}`;

    const r = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0',
        'Referer': 'https://vidsrc.me',
      },
    });
    const html = await r.text();

    // استخرج كل روابط m3u8
    const regex = /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/g;
    const matches = html.match(regex) || [];
    matches.forEach(u => {
      if (!sources.find(s => s.stream === u))
        sources.push({ stream: u, type: 'hls' });
    });

    // استخرج من JS المشفر
    const jsRegex = /["'](https?:\/\/[^"']+\.m3u8[^"']*)/g;
    let m;
    while ((m = jsRegex.exec(html)) !== null) {
      if (!sources.find(s => s.stream === m[1]))
        sources.push({ stream: m[1], type: 'hls' });
    }
  } catch(e) {}

  return new Response(JSON.stringify(sources), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    }
  });
}
