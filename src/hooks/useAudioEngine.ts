import { useCallback, useEffect, useRef, useState } from 'react';
import { EQ_FREQUENCIES } from '../constants/eq';
import { resolveStreamUrl } from '../services/streamUrl';
import { usePlayerStore } from '../stores/playerStore';

const STREAM_TIMEOUT_MS = 8000;
const FETCH_CHUNK_MIN = 32768; // 32 KB → ~2 s at 128 kbps before first decode attempt

// Safari's createMediaElementSource doesn't capture live streaming audio.
const IS_SAFARI =
  typeof navigator !== 'undefined' &&
  /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export interface VuLevels {
  left: number;
  right: number;
}

export function useAudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bypassGainRef = useRef<GainNode | null>(null);
  const eqGainRef = useRef<GainNode | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReaderRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const fetchNextTimeRef = useRef(0);
  const currentStreamUrlRef = useRef<string>('');
  const webAudioRef = useRef(false);

  const [vuLevels, setVuLevels] = useState<VuLevels>({ left: 0, right: 0 });
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const [webAudioEnabled, setWebAudioEnabled] = useState(false);

  const {
    currentStation,
    isPlaying,
    isMuted,
    volume,
    eqBands,
    eqEnabled,
    setPlaying,
    setStreamError,
    setLoading,
    nextStation,
  } = usePlayerStore();

  const initGraph = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') return;

    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;

      const gain = ctx.createGain();
      const bypassGain = ctx.createGain();
      const eqGain = ctx.createGain();

      const { eqEnabled, eqBands, volume, isMuted } = usePlayerStore.getState();

      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.4;
        filter.gain.value = eqBands[i] ?? 0;
        return filter;
      });

      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }
      filters[filters.length - 1].connect(eqGain);
      eqGain.connect(gain);
      bypassGain.connect(gain);
      gain.connect(analyser);
      analyser.connect(ctx.destination);

      bypassGain.gain.value = eqEnabled ? 0 : 1;
      eqGain.gain.value = eqEnabled ? 1 : 0;
      gain.gain.value = isMuted ? 0 : volume;

      ctxRef.current = ctx;
      filtersRef.current = filters;
      gainRef.current = gain;
      analyserRef.current = analyser;
      bypassGainRef.current = bypassGain;
      eqGainRef.current = eqGain;
    } catch (e) {
      console.warn('[AudioEngine] initGraph failed:', e);
    }
  }, []);

  const connectSource = useCallback(() => {
    const audio = audioRef.current;
    const ctx = ctxRef.current;
    if (!audio || !ctx || sourceRef.current) return;

    try {
      const source = ctx.createMediaElementSource(audio);
      source.connect(filtersRef.current[0]);
      source.connect(bypassGainRef.current!);
      sourceRef.current = source;
    } catch (e) {
      console.warn('[AudioEngine] connectSource failed:', e);
    }
  }, []);

  const stopFetchStream = useCallback(() => {
    fetchReaderRef.current?.cancel();
    fetchReaderRef.current = null;
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop(0);
      } catch {
        /* already stopped */
      }
    });
    activeSourcesRef.current.clear();
  }, []);

  const startFetchStream = useCallback(
    async (url: string) => {
      stopFetchStream();
      const ctx = ctxRef.current;
      if (!ctx) return;

      let res: Response;
      try {
        res = await fetch(url);
      } catch {
        setStreamError('Error al conectar con la estación. Probando siguiente...');
        setTimeout(() => nextStation(), 1500);
        return;
      }

      if (!res.ok || !res.body) {
        setStreamError('Error al cargar la estación. Probando siguiente...');
        setTimeout(() => nextStation(), 1500);
        return;
      }

      const reader = res.body.getReader();
      fetchReaderRef.current = reader;
      fetchNextTimeRef.current = ctx.currentTime + 0.3;

      setLoading(false);
      setStreamError(null);
      setPlaying(true);

      let pending = new Uint8Array(0);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const merged = new Uint8Array(pending.length + value.length);
          merged.set(pending);
          merged.set(value, pending.length);
          pending = merged;

          if (pending.length < FETCH_CHUNK_MIN) continue;

          let decoded: AudioBuffer;
          try {
            decoded = await ctx.decodeAudioData(pending.buffer.slice(0));
            pending = new Uint8Array(0);
          } catch {
            continue;
          }

          const bufSrc = ctx.createBufferSource();
          bufSrc.buffer = decoded;
          bufSrc.connect(filtersRef.current[0]);
          bufSrc.connect(bypassGainRef.current!);

          activeSourcesRef.current.add(bufSrc);
          bufSrc.onended = () => activeSourcesRef.current.delete(bufSrc);

          const startAt = Math.max(ctx.currentTime + 0.05, fetchNextTimeRef.current);
          bufSrc.start(startAt);
          fetchNextTimeRef.current = startAt + decoded.duration;
        }
      } catch {
        // Reader cancelled — expected on stop/station change
      }

      setPlaying(false);
    },
    [stopFetchStream, setLoading, setPlaying, setStreamError, nextStation],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopFetchStream();
    };
  }, [stopFetchStream]);

  const clearStreamTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startStreamTimeout = useCallback(() => {
    clearStreamTimeout();
    timeoutRef.current = setTimeout(() => {
      setStreamError('La estación no responde. Probando siguiente...');
      nextStation();
    }, STREAM_TIMEOUT_MS);
  }, [clearStreamTimeout, nextStation, setStreamError]);

  const play = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const useWebAudio = webAudioRef.current;

    try {
      if (useWebAudio) {
        initGraph();
        const ctx = ctxRef.current;
        if (!ctx) return;
        if (ctx.state === 'suspended') await ctx.resume();

        if (IS_SAFARI) {
          void startFetchStream(currentStreamUrlRef.current);
          setNeedsInteraction(false);
          return;
        }

        connectSource();
      }

      await audio.play();
      setPlaying(true);
      setNeedsInteraction(false);
      setStreamError(null);
    } catch (e) {
      console.warn('[AudioEngine] play failed:', e);
      setNeedsInteraction(true);
      setPlaying(false);
    }
  }, [initGraph, connectSource, startFetchStream, setPlaying, setStreamError]);

  const pause = useCallback(() => {
    if (IS_SAFARI && webAudioRef.current) {
      stopFetchStream();
      setPlaying(false);
    } else {
      audioRef.current?.pause();
      setPlaying(false);
    }
  }, [stopFetchStream, setPlaying]);

  const stop = useCallback(() => {
    if (IS_SAFARI && webAudioRef.current) {
      stopFetchStream();
      setPlaying(false);
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.currentTime = 0;
      setPlaying(false);
    }
  }, [stopFetchStream, setPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentStation) return;

    const shouldAutoPlay = isPlaying;
    const { url: streamUrl, webAudio } = resolveStreamUrl(currentStation.url);
    webAudioRef.current = webAudio;
    setWebAudioEnabled(webAudio);
    currentStreamUrlRef.current = streamUrl;

    setLoading(true);
    clearStreamTimeout();
    startStreamTimeout();
    stopFetchStream();

    // Safari + CORS proxy → fetch/decode pipeline for Web Audio
    if (IS_SAFARI && webAudio) {
      clearStreamTimeout();
      if (shouldAutoPlay) {
        void play();
      } else {
        setLoading(false);
      }
      return () => {
        stopFetchStream();
      };
    }

    // Element playback (Chrome/Firefox always; Safari without proxy)
    audio.removeAttribute('crossorigin');
    audio.src = streamUrl;
    audio.load();

    const onCanPlay = () => {
      clearStreamTimeout();
      setLoading(false);
      setStreamError(null);
      if (shouldAutoPlay) void play();
    };

    const onError = () => {
      clearStreamTimeout();
      setLoading(false);
      setStreamError('Error al cargar la estación. Probando siguiente...');
      setTimeout(() => nextStation(), 1500);
    };

    const onPlaying = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      clearStreamTimeout();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStation?.url]);

  useEffect(() => {
    const v = isMuted ? 0 : volume;
    if (gainRef.current) {
      gainRef.current.gain.value = v;
    }
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    filtersRef.current.forEach((filter, i) => {
      filter.gain.value = eqBands[i] ?? 0;
    });
  }, [eqBands]);

  useEffect(() => {
    if (bypassGainRef.current && eqGainRef.current) {
      if (eqEnabled) {
        bypassGainRef.current.gain.value = 0;
        eqGainRef.current.gain.value = 1;
      } else {
        bypassGainRef.current.gain.value = 1;
        eqGainRef.current.gain.value = 0;
      }
    }
  }, [eqEnabled]);

  useEffect(() => {
    let rafId = 0;

    const updateVu = () => {
      const analyser = analyserRef.current;
      if (analyser && isPlaying && webAudioEnabled) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);

        const bassRange = Math.floor(data.length * 0.08);
        let leftSum = 0;
        let rightSum = 0;
        let total = 0;

        for (let i = 0; i < data.length; i++) {
          total += data[i];
          if (i < bassRange) {
            if (i % 2 === 0) leftSum += data[i];
            else rightSum += data[i];
          }
        }

        const overall = total / data.length / 255;
        const left = (leftSum / (bassRange / 2 || 1)) / 255 || overall;
        const right = (rightSum / (bassRange / 2 || 1)) / 255 || overall;

        setVuLevels({
          left: Math.min(1, left * 1.4),
          right: Math.min(1, right * 1.4),
        });
      } else {
        setVuLevels({ left: 0, right: 0 });
      }
      rafId = requestAnimationFrame(updateVu);
    };

    rafId = requestAnimationFrame(updateVu);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, webAudioEnabled]);

  return {
    audioRef,
    analyserRef,
    vuLevels,
    needsInteraction,
    webAudioEnabled,
    play,
    pause,
    stop,
  };
}
