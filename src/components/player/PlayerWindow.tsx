import { useShallow } from 'zustand/react/shallow';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import { usePlayerStore } from '../../stores/playerStore';
import { SkinSelector } from './SkinSelector';
import { VuMeter } from './VuMeter';

export function PlayerWindow() {
  const {
    currentStation,
    isPlaying,
    isMuted,
    volume,
    isLoading,
    streamError,
    setVolume,
    toggleMute,
    nextStation,
    prevStation,
    toggleWindow,
  } = usePlayerStore(useShallow((s) => ({
    currentStation: s.currentStation,
    isPlaying: s.isPlaying,
    isMuted: s.isMuted,
    volume: s.volume,
    isLoading: s.isLoading,
    streamError: s.streamError,
    setVolume: s.setVolume,
    toggleMute: s.toggleMute,
    nextStation: s.nextStation,
    prevStation: s.prevStation,
    toggleWindow: s.toggleWindow,
  })));

  const { audioRef, vuLevels, needsInteraction, webAudioEnabled, play, pause, stop } =
    useAudioEngineContext();

  return (
    <div className="player-window">
      <audio ref={audioRef} preload="none" />

      <div className="player-display">
        <div className="marquee-container">
          <div className="marquee-text">
            {isLoading
              ? 'Cargando estación...'
              : currentStation?.name ?? 'Selecciona una estación'}
          </div>
        </div>
        {currentStation && (
          <div className="station-meta">
            {currentStation.codec}
            {currentStation.bitrate ? ` · ${currentStation.bitrate}kbps` : ''}
            {currentStation.country ? ` · ${currentStation.country}` : ''}
          </div>
        )}
      </div>

      <VuMeter levels={vuLevels} />

      <div className="player-controls">
        <button
          type="button"
          className="winamp-btn"
          onClick={prevStation}
          aria-label="Estación anterior"
          title="Anterior"
        >
          ⏮
        </button>
        <button
          type="button"
          className="winamp-btn winamp-btn-play"
          onClick={isPlaying ? pause : play}
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          className="winamp-btn"
          onClick={stop}
          aria-label="Detener"
          title="Detener"
        >
          ⏹
        </button>
        <button
          type="button"
          className="winamp-btn"
          onClick={nextStation}
          aria-label="Siguiente estación"
          title="Siguiente"
        >
          ⏭
        </button>
      </div>

      <div className="player-volume">
        <button
          type="button"
          className="winamp-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          className="volume-slider"
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          onChange={(e) => setVolume(Number(e.target.value) / 100)}
          aria-label="Volumen"
        />
        <span className="volume-label">{Math.round(volume * 100)}%</span>
      </div>

      <div className="player-toolbar">
        <SkinSelector />
        <div className="toolbar-buttons">
          <button type="button" className="winamp-btn-sm" onClick={() => toggleWindow('eq')}>
            EQ
          </button>
          <button type="button" className="winamp-btn-sm" onClick={() => toggleWindow('viz')}>
            VIS
          </button>
          <button type="button" className="winamp-btn-sm" onClick={() => toggleWindow('browser')}>
            LISTA
          </button>
        </div>
      </div>

      {needsInteraction && (
        <p className="player-hint">Haz clic en Reproducir para iniciar el audio</p>
      )}
      {!webAudioEnabled && (
        <p className="player-hint">
          Modo directo: el stream no se corta. EQ/VU/viz requieren proxy (ver README).
        </p>
      )}
      {streamError && <p className="player-error" role="alert">{streamError}</p>}
    </div>
  );
}
