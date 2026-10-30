import type { EqPresetId } from '../types/station';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;

export const EQ_PRESETS: Record<EqPresetId, { label: string; gains: number[] }> = {
  flat: {
    label: 'Plano',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  lofi: {
    label: 'Lo-Fi Cálido',
    gains: [4, 3, 2, 1, 0, -1, -2, -3, -4, -5],
  },
  study: {
    label: 'Enfoque Estudio',
    gains: [-2, -1, 0, 1, 2, 2, 1, 0, -1, -2],
  },
  classical: {
    label: 'Clásica',
    gains: [0, 1, 2, 1, 0, 0, 1, 2, 3, 2],
  },
  bass: {
    label: 'Bass Boost',
    gains: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  },
};
