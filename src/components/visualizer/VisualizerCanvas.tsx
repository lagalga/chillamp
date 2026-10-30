import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { usePlayerStore } from '../../stores/playerStore';
import type { VizMode } from '../../types/station';
import type { RefObject } from 'react';

interface VisualizerCanvasProps {
  analyserRef: RefObject<AnalyserNode | null>;
}

const VIZ_MODES: { id: VizMode; label: string }[] = [
  { id: 'bars', label: 'Barras' },
  { id: 'wave', label: 'Onda' },
  { id: 'plasma', label: 'Plasma' },
  { id: 'particles', label: 'Partículas' },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
}

export function VisualizerCanvas({ analyserRef }: VisualizerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);

  const { vizMode, skin, isPlaying, setVizMode } = usePlayerStore(useShallow((s) => ({
    vizMode: s.vizMode,
    skin: s.skin,
    isPlaying: s.isPlaying,
    setVizMode: s.setVizMode,
  })));

  const psychedelic = skin === 'psychedelic';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initParticles = (w: number, h: number) => {
      particlesRef.current = Array.from({ length: 80 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        size: Math.random() * 4 + 1,
        hue: Math.random() * 360,
      }));
    };

    let rafId = 0;

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const analyser = analyserRef.current;

      if (particlesRef.current.length === 0) {
        initParticles(w, h);
      }

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, w, h);

      if (!isPlaying || !analyser) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);

      const bass = freqData.slice(0, 16).reduce((a, b) => a + b, 0) / 16 / 255;
      const treble = freqData.slice(freqData.length - 32).reduce((a, b) => a + b, 0) / 32 / 255;

      timeRef.current += 0.02;

      if (vizMode === 'bars' || reducedMotion) {
        const barCount = 48;
        const barWidth = w / barCount;
        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * freqData.length * 0.6);
          const value = freqData[dataIndex] / 255;
          const barHeight = value * h * 0.85;
          const x = i * barWidth;
          const hue = psychedelic ? (i * 8 + timeRef.current * 50) % 360 : 120 + value * 60;
          ctx.fillStyle = psychedelic
            ? `hsl(${hue}, 100%, 55%)`
            : `hsl(${hue}, 80%, ${40 + value * 30}%)`;
          ctx.fillRect(x + 1, h - barHeight, barWidth - 2, barHeight);
          if (!reducedMotion) {
            ctx.fillRect(x + 1, h - barHeight - 4, barWidth - 2, 2);
          }
        }
      } else if (vizMode === 'wave') {
        ctx.beginPath();
        ctx.strokeStyle = psychedelic ? '#ff00ff' : '#00ff00';
        ctx.lineWidth = 2;
        const sliceWidth = w / timeData.length;
        let x = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * h) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();

        if (psychedelic) {
          ctx.globalCompositeOperation = 'screen';
          ctx.strokeStyle = '#00ffff';
          ctx.beginPath();
          x = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * h) / 2 + Math.sin(i * 0.1 + timeRef.current * 3) * 20;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
          ctx.globalCompositeOperation = 'source-over';
        }
      } else if (vizMode === 'plasma') {
        // putImageData ignores transform, use physical canvas pixels
        const pw = canvas.width;
        const ph = canvas.height;
        const imageData = ctx.createImageData(pw, ph);
        const t = timeRef.current;
        for (let y = 0; y < ph; y += 2) {
          for (let x = 0; x < pw; x += 2) {
            const v =
              Math.sin(x * 0.02 + t + bass * 5) +
              Math.sin(y * 0.02 + t * 1.3 + treble * 5) +
              Math.sin((x + y) * 0.015 + t * 0.7);
            const hue = ((v + 2) * 90 + t * 40 + (psychedelic ? 120 : 0)) % 360;
            const r = Math.sin(hue * 0.017) * 127 + 128;
            const g = Math.sin((hue + 120) * 0.017) * 127 + 128;
            const b = Math.sin((hue + 240) * 0.017) * 127 + 128;
            const idx = (y * pw + x) * 4;
            imageData.data[idx] = r;
            imageData.data[idx + 1] = g;
            imageData.data[idx + 2] = b;
            imageData.data[idx + 3] = 255;
          }
        }
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.putImageData(imageData, 0, 0);
        ctx.restore();
      } else if (vizMode === 'particles') {
        const particles = particlesRef.current;
        for (const p of particles) {
          const force = bass * 3 + treble;
          p.x += p.vx * (1 + force);
          p.y += p.vy * (1 + force);
          p.hue = (p.hue + force * 2) % 360;

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          const size = p.size * (1 + bass * 2);
          ctx.beginPath();
          ctx.fillStyle = psychedelic
            ? `hsla(${p.hue}, 100%, 60%, 0.8)`
            : `hsla(${120 + p.hue * 0.1}, 70%, 50%, 0.7)`;
          ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255,255,255,${0.02 + bass * 0.05})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [analyserRef, vizMode, skin, isPlaying, psychedelic]);

  const toggleFullscreen = () => {
    const el = canvasRef.current?.parentElement;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen();
    }
  };

  return (
    <div className="viz-window">
      <div className="viz-toolbar">
        <div className="viz-modes" role="group" aria-label="Modo de visualización">
          {VIZ_MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              className={`winamp-btn-sm ${vizMode === mode.id ? 'active' : ''}`}
              onClick={() => setVizMode(mode.id)}
              aria-pressed={vizMode === mode.id}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <button type="button" className="winamp-btn-sm" onClick={toggleFullscreen}>
          Pantalla completa
        </button>
      </div>
      <canvas ref={canvasRef} className="viz-canvas" aria-label="Visualizador de audio" />
    </div>
  );
}
