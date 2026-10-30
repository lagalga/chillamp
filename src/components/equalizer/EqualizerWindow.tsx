import { useShallow } from 'zustand/react/shallow';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../constants/eq';
import { usePlayerStore } from '../../stores/playerStore';
import type { EqPresetId } from '../../types/station';

function formatFreq(freq: number): string {
  if (freq >= 1000) return `${freq / 1000}k`;
  return String(freq);
}

export function EqualizerWindow() {
  const { eqBands, eqPreset, eqEnabled, setEqBand, setEqPreset, setEqEnabled } = usePlayerStore(
    useShallow((s) => ({
      eqBands: s.eqBands,
      eqPreset: s.eqPreset,
      eqEnabled: s.eqEnabled,
      setEqBand: s.setEqBand,
      setEqPreset: s.setEqPreset,
      setEqEnabled: s.setEqEnabled,
    })),
  );

  return (
    <div className="eq-window">
      <div className="eq-header">
        <label className="eq-toggle">
          <input
            type="checkbox"
            checked={eqEnabled}
            onChange={(e) => setEqEnabled(e.target.checked)}
          />
          <span>EQ {eqEnabled ? 'ON' : 'OFF'}</span>
        </label>

        <select
          className="eq-preset-select"
          value={eqPreset}
          onChange={(e) => setEqPreset(e.target.value as EqPresetId)}
          aria-label="Preset de ecualizador"
        >
          {Object.entries(EQ_PRESETS).map(([id, preset]) => (
            <option key={id} value={id}>
              {preset.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="winamp-btn-sm"
          onClick={() => setEqPreset('flat')}
        >
          Restablecer
        </button>
      </div>

      <div className="eq-sliders" role="group" aria-label="Ecualizador de 10 bandas">
        {EQ_FREQUENCIES.map((freq, i) => (
          <div key={freq} className="eq-band">
            <input
              type="range"
              className="eq-slider"
              min={-12}
              max={12}
              step={1}
              value={eqBands[i] ?? 0}
              onChange={(e) => setEqBand(i, Number(e.target.value))}
              aria-label={`Banda ${formatFreq(freq)} Hz`}
              disabled={!eqEnabled}
            />
            <span className="eq-freq">{formatFreq(freq)}</span>
            <span className="eq-gain">{eqBands[i] ?? 0}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
