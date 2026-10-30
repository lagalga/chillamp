import { useCallback, useEffect, useState } from 'react';
import { getCuratedByMood } from '../services/curatedStations';
import { searchByName, searchByTag } from '../services/radioBrowser';
import type { Mood, Station } from '../types/station';

export function useRadioStations(mood: Mood) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const curated = getCuratedByMood(mood);
      let apiStations: Station[] = [];

      if (mood !== 'all') {
        try {
          apiStations = await searchByTag(mood);
        } catch {
          // fallback to curated only
        }
      } else {
        const moods: Exclude<Mood, 'all'>[] = ['lofi', 'chill', 'classical', 'ambient', 'study', 'jazz'];
        const results = await Promise.allSettled(moods.map((m) => searchByTag(m, 10)));
        apiStations = results
          .filter((r): r is PromiseFulfilledResult<Station[]> => r.status === 'fulfilled')
          .flatMap((r) => r.value);
      }

      const seen = new Set<string>();
      const merged: Station[] = [];
      for (const station of [...curated, ...apiStations]) {
        if (!seen.has(station.url)) {
          seen.add(station.url);
          merged.push(station);
        }
      }
      setStations(merged);
    } catch {
      setError('No se pudieron cargar estaciones. Mostrando lista curada.');
      setStations(getCuratedByMood(mood));
    } finally {
      setLoading(false);
    }
  }, [mood]);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      void loadStations();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchByName(query);
      setStations(results.length > 0 ? results : getCuratedByMood(mood));
    } catch {
      setError('Búsqueda fallida. Mostrando estaciones curadas.');
      setStations(getCuratedByMood(mood));
    } finally {
      setLoading(false);
    }
  }, [loadStations, mood]);

  useEffect(() => {
    void loadStations();
  }, [loadStations]);

  return { stations, loading, error, search, reload: loadStations };
}
