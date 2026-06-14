// functions/api/quote.js
// Cloudflare Pages Function — proxies a Finnhub quote so your API key
// stays server-side and the browser avoids CORS issues.
//
// SETUP
// 1. Put this file at:  /functions/api/quote.js  (alongside your other api routes).
//    It will be served at:  /api/quote
// 2. In the Cloudflare dashboard: Pages → your project → Settings →
//    Environment variables → add  FINNHUB_KEY = <your key>  (mark it encrypted).
// 3. Deploy. The page calls /api/quote?t=NVDA and gets back Finnhub's JSON.
//
// Free Finnhub tier: ~60 calls/min, US quotes 15-min delayed — fine for a
// 4-ticker page polling once a minute.

const ALLOWED = new Set(["TSLA", "NVDA", "SPY", "AMD"]); // guard against arbitrary symbols

export async function onRequest({ request, env }) {
  const t = (new URL(request.url).searchParams.get("t") || "").toUpperCase();

  if (!ALLOWED.has(t)) {
    return json({ error: "unknown ticker" }, 400);
  }
  if (!env.FINNHUB_KEY) {
    return json({ error: "FINNHUB_KEY not set" }, 500);
  }

  try {
    const r = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${t}&token=${env.FINNHUB_KEY}`,
      { cf: { cacheTtl: 30, cacheEverything: true } } // cache 30s at the edge to spare your quota
    );
    if (!r.ok) return json({ error: "upstream " + r.status }, 502);

    const q = await r.json(); // { c, d, dp, h, l, o, pc, t }
    return json(q, 200);
  } catch (e) {
    return json({ error: "fetch failed" }, 502);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store"
    }
  });
}
