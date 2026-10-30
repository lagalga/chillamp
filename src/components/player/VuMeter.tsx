import type { VuLevels } from '../../hooks/useAudioEngine';

interface VuMeterProps {
  levels: VuLevels;
}

function getBarColor(level: number): string {
  if (level > 0.75) return 'var(--skin-vu-high)';
  if (level > 0.45) return 'var(--skin-vu-mid)';
  return 'var(--skin-vu-low)';
}

export function VuMeter({ levels }: VuMeterProps) {
  const segments = 12;

  return (
    <div className="vu-meter" aria-label="Medidor de volumen" role="meter">
      <div className="vu-channel">
        <span className="vu-label">L</span>
        <div className="vu-bars">
          {Array.from({ length: segments }).map((_, i) => {
            const threshold = (i + 1) / segments;
            const active = levels.left >= threshold;
            return (
              <div
                key={`l-${i}`}
                className={`vu-bar ${active ? 'active' : ''}`}
                style={active ? { background: getBarColor(threshold) } : undefined}
              />
            );
          })}
        </div>
      </div>
      <div className="vu-channel">
        <span className="vu-label">R</span>
        <div className="vu-bars">
          {Array.from({ length: segments }).map((_, i) => {
            const threshold = (i + 1) / segments;
            const active = levels.right >= threshold;
            return (
              <div
                key={`r-${i}`}
                className={`vu-bar ${active ? 'active' : ''}`}
                style={active ? { background: getBarColor(threshold) } : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
