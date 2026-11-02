import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadFleet, SAMPLE_FLEET, type FleetFile } from './fleet';

const FleetContext = createContext<FleetFile>(SAMPLE_FLEET);

export function FleetProvider({ children }: { children: ReactNode }) {
  const [fleet, setFleet] = useState<FleetFile>(SAMPLE_FLEET);
  useEffect(() => {
    let live = true;
    loadFleet().then((next) => {
      if (live) setFleet(next);
    });
    return () => {
      live = false;
    };
  }, []);
  return <FleetContext.Provider value={fleet}>{children}</FleetContext.Provider>;
}

export function useFleet() {
  return useContext(FleetContext);
}
