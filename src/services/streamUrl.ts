/**
 * Resolve the playback URL for a radio station.
 *
 * - DEV: Vite `/api/stream` proxy (CORS-safe → Web Audio EQ/VU/viz works)
 * - PROD + VITE_STREAM_PROXY_URL: durable external proxy (e.g. Cloudflare Worker)
 * - PROD without proxy: direct station URL (reliable long playback; no Web Audio)
 *
 * Never use Vercel Edge `/api/stream` for live radio — it times out (~25s) and cuts audio.
 */
export function resolveStreamUrl(stationUrl: string): { url: string; webAudio: boolean } {
  if (import.meta.env.DEV) {
    return {
      url: `/api/stream?url=${encodeURIComponent(stationUrl)}`,
      webAudio: true,
    };
  }

  const external = (import.meta.env.VITE_STREAM_PROXY_URL as string | undefined)?.trim();
  if (external) {
    const base = external.replace(/\/$/, '');
    return {
      url: `${base}?url=${encodeURIComponent(stationUrl)}`,
      webAudio: true,
    };
  }

  return { url: stationUrl, webAudio: false };
}
