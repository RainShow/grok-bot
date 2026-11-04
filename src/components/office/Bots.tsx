import { useRef, useState, type RefObject } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Group, Mesh } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { FleetBot } from '../../game/fleet';
import { useI18n } from '../../i18n/lang';
import { floorOf, pathFor, SEATS, taskFor, type HomeFloor, type Seat } from './model';

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
  return bot.status === 'offline' ? mixHex(base, '#8b939c', 0.55) : base;
}

function scaleFor(name: string) {
  let h = 0;
  for (const ch of name) h = (h * 33 + ch.charCodeAt(0)) % 97;
  return 0.92 + (h % 16) / 80;
}

function CuteBody({
  color,
  selected,
  bodyRef,
  eyesRef,
  handsRef,
  onOver,
  onOut,
  onClick,
}: {
  color: string;
  selected?: boolean;
  bodyRef: RefObject<Mesh | null>;
  eyesRef: RefObject<Group | null>;
  handsRef: RefObject<Group | null>;
  onOver?: (e: ThreeEvent<PointerEvent>) => void;
  onOut?: (e: ThreeEvent<PointerEvent>) => void;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  return (
    <>
      <mesh ref={bodyRef} position={[0, 0.64, 0]} castShadow>
        <sphereGeometry args={[0.58, 32, 24]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.32}
          metalness={0.02}
          clearcoat={0.6}
          clearcoatRoughness={0.24}
          emissive={selected ? '#ffffff' : '#000000'}
          emissiveIntensity={selected ? 0.14 : 0}
        />
        <group ref={eyesRef} position={[0, 0.16, 0.44]}>
          <mesh position={[-0.16, 0.05, 0]}>
            <sphereGeometry args={[0.135, 16, 14]} />
            <meshStandardMaterial color="#fbfcfd" roughness={0.18} />
          </mesh>
          <mesh position={[0.16, 0.05, 0]}>
            <sphereGeometry args={[0.135, 16, 14]} />
            <meshStandardMaterial color="#fbfcfd" roughness={0.18} />
          </mesh>
          <mesh position={[-0.16, 0.02, 0.09]}>
            <sphereGeometry args={[0.068, 12, 10]} />
            <meshStandardMaterial color="#1a1e24" roughness={0.35} />
          </mesh>
          <mesh position={[0.16, 0.02, 0.09]}>
            <sphereGeometry args={[0.068, 12, 10]} />
            <meshStandardMaterial color="#1a1e24" roughness={0.35} />
          </mesh>
          <mesh position={[-0.125, 0.07, 0.12]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0.195, 0.07, 0.12]}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
        <mesh position={[-0.22, -0.02, 0.34]} scale={[1, 0.55, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#ff8ea3" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <mesh position={[0.22, -0.02, 0.34]} scale={[1, 0.55, 0.4]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshStandardMaterial color="#ff8ea3" transparent opacity={0.4} depthWrite={false} />
        </mesh>
        <group ref={handsRef}>
          <mesh position={[-0.22, -0.22, 0.46]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
          <mesh position={[0.22, -0.22, 0.46]}>
            <sphereGeometry args={[0.09, 12, 10]} />
            <meshStandardMaterial color={color} roughness={0.35} />
          </mesh>
        </group>
      </mesh>
      <mesh position={[0, 0.62, 0]} onClick={onClick} onPointerOver={onOver} onPointerOut={onOut}>
        <sphereGeometry args={[0.78, 14, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

function turnToward(g: Group, desired: number, dt: number) {
  let delta = desired - g.rotation.y;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  g.rotation.y += delta * Math.min(1, dt * 7);
}

function Blob({
  bot,
  path,
  seat,
  index,
  selected,
  classified,
  onSelect,
}: {
  bot: FleetBot;
  path: [number, number][];
  seat?: Seat;
  index: number;
  selected: boolean;
  classified?: boolean;
  onSelect: () => void;
}) {
  const root = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const eyes = useRef<Group>(null);
  const hands = useRef<Group>(null);
  const prog = useRef(index * 1.37 + 0.2);
  const phase = useRef(index * 1.7);
  const sit = useRef(seat ? 1 : 0);
  const [hover, setHover] = useState(false);
  const { lang } = useI18n();
  const color = bodyColor(bot);
  const task = taskFor(lang, bot.name, classified);
  const canWalk = bot.status === 'busy' || bot.status === 'idle';

  useFrame((state, dt) => {
    const g = root.current;
    const mesh = body.current;
    if (!g || !mesh) return;
    const t = state.clock.elapsedTime;
    const cycle = (t + index * 2.05) % 12;
    const walking = !seat || (canWalk && cycle > 8.3);
    const sitGoal = walking ? 0 : 1;
    sit.current += (sitGoal - sit.current) * Math.min(1, dt * 5);
    const s = sit.current;
    if (seat && !walking) {
      g.position.x = seat.at[0];
      g.position.z = seat.at[1];
      turnToward(g, seat.rot, dt);
    } else if (seat && walking) {
      const u = (cycle - 8.3) / 3.7;
      const trip = u < 0.5 ? u * 2 : (1 - u) * 2;
      const ease = trip * trip * (3 - 2 * trip);
      const wx = Math.max(-4.8, Math.min(4.8, seat.at[0] + (index % 2 === 0 ? 1.4 : -1.4)));
      const wz = Math.max(-2.6, Math.min(3.1, seat.at[1] + 1.05));
      g.position.x = seat.at[0] + (wx - seat.at[0]) * ease;
      g.position.z = seat.at[1] + (wz - seat.at[1]) * ease;
      const face = Math.atan2(wx - seat.at[0], wz - seat.at[1]);
      turnToward(g, u < 0.5 ? face : face + Math.PI, dt);
    } else if (path.length < 2 || bot.status === 'offline') {
      g.position.x = path[0]?.[0] ?? 0;
      g.position.z = path[0]?.[1] ?? 0;
    } else {
      const speed = bot.status === 'busy' ? 0.72 : 0.4;
      prog.current += dt * speed;
      const seg = path.length;
      const i0 = Math.floor(prog.current) % seg;
      const i1 = (i0 + 1) % seg;
      const f = prog.current % 1;
      const ease = f * f * (3 - 2 * f);
      const a = path[i0];
      const b = path[i1];
      g.position.x = a[0] + (b[0] - a[0]) * ease;
      g.position.z = a[1] + (b[1] - a[1]) * ease;
      turnToward(g, Math.atan2(b[0] - a[0], b[1] - a[1]), dt);
    }
    const hop = (1 - s) * Math.abs(Math.sin(t * 9.2 + phase.current));
    g.position.y = hop * 0.11;
    g.rotation.x = s * 0.22;
    const type = s * Math.sin(t * (bot.status === 'busy' ? 16 : 9) + phase.current);
    mesh.position.y = 0.62 + s * 0.08;
    mesh.scale.set(scaleFor(bot.name) * (1.05 - hop * 0.06), 0.94 - s * 0.06 + hop * 0.08 + type * 0.02, 1.02);
    if (eyes.current) {
      const blink = Math.sin(t * 0.62 + phase.current) > 0.972;
      eyes.current.scale.y = blink ? 0.08 : 1;
    }
    if (hands.current) hands.current.position.y = type * 0.045;
  });

  const bind = (e: ThreeEvent<PointerEvent>, over: boolean) => {
    e.stopPropagation();
    setHover(over);
    const el = e.nativeEvent.target as HTMLElement | null;
    if (el) el.style.cursor = over ? 'pointer' : 'grab';
  };

  return (
    <group ref={root}>
      <CuteBody
        color={color}
        selected={selected}
        bodyRef={body}
        eyesRef={eyes}
        handsRef={hands}
        onOver={(e) => bind(e, true)}
        onOut={(e) => bind(e, false)}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.32, 18]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.14} depthWrite={false} />
      </mesh>
      {bot.status === 'needs_you' && <WaitRing />}
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.5, 0.58, 28]} />
          <meshBasicMaterial color="#1c242c" />
        </mesh>
      )}
      {hover && (
        <Html position={[0, 1.25, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
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
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
      <ringGeometry args={[0.42, 0.5, 28]} />
      <meshBasicMaterial color="#e2a23a" transparent opacity={0.95} />
    </mesh>
  );
}

function Host() {
  const root = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const eyes = useRef<Group>(null);
  const hands = useRef<Group>(null);
  const prog = useRef(0);
  const [hover, setHover] = useState(false);
  const { lang } = useI18n();
  const path: [number, number][] = [
    [-2.4, -1.15],
    [-0.9, -1.15],
    [-0.9, -0.4],
    [-2.4, -0.4],
  ];
  useFrame((_, dt) => {
    const g = root.current;
    const mesh = body.current;
    if (!g || !mesh) return;
    prog.current += dt * 0.32;
    const i0 = Math.floor(prog.current) % path.length;
    const i1 = (i0 + 1) % path.length;
    const f = prog.current % 1;
    const ease = f * f * (3 - 2 * f);
    const a = path[i0];
    const b = path[i1];
    g.position.x = a[0] + (b[0] - a[0]) * ease;
    g.position.z = a[1] + (b[1] - a[1]) * ease;
    const hop = Math.abs(Math.sin(prog.current * 8));
    g.position.y = hop * 0.08;
    turnToward(g, Math.atan2(b[0] - a[0], b[1] - a[1]), dt);
    mesh.scale.set(1.02 - hop * 0.05, 0.86 + hop * 0.08, 0.98);
    if (eyes.current) eyes.current.scale.y = Math.sin(prog.current * 0.7) > 0.97 ? 0.08 : 1;
  });
  const tip = lang === 'zh' ? '给人指电梯' : 'Pointing people to the lift';
  const role = lang === 'zh' ? '接待' : 'Reception';
  const name = lang === 'zh' ? '前台' : 'Desk';
  return (
    <group ref={root} scale={0.86}>
      <CuteBody
        color="#f0a05a"
        bodyRef={body}
        eyesRef={eyes}
        handsRef={hands}
        onOver={(e) => {
          e.stopPropagation();
          setHover(true);
          (e.nativeEvent.target as HTMLElement).style.cursor = 'pointer';
        }}
        onOut={() => {
          setHover(false);
          document.body.style.cursor = 'grab';
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {hover && (
        <Html position={[0, 1.15, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
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
    <group>
      {list.map((bot, index) => (
        <Blob
          key={bot.id}
          bot={bot}
          index={index}
          seat={SEATS[floor][index]}
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
