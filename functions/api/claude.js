// Cloudflare Pages Function: /api/claude
// Proxies requests to Anthropic API using the ANTHROPIC_API_KEY secret
// Same-origin call from pipingpro-academy.com — no CORS needed

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'API key not configured' } }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.text();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: body,
    });

    const responseBody = await response.text();
    return new Response(responseBody, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message } }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
