interface Props {
  onReset: () => void;
  onRotate: (dir: 1 | -1) => void;
  onZoom: (dir: 1 | -1) => void;
  labels: boolean;
  onToggleLabels: () => void;
  onSummary: () => void;
}

export function CameraControls({ onReset, onRotate, onZoom, labels, onToggleLabels, onSummary }: Props) {
  const items: { icon: string; label: string; fn: () => void; on?: boolean; testid?: string }[] = [
    { icon: '⌂', label: '全景', fn: onReset },
    { icon: '↺', label: '左转', fn: () => onRotate(-1) },
    { icon: '↻', label: '右转', fn: () => onRotate(1) },
    { icon: '+', label: '放大', fn: () => onZoom(1) },
    { icon: '−', label: '缩小', fn: () => onZoom(-1) },
    { icon: labels ? '◉' : '○', label: '标签', fn: onToggleLabels, on: labels },
    { icon: '≡', label: '汇总', fn: onSummary, testid: 'summary' },
  ];
  return (
    <div className="camera-controls glass">
      {items.map((it) => (
        <button key={it.label} onClick={it.fn} className={it.on ? 'on' : ''} title={it.label} data-testid={it.testid}>
          <span className="cc-icon">{it.icon}</span>
          <span className="cc-label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
