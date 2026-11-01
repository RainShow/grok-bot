import { useCallback, useRef, useState, type PointerEvent } from 'react';
import { AgentCards } from './components/AgentCards';
import { CameraControls } from './components/CameraControls';
import { Header, StatsStrip } from './components/Chrome';
import { LeftPanel, RightPanel } from './components/Panels';
import { SummaryModal } from './components/SummaryModal';
import { City } from './components/city/City';
import { nightAt, weatherAt } from './game/sim';
import { SimContext, useSim, useSimInstance } from './game/useSim';
import type { Pt } from './game/iso';

export default function App() {
  const sim = useSimInstance();
  return (
    <SimContext.Provider value={sim}>
      <Dashboard />
    </SimContext.Provider>
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

  const reset = useCallback(() => {
    setRot(0);
    setZoomIdx(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, .panel, .stats-strip')) return;
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) });
  };
  const onUp = () => {
    drag.current = null;
  };

  const night = nightAt(sim.state.clock);
  const { weather } = weatherAt(sim.state.clock);

  return (
    <div className="app">
      <Header />
      <main className="stage-area">
        <div
          className={`city-wrap weather-${weather}`}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <div className="clouds" aria-hidden>
            <span className="cloud c1" />
            <span className="cloud c2" />
            <span className="cloud c3" />
          </div>
          <div className="night" style={{ opacity: night * 0.5 }} aria-hidden />
          <City rot={rot} zoom={ZOOMS[zoomIdx]} pan={pan} labels={labels} />
          {weather === 'rain' && <div className="rain" aria-hidden />}
        </div>
        <LeftPanel />
        <RightPanel />
        <StatsStrip />
        <CameraControls
          onReset={reset}
          onRotate={(d) => setRot((r) => (r + d + 4) % 4)}
          onZoom={(d) => setZoomIdx((z) => Math.max(0, Math.min(ZOOMS.length - 1, z + d)))}
          labels={labels}
          onToggleLabels={() => setLabels((l) => !l)}
          onSummary={() => sim.openSummary()}
        />
      </main>
      <AgentCards />
      <SummaryModal />
    </div>
  );
}
