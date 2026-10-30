import { create } from 'zustand';
import { EQ_PRESETS } from '../constants/eq';
import type { Station } from '../types/station';
import type {
  EqPresetId,
  Mood,
  OpenWindows,
  SkinId,
  VizMode,
} from '../types/station';

interface PlayerState {
  currentStation: Station | null;
  stationQueue: Station[];
  queueIndex: number;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  skin: SkinId;
  eqBands: number[];
  eqPreset: EqPresetId;
  eqEnabled: boolean;
  vizMode: VizMode;
  openWindows: OpenWindows;
  streamError: string | null;
  isLoading: boolean;

  setStation: (station: Station) => void;
  setStationQueue: (stations: Station[], index?: number) => void;
  nextStation: () => void;
  prevStation: () => void;
  setPlaying: (playing: boolean) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setSkin: (skin: SkinId) => void;
  setEqBand: (index: number, gain: number) => void;
  setEqBands: (gains: number[]) => void;
  setEqPreset: (preset: EqPresetId) => void;
  setEqEnabled: (enabled: boolean) => void;
  setVizMode: (mode: VizMode) => void;
  toggleWindow: (window: keyof OpenWindows) => void;
  setStreamError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
  (set, get) => ({
      currentStation: null,
      stationQueue: [],
      queueIndex: 0,
      isPlaying: false,
      isMuted: false,
      volume: 0.75,
      skin: 'classic',
      eqBands: [...EQ_PRESETS.flat.gains],
      eqPreset: 'flat',
      eqEnabled: true,
      vizMode: 'bars',
      openWindows: {
        player: true,
        eq: true,
        viz: true,
        browser: true,
      },
      streamError: null,
      isLoading: false,

      setStation: (station) =>
        set({ currentStation: station, streamError: null }),

      setStationQueue: (stations, index = 0) =>
        set({
          stationQueue: stations,
          queueIndex: index,
          currentStation: stations[index] ?? null,
          streamError: null,
        }),

      nextStation: () => {
        const { stationQueue, queueIndex } = get();
        if (stationQueue.length === 0) return;
        const next = (queueIndex + 1) % stationQueue.length;
        set({
          queueIndex: next,
          currentStation: stationQueue[next],
          streamError: null,
        });
      },

      prevStation: () => {
        const { stationQueue, queueIndex } = get();
        if (stationQueue.length === 0) return;
        const prev = (queueIndex - 1 + stationQueue.length) % stationQueue.length;
        set({
          queueIndex: prev,
          currentStation: stationQueue[prev],
          streamError: null,
        });
      },

      setPlaying: (playing) => set({ isPlaying: playing }),
      setMuted: (muted) => set({ isMuted: muted }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
      setSkin: (skin) => set({ skin }),

      setEqBand: (index, gain) => {
        const bands = [...get().eqBands];
        bands[index] = gain;
        set({ eqBands: bands, eqPreset: 'flat' });
      },

      setEqBands: (gains) => set({ eqBands: gains }),

      setEqPreset: (preset) =>
        set({
          eqPreset: preset,
          eqBands: [...EQ_PRESETS[preset].gains],
        }),

      setEqEnabled: (enabled) => set({ eqEnabled: enabled }),
      setVizMode: (mode) => set({ vizMode: mode }),

      toggleWindow: (window) =>
        set((s) => ({
          openWindows: { ...s.openWindows, [window]: !s.openWindows[window] },
        })),

      setStreamError: (error) => set({ streamError: error }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
);

export const MOOD_LABELS: Record<Mood, string> = {
  lofi: 'Lo-Fi',
  chill: 'Chill',
  classical: 'Clásica',
  ambient: 'Ambient',
  study: 'Estudio',
  jazz: 'Jazz',
  all: 'Todas',
};
