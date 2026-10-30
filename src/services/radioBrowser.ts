import type { Mood, Station } from '../types/station';

const API_BASE = import.meta.env.DEV ? '/api/radio' : 'https://de1.api.radio-browser.info/json';
const USER_AGENT = 'ChillAmp/1.0';

interface RadioBrowserStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  tags: string;
  country: string;
  favicon: string;
  codec: string;
  bitrate: number;
}

function mapStation(raw: RadioBrowserStation, mood?: Mood): Station {
  return {
    id: raw.stationuuid,
    name: raw.name.trim(),
    url: raw.url_resolved || raw.url,
    tags: raw.tags,
    country: raw.country,
    favicon: raw.favicon,
    codec: raw.codec,
    bitrate: raw.bitrate,
    mood,
  };
}

async function fetchStations(path: string, mood?: Mood): Promise<Station[]> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'User-Agent': USER_AGENT },
  });

  if (!response.ok) {
    throw new Error(`Radio Browser error: ${response.status}`);
  }

  const data = (await response.json()) as RadioBrowserStation[];
  return data.map((s) => mapStation(s, mood));
}

const moodTags: Record<Exclude<Mood, 'all'>, string> = {
  lofi: 'lofi',
  chill: 'chill',
  classical: 'classical',
  ambient: 'ambient',
  study: 'study',
  jazz: 'jazz',
};

export async function searchByTag(mood: Exclude<Mood, 'all'>, limit = 30): Promise<Station[]> {
  const tag = moodTags[mood];
  return fetchStations(
    `/stations/search?tag=${encodeURIComponent(tag)}&order=clickcount&reverse=true&limit=${limit}&lastcheckok=1`,
    mood,
  );
}

export async function searchByName(name: string, limit = 30): Promise<Station[]> {
  return fetchStations(
    `/stations/search?name=${encodeURIComponent(name)}&order=clickcount&reverse=true&limit=${limit}&lastcheckok=1`,
  );
}
