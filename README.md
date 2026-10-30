# ChillAmp

Reproductor web retro estilo Winamp para escuchar radio lo-fi, chill, clásica y ambient.

## Características

- **Estética Winamp** con ventanas modulares
- **4 skins** intercambiables en vivo: Clásico, Midnight, Cassette, Psicodélico
- **Ecualizador** de 10 bandas con presets (Plano, Lo-Fi Cálido, Enfoque Estudio, Clásica, Bass Boost)
- **Visualizador** con 4 modos: Barras, Onda, Plasma, Partículas
- **VU meter** estéreo en tiempo real
- **Fuentes de música**: [Radio Browser API](https://www.radio-browser.info/) + estaciones curadas
- **Compatible con Chrome, Firefox y Safari**

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

En local, Vite proxa los streams (`/api/stream`) con CORS para que Web Audio (EQ / VU / viz) funcione.

## Build / Vercel

```bash
npm run build
```

### Por qué el audio se cortaba en Vercel

El proxy en una **Edge Function de Vercel** tiene límite de duración (~25 s). Un stream de radio en vivo se corta cuando la función muere.

**Comportamiento actual en producción (sin config extra):**
- Reproducción **directa** desde la URL de la emisora → no se corta
- EQ / VU / visualizador quedan inactivos (hace falta CORS)

### Activar EQ / VU / viz en producción (Cloudflare Worker)

1. Cuenta gratis en [Cloudflare](https://dash.cloudflare.com/)
2. Desde este repo:

```bash
npx wrangler deploy workers/stream-proxy.js --name chillamp-stream-proxy
```

3. Copia la URL del worker (ej. `https://chillamp-stream-proxy.<subdomain>.workers.dev`)
4. En Vercel → Project → **Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `VITE_STREAM_PROXY_URL` | `https://chillamp-stream-proxy.<subdomain>.workers.dev` |

5. **Redeploy** el proyecto (Vite inyecta la variable en build time)

## Uso

1. Selecciona una categoría en el panel **LISTA**
2. Haz clic en una estación
3. Pulsa **▶**
4. Cambia skins con las miniaturas de color
5. Abre **EQ** / **VIS** (en prod, tras configurar el proxy)

## Stack

- React 18 + TypeScript + Vite
- Zustand (estado global)
- Web Audio API (EQ, VU meter, análisis FFT)
- Canvas API (visualizaciones)

## Licencia

MIT
