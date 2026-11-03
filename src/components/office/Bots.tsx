import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { FleetBot } from '../../game/fleet';
import { useI18n } from '../../i18n/lang';
import { FLOOR_Y, floorOf, pathFor, taskFor, type HomeFloor } from './model';

function mixHex(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const h = hex.replace('#', '');
    const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [0, 2, 4].map((i) => Number.parseInt(n.slice(i, i + 2), 16));
  };
  const pa = parse(a);
  const pb = parse(b);
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function bodyColor(bot: FleetBot) {
  const base = bot.color ?? '#c5ced6';
  return bot.status === 'offline' ? mixHex(base, '#8b939c', 0.62) : base;
}

function scaleFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 33 + ch.charCodeAt(0)) % 97;
  return 0.9 + (h % 18) / 90;
}

function Blob({
  bot,
  path,
  index,
  selected,
  classified,
  onSelect,
}: {
  bot: FleetBot;
  path: [number, number][];
  index: number;
  selected: boolean;
  classified?: boolean;
  onSelect: () => void;
}) {
  const root = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const eyes = useRef<Group>(null);
  const prog = useRef(index * 1.37 + 0.2);
  const phase = useRef(index * 1.7);
  const [hover, setHover] = useState(false);
  const { lang } = useI18n();
  const speed = bot.status === 'offline' ? 0 : bot.status === 'busy' ? 0.95 : bot.status === 'needs_you' ? 0.42 : 0.58;
  const color = bodyColor(bot);
  const task = taskFor(lang, bot.name, classified);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    if (path.length < 2 || speed === 0) {
      g.position.x = path[0][0];
      g.position.z = path[0][1];
    } else {
      prog.current += dt * speed * 0.42;
      const seg = path.length;
      const i0 = Math.floor(prog.current) % seg;
      const i1 = (i0 + 1) % seg;
      const f = prog.current % 1;
      const ease = f * f * (3 - 2 * f);
      const a = path[i0];
      const b = path[i1];
      g.position.x = a[0] + (b[0] - a[0]) * ease;
      g.position.z = a[1] + (b[1] - a[1]) * ease;
      const dx = b[0] - a[0];
      const dz = b[1] - a[1];
      if (dx * dx + dz * dz > 0.0001) {
        const desired = Math.atan2(dx, dz);
        let delta = desired - g.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        g.rotation.y += delta * Math.min(1, dt * 6);
      }
    }
    const bob = Math.sin(t * (speed > 0 ? 7.2 : 2.2) + phase.current) * (speed > 0 ? 0.045 : 0.012);
    g.position.y = 0.22 + bob;
    if (body.current) {
      const squash = Math.sin(t * 7.2 + phase.current);
      const amp = speed > 0 ? 0.05 : 0.015;
      body.current.scale.set(scaleFor(bot.name) * (1 - squash * amp), 1.16 + squash * amp, 0.92);
    }
    if (eyes.current) {
      const blink = Math.sin(t * 0.65 + phase.current) > 0.985;
      eyes.current.scale.y = blink ? 0.12 : 1;
    }
  });

  const bind = (e: ThreeEvent<PointerEvent>, over: boolean) => {
    e.stopPropagation();
    setHover(over);
    const el = e.nativeEvent.target as HTMLElement | null;
    if (el) el.style.cursor = over ? 'pointer' : 'grab';
  };

  return (
    <group ref={root}>
      <mesh
        ref={body}
        position={[0, 0.4, 0]}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => bind(e, true)}
        onPointerOut={(e) => bind(e, false)}
      >
        <sphereGeometry args={[0.38, 28, 20]} />
        <meshStandardMaterial color={color} roughness={0.42} emissive={selected ? '#ffffff' : '#000000'} emissiveIntensity={selected ? 0.18 : 0} />
      </mesh>
      <mesh
        position={[0, 0.42, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => bind(e, true)}
        onPointerOut={(e) => bind(e, false)}
      >
        <sphereGeometry args={[0.48, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <group ref={eyes} position={[0, 0.48, 0.02]}>
        <mesh position={[-0.1, 0.02, 0.24]}>
          <sphereGeometry args={[0.07, 14, 12]} />
          <meshStandardMaterial color="#f7f9fb" roughness={0.25} />
        </mesh>
        <mesh position={[0.1, 0.02, 0.24]}>
          <sphereGeometry args={[0.07, 14, 12]} />
          <meshStandardMaterial color="#f7f9fb" roughness={0.25} />
        </mesh>
        <mesh position={[-0.1, 0.015, 0.29]}>
          <sphereGeometry args={[0.032, 10, 8]} />
          <meshStandardMaterial color="#1a1e24" />
        </mesh>
        <mesh position={[0.1, 0.015, 0.29]}>
          <sphereGeometry args={[0.032, 10, 8]} />
          <meshStandardMaterial color="#1a1e24" />
        </mesh>
        <mesh position={[-0.088, 0.03, 0.315]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[0.112, 0.03, 0.315]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <circleGeometry args={[0.26, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {bot.status === 'needs_you' && <WaitRing />}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
          <ringGeometry args={[0.46, 0.54, 28]} />
          <meshBasicMaterial color="#1c242c" />
        </mesh>
      )}
      {hover && (
        <Html position={[0, 1.05, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bot-tip" data-testid="bot-hover" role="tooltip">
            <b>{bot.name}</b>
            <span>{bot.role}</span>
            <em>{task}</em>
          </div>
        </Html>
      )}
    </group>
  );
}

function WaitRing() {
  const ref = useRef<Mesh>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const p = 1 + Math.sin(state.clock.elapsedTime * 3.2) * 0.08;
    ref.current.scale.setScalar(p);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
      <ringGeometry args={[0.38, 0.46, 28]} />
      <meshBasicMaterial color="#e2a23a" transparent opacity={0.95} />
    </mesh>
  );
}

function Host() {
  const root = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const { lang } = useI18n();
  const prog = useRef(0);
  const path: [number, number][] = [
    [-2.4, -1.15],
    [-0.9, -1.15],
    [-0.9, -0.4],
    [-2.4, -0.4],
  ];
  useFrame((_, dt) => {
    const g = root.current;
    if (!g) return;
    prog.current += dt * 0.28;
    const i0 = Math.floor(prog.current) % path.length;
    const i1 = (i0 + 1) % path.length;
    const f = prog.current % 1;
    const ease = f * f * (3 - 2 * f);
    const a = path[i0];
    const b = path[i1];
    g.position.x = a[0] + (b[0] - a[0]) * ease;
    g.position.z = a[1] + (b[1] - a[1]) * ease;
    g.position.y = 0.22 + Math.sin(prog.current * 8) * 0.03;
    const desired = Math.atan2(b[0] - a[0], b[1] - a[1]);
    let delta = desired - g.rotation.y;
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    g.rotation.y += delta * Math.min(1, dt * 6);
  });
  const tip = lang === 'zh' ? '给人指电梯' : 'Pointing people to the lift';
  const role = lang === 'zh' ? '接待' : 'Reception';
  const name = lang === 'zh' ? '前台' : 'Desk';
  return (
    <group ref={root}>
      <mesh
        position={[0, 0.4, 0]}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          (e.nativeEvent.target as HTMLElement).style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          setHover(false);
          (e.nativeEvent.target as HTMLElement).style.cursor = 'grab';
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[0.3, 24, 18]} />
        <meshStandardMaterial color="#f0a05a" roughness={0.4} />
      </mesh>
      <group position={[0, 0.48, 0.02]}>
        <mesh position={[-0.09, 0.02, 0.22]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color="#f7f9fb" />
        </mesh>
        <mesh position={[0.09, 0.02, 0.22]}>
          <sphereGeometry args={[0.065, 12, 10]} />
          <meshStandardMaterial color="#f7f9fb" />
        </mesh>
        <mesh position={[-0.09, 0.015, 0.27]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial color="#1a1e24" />
        </mesh>
        <mesh position={[0.09, 0.015, 0.27]}>
          <sphereGeometry args={[0.03, 10, 8]} />
          <meshStandardMaterial color="#1a1e24" />
        </mesh>
      </group>
      {hover && (
        <Html position={[0, 1.02, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bot-tip" role="tooltip">
            <b>{name}</b>
            <span>{role}</span>
            <em>{tip}</em>
          </div>
        </Html>
      )}
    </group>
  );
}

export function FloorBots({
  floor,
  bots,
  selectedId,
  onSelect,
}: {
  floor: HomeFloor;
  bots: readonly FleetBot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const list = bots.filter((bot) => floorOf(bot) === floor);
  return (
    <group position={[0, FLOOR_Y[floor], 0]}>
      {list.map((bot, index) => (
        <Blob
          key={bot.id}
          bot={bot}
          index={index}
          path={pathFor(floor, index)}
          selected={bot.id === selectedId}
          onSelect={() => onSelect(bot.id)}
        />
      ))}
      {floor === 'lobby' && <Host />}
    </group>
  );
}

export function ClassifiedBots({
  bots,
  selectedId,
  onSelect,
}: {
  bots: readonly FleetBot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const list = ['proto', 'analysis', 'grok']
    .map((name) => bots.find((bot) => bot.name.toLowerCase() === name))
    .filter((bot): bot is FleetBot => Boolean(bot));
  return (
    <group>
      {list.map((bot, index) => (
        <Blob
          key={bot.id}
          bot={bot}
          index={index}
          path={pathFor('classified', index)}
          selected={bot.id === selectedId}
          classified
          onSelect={() => onSelect(bot.id)}
        />
      ))}
    </group>
  );
}
