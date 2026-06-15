// Cloudflare Worker — CORS proxy for the DeGiro Portfolio Dashboard.
//
// Yahoo Finance and Stooq do not send CORS headers, so a browser-only app
// hosted on GitHub Pages cannot call them directly. This Worker forwards
// requests to an allowlisted set of upstream hosts and adds the CORS header
// the browser needs. It is intentionally NOT an open relay.
//
// Routes:
//   GET /yahoo/<path><query>   -> https://query2.finance.yahoo.com/<path><query>
//   GET /stooq/<path><query>   -> https://stooq.com/<path><query>
//
// Deploy with `wrangler deploy` (see README.md).

// Origins allowed to call this Worker. Update GH_PAGES_ORIGIN to your
// GitHub Pages origin (scheme + host, no path).
const GH_PAGES_ORIGIN = 'https://josbrinkie2.github.io';
const ALLOWED_ORIGINS = new Set([
  GH_PAGES_ORIGIN,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

// Upstream hosts this Worker is permitted to forward to.
const UPSTREAMS = {
  yahoo: 'https://query2.finance.yahoo.com',
  stooq: 'https://stooq.com',
};

// A browser-like User-Agent — Yahoo rejects some default/datacenter agents.
const UPSTREAM_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function corsHeaders(origin) {
  // Echo the request origin only if it is allowlisted; otherwise omit the
  // header (browser will block) so this can't be abused from arbitrary sites.
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : GH_PAGES_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin');
    const cors = corsHeaders(origin);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: cors });
    }

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean);
    const key = segments.shift(); // "yahoo" | "stooq"
    const base = UPSTREAMS[key];
    if (!base) {
      return new Response('Not Found', { status: 404, headers: cors });
    }

    const upstreamUrl = `${base}/${segments.join('/')}${url.search}`;

    try {
      const upstream = await fetch(upstreamUrl, {
        headers: { 'User-Agent': UPSTREAM_UA, Accept: '*/*' },
        // Cache at the edge briefly to soften bursts / rate limits.
        cf: { cacheTtl: 30, cacheEverything: true },
      });

      const headers = new Headers(cors);
      const contentType = upstream.headers.get('Content-Type');
      if (contentType) headers.set('Content-Type', contentType);
      headers.set('Cache-Control', 'public, max-age=30');

      return new Response(upstream.body, { status: upstream.status, headers });
    } catch {
      return new Response('Upstream fetch failed', { status: 502, headers: cors });
    }
  },
};
