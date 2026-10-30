import { SKINS } from '../../skins';
import { usePlayerStore } from '../../stores/playerStore';

export function SkinSelector() {
  const skin = usePlayerStore((s) => s.skin);
  const setSkin = usePlayerStore((s) => s.setSkin);

  return (
    <div className="skin-selector" role="group" aria-label="Seleccionar skin">
      {SKINS.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`skin-thumb ${skin === s.id ? 'active' : ''}`}
          style={{ background: s.preview }}
          onClick={() => setSkin(s.id)}
          title={s.label}
          aria-label={`Skin ${s.label}`}
          aria-pressed={skin === s.id}
        />
      ))}
    </div>
  );
}
