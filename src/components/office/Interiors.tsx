import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { FLOOR_Y, PLATE_D, PLATE_W } from './model';
import { Box, Desk, Plant, Plate, Pouf, Sofa } from './parts';
import { useBoardTexture, useFontRevision, useMarkTexture, usePosterTexture } from './textures';

function BackWall({ color = '#f4f6f8' }: { color?: string }) {
  return (
    <>
      <Box args={[PLATE_W, 1.15, 0.08]} position={[0, 0.8, -PLATE_D / 2 + 0.04]} color={color} roughness={0.9} />
      <Box args={[0.08, 1.15, PLATE_D]} position={[-PLATE_W / 2 + 0.04, 0.8, 0]} color={color} roughness={0.9} />
    </>
  );
}

function Rail() {
  return (
    <mesh position={[0, 0.55, PLATE_D / 2 - 0.08]}>
      <boxGeometry args={[PLATE_W - 0.4, 0.46, 0.04]} />
      <meshStandardMaterial color="#d5e3ee" transparent opacity={0.35} roughness={0.05} metalness={0.05} />
    </mesh>
  );
}

export function NightInterior() {
  const board = useBoardTexture();
  return (
    <group position={[0, FLOOR_Y.night, 0]}>
      <Plate />
      <BackWall />
      <Rail />
      <Desk position={[-3.5, 0, -1.9]} screen="#9fd0ea" />
      <Desk position={[-1.5, 0, -1.9]} screen="#f0c27a" />
      <Desk position={[0.6, 0, -1.9]} screen="#8ecfb0" />
      <Desk position={[2.7, 0, -1.9]} screen="#e7a0b8" />
      <Desk position={[-3.4, 0, 0.55]} rotation={Math.PI} screen="#c9b6f0" />
      <Desk position={[-1.2, 0, 0.55]} rotation={Math.PI} screen="#8fb8d8" />
      <Pouf position={[1.7, 0, 2.45]} color="#ff8a3d" />
      <Pouf position={[3.15, 0, 2.15]} color="#f2c14e" />
      <Pouf position={[4.25, 0, 0.85]} color="#5b8def" />
      <Pouf position={[-4.35, 0, 2.35]} color="#3eaf62" />
      <Pouf position={[0.15, 0, 2.55]} color="#e25d8f" />
      <Pouf position={[4.15, 0, -1.15]} color="#7a6cff" />
      <mesh position={[-1.4, 1.35, -4.4]}>
        <planeGeometry args={[2.3, 1.35]} />
        <meshBasicMaterial map={board} />
      </mesh>
      <Plant position={[5.15, 0, -3.15]} scale={1.15} />
      <Plant position={[-5.2, 0, -3.2]} />
      <Plant position={[5.2, 0, 2.8]} scale={0.85} />
      <Box args={[1.7, 0.9, 0.32]} position={[4.3, 0.7, -4.15]} color="#f3f1ec" />
      <Box args={[0.28, 0.16, 0.22]} position={[3.8, 1.22, -4.05]} color="#d24b4b" />
      <Box args={[0.28, 0.2, 0.22]} position={[4.15, 1.24, -4.05]} color="#e7d7a8" />
      <Box args={[0.28, 0.14, 0.22]} position={[4.5, 1.21, -4.05]} color="#7ea0c4" />
    </group>
  );
}

