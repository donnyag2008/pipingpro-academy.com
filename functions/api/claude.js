// Cloudflare Pages Function: /api/claude
// Proxies requests to Anthropic API with STREAMING to avoid Cloudflare 524 timeouts
// Handles both text and tool_use content blocks
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

    // Track all content blocks (text + tool_use)
    const contentBlocks = [];
    let currentBlockIndex = -1;
    let stopReason = null;
    let model = '';
    let inputTokens = 0;
    let outputTokens = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        try {
          const event = JSON.parse(data);

          // Message start — capture model and input tokens
          if (event.type === 'message_start' && event.message) {
            model = event.message.model || '';
            if (event.message.usage) inputTokens = event.message.usage.input_tokens || 0;
          }

          // Content block start — new text or tool_use block
          if (event.type === 'content_block_start') {
            currentBlockIndex = event.index;
            const cb = event.content_block;
            if (cb.type === 'text') {
              contentBlocks[currentBlockIndex] = { type: 'text', text: cb.text || '' };
            } else if (cb.type === 'tool_use') {
              contentBlocks[currentBlockIndex] = {
                type: 'tool_use',
                id: cb.id,
                name: cb.name,
                input: '',  // will accumulate JSON string, parse at end
              };
            }
          }

          // Content block delta — append text or tool input JSON
          if (event.type === 'content_block_delta') {
            const idx = event.index;
            const block = contentBlocks[idx];
            if (block && event.delta) {
              if (event.delta.type === 'text_delta') {
                block.text += event.delta.text || '';
              } else if (event.delta.type === 'input_json_delta') {
                block.input += event.delta.partial_json || '';
              }
            }
          }

          // Message delta — stop reason and output tokens
          if (event.type === 'message_delta') {
            stopReason = event.delta?.stop_reason || stopReason;
            if (event.usage) outputTokens = event.usage.output_tokens || 0;
          }

        } catch {}
      }
    }

    // Parse tool_use input JSON strings into objects
    for (const block of contentBlocks) {
      if (block && block.type === 'tool_use' && typeof block.input === 'string') {
        try {
          block.input = JSON.parse(block.input || '{}');
        } catch {
          block.input = {};
        }
      }
    }

    // Reconstruct standard non-streaming response
    const reconstructed = {
      content: contentBlocks.filter(Boolean),
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
