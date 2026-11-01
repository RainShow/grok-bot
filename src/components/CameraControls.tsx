interface Props {
  onReset: () => void;
  onRotate: (dir: 1 | -1) => void;
  onZoom: (dir: 1 | -1) => void;
  labels: boolean;
  onToggleLabels: () => void;
  onSummary: () => void;
}

export function CameraControls({ onReset, onRotate, onZoom, labels, onToggleLabels, onSummary }: Props) {
  const items = [
    { icon: '⌂', label: 'full view', fn: onReset },
    { icon: '↺', label: 'rotate L', fn: () => onRotate(-1) },
    { icon: '↻', label: 'rotate R', fn: () => onRotate(1) },
    { icon: '+', label: 'zoom in', fn: () => onZoom(1) },
    { icon: '−', label: 'zoom out', fn: () => onZoom(-1) },
    { icon: labels ? '◉' : '○', label: 'labels', fn: onToggleLabels, on: labels },
    { icon: '≡', label: 'day log', fn: onSummary },
  ];
  return (
    <div className="camera-controls glass">
      {items.map((it) => (
        <button key={it.label} onClick={it.fn} className={it.on ? 'on' : ''} title={it.label}>
          <span className="cc-icon">{it.icon}</span>
          <span className="cc-label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