export function ContentInterior() {
  return (
    <group position={[0, FLOOR_Y.content, 0]}>
      <Plate lip="#fbf7f2" />
      <BackWall color="#f7f4ef" />
      <Rail />
      <Box args={[2.1, 1.25, 0.06]} position={[-3.3, 1.35, -4.35]} color="#1c242c" />
      <Box args={[1.9, 1.08, 0.04]} position={[-3.3, 1.35, -4.3]} color="#f0a05a" emissive="#e08940" emissiveIntensity={0.35} />
      <Box args={[1.7, 1.05, 0.06]} position={[-0.6, 1.28, -4.35]} color="#1c242c" />
      <Box args={[1.52, 0.88, 0.04]} position={[-0.6, 1.28, -4.3]} color="#7eb8c9" emissive="#6aa8b8" emissiveIntensity={0.3} />
      <Box args={[1.7, 1.05, 0.06]} position={[1.8, 1.28, -4.35]} color="#1c242c" />
      <Box args={[1.52, 0.88, 0.04]} position={[1.8, 1.28, -4.3]} color="#e7d7a8" emissive="#d4c08a" emissiveIntensity={0.25} />
      <Desk position={[-3.2, 0, 0.2]} screen="#f0b56a" />
      <Desk position={[-1.2, 0, 0.2]} screen="#9fd0c4" />
      <Desk position={[1.1, 0, -1.5]} screen="#d7c4f0" />
      <Sofa position={[3.4, 0, 1.5]} rotation={-Math.PI / 2} color="#2f3640" />
      <Sofa position={[3.4, 0, -0.4]} rotation={-Math.PI / 2} color="#3d4652" />
      <Pouf position={[1.8, 0, 2.2]} color="#f2c14e" />
      <Pouf position={[-0.2, 0, 2.35]} color="#ff8a5b" />
      <Plant position={[5.2, 0, -3.1]} />
      <Plant position={[-5.3, 0, 2.6]} scale={1.1} />
      <Box args={[2.2, 0.08, 0.4]} position={[4.4, 0.7, -4.2]} color="#efeae2" />
      <Box args={[2.2, 0.08, 0.4]} position={[4.4, 1.15, -4.2]} color="#efeae2" />
      <Box args={[0.08, 1.3, 0.4]} position={[3.35, 0.85, -4.2]} color="#efeae2" />
      <Box args={[0.08, 1.3, 0.4]} position={[5.45, 0.85, -4.2]} color="#efeae2" />
    </group>
  );
}

function Shelf({ position }: { position: [number, number, number] }) {
  const colors = ['#c4554a', '#e6d7b0', '#3d6d8c', '#2f6b45', '#1c242c', '#d8c4a4', '#8d6a45', '#7ea0c4'];
  return (
    <group position={position}>
      <Box args={[2.5, 0.06, 0.36]} position={[0, 0.16, 0]} color="#f3f1ec" />
      <Box args={[2.5, 0.06, 0.36]} position={[0, 0.78, 0]} color="#f3f1ec" />
      <Box args={[2.5, 0.06, 0.36]} position={[0, 1.4, 0]} color="#f3f1ec" />
      <Box args={[0.06, 1.4, 0.36]} position={[-1.22, 0.78, 0]} color="#e7e2d8" />
      <Box args={[0.06, 1.4, 0.36]} position={[1.22, 0.78, 0]} color="#e7e2d8" />
      {Array.from({ length: 24 }, (_, i) => {
        const row = i < 12 ? 0 : 1;
        const col = i % 12;
        const h = 0.42 + ((i * 5) % 4) * 0.04;
        return (
          <Box
            key={i}
            args={[0.14, h, 0.26]}
            position={[-1.02 + col * 0.18, (row === 0 ? 0.2 : 0.82) + h / 2, 0.02]}
            color={colors[i % colors.length]}
          />
        );
      })}
    </group>
  );
}

export function ResearchInterior() {
  return (
    <group position={[0, FLOOR_Y.research, 0]}>
      <Plate lip="#fbf8f3" />
      <BackWall color="#f6f3ee" />
      <Rail />
      <Shelf position={[-3.4, 0, -4.15]} />
      <Shelf position={[-0.6, 0, -4.15]} />
      <Desk position={[-3.2, 0, -0.6]} screen="#d9c89a" />
      <Desk position={[-0.8, 0, -0.6]} screen="#c5d4e4" />
      <Desk position={[2.2, 0, -1.6]} rotation={0.4} screen="#e7d3b8" />
      <Sofa position={[3.5, 0, 1.4]} rotation={-0.8} color="#3a4038" />
      <Plant position={[5.15, 0, -2.8]} scale={1.2} />
      <Plant position={[-5.2, 0, 2.4]} />
      <group position={[4.5, 0, -3.3]}>
        <Box args={[0.08, 1.35, 0.08]} position={[0, 0.9, 0]} color="#d7d1c6" />
        <mesh position={[0, 1.62, 0]}>
          <sphereGeometry args={[0.16, 16, 12]} />
          <meshStandardMaterial color="#fff4d2" emissive="#ffe2a0" emissiveIntensity={0.7} />
        </mesh>
      </group>
      <mesh position={[1.2, 0.24, 1.5]} rotation={[-Math.PI / 2, 0, 0.2]}>
        <circleGeometry args={[1.35, 24]} />
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
    <group position={[0, FLOOR_Y.lobby, 0]}>
      <Plate />
      <BackWall />
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
