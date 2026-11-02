import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { AgentCards } from './components/AgentCards';
import { CameraControls } from './components/CameraControls';
import { Header, Telemetry } from './components/Chrome';
import { LeftPanel, RightPanel } from './components/Panels';
import { SummaryModal } from './components/SummaryModal';
import { City } from './components/city/City';
import { SimContext, useSim, useSimInstance } from './game/useSim';
import { LangProvider } from './i18n/lang';
import type { Pt } from './game/iso';

export default function App() {
  const sim = useSimInstance();
  return (
    <LangProvider>
      <SimContext.Provider value={sim}>
        <Dashboard />
      </SimContext.Provider>
    </LangProvider>
  );
}

const ZOOMS = [0.8, 1, 1.25, 1.6, 2];

function Dashboard() {
  const sim = useSim();
  const [rot, setRot] = useState(0);
  const [zoomIdx, setZoomIdx] = useState(1);
  const [pan, setPan] = useState<Pt>({ x: 0, y: 0 });
  const [labels, setLabels] = useState(true);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const xyRef = useRef<HTMLSpanElement>(null);

  const reset = useCallback(() => {
    setRot(0);
    setZoomIdx(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    const el = xyRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
    el.textContent = `X ${x.toFixed(3)} · Y ${y.toFixed(3)}`;
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    track(e);
    if ((e.target as HTMLElement).closest('button, .panel, .stats-strip')) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    track(e);
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onUp = () => {
    drag.current = null;
  };

  return (
    <div className="app">
      <Header />
      <main className="stage-area">
        <div className="city-stage">
          <div
            className="city-wrap"
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <div className="shafts" aria-hidden />
            <div className="mist" aria-hidden />
            <div className="stars" aria-hidden />
            <div className="vignette" aria-hidden />
            <City rot={rot} zoom={ZOOMS[zoomIdx]} pan={pan} labels={labels} />
          </div>
          <Telemetry xyRef={xyRef} />
          <CameraControls
            onReset={reset}
            onRotate={(d) => setRot((r) => (r + d + 4) % 4)}
            onZoom={(d) => setZoomIdx((z) => Math.max(0, Math.min(ZOOMS.length - 1, z + d)))}
            labels={labels}
            onToggleLabels={() => setLabels((l) => !l)}
            onSummary={() => sim.openSummary()}
          />
        </div>
        <LeftPanel />
        <RightPanel />
      </main>
      <AgentCards />
      <SummaryModal />
    </div>
  );
}
