/**
 * Pages Function — public read API for the feed pages.
 *   GET /api/feed?type=jobs   &discipline=&region=&contract=&software=&q=
 *   GET /api/feed?type=awards &scope=&stage=&region=&q=
 * Read-only, no auth (this surface is meant to be public + Google-indexed).
 * Binding: D1 as env.DB (wrangler / Pages dashboard).
 */
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const type = u.searchParams.get('type') === 'awards' ? 'awards' : 'jobs';
  const q = (u.searchParams.get('q') || '').trim().toLowerCase();
  const limit = Math.min(parseInt(u.searchParams.get('limit') || '60', 10), 100);

  let sql, binds = [];
  if (type === 'jobs') {
    sql = `SELECT id,title,employer,discipline,software,contract_type,region,country,city,
                  rate_band,apply_url,publisher,posted_at
           FROM jobs WHERE status='live' AND expires_at > datetime('now')`;
    const eq = (col, p) => { const v = u.searchParams.get(p); if (v) { sql += ` AND ${col}=?`; binds.push(v); } };
    eq('discipline', 'discipline'); eq('region', 'region'); eq('contract_type', 'contract');
    const sw = u.searchParams.get('software');
    if (sw) { sql += ` AND software LIKE ?`; binds.push(`%${sw}%`); }
    if (q) { sql += ` AND (lower(title) LIKE ? OR lower(employer) LIKE ?)`; binds.push(`%${q}%`, `%${q}%`); }
    sql += ` ORDER BY COALESCE(posted_at, created_at) DESC LIMIT ?`; binds.push(limit);
  } else {
    sql = `SELECT id,headline,summary,operator,contractor,project,scope,stage,region,country,
                  location,value_usd,value_text,awarded_date,source_url,publisher
           FROM awards WHERE status='live'`;
    const eq = (col, p) => { const v = u.searchParams.get(p); if (v) { sql += ` AND ${col}=?`; binds.push(v); } };
    eq('scope', 'scope'); eq('stage', 'stage'); eq('region', 'region');
    if (q) { sql += ` AND (lower(headline) LIKE ? OR lower(operator) LIKE ? OR lower(contractor) LIKE ?)`; binds.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    sql += ` ORDER BY COALESCE(awarded_date, created_at) DESC LIMIT ?`; binds.push(limit);
  }

  const { results } = await env.DB.prepare(sql).bind(...binds).all();
  if (type === 'jobs') results.forEach(r => { try { r.software = JSON.parse(r.software || '[]'); } catch { r.software = []; } });

  return new Response(JSON.stringify({ type, count: results.length, items: results }), {
    headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=600' },
  });
}
