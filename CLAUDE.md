# ChillAmp — notas para Claude

## Stack
React 18 + TypeScript + Vite + Zustand 5 + Web Audio API + Canvas API

## Arquitectura

```
App
└── AudioEngineProvider   (useAudioEngine hook vive aquí)
    └── WinampShell
        ├── PlayerWindow  (<audio> element + controles)
        ├── EqualizerWindow
        ├── VisualizerCanvas
        └── StationBrowser
```

El hook `useAudioEngine` se instancia en el provider, no en el componente. El `<audio>` element vive en `PlayerWindow` pero el ref se comparte vía contexto.

## Web Audio graph

```
(source) ──┬── filter[0]→...→filter[9] → eqGain ──┬── gain → analyser → destination
           └────────────────────────── bypassGain ──┘
```

- `eqEnabled=true`:  eqGain=1, bypassGain=0
- `eqEnabled=false`: eqGain=0, bypassGain=1

## Dos rutas de playback (crítico)

### Chrome/Firefox
`<audio>` element → `createMediaElementSource` → graph → destination  
crossOrigin se elimina en DEV (proxy same-origin), se pone 'anonymous' en PROD.

### Safari (IS_SAFARI constante al cargar el módulo)
`createMediaElementSource` silently falla con streams en vivo — la detección es userAgent.  
En su lugar: `fetch(proxyUrl)` → acumular chunks de 32 KB → `decodeAudioData` → `AudioBufferSourceNode` → graph → destination.  
El `<audio>` element NO se usa para playback en Safari, solo existía para error detection (actualmente no se usa en Safari).

## Proxy de streams (DEV)
`vite.config.ts` tiene un plugin `stream-proxy` que:
- Sirve `/api/stream?url=...`
- Sigue redirects hasta 5 hops
- Añade `Access-Control-Allow-Origin: *`

En PROD los streams se llaman directamente (necesitarían CORS o un proxy externo).

## Trampas conocidas

### React StrictMode + AudioContext
StrictMode double-invoca efectos: setup → cleanup → setup.  
`AudioContext.close()` es asíncrono, así que el segundo setup ve state='suspended' (pasa el guard) pero el close resuelve después y deja el ctx en 'closed' cuando el usuario hace play.  
**Solución**: NO llamar `ctx.close()` en el cleanup del efecto de mount. El browser GC se encarga al descargar la página.

### Zustand selectors — shallow equality
Todos los componentes que usen object selectors (`usePlayerStore((s) => ({...}))`) DEBEN usar `useShallow` de `zustand/react/shallow`. Sin ello se crea un objeto nuevo cada render → loop infinito de re-renders.

### Safari + streaming + decodeAudioData
- `decodeAudioData` en chunks de 32 KB funciona bien para MP3/AAC
- Latencia inicial ~2 s a 128 kbps (tiempo en acumular 32 KB + decode)
- Al pausar/cambiar estación el fetch reader se cancela (`reader.cancel()`) y los `AudioBufferSourceNode` activos se detienen con `.stop(0)`

## Estado global (playerStore)
No usa `persist` middleware — se eliminó porque causaba loops de hidratación en Zustand 5. Estado es efímero (se pierde al recargar). Si se quiere persistir volumen/skin en el futuro, usar `partialize` con cuidado y verificar que no cause re-renders durante hidratación.

## Mejoras pendientes posibles
- Persistir volumen, skin y modo viz (localStorage manual o persist con partialize)
- Metadata ICY (stream title/artist) — los streams Shoutcast/Icecast la envían como header `Icy-MetaData`
- Modo favoritos de estaciones
- Soporte teclado/media keys (MediaSession API)
- PWA / installable app
- Deploy: el proxy DEV no funciona en PROD — necesita un worker/edge proxy o CORS nativo
