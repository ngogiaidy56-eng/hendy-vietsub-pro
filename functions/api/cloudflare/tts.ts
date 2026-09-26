function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function readJson(request: Request): Promise<Record<string, unknown>> {
  try {
    const value = await request.json();
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function response(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

export const onRequest = async (context: any): Promise<Response> => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (context.request.method !== 'POST') return response({ success: false, error: 'Method Not Allowed' }, 405);

  const body = await readJson(context.request);
  const env = context.env as Record<string, string | undefined>;
  const text = String(body.text || '').trim();
  const accountId = String(body.accountId || env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const apiToken = String(body.apiToken || env.CLOUDFLARE_API_TOKEN || '').trim();

  if (!text) return response({ success: false, error: 'Text is required' }, 400);
  if (!accountId || !apiToken) {
    return response({
      success: true,
      audioBase64: null,
      fallbackText: text,
      provider: 'ready_for_credentials',
      message: 'Cloudflare Workers AI credentials chưa được cấu hình. Có thể dùng Gemini TTS hoặc trình đọc của trình duyệt.',
    });
  }

  try {
    // Current Cloudflare model identifier and input fields.
    const model = '@cf/myshell-ai/melotts';
    const modelPath = model.split('/').map(encodeURIComponent).join('/');
    const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${modelPath}`;
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg, application/json',
      },
      body: JSON.stringify({
        prompt: text,
        lang: 'vi',
      }),
    });

    const contentType = upstream.headers.get('content-type') || '';
    if (!upstream.ok) {
      const message = await upstream.text();
      throw new Error(`Cloudflare AI ${upstream.status}: ${message.slice(0, 400)}`);
    }

    if (contentType.includes('application/json')) {
      const data = (await upstream.json()) as any;
      const base64 = typeof data?.result?.audio === 'string'
        ? data.result.audio
        : typeof data?.audio === 'string'
          ? data.audio
          : null;
      if (base64) {
        return response({ success: true, audioBase64: base64, mimeType: 'audio/mpeg', provider: 'cloudflare' });
      }
    } else {
      const buffer = new Uint8Array(await upstream.arrayBuffer());
      return response({ success: true, audioBase64: bytesToBase64(buffer), mimeType: 'audio/mpeg', provider: 'cloudflare' });
    }

    throw new Error('Cloudflare AI returned no audio data');
  } catch (error) {
    return response({
      success: true,
      audioBase64: null,
      fallbackText: text,
      provider: 'client_fallback',
      warning: error instanceof Error ? error.message : String(error),
    });
  }
};
