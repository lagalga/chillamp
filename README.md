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

En desarrollo, los streams de radio se proxean a través de Vite para evitar problemas de CORS y permitir que el Web Audio API funcione.

## Build

```bash
npm run build
npm run preview
```

> **Nota de producción**: el proxy de streams solo funciona en dev. En producción los streams se llaman directamente desde el cliente — las estaciones deben tener CORS habilitado o se necesita un proxy externo (worker, edge function, etc.).

## Uso

1. Selecciona una categoría (Lo-Fi, Chill, Clásica, etc.) en el panel **LISTA**
2. Haz clic en una estación
3. Pulsa **▶** — el navegador puede pedir interacción de usuario la primera vez
4. Cambia skins con las miniaturas de color en el player
5. Abre **EQ** para ecualizar, **VIS** para el visualizador

## Stack

- React 18 + TypeScript + Vite
- Zustand (estado global)
- Web Audio API (EQ, VU meter, análisis FFT)
- Canvas API (visualizaciones)

## Licencia

MIT
