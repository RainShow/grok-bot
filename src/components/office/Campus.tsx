import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Box, Car, Palm, Plant } from './parts';
import { useFontRevision, useSignTexture, useSoftShadow, useStoryTexture } from './textures';

const STORIES = [0, 3.3, 6.6, 9.9];

function StoryBand({ y, material }: { y: number; material: THREE.Material }) {
  const w = 12.2;
  const d = 9;
  const h = 2.95;
  const mid = 0.24 + h / 2;
  return (
    <group position={[0, y, 0]}>
      <Box args={[w, 0.24, d]} position={[0, 0.12, 0]} color="#fbfcfd" roughness={0.88} castShadow receiveShadow />
      <mesh position={[0, mid, d / 2]} material={material}>
        <planeGeometry args={[w - 0.2, h]} />
      </mesh>
      <mesh position={[w / 2, mid, 0]} rotation={[0, Math.PI / 2, 0]} material={material}>
        <planeGeometry args={[d - 0.2, h]} />
      </mesh>
      <Box args={[w, h, 0.1]} position={[0, mid, -d / 2]} color="#e6ebf0" roughness={0.85} />
      <Box args={[0.1, h, d]} position={[-w / 2, mid, 0]} color="#eef2f6" roughness={0.85} />
      <Box args={[0.22, h + 0.24, 0.22]} position={[w / 2 - 0.04, mid, d / 2 - 0.04]} color="#f7f8fa" />
      <Box args={[0.22, h + 0.24, 0.22]} position={[-w / 2 + 0.04, mid, d / 2 - 0.04]} color="#f7f8fa" />
      <Box args={[0.22, h + 0.24, 0.22]} position={[w / 2 - 0.04, mid, -d / 2 + 0.04]} color="#f4f6f8" />
      <Box args={[0.22, h + 0.24, 0.22]} position={[-w / 2 + 0.04, mid, -d / 2 + 0.04]} color="#f4f6f8" />
    </group>
  );
}

function Roof() {
  return (
    <group position={[0, 13.15, 0]}>
      <Box args={[12.5, 0.16, 9.3]} position={[0, 0, 0]} color="#f7f8fa" roughness={0.9} castShadow receiveShadow />
      <Box args={[12.7, 0.28, 0.12]} position={[0, 0.18, 4.6]} color="#fbfcfd" />
      <Box args={[12.7, 0.28, 0.12]} position={[0, 0.18, -4.6]} color="#f3f5f7" />
      <Box args={[0.12, 0.28, 9.3]} position={[6.28, 0.18, 0]} color="#fbfcfd" />
      <Box args={[0.12, 0.28, 9.3]} position={[-6.28, 0.18, 0]} color="#f3f5f7" />
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 4 }, (_, col) => (
          <mesh key={`${row}-${col}`} position={[-1.7 + col * 1.15, 0.28, -1.7 + row * 1.35]} rotation={[-0.42, 0, 0]} castShadow>
            <boxGeometry args={[1.02, 0.04, 0.62]} />
            <meshStandardMaterial color="#1c2632" metalness={0.45} roughness={0.32} />
          </mesh>
        )),
      )}
      <Box args={[1.5, 0.55, 0.9]} position={[-4.2, 0.42, -2.6]} color="#e7ecf1" radius={0.06} castShadow />
      <Box args={[1.15, 0.42, 0.75]} position={[-4.2, 0.36, -1.2]} color="#d5dde4" radius={0.05} castShadow />
      <mesh position={[-4.2, 0.74, -2.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.06, 16]} />
        <meshStandardMaterial color="#2a333c" />
      </mesh>
      <mesh position={[3.6, 0.45, 1.4]}>
        <boxGeometry args={[1.8, 0.08, 1.3]} />
        <meshStandardMaterial color="#d5e4ee" transparent opacity={0.55} roughness={0.08} />
      </mesh>
      <Box args={[1.9, 0.08, 0.08]} position={[3.6, 0.2, 2.05]} color="#c5d0da" />
      <Box args={[1.9, 0.08, 0.08]} position={[3.6, 0.2, 0.75]} color="#c5d0da" />
    </group>
  );
}

function Elevator() {
  const h = 13.2;
  return (
    <group position={[7.05, h / 2, 1.5]}>
      <mesh>
        <boxGeometry args={[1.15, h, 1.85]} />
        <meshStandardMaterial color="#d7e4ee" transparent opacity={0.32} roughness={0.08} metalness={0.15} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <Box key={i} args={[1.2, 0.045, 1.9]} position={[0, -h / 2 + 0.7 + i * 1.45, 0]} color="#9aa8b4" metalness={0.35} roughness={0.35} />
      ))}
      {[
        [-0.58, -0.9],
        [0.58, -0.9],
        [-0.58, 0.9],
        [0.58, 0.9],
      ].map((p, i) => (
        <Box key={i} args={[0.07, h, 0.07]} position={[p[0], 0, p[1]]} color="#8b98a4" metalness={0.4} roughness={0.3} />
      ))}
    </group>
  );
}

