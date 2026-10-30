import { useCallback, useRef, type ReactNode } from 'react';

interface WindowChromeProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onMinimize?: () => void;
  defaultPosition?: { x: number; y: number };
  className?: string;
}

export function WindowChrome({
  title,
  children,
  onClose,
  onMinimize,
  defaultPosition = { x: 0, y: 0 },
  className = '',
}: WindowChromeProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, offsetX: 0, offsetY: 0 });

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = windowRef.current;
    if (!el) return;
    dragRef.current = {
      dragging: true,
      offsetX: e.clientX - el.offsetLeft,
      offsetY: e.clientY - el.offsetTop,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.dragging || !windowRef.current) return;
    windowRef.current.style.left = `${e.clientX - dragRef.current.offsetX}px`;
    windowRef.current.style.top = `${e.clientY - dragRef.current.offsetY}px`;
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  return (
    <div
      ref={windowRef}
      className={`winamp-window ${className}`}
      style={{ left: defaultPosition.x, top: defaultPosition.y }}
      role="region"
      aria-label={title}
    >
      <div
        className="winamp-titlebar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <span className="winamp-titlebar-text">{title}</span>
        <div className="winamp-titlebar-buttons">
          {onMinimize && (
            <button
              type="button"
              className="winamp-btn-chrome"
              onClick={onMinimize}
              aria-label="Minimizar"
            >
              _
            </button>
          )}
          {onClose && (
            <button
              type="button"
              className="winamp-btn-chrome winamp-btn-close"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <div className="winamp-window-body">{children}</div>
    </div>
  );
}
