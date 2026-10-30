import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useRadioStations } from '../../hooks/useRadioStations';
import { MOOD_LABELS, usePlayerStore } from '../../stores/playerStore';
import type { Mood } from '../../types/station';

const MOODS: Mood[] = ['lofi', 'chill', 'classical', 'ambient', 'study', 'jazz', 'all'];

export function StationBrowser() {
  const [activeMood, setActiveMood] = useState<Mood>('lofi');
  const [searchQuery, setSearchQuery] = useState('');
  const { stations, loading, error, search } = useRadioStations(activeMood);

  const { currentStation, setStationQueue, setPlaying } = usePlayerStore(useShallow((s) => ({
    currentStation: s.currentStation,
    setStationQueue: s.setStationQueue,
    setPlaying: s.setPlaying,
  })));

  const handleSelect = useCallback(
    (index: number) => {
      setStationQueue(stations, index);
      setPlaying(true);
    },
    [stations, setStationQueue, setPlaying],
  );

  useEffect(() => {
    if (stations.length > 0 && !currentStation) {
      setStationQueue(stations, 0);
    }
  }, [stations, currentStation, setStationQueue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        void search(searchQuery);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, search]);

  return (
    <div className="station-browser">
      <div className="browser-tabs" role="tablist" aria-label="Categorías de estaciones">
        {MOODS.map((mood) => (
          <button
            key={mood}
            type="button"
            role="tab"
            className={`browser-tab ${activeMood === mood ? 'active' : ''}`}
            aria-selected={activeMood === mood}
            onClick={() => {
              setActiveMood(mood);
              setSearchQuery('');
            }}
          >
            {MOOD_LABELS[mood]}
          </button>
        ))}
      </div>

      <div className="browser-search">
        <input
          type="search"
          className="browser-search-input"
          placeholder="Buscar estaciones..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Buscar estaciones"
        />
      </div>

      {loading && <p className="browser-status">Cargando estaciones...</p>}
      {error && <p className="browser-error" role="alert">{error}</p>}

      <ul className="station-list" role="listbox" aria-label="Lista de estaciones">
        {stations.map((station, index) => (
          <li key={station.id}>
            <button
              type="button"
              role="option"
              className={`station-item ${currentStation?.id === station.id ? 'active' : ''}`}
              aria-selected={currentStation?.id === station.id}
              onClick={() => handleSelect(index)}
            >
              {station.favicon ? (
                <img
                  src={station.favicon}
                  alt=""
                  className="station-favicon"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="station-favicon-placeholder">♫</span>
              )}
              <span className="station-info">
                <span className="station-name">{station.name}</span>
                <span className="station-tags">
                  {station.country}
                  {station.codec ? ` · ${station.codec}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
