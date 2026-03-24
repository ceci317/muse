const DASHSCOPE_API_BASE = 'https://dashscope.aliyuncs.com/api/v1';
const DASHSCOPE_REALTIME_ASR_URL = 'wss://dashscope.aliyuncs.com/api-ws/v1/realtime';

function json(data, status = 200, origin = '*') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}

function corsHeaders(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Provider-Key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function getAllowedOrigin(request, env) {
  const configured = String(env.ALLOWED_ORIGINS || '*').trim();
  if (configured === '*') return '*';

  const requestOrigin = request.headers.get('Origin');
  const allowed = configured.split(',').map(item => item.trim()).filter(Boolean);
  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }
  return allowed[0] || '*';
}

function getDashScopeKey(request, env) {
  return String(env.DASHSCOPE_API_KEY || request.headers.get('X-Provider-Key') || '').trim();
}

async function proxyDashScopeAsrWebSocket(request, env) {
  const apiKey = getDashScopeKey(request, env);
  if (!apiKey) {
    return new Response('DashScope API key is not configured', { status: 400 });
  }

  const upgradeHeader = request.headers.get('Upgrade');
  if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected Upgrade: websocket', { status: 426 });
  }

  const url = new URL(request.url);
  const model = String(url.searchParams.get('model') || 'qwen3-asr-flash-realtime').trim();
  const upstreamUrl = `${DASHSCOPE_REALTIME_ASR_URL}?model=${encodeURIComponent(model)}`;
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.set('Authorization', `bearer ${apiKey}`);
  upstreamHeaders.set('Connection', 'Upgrade');
  upstreamHeaders.set('Upgrade', 'websocket');

  const upstreamResponse = await fetch(new Request(upstreamUrl, {
    method: request.method,
    headers: upstreamHeaders,
  }));

  if (!upstreamResponse.webSocket) {
    const errorText = await upstreamResponse.text().catch(() => 'Unable to open upstream websocket');
    return new Response(errorText, { status: upstreamResponse.status || 502 });
  }

  return new Response(null, {
    status: 101,
    webSocket: upstreamResponse.webSocket,
  });
}

async function proxyDashScopeValidate(request, env, origin) {
  const apiKey = getDashScopeKey(request, env);
  if (!apiKey) {
    return json({ success: false, error: 'DashScope API key is not configured' }, 400, origin);
  }

  const response = await fetch(`${DASHSCOPE_API_BASE}/services/aigc/multimodal-generation/generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen3-tts-flash',
      input: {
        text: '测试',
        voice: 'Kai',
        language_type: 'Chinese',
      },
    }),
  });

  if (response.ok || response.status === 400) {
    return json({ success: true }, 200, origin);
  }

  return json({ success: false, error: await response.text() }, response.status, origin);
}

async function proxyDashScopeSynthesize(request, env, origin) {
  const apiKey = getDashScopeKey(request, env);
  if (!apiKey) {
    return json({ error: 'DashScope API key is not configured' }, 400, origin);
  }

  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim();
  const voice = String(body.voice || 'Kai');
  const languageType = String(body.language_type || 'Chinese');

  if (!text) {
    return json({ error: 'text is required' }, 400, origin);
  }

  const response = await fetch(`${DASHSCOPE_API_BASE}/services/aigc/multimodal-generation/generation`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen3-tts-flash',
      input: {
        text,
        voice,
        language_type: languageType,
      },
    }),
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json',
      ...corsHeaders(origin),
    },
  });
}

async function proxyAudioFetch(url, origin) {
  if (!url) {
    return json({ error: 'url is required' }, 400, origin);
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return json({ error: 'invalid url' }, 400, origin);
  }

  const allowedTokens = ['dashscope-result-', 'aliyuncs.com', 'oss-cn-'];
  if (!['http:', 'https:'].includes(parsed.protocol) || !allowedTokens.some(token => parsed.hostname.includes(token))) {
    return json({ error: 'unsupported audio host' }, 400, origin);
  }

  const upstream = await fetch(parsed.toString());
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'audio/wav',
      'Content-Length': upstream.headers.get('Content-Length') || undefined,
      ...corsHeaders(origin),
    },
  });
}

function minimaxNotReady(origin) {
  return json(
    {
      success: false,
      error: 'MiniMax worker scaffold is ready, but live API integration is not connected yet',
    },
    501,
    origin,
  );
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin),
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json(
        {
          ok: true,
          providers: {
            dashscope: Boolean(env.DASHSCOPE_API_KEY),
            minimax: Boolean(env.MINIMAX_API_KEY),
          },
        },
        200,
        origin,
      );
    }

    if (url.pathname === '/api/dashscope/validate' && request.method === 'POST') {
      return proxyDashScopeValidate(request, env, origin);
    }

    if (url.pathname === '/api/dashscope/synthesize' && request.method === 'POST') {
      return proxyDashScopeSynthesize(request, env, origin);
    }

    if (url.pathname === '/api/audio/fetch' && request.method === 'GET') {
      return proxyAudioFetch(url.searchParams.get('url'), origin);
    }

    if (url.pathname === '/ws/dashscope/asr') {
      return proxyDashScopeAsrWebSocket(request, env);
    }

    if (url.pathname === '/api/minimax/validate' && request.method === 'POST') {
      return minimaxNotReady(origin);
    }

    if (url.pathname === '/api/minimax/synthesize' && request.method === 'POST') {
      return minimaxNotReady(origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};
