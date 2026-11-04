import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { DESK_YAW, PLATE_D, PLATE_W, WORK_DESKS } from './model';
import { Box, Desk, Plant, Plate, Pouf, Sofa } from './parts';
import { useBoardTexture, useFontRevision, useMarkTexture, usePosterTexture } from './textures';

function Floor({ color = '#f6f4ef' }: { color?: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} receiveShadow>
      <planeGeometry args={[12.4, 8.8]} />
      <meshStandardMaterial color={color} roughness={0.94} />
    </mesh>
  );
}

function Strips() {
  return (
    <>
      <Box args={[8.2, 0.045, 0.16]} position={[-0.2, 2.52, -0.6]} color="#fffaf3" emissive="#fff1d4" emissiveIntensity={0.85} />
      <Box args={[6.4, 0.045, 0.14]} position={[0.4, 2.52, 1.7]} color="#fffaf3" emissive="#fff1d4" emissiveIntensity={0.6} />
      <pointLight position={[0, 2.3, 0.2]} color="#fff4e2" intensity={0.55} distance={9} />
    </>
  );
}

function Rail() {
  return (
    <mesh position={[0, 0.42, 4.22]}>
      <boxGeometry args={[12.2, 0.34, 0.035]} />
      <meshStandardMaterial color="#d7e6f0" transparent opacity={0.38} roughness={0.05} />
    </mesh>
  );
}

function Board({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const map = useBoardTexture();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Box args={[2.05, 1.25, 0.06]} position={[0, 0, -0.02]} color="#f7f4ee" />
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[1.85, 1.05]} />
        <meshBasicMaterial map={map} />
      </mesh>
    </group>
  );
}

function Shelf({ position }: { position: [number, number, number] }) {
  const colors = ['#c4554a', '#e6d7b0', '#3d6d8c', '#2f6b45', '#1c242c', '#d8c4a4', '#8d6a45', '#7ea0c4'];
  return (
    <group position={position}>
      <Box args={[2.4, 0.06, 0.34]} position={[0, 0.16, 0]} color="#f3f1ec" />
      <Box args={[2.4, 0.06, 0.34]} position={[0, 0.78, 0]} color="#f3f1ec" />
      <Box args={[2.4, 0.06, 0.34]} position={[0, 1.4, 0]} color="#f3f1ec" />
      <Box args={[0.06, 1.45, 0.34]} position={[-1.18, 0.78, 0]} color="#e7e2d8" />
      <Box args={[0.06, 1.45, 0.34]} position={[1.18, 0.78, 0]} color="#e7e2d8" />
      {Array.from({ length: 22 }, (_, i) => {
        const row = i < 11 ? 0 : 1;
        const col = i % 11;
        const h = 0.38 + ((i * 5) % 4) * 0.05;
        return (
          <Box
            key={i}
            args={[0.16, h, 0.24]}
            position={[-0.95 + col * 0.19, (row === 0 ? 0.2 : 0.82) + h / 2, 0.02]}
            color={colors[i % colors.length]}
          />
        );
      })}
    </group>
  );
}

function Meeting({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box args={[2.5, 0.06, 1.7]} position={[0, 0.04, 0]} color="#f7f8fa" />
      <mesh position={[0, 0.75, 0.84]}>
        <boxGeometry args={[2.5, 1.4, 0.03]} />
        <meshStandardMaterial color="#d5e7f2" transparent opacity={0.32} roughness={0.06} />
      </mesh>
      <mesh position={[1.24, 0.75, 0]}>
        <boxGeometry args={[0.03, 1.4, 1.7]} />
        <meshStandardMaterial color="#d5e7f2" transparent opacity={0.32} roughness={0.06} />
      </mesh>
      <Box args={[0.04, 1.4, 0.04]} position={[-1.22, 0.75, 0.82]} color="#8e99a3" metalness={0.4} />
      <Box args={[0.04, 1.4, 0.04]} position={[1.22, 0.75, 0.82]} color="#8e99a3" metalness={0.4} />
      <Box args={[1.35, 0.07, 0.7]} position={[0, 0.74, 0]} color="#f4efe6" radius={0.04} castShadow />
      <Box args={[0.42, 0.38, 0.42]} position={[-0.48, 0.28, 0.38]} color="#2c333b" radius={0.08} />
      <Box args={[0.42, 0.38, 0.42]} position={[0.48, 0.28, 0.38]} color="#3d4652" radius={0.08} />
      <Box args={[0.42, 0.38, 0.42]} position={[0, 0.28, -0.38]} color="#2f3844" radius={0.08} />
    </group>
  );
}

const NIGHT_X = [-4.4, -2.64, -0.88, 0.88, 2.64, 4.4];
const NIGHT_SCREENS = ['#7ec8ea', '#f0c27a', '#8ecfb0', '#e7a0b8', '#c9b6f0', '#c4f93e'];