export function Monument() {
  return (
    <group position={[-8.6, 0, 7.4]}>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.35, 2.45, 0.1, 40]} />
        <meshStandardMaterial color="#f3f5f7" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.025, 8, 48]} />
        <meshStandardMaterial color="#c5ced6" />
      </mesh>
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.sin(a) * 2.15, 0.12, Math.cos(a) * 2.15]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.06, 0.03, i % 4 === 0 ? 0.32 : 0.16]} />
            <meshStandardMaterial color="#b7c2cc" />
          </mesh>
        );
      })}
      <mesh position={[0, 3.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.34, 6.4, 20]} />
        <meshStandardMaterial color="#f7f8fa" roughness={0.32} metalness={0.08} />
      </mesh>
      <mesh position={[0, 6.9, 0]} castShadow>
        <sphereGeometry args={[0.32, 24, 18]} />
        <meshStandardMaterial color="#fbfcfd" roughness={0.22} metalness={0.12} />
      </mesh>
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.04, 10, 32]} />
        <meshStandardMaterial color="#d5dee6" metalness={0.25} roughness={0.35} />
      </mesh>
    </group>
  );
}

function Truck() {
  return (
    <group position={[8.4, 0, 6.4]} rotation={[0, -0.6, 0]}>
      <Box args={[2.3, 1.15, 1.05]} position={[0.35, 0.85, 0]} color="#f5f7f8" radius={0.06} castShadow />
      <Box args={[0.85, 0.72, 0.98]} position={[-1.05, 0.62, 0]} color="#2c333b" radius={0.08} castShadow />
      {[
        [1.05, 0.5],
        [1.05, -0.5],
        [-0.7, 0.5],
        [-0.7, -0.5],
      ].map((p, i) => (
        <mesh key={i} position={[p[0], 0.22, p[1]]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.12, 14]} />
          <meshStandardMaterial color="#1b2128" />
        </mesh>
      ))}
    </group>
  );
}

export function Shell() {
  const tex = useStoryTexture();
  const rev = useFontRevision();
  const sign = useSignTexture(rev);
  const glass = useMemo(
    () => new THREE.MeshStandardMaterial({ map: tex, color: '#f5f8fb', roughness: 0.38, metalness: 0.08 }),
    [tex],
  );
  useEffect(() => () => glass.dispose(), [glass]);
  return (
    <group>
      {STORIES.map((y) => (
        <StoryBand key={y} y={y} material={glass} />
      ))}
      <Roof />
      <Elevator />
      <mesh position={[0, 8.15, 4.56]}>
        <planeGeometry args={[7.4, 1.9]} />
        <meshBasicMaterial map={sign} transparent depthWrite={false} />
      </mesh>
    </group>
  );
}

export function Grounds() {
  const shadow = useSoftShadow();
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#e7ebf0" roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.4, 0.02, 1.2]}>
        <planeGeometry args={[20, 16]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8.6, 0.015, 7.4]}>
        <planeGeometry args={[6, 6]} />
        <meshBasicMaterial map={shadow} transparent depthWrite={false} />
      </mesh>
      <Box args={[28, 0.04, 3.1]} position={[2, 0.03, 13.2]} color="#d3dae2" roughness={0.95} receiveShadow />
      <Box args={[3.2, 0.04, 22]} position={[13.4, 0.03, 4]} color="#d3dae2" roughness={0.95} receiveShadow />
      <Box args={[16, 0.02, 7.2]} position={[1.2, 0.04, 8.6]} color="#e3e8ee" roughness={1} receiveShadow />
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={`stall-${i}`} args={[0.04, 0.01, 2.3]} position={[-3.2 + i * 1.55, 0.06, 8.3]} color="#f7f8fa" />
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <Box key={`walk-${i}`} args={[0.28, 0.01, 1.15]} position={[-1.6 + i * 0.48, 0.06, 11.55]} color="#f7f8fa" />
      ))}
      {Array.from({ length: 5 }, (_, i) => (
        <Box key={`dash-${i}`} args={[1.1, 0.01, 0.08]} position={[-4 + i * 2.2, 0.06, 13.2]} color="#f4f6f8" />
      ))}
      <Palm position={[-8.2, 0, 5.6]} />
      <Palm position={[-7.4, 0, -4.2]} scale={0.85} />
      <Palm position={[8.6, 0, 5.2]} scale={0.95} />
      <Palm position={[9.4, 0, -3.4]} scale={0.8} />
      <Palm position={[2.4, 0, 11.2]} scale={0.7} />
      <Palm position={[-4.6, 0, 11.4]} scale={0.75} />
      <Plant position={[-8.8, 0, 3.4]} scale={1.3} />
      <Plant position={[8.2, 0, 3.2]} scale={1.15} />
      <Car position={[-3.2, 0, 7.5]} rotation={0.08} color="#f4f6f8" />
      <Car position={[-1.6, 0, 7.65]} rotation={-0.04} color="#2c333b" />
      <Car position={[0.1, 0, 7.5]} color="#d24b4b" />
      <Car position={[1.7, 0, 7.7]} rotation={0.05} color="#4d6f92" />
      <Car position={[3.4, 0, 9.7]} rotation={Math.PI} color="#f7f7f5" />
      <Car position={[1.6, 0, 9.85]} rotation={Math.PI + 0.06} color="#1f242b" />
      <Car position={[-0.2, 0, 9.7]} rotation={Math.PI} color="#c9a24a" />
      <Truck />
      <mesh position={[-2.4, 0.04, 5.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 20]} />
        <meshStandardMaterial color="#d7e4cf" roughness={1} />
      </mesh>
      <Plant position={[-2.4, 0, 5.4]} scale={1.4} />
    </group>
  );
}
