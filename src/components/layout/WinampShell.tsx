import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAudioEngineContext } from '../../context/AudioEngineContext';
import { usePlayerStore } from '../../stores/playerStore';
import { WindowChrome } from '../common/WindowChrome';
import { EqualizerWindow } from '../equalizer/EqualizerWindow';
import { PlayerWindow } from '../player/PlayerWindow';
import { StationBrowser } from '../stations/StationBrowser';
import { VisualizerCanvas } from '../visualizer/VisualizerCanvas';

export function WinampShell() {
  const { skin, openWindows, toggleWindow } = usePlayerStore(
    useShallow((s) => ({
      skin: s.skin,
      openWindows: s.openWindows,
      toggleWindow: s.toggleWindow,
    }))
  );

  const { analyserRef } = useAudioEngineContext();

  useEffect(() => {
    document.documentElement.setAttribute('data-skin', skin);
  }, [skin]);

  return (
    <div className="winamp-shell">
      <div className="winamp-desktop">
        {openWindows.player && (
          <WindowChrome
            title="ChillAmp Player"
            defaultPosition={{ x: 40, y: 40 }}
            onClose={() => toggleWindow('player')}
          >
            <PlayerWindow />
          </WindowChrome>
        )}

        {openWindows.eq && (
          <WindowChrome
            title="Ecualizador"
            defaultPosition={{ x: 40, y: 340 }}
            onClose={() => toggleWindow('eq')}
          >
            <EqualizerWindow />
          </WindowChrome>
        )}

        {openWindows.viz && (
          <WindowChrome
            title="Visualizador"
            defaultPosition={{ x: 420, y: 40 }}
            className="viz-window-chrome"
            onClose={() => toggleWindow('viz')}
          >
            <VisualizerCanvas analyserRef={analyserRef} />
          </WindowChrome>
        )}

        {openWindows.browser && (
          <WindowChrome
            title="Estaciones"
            defaultPosition={{ x: 420, y: 380 }}
            className="browser-window-chrome"
            onClose={() => toggleWindow('browser')}
          >
            <StationBrowser />
          </WindowChrome>
        )}
      </div>

      <div className="winamp-taskbar">
        <span className="taskbar-brand">ChillAmp v1.0</span>
        <div className="taskbar-toggles">
          {(['player', 'eq', 'viz', 'browser'] as const).map((win) => (
            <button
              key={win}
              type="button"
              className={`taskbar-btn ${openWindows[win] ? 'active' : ''}`}
              onClick={() => toggleWindow(win)}
            >
              {win === 'player' && 'Player'}
              {win === 'eq' && 'EQ'}
              {win === 'viz' && 'Vis'}
              {win === 'browser' && 'Lista'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