export function NightInterior() {
  return (
    <group>
      <Floor color="#e7ebee" />
      <Strips />
      <Rail />
      <group position={[0, 1.45, -4.35]}>
        <Box args={[11.2, 1.7, 0.08]} color="#12181e" />
        <Box args={[4.8, 1.28, 0.04]} position={[-2.5, 0.05, 0.07]} color="#123044" emissive="#1a5278" emissiveIntensity={0.75} />
        <Box args={[3.4, 1.28, 0.04]} position={[2.7, 0.05, 0.07]} color="#10261c" emissive="#1c6b48" emissiveIntensity={0.55} />
        {Array.from({ length: 9 }, (_, i) => (
          <Box
            key={i}
            args={[0.14, 0.18 + (i % 5) * 0.12, 0.05]}
            position={[-4.5 + i * 0.28, -0.35, 0.12]}
            color="#8fd0ea"
            emissive="#7ec8ea"
            emissiveIntensity={0.7}
          />
        ))}
        <Box args={[2.2, 0.08, 0.05]} position={[2.7, 0.35, 0.12]} color="#d8ecff" emissive="#d0e6ff" emissiveIntensity={0.4} />
        <Box args={[1.6, 0.08, 0.05]} position={[2.4, 0.1, 0.12]} color="#9fd8c4" emissive="#8ed0b4" emissiveIntensity={0.35} />
      </group>
      {WORK_DESKS.night.map(([x, z], i) => (
        <Desk key={`seat-${x}`} position={[x, 0, z]} rotation={DESK_YAW} dark screen={NIGHT_SCREENS[i]} />
      ))}
      {NIGHT_X.map((x) => (
        <Desk key={`back-${x}`} position={[x, 0, -2.05]} rotation={DESK_YAW} dark screen="#6aa8c4" />
      ))}
      {NIGHT_X.map((x) => (
        <Desk key={`front-${x}`} position={[x, 0, 1.7]} rotation={DESK_YAW} dark screen="#8fb8a4" />
      ))}
      <Board position={[-5.95, 1.35, -1.1]} rotation={Math.PI / 2} />
      <Plant position={[-5.55, 0, -3.55]} scale={1.05} />
      <Plant position={[5.55, 0, -3.45]} />
      <Plant position={[5.6, 0, 3.15]} scale={0.9} />
      <Plant position={[-5.5, 0, 3.2]} scale={0.85} />
      <Pouf position={[-5.3, 0, 0.9]} color="#5b8def" />
      <Pouf position={[5.35, 0, 0.4]} color="#f2c14e" />
    </group>
  );
}

export function ContentInterior() {
  return (
    <group>
      <Floor color="#f7f3ec" />
      <Strips />
      <Rail />
      <Box args={[2.2, 1.2, 0.06]} position={[-3.4, 1.4, -4.28]} color="#1c242c" />
      <Box args={[1.95, 1.0, 0.03]} position={[-3.4, 1.4, -4.22]} color="#f0a05a" emissive="#e08940" emissiveIntensity={0.4} />
      <Box args={[1.8, 1.05, 0.06]} position={[-0.7, 1.35, -4.28]} color="#1c242c" />
      <Box args={[1.55, 0.86, 0.03]} position={[-0.7, 1.35, -4.22]} color="#7eb8c9" emissive="#6aa8b8" emissiveIntensity={0.35} />
      <Box args={[1.7, 1.0, 0.06]} position={[1.7, 1.32, -4.28]} color="#1c242c" />
      <Box args={[1.45, 0.8, 0.03]} position={[1.7, 1.32, -4.22]} color="#e7d7a8" emissive="#d4c08a" emissiveIntensity={0.28} />
      {WORK_DESKS.content.map(([x, z], i) => (
        <Desk key={`c-${x}`} position={[x, 0, z]} rotation={DESK_YAW} screen={['#f0b56a', '#9fd0c4', '#d7c4f0'][i]} />
      ))}
      <Desk position={[-3.55, 0, -1.85]} rotation={DESK_YAW} screen="#e7c98a" />
      <Desk position={[-1.6, 0, -1.85]} rotation={DESK_YAW} screen="#b7d4c8" />
      <Desk position={[0.35, 0, -1.85]} rotation={DESK_YAW} screen="#d8c6ea" />
      <Meeting position={[3.7, 0, -0.35]} />
      <Board position={[3.55, 1.4, -3.9]} />
      <Shelf position={[5.15, 0, 2.55]} />
      <Sofa position={[3.5, 0, 2.35]} rotation={-0.4} color="#2f3640" />
      <Sofa position={[1.5, 0, 2.85]} color="#3d4652" />
      <Pouf position={[-0.4, 0, 2.55]} color="#f2c14e" />
      <Pouf position={[-1.5, 0, 2.9]} color="#ff8a5b" />
      <Pouf position={[0.7, 0, 2.35]} color="#7a6cff" />
      <Pouf position={[-4.6, 0, 2.4]} color="#3eaf62" />
      <Plant position={[5.5, 0, -3.3]} scale={1.1} />
      <Plant position={[-5.55, 0, 2.7]} />
      <Plant position={[-5.4, 0, -3.4]} scale={0.9} />
    </group>
  );
}

function Lamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Box args={[0.08, 1.25, 0.08]} position={[0, 0.7, 0]} color="#d7d1c6" />
      <mesh position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial color="#fff4d2" emissive="#ffe2a0" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#ffe6b0" intensity={0.35} distance={3.5} />
    </group>
  );
}

export function ResearchInterior() {
  return (
    <group>
      <Floor color="#f6f1e8" />
      <Strips />
      <Rail />
      <Shelf position={[-3.6, 0, -4.15]} />
      <Shelf position={[-0.7, 0, -4.15]} />
      <Shelf position={[2.3, 0, -4.15]} />
      {WORK_DESKS.research.map(([x, z], i) => (
        <Desk key={`r-${x}`} position={[x, 0, z]} rotation={DESK_YAW} screen={['#d9c89a', '#c5d4e4', '#e7d3b8', '#c9d8c4'][i]} />
      ))}
      <Box args={[1.6, 0.08, 0.7]} position={[4.4, 0.74, 1.15]} color="#f3efe6" radius={0.04} />
      <Box args={[0.4, 0.4, 0.4]} position={[3.85, 0.28, 1.15]} color="#3a4038" radius={0.08} />
      <Box args={[0.4, 0.4, 0.4]} position={[4.9, 0.28, 1.15]} color="#3a4038" radius={0.08} />
      <Sofa position={[3.6, 0, 2.55]} rotation={-0.6} color="#3a4038" />
      <Board position={[5.7, 1.35, 0.2]} rotation={-Math.PI / 2} />
      <Plant position={[5.45, 0, -3.2]} scale={1.15} />
      <Plant position={[-5.5, 0, 2.6]} />
      <Plant position={[-5.45, 0, -2.2]} scale={0.8} />
      <Lamp position={[4.7, 0, -2.6]} />
      <mesh position={[0.2, 0.035, 1.7]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[1.45, 28]} />
        <meshStandardMaterial color="#efe4d2" roughness={1} />
      </mesh>
    </group>
  );
}

function Capsule({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.08, 20]} />
        <meshStandardMaterial color="#e6eaee" />
      </mesh>
      <mesh position={[0, 0.62, 0]} castShadow>
        <capsuleGeometry args={[0.26, 0.55, 6, 16]} />
        <meshStandardMaterial color={color} roughness={0.38} metalness={0.06} />
      </mesh>
    </group>
  );
}

export function LobbyInterior() {
  const rev = useFontRevision();
  const poster = usePosterTexture(rev);
  return (
    <group>
      <Floor />
      <Strips />
      <mesh position={[-4.3, 1.45, -4.38]}>
        <planeGeometry args={[1.7, 1.05]} />
        <meshBasicMaterial map={poster} />
      </mesh>
      <Box args={[2.4, 0.12, 0.7]} position={[-1.7, 0.85, -2.15]} color="#2c333b" radius={0.04} castShadow />
      <Box args={[2.2, 0.72, 0.5]} position={[-1.7, 0.48, -2.15]} color="#f4f1ea" radius={0.04} />
      <mesh position={[-0.7, 1.15, -2.15]}>
        <sphereGeometry args={[0.12, 16, 12]} />
        <meshStandardMaterial color="#ff9a3c" emissive="#ff8a2a" emissiveIntensity={0.8} />
      </mesh>
      <Box args={[0.04, 0.28, 0.04]} position={[-0.7, 0.95, -2.15]} color="#2c333b" />
      <Sofa position={[1.4, 0, 1.7]} color="#2f3844" />
      <Sofa position={[3.5, 0, 0.2]} rotation={-Math.PI / 2} color="#3c4652" />
      <Pouf position={[-3.6, 0, 1.8]} color="#ffb057" />
      <Pouf position={[0.2, 0, 2.6]} color="#7d8ea3" />
      <Plant position={[-5.2, 0, -2.6]} scale={1.25} />
      <Plant position={[5.3, 0, -2.5]} scale={1.15} />
      <Plant position={[5.2, 0, 2.6]} />
      <Plant position={[-4.8, 0, 2.8]} scale={0.9} />
      <Capsule position={[4.3, 0, -1.2]} color="#f4f1ea" />
      <Capsule position={[5.15, 0, 0.15]} color="#d5dee6" />
      <Capsule position={[4.15, 0, 1.35]} color="#d7e3d4" />
      <Board position={[-5.7, 1.3, 0.4]} rotation={Math.PI / 2} />
      <Box args={[0.08, 0.7, 0.08]} position={[-3.3, 0.55, 0.4]} color="#c5ced6" />
      <Box args={[0.08, 0.7, 0.08]} position={[-2.2, 0.55, 0.9]} color="#c5ced6" />
      <Box args={[1.15, 0.02, 0.02]} position={[-2.75, 0.82, 0.65]} color="#e7edf2" />
    </group>
  );
}

