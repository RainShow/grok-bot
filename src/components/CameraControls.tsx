import { useI18n } from '../i18n/lang';

interface Props {
  onReset: () => void;
  onRotate: (dir: 1 | -1) => void;
  onZoom: (dir: 1 | -1) => void;
  labels: boolean;
  onToggleLabels: () => void;
  onSummary: () => void;
}

export function CameraControls({ onReset, onRotate, onZoom, labels, onToggleLabels, onSummary }: Props) {
  const { t } = useI18n();
  const items: { id: string; icon: string; label: string; fn: () => void; on?: boolean; testid?: string }[] = [
    { id: 'full', icon: '⌂', label: t.camFull, fn: onReset },
    { id: 'left', icon: '↺', label: t.camLeft, fn: () => onRotate(-1) },
    { id: 'right', icon: '↻', label: t.camRight, fn: () => onRotate(1) },
    { id: 'in', icon: '+', label: t.camIn, fn: () => onZoom(1) },
    { id: 'out', icon: '−', label: t.camOut, fn: () => onZoom(-1) },
    { id: 'labels', icon: labels ? '◉' : '○', label: t.camLabels, fn: onToggleLabels, on: labels },
    { id: 'summary', icon: '≡', label: t.camSummary, fn: onSummary, testid: 'summary' },
  ];
  return (
    <div className="camera-controls glass">
      {items.map((it) => (
        <button key={it.id} onClick={it.fn} className={it.on ? 'on' : ''} title={it.label} data-testid={it.testid}>
          <span className="cc-icon">{it.icon}</span>
          <span className="cc-label">{it.label}</span>
        </button>
      ))}
    </div>
  );
}
