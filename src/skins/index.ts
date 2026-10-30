import type { SkinId } from '../types/station';

export interface SkinInfo {
  id: SkinId;
  label: string;
  preview: string;
}

export const SKINS: SkinInfo[] = [
  { id: 'classic', label: 'Clásico', preview: '#3c3c3c' },
  { id: 'midnight', label: 'Midnight', preview: '#141c2e' },
  { id: 'cassette', label: 'Cassette', preview: '#4a3c2e' },
  { id: 'psychedelic', label: 'Psicodélico', preview: '#2d1b4e' },
];
