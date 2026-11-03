import { useState } from 'react';
import { AgentCards } from './components/AgentCards';
import { LeftPanel, RightPanel } from './components/Panels';
import { SummaryModal } from './components/SummaryModal';
import { OfficeStage } from './components/office/OfficeScene';
import { floorOf, type FloorId } from './components/office/model';
import { FleetProvider, useFleet } from './game/useFleet';
import { SimContext, useSimInstance } from './game/useSim';
import { LangProvider } from './i18n/lang';

export default function App() {
  const sim = useSimInstance();
  return (
    <FleetProvider>
      <LangProvider>
        <SimContext.Provider value={sim}>
          <Dashboard />
        </SimContext.Provider>
      </LangProvider>
    </FleetProvider>
  );
}

function Dashboard() {
  const fleet = useFleet();
  const [floor, setFloor] = useState<FloorId>('overview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ops, setOps] = useState(false);

  const chooseFloor = (next: FloorId) => {
    setFloor(next);
    setSelectedId(null);
  };

  const selectFromRoster = (id: string | null) => {
    setSelectedId(id);
    if (!id) return;
    const bot = fleet.bots.find((item) => item.id === id);
    if (bot) setFloor(floorOf(bot));
  };

  return (
    <div className={`app office-app${floor === 'classified' ? ' is-classified' : ''}`}>
      <main className="stage-area">
        <OfficeStage
          floor={floor}
          onFloor={chooseFloor}
          selectedId={selectedId}
          onSelectBot={setSelectedId}
          opsOpen={ops}
          onToggleOps={() => setOps((open) => !open)}
        />
        {ops && (
          <div className="ops-drawer">
            <LeftPanel />
            <RightPanel />
          </div>
        )}
      </main>
      <AgentCards selectedId={selectedId} onSelect={selectFromRoster} hideDetail />
      <SummaryModal />
    </div>
  );
}
