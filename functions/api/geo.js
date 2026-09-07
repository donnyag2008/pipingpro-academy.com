// /functions/api/geo.js
// Cloudflare Pages Function — returns user's country and mapped language
// Cloudflare automatically provides CF-IPCountry header on every request

const BAHASA_COUNTRIES = new Set([
  'ID', // Indonesia
  'MY', // Malaysia
  'BN', // Brunei
  'SG', // Singapore (significant Malay-speaking population)
]);

// Only auto-switch for ID, MY, BN — Singapore stays English by default
// but we include it in the Bahasa-capable set so users can toggle
const AUTO_BAHASA = new Set(['ID', 'MY', 'BN']);

export async function onRequest(context) {
  const country = context.request.headers.get('CF-IPCountry') || 'XX';

  // Determine language
  // Priority: 1) query param override, 2) geo-detection
  const url = new URL(context.request.url);
  const langOverride = url.searchParams.get('lang');

  let lang = 'en';
  let autoDetected = true;

  if (langOverride === 'id' || langOverride === 'en') {
    lang = langOverride;
    autoDetected = false;
  } else if (AUTO_BAHASA.has(country)) {
    lang = 'id';
  }

  return new Response(JSON.stringify({
    country,
    lang,
    autoDetected,
    bahasaAvailable: BAHASA_COUNTRIES.has(country) || lang === 'id',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
