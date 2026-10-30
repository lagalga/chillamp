export type Mood = 'lofi' | 'chill' | 'classical' | 'ambient' | 'study' | 'jazz' | 'all';

export interface Station {
  id: string;
  name: string;
  url: string;
  tags: string;
  country: string;
  favicon: string;
  codec: string;
  bitrate?: number;
  mood?: Mood;
}

export type SkinId = 'classic' | 'midnight' | 'cassette' | 'psychedelic';

export type VizMode = 'bars' | 'wave' | 'plasma' | 'particles';

export type EqPresetId = 'flat' | 'lofi' | 'study' | 'classical' | 'bass';

export interface OpenWindows {
  player: boolean;
  eq: boolean;
  viz: boolean;
  browser: boolean;
}
