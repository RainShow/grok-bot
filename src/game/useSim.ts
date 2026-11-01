import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import { Sim } from './sim';

export const SimContext = createContext<Sim | null>(null);

export function useSimInstance() {
  const [sim] = useState(() => {
    const at = new URLSearchParams(window.location.search).get('at');
    return new Sim({ startHour: at === null ? undefined : Number(at) });
  });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      sim.tick(Math.min(0.1, (now - last) / 1000));
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sim]);
  return sim;
}

export function useSim() {
  const sim = useContext(SimContext)!;
  useSyncExternalStore(sim.subscribe, sim.getVersion);
  return sim;
}

export function useSimFrame() {
  const sim = useContext(SimContext)!;
  useSyncExternalStore(sim.subscribeFrame, sim.getFrame);
  return sim;
}
