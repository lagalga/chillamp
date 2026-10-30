export const config = { runtime: 'edge' };

const MAX_HOPS = 5;

function corsHeaders(contentType: string | null): HeadersInit {
  return {
    'Content-Type': contentType ?? 'audio/mpeg',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Cache-Control': 'no-cache, no-store',
  };
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(null) });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const targetParam = new URL(req.url).searchParams.get('url');
  if (!targetParam) {
    return new Response('Missing url param', { status: 400 });
  }

  let target: string;
  try {
    target = decodeURIComponent(targetParam);
    // Validate absolute http(s) URL
    const parsed = new URL(target);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return new Response('Invalid URL protocol', { status: 400 });
    }
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  let upstream: Response | null = null;

  for (let hop = 0; hop < MAX_HOPS; hop++) {
    try {
      upstream = await fetch(target, {
        headers: {
          'User-Agent': 'ChillAmp/1.0',
          'Icy-MetaData': '0',
          Accept: '*/*',
        },
        redirect: 'manual',
      });
    } catch {
      return new Response('Upstream fetch failed', { status: 502 });
    }

    const status = upstream.status;
    if ([301, 302, 303, 307, 308].includes(status)) {
      const location = upstream.headers.get('location');
      if (!location) break;
      target = new URL(location, target).toString();
      continue;
    }
    break;
  }

  if (!upstream || !upstream.ok || !upstream.body) {
    return new Response('Upstream error', { status: upstream?.status ?? 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: corsHeaders(upstream.headers.get('content-type')),
  });
}
