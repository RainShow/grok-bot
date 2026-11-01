import type { AgentDef } from '../game/data';

export function BotIcon({ def, size = 26 }: { def: AgentDef; size?: number }) {
  const c = def.color;
  return (
    <svg width={size} height={size} viewBox="-14 -32 28 34" aria-hidden>
      {def.shape === 'pill' && <rect x={-11} y={-28} width={22} height={26} rx={10} fill={c} stroke="#0c1014" strokeWidth={1.6} />}
      {def.shape === 'ghost' && (
        <path d="M-11,-3 V-17 a11,11 0 0 1 22,0 V-3 l-3.7,3 -3.7,-3 -3.6,3 -3.7,-3 -3.6,3 z" fill={c} stroke="#0c1014" strokeWidth={1.6} strokeLinejoin="round" />
      )}
      {def.shape === 'tri' && <path d="M0,-30 L13,-2 H-13 Z" fill={c} stroke="#0c1014" strokeWidth={1.6} strokeLinejoin="round" />}
      <rect x={-5.5} y={def.shape === 'tri' ? -14 : -19} width={3.4} height={7} rx={1.7} fill="#fff" />
      <rect x={2.1} y={def.shape === 'tri' ? -14 : -19} width={3.4} height={7} rx={1.7} fill="#fff" />
    </svg>
  );
}
