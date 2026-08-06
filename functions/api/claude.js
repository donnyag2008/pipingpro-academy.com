// Cloudflare Pages Function: /api/claude
// Proxies requests to Anthropic API with STREAMING to avoid Cloudflare 524 timeouts
// Collects streamed response and returns complete JSON

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'API key not configured' } }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = JSON.parse(await request.text());

    // Force streaming to avoid Cloudflare 524 timeout
    body.stream = true;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(errText, {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read the SSE stream and reconstruct the full response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let textContent = '';
    let stopReason = null;
    let model = '';
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'message_start' && event.message) {
            model = event.message.model || '';
            if (event.message.usage) inputTokens = event.message.usage.input_tokens || 0;
          }
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            textContent += event.delta.text || '';
          }
          if (event.type === 'message_delta') {
            stopReason = event.delta?.stop_reason || stopReason;
            if (event.usage) outputTokens = event.usage.output_tokens || 0;
          }
        } catch {}
      }
    }

    // Reconstruct the standard non-streaming response format
    const reconstructed = {
      content: [{ type: 'text', text: textContent }],
      model: model,
      stop_reason: stopReason,
      usage: { input_tokens: inputTokens, output_tokens: outputTokens },
    };

    return new Response(JSON.stringify(reconstructed), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: { message: err.message } }), {
      status: 502, headers: { 'Content-Type': 'application/json' },
    });
  }
}
