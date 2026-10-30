import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';

function proxyStream(
  targetUrl: string,
  req: IncomingMessage,
  res: ServerResponse,
  hops = 0,
): void {
  if (hops > 5) {
    res.statusCode = 502;
    res.end('Too many redirects');
    return;
  }

  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    res.statusCode = 400;
    res.end('Invalid URL');
    return;
  }

  const lib = url.protocol === 'https:' ? https : http;

  const proxyReq = lib.get(
    url.toString(),
    { headers: { 'User-Agent': 'ChillAmp/1.0', 'Icy-MetaData': '0' } },
    (proxyRes) => {
      const status = proxyRes.statusCode ?? 200;
      if ([301, 302, 303, 307, 308].includes(status) && proxyRes.headers.location) {
        proxyRes.resume();
        proxyStream(proxyRes.headers.location, req, res, hops + 1);
        return;
      }

      res.writeHead(200, {
        'Content-Type': proxyRes.headers['content-type'] ?? 'audio/mpeg',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      });

      proxyRes.pipe(res);
      req.on('close', () => proxyReq.destroy());
    },
  );

  proxyReq.on('error', () => {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Proxy error');
    }
  });
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'stream-proxy',
      configureServer(server) {
        server.middlewares.use('/api/stream', (req, res) => {
          const reqUrl = new URL(req.url ?? '', 'http://localhost');
          const target = reqUrl.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            res.end('Missing url param');
            return;
          }
          proxyStream(decodeURIComponent(target), req, res);
        });
      },
    },
  ],
  server: {
    proxy: {
      '/api/radio': {
        target: 'https://de1.api.radio-browser.info',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/radio/, '/json'),
      },
    },
  },
});