function Hologram() {
  const ref = useRef<Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.35;
  });
  return (
    <group position={[0, 1.45, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.15, 0]}>
        <ringGeometry args={[1.15, 1.28, 40]} />
        <meshBasicMaterial color="#7ef6ff" transparent opacity={0.8} />
      </mesh>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[0.95, 20, 14]} />
          <meshBasicMaterial color="#8ef6ff" wireframe transparent opacity={0.9} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.52, 16, 12]} />
          <meshBasicMaterial color="#d9fbff" transparent opacity={0.18} />
        </mesh>
        <mesh rotation={[Math.PI / 2.4, 0.4, 0]}>
          <torusGeometry args={[1.15, 0.012, 8, 48]} />
          <meshBasicMaterial color="#b8fbff" />
        </mesh>
      </group>
      <pointLight color="#7ef0ff" intensity={8} distance={7} />
    </group>
  );
}

function Beacon() {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 0.45 + Math.sin(state.clock.elapsedTime * 4) * 0.55;
    ref.current.scale.setScalar(0.85 + pulse * 0.3);
  });
  return (
    <group position={[4.7, 0, -3.15]}>
      <Box args={[0.16, 1.7, 0.16]} position={[0, 0.85, 0]} color="#2a1218" />
      <group ref={ref} position={[0, 1.8, 0]}>
        <mesh>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial color="#ff3142" emissive="#ff2030" emissiveIntensity={2.2} />
        </mesh>
      </group>
      <pointLight color="#ff2436" intensity={10} distance={8} position={[0, 1.8, 0]} />
    </group>
  );
}

export function ClassifiedInterior() {
  const mark = useMarkTexture('B2');
  return (
    <group>
      <Plate color="#1a1014" lip="#241018" />
      <Box args={[PLATE_W, 1.4, 0.1]} position={[0, 0.92, -PLATE_D / 2 + 0.05]} color="#140c10" />
      <Box args={[0.1, 1.4, PLATE_D]} position={[-PLATE_W / 2 + 0.05, 0.92, 0]} color="#140c10" />
      <Box args={[0.1, 1.4, PLATE_D]} position={[PLATE_W / 2 - 0.05, 0.92, 0]} color="#160e12" />
      <Box args={[PLATE_W - 0.3, 0.04, 0.04]} position={[0, 1.45, -4.38]} color="#ff2a3c" emissive="#ff2030" emissiveIntensity={1.4} />
      <Box args={[0.04, 0.04, PLATE_D - 0.4]} position={[-5.95, 0.4, 0]} color="#ff2a3c" emissive="#ff2030" emissiveIntensity={0.8} />
      <Box args={[0.04, 0.04, PLATE_D - 0.4]} position={[5.95, 0.4, 0]} color="#ff2a3c" emissive="#ff2030" emissiveIntensity={0.8} />
      <mesh position={[2.3, 0.26, 1.8]} rotation={[-Math.PI / 2, 0, -0.4]}>
        <planeGeometry args={[2.6, 1.2]} />
        <meshBasicMaterial map={mark} transparent depthWrite={false} />
      </mesh>
      <Hologram />
      <Beacon />
      <Box args={[1.6, 0.7, 0.55]} position={[-3.6, 0.6, -2.4]} color="#24161c" />
      <Box args={[1.35, 0.4, 0.04]} position={[-3.6, 1.15, -2.15]} color="#ff4a5a" emissive="#ff3040" emissiveIntensity={0.7} />
      <Box args={[1.3, 0.55, 0.45]} position={[-1.5, 0.52, -2.8]} color="#1c1216" />
      <Box args={[0.7, 0.55, 0.7]} position={[3.4, 0.5, 2.3]} color="#3a2420" />
      <Box args={[0.74, 0.08, 0.74]} position={[3.4, 0.28, 2.3]} color="#e0c84a" />
      <Box args={[0.74, 0.08, 0.74]} position={[3.4, 0.62, 2.3]} color="#1a1a1a" />
      <Box args={[0.62, 0.5, 0.62]} position={[4.2, 0.48, 1.5]} color="#2a1a16" />
      <pointLight color="#ff3040" intensity={4} distance={6} position={[-4.5, 1.4, -2]} />
    </group>
  );
}
